const transporter = require('../config/email');

const sendOtpEmail = async (toEmail, studentName, otp) => {
  try {
    const mailOptions = {
      from: process.env.MAIL_FROM || 'College Portal <noreply@college.edu>',
      to: toEmail,
      subject: 'Password Reset OTP - College Academic Portal',
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;border:1px solid #e0e0e0;border-radius:10px">
  <h2 style="color:#1a237e">College Academic Portal</h2>
  <h3>Password Reset Request</h3>
  <p>Dear ${studentName},</p>
  <p>Your password reset OTP is:</p>
  <div style="background:#f5f5f5;padding:20px;text-align:center;border-radius:8px;margin:20px 0">
    <h1 style="color:#1a237e;letter-spacing:8px;font-size:36px">${otp}</h1>
  </div>
  <p>This OTP is valid for ${process.env.OTP_EXPIRE_MINUTES || 5} minutes. Do not share this OTP with anyone.</p>
  <p style="color:#f44336">If you did not request this, please contact admin immediately.</p>
</div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP sent successfully to ${toEmail}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
  }
};

module.exports = {
  sendOtpEmail
};
