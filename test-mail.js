const nodemailer = require('nodemailer');
require('dotenv').config({ path: 'c:/Projetos/Pelotas/back-pelotas/.env' });

async function testMail() {
  const user = process.env.MAIL_USER;
  const clientId = process.env.MAIL_CLIENT_ID;
  const clientSecret = process.env.MAIL_CLIENT_SECRET;
  const refreshToken = process.env.MAIL_REFRESH_TOKEN;
  
  if (!user || !clientId || !clientSecret || !refreshToken) {
    console.error('Missing credentials');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user,
      clientId,
      clientSecret,
      refreshToken,
      // intentionally omitted accessToken to see if it fixes it
    },
  });

  try {
    const info = await transporter.sendMail({
      from: user,
      to: user, // send to self
      subject: 'Test Email',
      text: 'This is a test email from the Pelotas backend.'
    });
    console.log('Success:', info.messageId);
  } catch (err) {
    console.error('Error sending mail:', err.message, err.response);
  }
}

testMail();
