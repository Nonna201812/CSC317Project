const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables from .env file

// Create a transporter object using the SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail', // Change this if you're using another email service
  auth: {
    user: process.env.EMAIL_USER, // Use the email from .env
    pass: process.env.EMAIL_PASS  // Use the email password from .env
  }
});

// Function to send an email alert
const sendBudgetAlert = (userEmail, userName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER, // The sender email (from your .env)
    to: userEmail, // The recipient email (the user's email)
    subject: 'Budget Alert - You have reached your limit!', // Email subject
    text: `Dear ${userName},\n\nYou have reached your budget limit. Please review your spending.\n\nBest regards,\nYour Budget Tracker App`
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

module.exports = sendBudgetAlert;

