export function isPasswordResetEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESET_EMAIL_FROM);
}

export async function sendPasswordResetEmail({ email, name, resetUrl }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.RESET_EMAIL_FROM,
      to: [email],
      subject: 'Reset your PageTurner password',
      text: `Hello ${name},\n\nUse this link to reset your PageTurner password. It expires in 15 minutes:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>Hello ${escapeHtml(name)},</p><p>Use the link below to reset your PageTurner password. It expires in 15 minutes.</p><p><a href="${escapeHtml(resetUrl)}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`
    })
  });
  if (!response.ok) throw new Error(`Password reset email request failed with status ${response.status}.`);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}
