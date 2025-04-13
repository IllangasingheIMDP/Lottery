// app/api/auth/forgot-password/route.js
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400 }
      );
    }

    // Create a transporter using environment variables
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email options
    const mailOptions = {
      from: `"Lottery Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Recovery',
      text: 'Your password is: kumaral\n\nPlease use this to log in. ',
      html: `
        <h2>Password Recovery</h2>
        <p>Your password is: <strong>kumaral</strong></p>
        <p>Please use this to log in.</p>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return new Response(
      JSON.stringify({ message: 'Password recovery email sent successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/auth/forgot-password error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send email', details: error.message }),
      { status: 500 }
    );
  }
}