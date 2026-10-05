import { Resend } from 'resend';
import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';

let resendClient: Resend | null = null;
let smtpTransporter: Transporter | null = null;

export const getSmtpTransporter = (): Transporter | null => {
  if (!smtpTransporter && (config.smtpUser || process.env.SMTP_USER || process.env.GMAIL_USER)) {
    const user = (config.smtpUser || process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
    const rawPass = config.smtpPass || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '';
    const pass = rawPass.replace(/\s+/g, '');
    const host = config.smtpHost || process.env.SMTP_HOST || (user.includes('@gmail.com') ? 'smtp.gmail.com' : 'smtp.gmail.com');
    const port = config.smtpPort || Number(process.env.SMTP_PORT) || 465;
    const secure = port === 465;

    try {
      smtpTransporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      console.log(`[SMTP] Transporter ready for ${user} via ${host}:${port}`);
    } catch (err) {
      console.warn('[SMTP] Transporter initialization failed:', err);
    }
  }
  return smtpTransporter;
};

export const getResendClient = (): Resend | null => {
  if (!resendClient && config.resendApiKey && !config.resendApiKey.includes('mock')) {
    try {
      resendClient = new Resend(config.resendApiKey);
    } catch (err) {
      console.warn('[Resend] Client initialization failed:', err);
    }
  }
  return resendClient;
};

/**
 * Robust email dispatcher with automatic SMTP and Resend fallbacks
 */
async function deliverEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  // 1. If SMTP is configured, deliver directly to recipient email without domain restrictions
  const smtp = getSmtpTransporter();
  if (smtp) {
    try {
      const fromAddr = config.smtpFrom || config.smtpUser || `DropOfLife <no-reply@dropoflife.org>`;
      const info = await smtp.sendMail({
        from: fromAddr,
        to,
        subject,
        html,
      });
      console.log(`📧 Email delivered via SMTP directly to ${to}:`, info.messageId);
      return { success: true, messageId: info.messageId, to };
    } catch (smtpErr: any) {
      console.warn(`[SMTP] Direct delivery to ${to} failed, falling back to Resend:`, smtpErr?.message);
    }
  }

  // 2. Resend Delivery
  const client = getResendClient();
  if (!client) {
    console.log(`[SIMULATED EMAIL via Resend] To: ${to} | Subject: ${subject}`);
    return { simulated: true, to, subject };
  }

  try {
    const fromAddress = `DropOfLife <${config.resendFromEmail}>`;
    const response = await client.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
    });

    if (response.error) {
      console.warn(`[Resend] Delivery to ${to} rejected:`, response.error.message);
      if (response.error.message?.includes('testing emails to your own email address')) {
        console.warn(
          `[Resend Notice] Resend sandbox restriction: To send live emails to any recipient (${to}), please add and verify your custom domain at https://resend.com/domains or configure Gmail SMTP (GMAIL_USER & GMAIL_APP_PASSWORD) in backend/.env.`
        );
      }
      return { simulated: true, to, subject, error: response.error.message };
    }

    console.log(`📧 Email delivered via Resend directly to recipient ${to}:`, response.data?.id);
    return response;
  } catch (err: any) {
    console.warn(`[Resend] Dispatch to ${to} failed:`, err.message);
    if (err.message?.includes('testing emails to your own email address')) {
      console.warn(
        `[Resend Notice] Resend sandbox restriction: To send live emails to any recipient (${to}), please add and verify your custom domain at https://resend.com/domains or configure Gmail SMTP (GMAIL_USER & GMAIL_APP_PASSWORD) in backend/.env.`
      );
    }
    return { simulated: true, to, subject, error: err.message };
  }
}

/**
 * 1. Send Welcome Email upon User Registration
 */
export const sendWelcomeEmail = async (user: {
  name: string;
  email: string;
  role: string;
  bloodGroup?: string;
}) => {
  const subject = `🩸 Welcome to DropOfLife — জীবনের এক ফোঁটা, ${user.name}!`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; border: 1px solid #27272a; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #e11d48, #9f1239); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800;">DropOfLife — জীবনের এক ফোঁটা</h1>
        <p style="color: #ffe4e6; margin: 8px 0 0 0; font-size: 14px;">National Emergency Blood Donation & Coordination Platform</p>
      </div>
      <div style="padding: 32px 24px; line-height: 1.6;">
        <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Welcome, ${user.name}!</h2>
        <p style="color: #d4d4d8; font-size: 14px;">
          Thank you for joining the DropOfLife network as a registered <strong>${user.role.toUpperCase()}</strong>${user.bloodGroup ? ` with blood group <strong>(${user.bloodGroup})</strong>` : ''}.
        </p>
        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #fb7185; margin: 0 0 12px 0; font-size: 15px;">Your Account Profile</h3>
          <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Registered Email:</strong> ${user.email}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Assigned Role:</strong> ${user.role}</p>
          ${user.bloodGroup ? `<p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Blood Group:</strong> ${user.bloodGroup}</p>` : ''}
          <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Emergency Dispatch Hotline:</strong> +8801521711716</p>
        </div>
        <p style="color: #d4d4d8; font-size: 14px;">
          You can now view live transfusion requests, manage blood bank inventories, or respond directly to save lives in your district.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${config.clientUrl}/login" style="background-color: #e11d48; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-weight: bold; text-decoration: none; display: inline-block;">
            Sign In to Your Dashboard
          </a>
        </div>
      </div>
      <div style="background-color: #18181b; padding: 16px 24px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #27272a;">
        24/7 National Emergency Hotline: +8801521711716 • DropOfLife Bangladesh
      </div>
    </div>
  `;

  return deliverEmail({ to: user.email, subject, html });
};

/**
 * 2. Send Donor Registration & Readiness Confirmation Email
 */
export const sendDonorConfirmationEmail = async (donor: {
  name: string;
  email: string;
  bloodGroup: string;
  district: string;
}) => {
  const subject = `🩸 You Are Now a Registered Lifesaver Donor (${donor.bloodGroup})!`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; border: 1px solid #27272a; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #e11d48, #be123c); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800;">Lifesaver Donor Registered</h1>
        <p style="color: #ffe4e6; margin: 8px 0 0 0; font-size: 14px;">Thank you for standing ready to give the gift of life.</p>
      </div>
      <div style="padding: 32px 24px; line-height: 1.6;">
        <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Dear ${donor.name},</h2>
        <p style="color: #d4d4d8; font-size: 14px;">
          Your voluntary blood donor profile is now active on DropOfLife. When a patient in <strong>${donor.district}</strong> urgently requires <strong>${donor.bloodGroup}</strong> blood, you may receive an emergency broadcast alert.
        </p>
        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #34d399; margin: 0 0 8px 0; font-size: 15px;">Donor Readiness Status</h3>
          <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Blood Group:</strong> ${donor.bloodGroup}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Assigned Zone:</strong> ${donor.district} District</p>
          <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Availability:</strong> Available Now (Toggleable in Dashboard)</p>
          <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Emergency Dispatch Hotline:</strong> +8801521711716</p>
        </div>
        <p style="color: #d4d4d8; font-size: 14px;">
          You can toggle your availability anytime from &quot;Available&quot; to &quot;Resting&quot; directly in your Donor Dashboard.
        </p>
      </div>
    </div>
  `;

  return deliverEmail({ to: donor.email, subject, html });
};

/**
 * 3. Send Admin Password Reset Notice Email
 */
export const sendPasswordResetNoticeEmail = async ({
  name,
  email,
  newPassword,
}: {
  name: string;
  email: string;
  newPassword: string;
}) => {
  const subject = `🔐 DropOfLife Security: Your Account Password Has Been Reset`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; border: 1px solid #27272a; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #d97706, #b45309); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Password Reset Notification</h1>
        <p style="color: #fef3c7; margin: 8px 0 0 0; font-size: 14px;">DropOfLife Security & Credential Management</p>
      </div>
      <div style="padding: 32px 24px; line-height: 1.6;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Hello, ${name}!</h2>
        <p style="color: #d4d4d8; font-size: 14px;">
          An administrator has reset your account password on DropOfLife. You can now log in using your new temporary password below:
        </p>
        <div style="background-color: #18181b; border: 1px solid #3f3f46; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #a1a1aa; text-transform: uppercase; font-weight: bold;">New Password</p>
          <div style="font-size: 22px; font-family: monospace; font-weight: bold; color: #fbbf24; background: #27272a; padding: 12px 20px; border-radius: 8px; display: inline-block; letter-spacing: 2px;">
            ${newPassword}
          </div>
        </div>
        <p style="color: #a1a1aa; font-size: 13px;">
          For your security, we recommend changing this password to a personal one after logging in.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${config.clientUrl}/login" style="background-color: #d97706; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-weight: bold; text-decoration: none; display: inline-block;">
            Sign In with New Password
          </a>
        </div>
      </div>
      <div style="background-color: #18181b; padding: 16px 24px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #27272a;">
        Need help? Contact DropOfLife 24/7 Hotline: +8801521711716
      </div>
    </div>
  `;

  return deliverEmail({ to: email, subject, html });
};

/**
 * 4. Send Emergency Blood Request Broadcast Alert
 */
export const sendEmergencyRequestAlertEmail = async ({
  recipientEmail,
  donorName,
  patientName,
  hospitalName,
  bloodGroup,
  units,
  location,
  contactPhone,
}: {
  recipientEmail: string;
  donorName: string;
  patientName: string;
  hospitalName: string;
  bloodGroup: string;
  units: number;
  location: string;
  contactPhone: string;
}) => {
  const subject = `🚨 URGENT: Blood Needed (${bloodGroup}) for Patient at ${hospitalName}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; border: 1px solid #e11d48; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #e11d48, #9f1239); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800;">🚨 Urgent Blood Request Alert</h1>
        <p style="color: #ffe4e6; margin: 8px 0 0 0; font-size: 14px;">A life in your area needs your immediate help</p>
      </div>
      <div style="padding: 32px 24px; line-height: 1.6;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Dear ${donorName},</h2>
        <p style="color: #d4d4d8; font-size: 14px;">
          An emergency blood requirement matching your blood group <strong>(${bloodGroup})</strong> has just been escalated in your zone.
        </p>
        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #fb7185; margin: 0 0 12px 0; font-size: 15px;">Emergency Details</h3>
          <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Patient:</strong> ${patientName}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Hospital:</strong> ${hospitalName}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Location:</strong> ${location}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Required Units:</strong> ${units} Bag(s)</p>
          <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Emergency Contact:</strong> ${contactPhone}</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${config.clientUrl}/emergency-requests" style="background-color: #e11d48; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-weight: bold; text-decoration: none; display: inline-block;">
            Respond to Emergency
          </a>
        </div>
      </div>
      <div style="background-color: #18181b; padding: 16px 24px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #27272a;">
        DropOfLife 24/7 Lifesaver Hotline: +8801521711716
      </div>
    </div>
  `;

  return deliverEmail({ to: recipientEmail, subject, html });
};

/**
 * 5. Send Stripe Payment / Donation Receipt
 */
export const sendPaymentReceiptEmail = async ({
  email,
  name,
  amount,
  currency,
  paymentIntentId,
  purpose,
  receiptUrl,
}: {
  email: string;
  name: string;
  amount: number;
  currency: string;
  paymentIntentId: string;
  purpose: string;
  receiptUrl?: string;
}) => {
  const subject = `🩸 Official Donation Receipt #${paymentIntentId.slice(-8).toUpperCase()} - DropOfLife`;
  const formattedAmount = `${amount.toLocaleString()} ${currency.toUpperCase()}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; border: 1px solid #27272a; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800;">Payment Successful</h1>
        <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 14px;">Your contribution is directly funding emergency blood logistics</p>
      </div>
      <div style="padding: 32px 24px; line-height: 1.6;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Dear ${name},</h2>
        <p style="color: #d4d4d8; font-size: 14px;">
          Thank you for supporting DropOfLife! Your payment has been securely authorized and verified via Stripe.
        </p>
        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #34d399; margin: 0 0 12px 0; font-size: 15px;">Transaction Details</h3>
          <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Amount Paid:</strong> <span style="color: #34d399; font-weight: 700; font-size: 16px;">${formattedAmount}</span></p>
          <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Purpose:</strong> ${purpose.replace(/_/g, ' ')}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Stripe Reference:</strong> <code>${paymentIntentId}</code></p>
          <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Status:</strong> <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 8px; border-radius: 4px; font-size: 11px;">SETTLED (Stripe Test Mode)</span></p>
        </div>
        ${
          receiptUrl
            ? `
        <div style="text-align: center; margin: 28px 0;">
          <a href="${receiptUrl}" target="_blank" style="background-color: #e11d48; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">
            View Official Stripe Receipt
          </a>
        </div>
        `
            : ''
        }
      </div>
      <div style="background-color: #18181b; padding: 16px 24px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #27272a;">
        DropOfLife Foundation • 24/7 Lifesaver Hotline: +8801521711716
      </div>
    </div>
  `;

  return deliverEmail({ to: email, subject, html });
};

/**
 * 6. Send User Password Reset Link & OTP Email
 */
export const sendPasswordResetLinkEmail = async ({
  name,
  email,
  resetLink,
  resetOtp,
}: {
  name: string;
  email: string;
  resetLink: string;
  resetOtp: string;
}) => {
  const subject = `🔑 Reset Your DropOfLife Password (OTP: ${resetOtp})`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; border: 1px solid #27272a; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #e11d48, #be123c); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Password Reset Request</h1>
        <p style="color: #ffe4e6; margin: 8px 0 0 0; font-size: 14px;">DropOfLife Security & Access Verification</p>
      </div>
      <div style="padding: 32px 24px; line-height: 1.6;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Hello, ${name}!</h2>
        <p style="color: #d4d4d8; font-size: 14px;">
          We received a request to reset your password for your DropOfLife account (${email}). Click the button below to set a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: linear-gradient(135deg, #e11d48, #be123c); color: #ffffff; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 15px; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.4);">
            Reset My Password Now
          </a>
        </div>
        <div style="background-color: #18181b; border: 1px solid #3f3f46; border-radius: 12px; padding: 18px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #a1a1aa; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Or use this 6-Digit Verification Code</p>
          <div style="font-size: 26px; font-family: monospace; font-weight: 900; color: #fb7185; letter-spacing: 6px;">
            ${resetOtp}
          </div>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #71717a;">Valid for 15 minutes. Never share this code with anyone.</p>
        </div>
        <p style="color: #71717a; font-size: 12px;">
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>
      <div style="background-color: #18181b; padding: 16px 24px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #27272a;">
        DropOfLife Emergency Blood Network • 24/7 Hotline: +8801521711716
      </div>
    </div>
  `;

  return deliverEmail({ to: email, subject, html });
};

/**
 * 7. Send Password Reset Success Confirmation
 */
export const sendPasswordResetSuccessEmail = async ({
  name,
  email,
}: {
  name: string;
  email: string;
}) => {
  const subject = `✅ Password Successfully Changed - DropOfLife Security Alert`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; border: 1px solid #27272a; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #059669, #047857); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Password Changed</h1>
        <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 14px;">Your account is safe & updated</p>
      </div>
      <div style="padding: 32px 24px; line-height: 1.6;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Hello, ${name}!</h2>
        <p style="color: #d4d4d8; font-size: 14px;">
          Your DropOfLife account password was just successfully changed. You can now use your new password to sign in.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${config.clientUrl}/login" style="background-color: #059669; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: bold; text-decoration: none; display: inline-block;">
            Sign In to Account
          </a>
        </div>
        <p style="color: #ef4444; font-size: 12px;">
          If you did NOT perform this change, please immediately contact our emergency security hotline at +8801521711716.
        </p>
      </div>
      <div style="background-color: #18181b; padding: 16px 24px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #27272a;">
        DropOfLife Emergency Blood Network • 24/7 Hotline: +8801521711716
      </div>
    </div>
  `;

  return deliverEmail({ to: email, subject, html });
};

/**
 * 7. Send Direct Blood Request Notification Email to Targeted Donor
 */
export const sendDirectDonorRequestEmail = async ({
  recipientEmail,
  donorName,
  requesterName,
  requesterPhone,
  patientName,
  hospitalName,
  hospitalAddress,
  district,
  division,
  urgencyLevel,
  bloodGroup,
  units,
  contactPhone,
  reason,
  requiredDate,
}: {
  recipientEmail: string;
  donorName: string;
  requesterName: string;
  requesterPhone?: string;
  patientName: string;
  hospitalName: string;
  hospitalAddress?: string;
  district?: string;
  division?: string;
  urgencyLevel?: string;
  bloodGroup: string;
  units: number;
  contactPhone: string;
  reason?: string;
  requiredDate?: string | Date;
}) => {
  const subject = `🩸 [জরুরি রক্তদান আবেদন] ${patientName}-এর জন্য ${bloodGroup} রক্ত প্রয়োজন - DropOfLife`;
  const formattedDate = requiredDate
    ? new Date(requiredDate).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'জরুরি প্রয়োজনে অবিলম্বে';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; border: 1px solid #e11d48; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
      <div style="background: linear-gradient(135deg, #e11d48, #881337); padding: 32px 24px; text-align: center;">
        <span style="background: rgba(255,255,255,0.2); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">সরাসরি রক্তদানের আবেদন</span>
        <h1 style="color: #ffffff; margin: 12px 0 0 0; font-size: 24px; font-weight: 800;">🚨 রক্তদাতার কাছে সরাসরি অনুরোধ</h1>
        <p style="color: #ffe4e6; margin: 8px 0 0 0; font-size: 13px;">একজন সংকটাপন্ন রোগীর জন্য আপনার রক্তের প্রয়োজন</p>
      </div>

      <div style="padding: 28px 24px; line-height: 1.6;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">শ্রদ্ধেয় রক্তদাতা ${donorName},</h2>
        <p style="color: #d4d4d8; font-size: 14px; margin-bottom: 20px;">
          ড্রপ অফ লাইফ (DropOfLife) প্ল্যাটফর্মে আপনার রক্তদান প্রস্তুতি দেখে <strong>${requesterName}</strong> সরাসরি আপনার প্রোফাইলে (ইমেইল: <strong style="color: #f43f5e;">${recipientEmail}</strong>) জরুরি রক্তদানের আবেদন জানিয়েছেন।
        </p>

        <!-- Requester Section -->
        <div style="background-color: #18181b; border: 1px solid #27272a; border-left: 4px solid #3b82f6; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
          <h3 style="color: #60a5fa; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; font-weight: 800;">👤 আবেদনকারী / রোগীর স্বজনের বিবরণ</h3>
          <p style="margin: 4px 0; font-size: 13px; color: #e4e4e7;"><strong>আবেদনকারীর নাম:</strong> ${requesterName}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #e4e4e7;"><strong>যোগাযোগের মোবাইল নম্বর:</strong> <a href="tel:${requesterPhone || contactPhone}" style="color: #60a5fa; font-weight: 700; text-decoration: none;">📞 ${requesterPhone || contactPhone}</a></p>
        </div>

        <!-- Patient Details Section -->
        <div style="background-color: #18181b; border: 1px solid #27272a; border-left: 4px solid #e11d48; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
          <h3 style="color: #fb7185; margin: 0 0 14px 0; font-size: 15px; text-transform: uppercase; font-weight: 800;">🏥 রোগীর চিকিৎসার জরুরি বিবরণ</h3>
          <p style="margin: 6px 0; font-size: 13px; color: #e4e4e7;"><strong>রোগীর পুরো নাম:</strong> <strong style="color: #fff; font-size: 14px;">${patientName}</strong></p>
          <p style="margin: 6px 0; font-size: 13px; color: #e4e4e7;">
            <strong>রক্তের গ্রুপ:</strong>
            <span style="background: #e11d48; color: #ffffff; padding: 4px 12px; border-radius: 6px; font-weight: 900; font-size: 16px; margin-left: 6px;">${bloodGroup}</span>
          </p>
          <p style="margin: 6px 0; font-size: 13px; color: #e4e4e7;"><strong>জরুরি মাত্রা:</strong> <span style="color: #f43f5e; font-weight: bold;">🚨 ${urgencyLevel || 'Critical'}</span></p>
          <p style="margin: 6px 0; font-size: 13px; color: #e4e4e7;"><strong>প্রয়োজনীয় রক্তের পরিমাণ:</strong> <strong style="color: #fff;">${units} ব্যাগ (Units)</strong></p>
          <p style="margin: 6px 0; font-size: 13px; color: #e4e4e7;"><strong>হাসপাতাল / মেডিকেল:</strong> ${hospitalName}</p>
          <p style="margin: 6px 0; font-size: 13px; color: #e4e4e7;"><strong>হাসপাতালের ঠিকানা ও ওয়ার্ড:</strong> ${hospitalAddress || hospitalName}</p>
          ${district ? `<p style="margin: 6px 0; font-size: 13px; color: #e4e4e7;"><strong>জেলা ও বিভাগ:</strong> ${district}${division ? `, ${division}` : ''}</p>` : ''}
          <p style="margin: 6px 0; font-size: 13px; color: #e4e4e7;"><strong>রক্ত প্রয়োজনের তারিখ:</strong> ${formattedDate}</p>
          <p style="margin: 6px 0; font-size: 13px; color: #e4e4e7;"><strong>চিকিৎসার কারণ ও শারীরিক সমস্যা:</strong> ${reason || 'জরুরি রক্তের ট্রান্সফিউশন প্রয়োজন।'}</p>
          <div style="margin: 14px 0 4px 0; font-size: 13px; color: #e4e4e7; background: #27272a; padding: 12px 16px; border-radius: 8px;">
            <strong>হাসপাতাল / স্বজনের জরুরি হটলাইন:</strong>
            <a href="tel:${contactPhone}" style="color: #34d399; font-weight: 800; font-size: 16px; margin-left: 6px; text-decoration: none;">📞 ${contactPhone}</a>
          </div>
        </div>

        <!-- Action CTAs -->
        <div style="text-align: center; margin: 28px 0;">
          <a href="tel:${requesterPhone || contactPhone}" style="background-color: #10b981; color: #ffffff; padding: 14px 24px; border-radius: 10px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px; margin: 6px;">
            📞 রোগীর স্বজনকে এখনই কল করুন (${requesterPhone || contactPhone})
          </a>
          <a href="${config.clientUrl}/dashboard/donor" style="background-color: #e11d48; color: #ffffff; padding: 14px 24px; border-radius: 10px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px; margin: 6px;">
            🩸 ড্যাশবোর্ডে গিয়ে রক্তদানের সম্মতি দিন
          </a>
        </div>

        <p style="font-size: 12px; color: #a1a1aa; text-align: center; margin-top: 20px;">
          ২৪ ঘণ্টার মধ্যে পুনরায় অনুরোধ পাঠানোর সীমাবদ্ধতা সিস্টেম দ্বারা সুরক্ষিত রাখা হয়েছে।
        </p>
      </div>

      <div style="background-color: #18181b; padding: 16px 24px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #27272a;">
        ড্রপ অফ লাইফ (DropOfLife) ২৪/৭ ইমার্জেন্সি সাপোর্ট হেল্পলাইন: +8801521711716
      </div>
    </div>
  `;

  return deliverEmail({ to: recipientEmail, subject, html });
};

export const EmailService = {
  sendWelcomeEmail,
  sendDonorConfirmationEmail,
  sendPasswordResetNoticeEmail,
  sendPasswordResetLinkEmail,
  sendPasswordResetSuccessEmail,
  sendEmergencyRequestAlertEmail,
  sendDirectDonorRequestEmail,
  sendPaymentReceiptEmail,
  getResendClient,
};


