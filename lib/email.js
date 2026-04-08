import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const FROM = process.env.SMTP_FROM || 'noreply@psykasten.de';

function emailLayout(content) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>psyKasten</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafc;padding:40px 20px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;border:1px solid #e0e0e0;overflow:hidden;">

<!-- Header -->
<tr>
<td style="background-color:#1a1a2e;padding:28px 32px;text-align:center;">
<span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">psyKasten</span>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:32px;">
${content}
</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding:20px 32px;background-color:#eef2f7;border-top:1px solid #e0e0e0;text-align:center;">
<p style="margin:0;font-size:12px;color:#888;line-height:1.6;">
psyKasten &mdash; Cognitive Assessment Toolbox<br>
<a href="https://psykasten.de" style="color:#007bff;text-decoration:none;">psykasten.de</a>
</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendVerificationEmail(email, token) {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}`;

    const html = emailLayout(`
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#333;">Verify your email</h1>
<p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
Thanks for signing up. Please confirm your email address to activate your account.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:8px 0 24px;">
<a href="${verifyUrl}" style="display:inline-block;padding:14px 36px;background-color:#007bff;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">
Verify Email Address
</a>
</td></tr>
</table>

<p style="margin:0 0 16px;font-size:13px;color:#888;line-height:1.6;">
If the button doesn't work, copy and paste this link into your browser:
</p>
<p style="margin:0 0 24px;font-size:13px;color:#007bff;word-break:break-all;line-height:1.5;">
${verifyUrl}
</p>

<p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
This link expires in 24 hours. If you didn't create an account, you can ignore this email.
</p>
`);

    await transporter.sendMail({
        from: `psyKasten <${FROM}>`,
        to: email,
        subject: 'Verify your email address — psyKasten',
        html,
    });
}

export async function sendPasswordResetEmail(email, token) {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    const html = emailLayout(`
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#333;">Reset your password</h1>
<p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
We received a request to reset your password. Click the button below to choose a new one.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:8px 0 24px;">
<a href="${resetUrl}" style="display:inline-block;padding:14px 36px;background-color:#007bff;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">
Reset Password
</a>
</td></tr>
</table>

<p style="margin:0 0 16px;font-size:13px;color:#888;line-height:1.6;">
If the button doesn't work, copy and paste this link into your browser:
</p>
<p style="margin:0 0 24px;font-size:13px;color:#007bff;word-break:break-all;line-height:1.5;">
${resetUrl}
</p>

<p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.
</p>
`);

    await transporter.sendMail({
        from: `psyKasten <${FROM}>`,
        to: email,
        subject: 'Reset your password — psyKasten',
        html,
    });
}
