import "server-only";

import type { SendResult } from "@/lib/email";
import { emailBrand, sendShopEmail } from "@/services/email";
import { passwordResetEmail, verificationEmail, welcomeEmail } from "@/lib/email/templates/account";
import { EMAIL_VERIFICATION_HOURS, PASSWORD_RESET_MINUTES } from "@/services/auth/accounts";

const brand = emailBrand;

export async function sendVerificationEmail(
  user: { email: string; firstName: string },
  token: string,
): Promise<SendResult> {
  const b = await brand();
  const url = `${b.siteUrl}/cont/verificare-email?token=${encodeURIComponent(token)}`;
  return sendShopEmail({
    to: user.email,
    ...verificationEmail({ firstName: user.firstName, url, hours: EMAIL_VERIFICATION_HOURS }, b),
  });
}

export async function sendWelcomeEmail(user: {
  email: string;
  firstName: string;
}): Promise<SendResult> {
  const b = await brand();
  return sendShopEmail({
    to: user.email,
    ...welcomeEmail(
      { firstName: user.firstName, shopUrl: `${b.siteUrl}/produse`, quizUrl: `${b.siteUrl}/quiz` },
      b,
    ),
  });
}

export async function sendPasswordResetEmail(
  user: { email: string; firstName: string },
  token: string,
): Promise<SendResult> {
  const b = await brand();
  const url = `${b.siteUrl}/cont/resetare-parola?token=${encodeURIComponent(token)}`;
  return sendShopEmail({
    to: user.email,
    ...passwordResetEmail({ firstName: user.firstName, url, minutes: PASSWORD_RESET_MINUTES }, b),
  });
}
