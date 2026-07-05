import nodemailer from 'nodemailer';

const testEmails = [
  'ketananand1110@gmail.com',
  'designkartbihar@gmail.com',
  'ketanpaswan53@gmail.com'
];
const appPassword = 'razheraquoueafqh'; // The trimmed password from your .env

const runDiagnostic = async () => {
  console.log('=== MULTI-ACCOUNT SMTP DIAGNOSTIC ===');
  console.log(`App Password: ${appPassword}\n`);

  for (const email of testEmails) {
    console.log(`Testing authentication for sender: ${email}...`);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: email,
        pass: appPassword
      }
    });

    try {
      await transporter.verify();
      console.log(`✅ SUCCESS! ${email} authenticated successfully!`);
      
      console.log(`Sending verification test to ${email}...`);
      await transporter.sendMail({
        from: `"CreatorHub Diagnostics" <${email}>`,
        to: email,
        subject: 'CreatorHub SMTP Diagnostics Success',
        html: '<h3>Your SMTP is working!</h3>'
      });
      console.log(`✅ Mail delivered to: ${email}\n`);
      return; // Stop if we found a working combination!
    } catch (err) {
      console.error(`❌ FAILED for ${email}: ${err.message}\n`);
    }
  }

  console.log('======================================');
  console.log('Diagnostic finished. No combination was accepted by Google SMTP.');
};

runDiagnostic();
