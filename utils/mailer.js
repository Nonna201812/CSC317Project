const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables from .env file

// Validate email configuration
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('❌ EMAIL_USER or EMAIL_PASS is not set in the .env file');
  process.exit(1);
}

// Create a reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail', // Change this if you're using another email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Function to send an email alert
const sendBudgetAlert = async (userEmail, userName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Budget Alert - You have reached your limit!',
      text: `Dear ${userName},\n\nYou have reached your budget limit. Please review your spending.\n\nBest regards,\nYour Budget Tracker App`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.response);
    return info.response;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

module.exports = sendBudgetAlert;
