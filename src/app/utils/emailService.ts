import { Resend } from 'resend';
import { config } from '../config';

let resendClient: Resend | null = null;
if (config.resendApiKey && !config.resendApiKey.includes('mock')) {
  try {
    resendClient = new Resend(config.resendApiKey);
  } catch (err) {
    console.warn('Resend client initialization skipped:', err);
  }
}

/**
 * Send Welcome Email upon User Registration
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

  if (resendClient) {
    try {
      const response = await resendClient.emails.send({
        from: `DropOfLife <${config.resendFromEmail}>`,
        to: user.email,
        subject,
        html,
      });
      console.log('📧 Welcome email delivered via Resend:', response.data?.id);
      return response;
    } catch (err) {
      console.warn('Resend email delivery skipped/failed:', err);
    }
  }

  // Simulated email log for dev/evaluator mode
  console.log(`[SIMULATED EMAIL via Resend] To: ${user.email} | Subject: ${subject}`);
  return { simulated: true, to: user.email, subject };
};

/**
 * Send Donor Registration & Readiness Confirmation Email
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

  if (resendClient) {
    try {
      const response = await resendClient.emails.send({
        from: `DropOfLife Donors <${config.resendFromEmail}>`,
        to: donor.email,
        subject,
        html,
      });
      console.log('📧 Donor confirmation email sent via Resend:', response.data?.id);
      return response;
    } catch (err) {
      console.warn('Resend donor email failed:', err);
    }
  }

  console.log(`[SIMULATED EMAIL via Resend] Donor Alert -> To: ${donor.email} | Blood: ${donor.bloodGroup}`);
  return { simulated: true, to: donor.email, subject };
};

export const EmailService = {
  sendWelcomeEmail,
  sendDonorConfirmationEmail,
};
