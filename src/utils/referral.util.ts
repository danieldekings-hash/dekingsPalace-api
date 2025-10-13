/**
 * Generate a referral link for a user
 * @param referralCode - User's unique referral code
 * @param baseUrl - Base URL of the frontend application
 * @returns Full referral link
 */
export const generateReferralLink = (referralCode: string, baseUrl?: string): string => {
  const frontendUrl = baseUrl || process.env.FRONTEND_URL || "http://localhost:3000";
  return `${frontendUrl}/register?ref=${referralCode}`;
};

/**
 * Validate referral code format
 * @param code - Referral code to validate
 * @returns boolean
 */
export const isValidReferralCode = (code: string): boolean => {
  // Alphanumeric, 8 characters
  return /^[A-Z0-9]{8}$/.test(code);
};
