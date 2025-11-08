import { Resend } from "resend";

// Initialize Resend with API key (will be undefined if not set, but Resend handles it)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Sends OTP email to user for email verification
 * @param to - Recipient email address
 * @param otp - One-time password (6 digits)
 * @param fullName - User's full name (optional)
 * @returns Promise<boolean> - true if email sent successfully
 */
export const sendOTPEmail = async (
  to: string,
  otp: string,
  fullName?: string
): Promise<boolean> => {
  try {
    if (!resend || !process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set in environment variables");
      return false;
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@dekingspalace.com";
    const userName = fullName || "User";

    await resend.emails.send({
      from: fromEmail,
      to,
      subject: "Your Email Verification Code - DeKingsPalace",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #ffffff; margin: 0;">DeKingsPalace</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333333; margin-top: 0;">Email Verification</h2>
            <p style="color: #666666; font-size: 16px;">Hello ${userName},</p>
            <p style="color: #666666; font-size: 16px;">Thank you for registering with DeKingsPalace. Please use the verification code below to verify your email address:</p>
            <div style="background: #ffffff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otp}</h1>
            </div>
            <p style="color: #666666; font-size: 14px; margin-bottom: 5px;"><strong>This code will expire in 5 minutes.</strong></p>
            <p style="color: #999999; font-size: 12px; margin-top: 0;">If you didn't request this code, please ignore this email.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dddddd;">
              <p style="color: #999999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} DeKingsPalace. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
    });

    console.log(`OTP email sent successfully to: ${to}`);
    return true;
  } catch (error: any) {
    console.error("Failed to send OTP email:", error);
    return false;
  }
};

/**
 * Generates a 6-digit OTP
 * @returns string - 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

