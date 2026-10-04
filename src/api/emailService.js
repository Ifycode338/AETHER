import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export async function sendEmail({ to, subject, body, html }) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'BennyCare <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      text: body,
      html: html || body,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
