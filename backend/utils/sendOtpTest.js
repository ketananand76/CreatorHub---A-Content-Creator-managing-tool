import nodemailer from 'nodemailer';

const sendTestOtp = async () => {
  const targetEmail = 'ketananand1110@gmail.com';
  const simulatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

  console.log(`[TEST PROCESS] Creating SMTP test account via Ethereal Email...`);
  try {
    // Generate test SMTP credentials
    const testAccount = await nodemailer.createTestAccount();

    // Create reuseable transporter object
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });

    const brandTemplate = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #070b14; color: #f8fafc; margin: 0; padding: 0; }
    .email-container { max-width: 500px; margin: 40px auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #8b5cf6, #6366f1); padding: 40px 20px; text-align: center; }
    .logo { color: #ffffff; font-size: 28px; font-weight: 800; margin-bottom: 5px; letter-spacing: -0.025em; }
    .subtitle { color: #c084fc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
    .content { padding: 40px 30px; text-align: center; }
    .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 10px; }
    .text { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 30px; }
    .otp-card { background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 20px; display: inline-block; min-width: 200px; margin: 10px auto; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 900; color: #a78bfa; letter-spacing: 6px; }
    .expiry { font-size: 10px; color: #f43f5e; font-weight: 700; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .footer { background-color: #0b0f19; padding: 25px 20px; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #64748b; }
    .footer-links { margin-bottom: 10px; }
    .footer-links a { color: #8b5cf6; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">CreatorHub</div>
      <div class="subtitle">Secure Verification System</div>
    </div>
    <div class="content">
      <div class="title">Verify Your Email Address</div>
      <div class="text">
        Welcome to CreatorHub! To finalize your workspace deployment, please verify your email address. Use the secure 6-digit verification code below:
      </div>
      <div class="otp-card">
        <div class="otp-code">${simulatedOtp}</div>
        <div class="expiry">Expires in 10 minutes</div>
      </div>
      <div class="text" style="margin-top: 30px; font-size: 12px; color: #64748b;">
        If you did not initiate this request, you can safely ignore this email. Your credentials remain secure.
      </div>
    </div>
    <div class="footer">
      <div class="footer-links">
        <a href="#">Support Center</a> • <a href="#">Privacy Policy</a> • <a href="#">Terms of Use</a>
      </div>
      © 2026 CreatorHub Inc. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

    const mailOptions = {
      from: '"CreatorHub Auth" <noreply@creatorhub.com>',
      to: targetEmail,
      subject: 'Verify Your CreatorHub Workspace Email',
      html: brandTemplate
    };

    console.log(`[TEST PROCESS] Sending test email to: ${targetEmail}...`);
    const info = await transporter.sendMail(mailOptions);

    console.log('\n==========================================================');
    console.log('✅ TEST OTP EMAIL SENT SUCCESSFULLY!');
    console.log(`Recipient: ${targetEmail}`);
    console.log(`Simulated OTP Code: ${simulatedOtp}`);
    console.log(`Message ID: ${info.messageId}`);
    console.log('----------------------------------------------------------');
    console.log(`🔗 OPEN PREVIEW URL TO SEE RENDERED EMAIL LIVE ON BROWSER:`);
    console.log(`${nodemailer.getTestMessageUrl(info)}`);
    console.log('==========================================================\n');

  } catch (err) {
    console.error('Error sending test OTP email:', err);
  }
};

sendTestOtp();
