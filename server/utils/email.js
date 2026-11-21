const nodemailer = require('nodemailer');
const config = require('./config');

function getTransport() {
  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) return null;
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: { user: config.smtpUser, pass: config.smtpPass }
  });
}

async function sendOrderConfirmation(order, email) {
  const transport = getTransport();
  if (!transport) return;
  await transport.sendMail({
    from: config.smtpFrom || config.smtpUser,
    to: email,
    subject: `Your Shop with Vikky order ${order.orderNumber}`,
    html: `<div style="font-family:Arial,sans-serif;color:#2A0A4F"><h1 style="color:#3B0B73">Shop with Vikky</h1><p>Thank you for your order.</p><p><strong>Order:</strong> ${order.orderNumber}</p><p><strong>Total:</strong> ₦${order.total.toLocaleString('en-NG')}</p></div>`
  });
}

module.exports = { sendOrderConfirmation };
