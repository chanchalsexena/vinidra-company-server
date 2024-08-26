// sendMail.js

import { createTransport } from "nodemailer";
const sendEmail = async (to, subject, text) => {
  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    logger: false,
    debug: false, // include SMTP traffic in the logs
  });
  await transporter.sendMail({
    to,
    subject,
    text,
  });
};

export default sendEmail;
