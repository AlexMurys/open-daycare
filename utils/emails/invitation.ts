export interface InvitationEmailData {
  parentName: string;
  childName: string;
  roomName: string;
  code: string;
  activateUrl: string;
}

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const COLORS = {
  canvas: "#f6ecdf",
  surface: "#fffdf9",
  line: "#eadfd0",
  ink: "#3f362e",
  inkMuted: "#6e6359",
  accent: "#d9583c",
  accentWash: "#fbe3d8",
} as const;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatExpiryDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function renderInvitationEmail(data: InvitationEmailData): {
  subject: string;
  html: string;
} {
  const parentName = escapeHtml(data.parentName);
  const childName = escapeHtml(data.childName);
  const roomName = escapeHtml(data.roomName);
  const code = escapeHtml(data.code);
  const activateUrl = escapeHtml(data.activateUrl);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const expiryText = `${formatExpiryDate(expiresAt)}`;

  const subject = `Tu código para seguir el día de ${data.childName} en OpenDayCare`;

  const html = `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:0; background-color:${COLORS.canvas}; font-family:${FONT_STACK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.canvas}; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:${COLORS.surface}; border:1px solid ${COLORS.line}; border-radius:16px; overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <p style="margin:0 0 4px 0; font-size:13px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:${COLORS.accent};">OpenDayCare</p>
                <h1 style="margin:0 0 16px 0; font-size:22px; line-height:1.3; font-weight:700; color:${COLORS.ink};">Hola, ${parentName}</h1>
                <p style="margin:0 0 8px 0; font-size:15px; line-height:1.5; color:${COLORS.inkMuted};">Te invitaron a seguir el día de:</p>
                <p style="margin:0 0 24px 0; font-size:17px; font-weight:700; color:${COLORS.ink};">${childName} · ${roomName}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <p style="margin:0 0 8px 0; font-size:13px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:${COLORS.inkMuted};">Tu código de activación</p>
                <p style="margin:0 0 24px 0; padding:16px; background-color:${COLORS.accentWash}; border-radius:12px; font-size:30px; font-weight:700; letter-spacing:0.3em; text-align:center; color:${COLORS.ink}; font-family:${FONT_STACK};">${code}</p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px 0;">
                  <tr>
                    <td style="border-radius:10px; background-color:${COLORS.accent};">
                      <a href="${activateUrl}" style="display:inline-block; padding:14px 28px; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; font-family:${FONT_STACK};">Activar mi cuenta</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 32px 32px;">
                <p style="margin:0; font-size:13px; line-height:1.5; color:${COLORS.inkMuted};">Este código vence en 7 días — ${expiryText}. Si no solicitaste esta invitación, puedes ignorar este correo.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html };
}
