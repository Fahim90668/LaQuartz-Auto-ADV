import type { CreateAccountInput, DiscordAccountDTO, UpdateAccountLabelInput } from '@app/shared';
import { errors } from '@app/shared';
import { accounts as accountsDb } from '@app/db';
import { decryptToken, encryptToken, fingerprintToken as fpToken } from '@app/crypto';
import { validateToken } from '@app/discord';

export interface ValidatedAccount {
  account: DiscordAccountDTO;
}

export async function addAccount(
  userId: string,
  input: CreateAccountInput,
): Promise<DiscordAccountDTO> {
  const fingerprint = fpToken(input.token);

  const existing = await accountsDb.findByFingerprint(userId, fingerprint);
  if (existing) throw errors.duplicateToken();

  let validated;
  try {
    validated = await validateToken(input.token);
  } catch (err) {
    if ((err as Error).message === 'BOT_TOKEN_NOT_ALLOWED') {
      throw errors.invalidToken('Bot tokens cannot be linked.');
    }
    throw errors.invalidToken('Discord rejected this token.');
  }

  const enc = encryptToken(input.token);

  const account = await accountsDb.insertAccount({
    userId,
    label: input.label,
    discordUserId: validated.user.id,
    username: validated.user.username,
    globalName: validated.user.global_name,
    avatarUrl: validated.avatarUrl,
    token: enc,
    fingerprint,
  });

  return account;
}

export async function listAccounts(userId: string): Promise<DiscordAccountDTO[]> {
  return accountsDb.listAccountsForUser(userId);
}

export async function validateAccount(
  userId: string,
  accountId: string,
): Promise<DiscordAccountDTO> {
  const bundle = await accountsDb.getAccountTokenBundle(accountId);
  if (!bundle || bundle.userId !== userId) {
    throw errors.accountNotFound();
  }

  let token: string;
  try {
    token = decryptToken({
      ciphertext: bundle.ciphertext,
      iv: bundle.iv,
      tag: bundle.tag,
      keyVersion: bundle.keyVersion,
    });
  } catch {
    throw errors.internal('Stored token could not be decrypted.');
  }

  try {
    await validateToken(token);
  } catch (err) {
    await accountsDb.setAccountValidationStatus(
      accountId,
      'invalid',
      (err as Error).message,
    );
    throw errors.accountInvalid();
  }

  await accountsDb.setAccountValidationStatus(accountId, 'active', null);

  const refreshed = await accountsDb.getAccountById(accountId, userId);
  if (!refreshed) throw errors.accountNotFound();
  return refreshed;
}

export async function updateLabel(
  userId: string,
  accountId: string,
  input: UpdateAccountLabelInput,
): Promise<DiscordAccountDTO> {
  const updated = await accountsDb.updateAccountLabel(accountId, userId, input.label);
  if (!updated) throw errors.accountNotFound();
  return updated;
}

export async function removeAccount(userId: string, accountId: string): Promise<void> {
  const ok = await accountsDb.softDeleteAccount(accountId, userId);
  if (!ok) throw errors.accountNotFound();
      }
