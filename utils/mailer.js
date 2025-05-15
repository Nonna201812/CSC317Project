const nodemailer = require('nodemailer');
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  throw new Error('EMAIL_USER and EMAIL_PASS must be set');
}
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
transporter.verify(err =>
  err
    ? console.error('SMTP error', err)
    : console.log('SMTP ready')
);

module.exports = async (to, name) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Budget Alert',
    text: `Hi ${name}, you’ve reached your budget limit.`
  });
  return info;
};
