/**
 * Shared alphanumeric code generator.
 * Single source of truth — used by auth, tickets, referrals, societe, security modules.
 */
const ALPHANUMERIC_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateAlphanumericCode(length: number, prefix = ''): string {
  let code = prefix;
  for (let i = 0; i < length; i++) {
    code += ALPHANUMERIC_CHARS.charAt(
      Math.floor(Math.random() * ALPHANUMERIC_CHARS.length),
    );
  }
  return code;
}
