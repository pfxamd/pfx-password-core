/**
 * Operational safety bound for a single generated password.
 *
 * 4096 is deliberately far above normal authentication requirements while
 * preventing accidental or hostile inputs from requesting unbounded BigInt
 * work and output allocation.
 */
export const MAX_PASSWORD_LENGTH = 4_096;
