use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;

declare_id!("TrustDea1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx");

#[program]
pub mod trustdeal {
    use super::*;

    /// Создать новую сделку (эскроу)
    /// AI устанавливает параметры: тип сделки, таймаут, условия
    pub fn create_deal(
        ctx: Context<CreateDeal>,
        deal_id: u64,
        amount: u64,
        description: String,
        counterparty: Pubkey,
        timeout_hours: u64,
        ai_conditions_hash: [u8; 32], // SHA-256 хэш условий от AI
        deal_type: u8,                // 0=freelance, 1=supply, 2=rental, 3=labor
    ) -> Result<()> {
        require!(description.len() <= 256, TrustDealError::DescriptionTooLong);
        require!(amount > 0, TrustDealError::InvalidAmount);
        require!(timeout_hours > 0 && timeout_hours <= 720, TrustDealError::InvalidTimeout);

        let deal = &mut ctx.accounts.deal;
        let clock = Clock::get()?;

        deal.deal_id = deal_id;
        deal.creator = ctx.accounts.creator.key();
        deal.counterparty = counterparty;
        deal.amount = amount;
        deal.description = description;
        deal.status = DealStatus::Pending as u8;
        deal.deal_type = deal_type;
        deal.ai_conditions_hash = ai_conditions_hash;
        deal.created_at = clock.unix_timestamp;
        deal.timeout_at = clock.unix_timestamp + (timeout_hours as i64 * 3600);
        deal.ai_verdict_hash = [0u8; 32];
        deal.ai_verdict_text = String::new();
        deal.ai_law_reference = String::new();
        deal.nft_mint = Pubkey::default();
        deal.bump = ctx.bumps.deal;

        emit!(DealCreated {
            deal_id,
            creator: deal.creator,
            counterparty,
            amount,
            deal_type,
            timestamp: clock.unix_timestamp,
        });

        msg!("TrustDeal: сделка #{} создана. Сумма: {} lamports", deal_id, amount);
        Ok(())
    }

    /// Депозит средств в эскроу (creator вносит SOL)
    pub fn deposit_escrow(ctx: Context<DepositEscrow>, deal_id: u64) -> Result<()> {
        let deal = &mut ctx.accounts.deal;
        require!(deal.status == DealStatus::Pending as u8, TrustDealError::InvalidStatus);
        require!(ctx.accounts.creator.key() == deal.creator, TrustDealError::Unauthorized);

        // Перевод SOL в escrow vault (PDA)
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.creator.key(),
            &ctx.accounts.escrow_vault.key(),
            deal.amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.creator.to_account_info(),
                ctx.accounts.escrow_vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        deal.status = DealStatus::Active as u8;

        let clock = Clock::get()?;
        emit!(EscrowDeposited {
            deal_id,
            amount: deal.amount,
            timestamp: clock.unix_timestamp,
        });

        msg!("TrustDeal: эскроу #{} пополнен на {} lamports", deal_id, deal.amount);
        Ok(())
    }

    /// AI арбитраж — записать вердикт on-chain (вызывается автономно бэкендом)
    /// Это ключевая функция: AI решение → смена состояния контракта
    pub fn submit_ai_verdict(
        ctx: Context<SubmitAiVerdict>,
        deal_id: u64,
        verdict: u8,           // 0=release_to_counterparty, 1=refund_to_creator, 2=split
        split_bps: u16,        // базисные пункты для counterparty (0-10000), при verdict=2
        verdict_text: String,  // текст решения AI (со ссылкой на закон)
        law_reference: String, // "ГК РК ст. 349", "ТК РК ст. 95" и т.д.
        verdict_hash: [u8; 32], // хэш решения для верификации
    ) -> Result<()> {
        require!(verdict_text.len() <= 512, TrustDealError::TextTooLong);
        require!(law_reference.len() <= 128, TrustDealError::TextTooLong);
        require!(split_bps <= 10000, TrustDealError::InvalidSplitBps);

        let deal = &mut ctx.accounts.deal;
        require!(
            deal.status == DealStatus::Active as u8 || deal.status == DealStatus::Disputed as u8,
            TrustDealError::InvalidStatus
        );
        // Только арбитр (наш AI-сервис через PDA) может писать вердикт
        require!(ctx.accounts.arbitrator.key() == ctx.accounts.arbitrator_authority.key(), TrustDealError::Unauthorized);

        let clock = Clock::get()?;

        deal.ai_verdict = verdict;
        deal.ai_verdict_hash = verdict_hash;
        deal.ai_verdict_text = verdict_text.clone();
        deal.ai_law_reference = law_reference.clone();
        deal.ai_verdict_at = clock.unix_timestamp;
        deal.status = DealStatus::VerdictReady as u8;

        emit!(AiVerdictSubmitted {
            deal_id,
            verdict,
            split_bps,
            law_reference: law_reference.clone(),
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "TrustDeal AI Verdict #{}: вердикт={}, закон={}, хэш=[{}...]",
            deal_id, verdict, law_reference, verdict_hash[0]
        );
        Ok(())
    }

    /// Исполнить вердикт AI — перевести средства согласно решению
    pub fn execute_verdict(ctx: Context<ExecuteVerdict>, deal_id: u64) -> Result<()> {
        let deal = &mut ctx.accounts.deal;
        require!(deal.status == DealStatus::VerdictReady as u8, TrustDealError::InvalidStatus);

        let vault_balance = ctx.accounts.escrow_vault.lamports();
        let verdict = deal.ai_verdict;
        let split_bps = deal.split_bps;

        match verdict {
            0 => {
                // Перевести counterparty
                **ctx.accounts.escrow_vault.try_borrow_mut_lamports()? -= vault_balance;
                **ctx.accounts.counterparty.try_borrow_mut_lamports()? += vault_balance;
                msg!("TrustDeal: средства переведены counterparty");
            }
            1 => {
                // Возврат creator
                **ctx.accounts.escrow_vault.try_borrow_mut_lamports()? -= vault_balance;
                **ctx.accounts.creator.try_borrow_mut_lamports()? += vault_balance;
                msg!("TrustDeal: средства возвращены creator");
            }
            2 => {
                // Разделить
                let to_counterparty = vault_balance * (split_bps as u64) / 10000;
                let to_creator = vault_balance - to_counterparty;
                **ctx.accounts.escrow_vault.try_borrow_mut_lamports()? -= vault_balance;
                **ctx.accounts.counterparty.try_borrow_mut_lamports()? += to_counterparty;
                **ctx.accounts.creator.try_borrow_mut_lamports()? += to_creator;
                msg!("TrustDeal: средства разделены {}/{} bps", split_bps, 10000 - split_bps);
            }
            _ => return Err(TrustDealError::InvalidVerdict.into()),
        }

        deal.status = DealStatus::Completed as u8;
        let clock = Clock::get()?;
        deal.completed_at = clock.unix_timestamp;

        emit!(DealExecuted {
            deal_id,
            verdict,
            amount: vault_balance,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Открыть спор (любая сторона может инициировать)
    pub fn open_dispute(
        ctx: Context<OpenDispute>,
        deal_id: u64,
        evidence_hash: [u8; 32],
        evidence_description: String,
    ) -> Result<()> {
        let deal = &mut ctx.accounts.deal;
        require!(deal.status == DealStatus::Active as u8, TrustDealError::InvalidStatus);
        require!(
            ctx.accounts.signer.key() == deal.creator || ctx.accounts.signer.key() == deal.counterparty,
            TrustDealError::Unauthorized
        );

        deal.status = DealStatus::Disputed as u8;
        deal.evidence_hash = evidence_hash;
        deal.dispute_initiator = ctx.accounts.signer.key();

        let clock = Clock::get()?;
        emit!(DisputeOpened {
            deal_id,
            initiator: ctx.accounts.signer.key(),
            evidence_hash,
            timestamp: clock.unix_timestamp,
        });

        msg!("TrustDeal: спор по сделке #{} открыт, AI арбитраж запущен", deal_id);
        Ok(())
    }

    /// Записать адрес NFT-сертификата on-chain
    pub fn register_nft_certificate(
        ctx: Context<RegisterNft>,
        deal_id: u64,
        nft_mint: Pubkey,
    ) -> Result<()> {
        let deal = &mut ctx.accounts.deal;
        require!(deal.status == DealStatus::Completed as u8, TrustDealError::InvalidStatus);

        deal.nft_mint = nft_mint;

        let clock = Clock::get()?;
        emit!(NftCertificateRegistered {
            deal_id,
            nft_mint,
            timestamp: clock.unix_timestamp,
        });

        msg!("TrustDeal: NFT сертификат {} зарегистрирован для сделки #{}", nft_mint, deal_id);
        Ok(())
    }

    /// TrustScore — AI обновляет оценку надёжности пользователя on-chain
    pub fn update_trust_score(
        ctx: Context<UpdateTrustScore>,
        user: Pubkey,
        score_delta: i16, // +10 за успешную сделку, -20 за проигранный спор
        deals_completed: u32,
        deals_disputed: u32,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.user_profile;
        profile.user = user;

        let new_score = (profile.trust_score as i32 + score_delta as i32)
            .max(0)
            .min(1000) as u16;
        profile.trust_score = new_score;
        profile.deals_completed = deals_completed;
        profile.deals_disputed = deals_disputed;

        let clock = Clock::get()?;
        profile.last_updated = clock.unix_timestamp;

        emit!(TrustScoreUpdated {
            user,
            new_score,
            timestamp: clock.unix_timestamp,
        });

        msg!("TrustScore: пользователь {} → {} баллов", user, new_score);
        Ok(())
    }
}

// ============================================================
// ACCOUNT STRUCTS
// ============================================================

#[account]
#[derive(Default)]
pub struct Deal {
    pub deal_id: u64,
    pub creator: Pubkey,
    pub counterparty: Pubkey,
    pub amount: u64,
    pub description: String,        // max 256
    pub status: u8,
    pub deal_type: u8,
    pub ai_conditions_hash: [u8; 32],
    pub created_at: i64,
    pub timeout_at: i64,
    pub completed_at: i64,
    // AI Verdict
    pub ai_verdict: u8,
    pub ai_verdict_at: i64,
    pub ai_verdict_hash: [u8; 32],
    pub ai_verdict_text: String,    // max 512
    pub ai_law_reference: String,   // max 128
    pub split_bps: u16,
    // Dispute
    pub evidence_hash: [u8; 32],
    pub dispute_initiator: Pubkey,
    // NFT
    pub nft_mint: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(Default)]
pub struct UserProfile {
    pub user: Pubkey,
    pub trust_score: u16,
    pub deals_completed: u32,
    pub deals_disputed: u32,
    pub last_updated: i64,
    pub bump: u8,
}

// ============================================================
// CONTEXT STRUCTS
// ============================================================

#[derive(Accounts)]
#[instruction(deal_id: u64)]
pub struct CreateDeal<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Deal::INIT_SPACE,
        seeds = [b"deal", creator.key().as_ref(), deal_id.to_le_bytes().as_ref()],
        bump
    )]
    pub deal: Account<'info, Deal>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(deal_id: u64)]
pub struct DepositEscrow<'info> {
    #[account(
        mut,
        seeds = [b"deal", creator.key().as_ref(), deal_id.to_le_bytes().as_ref()],
        bump = deal.bump
    )]
    pub deal: Account<'info, Deal>,
    #[account(
        mut,
        seeds = [b"vault", deal.key().as_ref()],
        bump
    )]
    /// CHECK: escrow vault PDA
    pub escrow_vault: AccountInfo<'info>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(deal_id: u64)]
pub struct SubmitAiVerdict<'info> {
    #[account(
        mut,
        seeds = [b"deal", deal.creator.as_ref(), deal_id.to_le_bytes().as_ref()],
        bump = deal.bump
    )]
    pub deal: Account<'info, Deal>,
    /// CHECK: AI arbitrator authority
    pub arbitrator: AccountInfo<'info>,
    #[account(
        seeds = [b"arbitrator"],
        bump
    )]
    /// CHECK: PDA of arbitrator
    pub arbitrator_authority: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(deal_id: u64)]
pub struct ExecuteVerdict<'info> {
    #[account(
        mut,
        seeds = [b"deal", deal.creator.as_ref(), deal_id.to_le_bytes().as_ref()],
        bump = deal.bump
    )]
    pub deal: Account<'info, Deal>,
    #[account(
        mut,
        seeds = [b"vault", deal.key().as_ref()],
        bump
    )]
    /// CHECK: escrow vault
    pub escrow_vault: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: creator wallet
    pub creator: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: counterparty wallet
    pub counterparty: AccountInfo<'info>,
    #[account(mut)]
    pub executor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(deal_id: u64)]
pub struct OpenDispute<'info> {
    #[account(
        mut,
        seeds = [b"deal", deal.creator.as_ref(), deal_id.to_le_bytes().as_ref()],
        bump = deal.bump
    )]
    pub deal: Account<'info, Deal>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(deal_id: u64)]
pub struct RegisterNft<'info> {
    #[account(
        mut,
        seeds = [b"deal", deal.creator.as_ref(), deal_id.to_le_bytes().as_ref()],
        bump = deal.bump
    )]
    pub deal: Account<'info, Deal>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateTrustScore<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + 32 + 2 + 4 + 4 + 8 + 1 + 64,
        seeds = [b"profile", user_profile.user.as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ============================================================
// DEAL STATUS ENUM
// ============================================================

pub enum DealStatus {
    Pending = 0,
    Active = 1,
    Disputed = 2,
    VerdictReady = 3,
    Completed = 4,
    Cancelled = 5,
}

// ============================================================
// EVENTS
// ============================================================

#[event]
pub struct DealCreated {
    pub deal_id: u64,
    pub creator: Pubkey,
    pub counterparty: Pubkey,
    pub amount: u64,
    pub deal_type: u8,
    pub timestamp: i64,
}

#[event]
pub struct EscrowDeposited {
    pub deal_id: u64,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct AiVerdictSubmitted {
    pub deal_id: u64,
    pub verdict: u8,
    pub split_bps: u16,
    pub law_reference: String,
    pub timestamp: i64,
}

#[event]
pub struct DealExecuted {
    pub deal_id: u64,
    pub verdict: u8,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct DisputeOpened {
    pub deal_id: u64,
    pub initiator: Pubkey,
    pub evidence_hash: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct NftCertificateRegistered {
    pub deal_id: u64,
    pub nft_mint: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct TrustScoreUpdated {
    pub user: Pubkey,
    pub new_score: u16,
    pub timestamp: i64,
}

// ============================================================
// ERRORS
// ============================================================

#[error_code]
pub enum TrustDealError {
    #[msg("Описание слишком длинное (макс. 256 символов)")]
    DescriptionTooLong,
    #[msg("Недопустимая сумма")]
    InvalidAmount,
    #[msg("Недопустимый таймаут (1-720 часов)")]
    InvalidTimeout,
    #[msg("Неверный статус сделки")]
    InvalidStatus,
    #[msg("Нет прав для этого действия")]
    Unauthorized,
    #[msg("Текст слишком длинный")]
    TextTooLong,
    #[msg("Недопустимые базисные пункты (0-10000)")]
    InvalidSplitBps,
    #[msg("Недопустимый вердикт")]
    InvalidVerdict,
}

impl Deal {
    pub const INIT_SPACE: usize = 8 + 8 + 32 + 32 + 8 + (4 + 256) + 1 + 1 + 32 + 8 + 8 + 8 + 1 + 8 + 32 + (4 + 512) + (4 + 128) + 2 + 32 + 32 + 32 + 1;
}
