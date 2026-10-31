import nodemailer from "nodemailer"
import { Order } from "./types"
import { ShareResult } from "./gdrive"
import { formatRupiah } from "./format"

function getTransporter() {
  const user = process.env.SMTP_USER || "notreseller.magazine@gmail.com"
  const pass = process.env.SMTP_PASS

  if (!pass) {
    console.warn("[Mailer] SMTP_PASS is not configured. Email will be logged to console instead.")
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== "false", // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  })
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Sends a purchase confirmation email with Google Drive links to the buyer
 */
export async function sendOrderConfirmationEmail(
  order: Order,
  sharedFiles: ShareResult[]
): Promise<SendEmailResult> {
  const transporter = getTransporter()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://majalahpdf.my.id"
  const fromAddress = `DIGITALPITSTOP Magazines <${process.env.SMTP_USER || "notreseller.magazine@gmail.com"}>`

  // Generate HTML for each purchased magazine item
  const itemsHtml = order.items
    .map((item, idx) => {
      const share = sharedFiles[idx] || {}
      const driveLink =
        share.webViewLink ||
        item.pdfUrl ||
        `${siteUrl}/library`

      return `
      <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px; background-color: #ffffff; display: flex;">
        <div style="flex: 1;">
          <div style="font-size: 11px; font-weight: 700; color: #4f46e5; text-transform: uppercase; margin-bottom: 4px;">
            ${item.issueNumber || "Digital Edition"}
          </div>
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
            ${item.title}
          </h3>
          <div style="font-size: 13px; font-weight: 600; color: #059669; margin-bottom: 14px;">
            ${formatRupiah(item.price)}
          </div>
          <div style="margin-top: 10px;">
            <a href="${driveLink}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700;">
              📖 Buka & Baca di Google Drive →
            </a>
          </div>
        </div>
      </div>
    `
    })
    .join("")

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>Akses Majalah Digital Anda</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #334155;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header with Picture Logo -->
        <div style="background-color: #0f172a; padding: 28px 24px; text-align: center;">
          <a href="${siteUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
            <img src="https://s3api2.skyconnection.id/image/2026/10/31/logo-edit-remene-to-dps4.jpeg" alt="DIGITALPITSTOP Logo" style="height: 56px; max-width: 220px; object-fit: contain; border-radius: 8px; margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto;" />
          </a>
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
            DIGITALPITSTOP <span style="color: #818cf8; font-weight: 400;">MAGAZINES</span>
          </h1>
          <p style="color: #94a3b8; font-size: 12px; margin: 6px 0 0 0;">
            Akses Digital PDF & Struk Pembelian
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px;">
          <p style="font-size: 15px; line-height: 1.5; color: #1e293b; margin-top: 0;">
            Halo <strong>${order.customerName}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Terima kasih telah berbelanja di <strong>majalahpdf.my.id</strong>. Pesanan Anda (No. Order: <code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: #0f172a;">${order.orderCode}</code>) telah berhasil diverifikasi.
          </p>

          <!-- Notification box -->
          <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 14px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #3730a3; font-weight: 600;">
              ✨ File PDF telah otomatis dibagikan ke Google Drive akun Anda (${order.customerEmail}).
            </p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #4338ca;">
              Anda dapat membaca langsung tanpa batasan atau mendownloadnya ke perangkat Anda.
            </p>
          </div>

          <!-- Items list -->
          <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin: 24px 0 12px 0;">
            Daftar Majalah yang Anda Beli (${order.items.length} Edisi):
          </h2>
          ${itemsHtml}

          <!-- Total summary -->
          <div style="border-top: 2px dashed #e2e8f0; margin-top: 24px; padding-top: 16px; display: flex; justify-content: space-between;">
            <span style="font-size: 14px; color: #64748b; font-weight: 600;">Total Pembayaran:</span>
            <span style="font-size: 16px; color: #0f172a; font-weight: 800; float: right;">${formatRupiah(order.totalAmount)}</span>
          </div>

          <!-- Library Link -->
          <div style="text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
            <a href="${siteUrl}/library" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 700;">
              Buka Koleksi di My Library Web →
            </a>
          </div>

          <!-- WhatsApp Contact Support Card -->
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 18px; margin: 24px 0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="width: 32px; vertical-align: top; font-size: 20px;">💬</td>
                <td>
                  <p style="margin: 0; font-size: 13px; font-weight: 700; color: #166534;">
                    Layanan Bantuan Pelanggan (WhatsApp):
                  </p>
                  <p style="margin: 3px 0 0 0; font-size: 12px; color: #15803d;">
                    Ada kendala akses file atau pertanyaan? Hubungi kami via WhatsApp:
                    <a href="https://wa.me/6282240404612" target="_blank" style="color: #15803d; font-weight: 800; text-decoration: underline;">
                      082240404612 (Chat Only)
                    </a>
                  </p>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #334155;">
            Layanan Bantuan & Dukungan:
          </p>
          <p style="margin: 0 0 12px 0; font-size: 12px; color: #64748b;">
            💬 WhatsApp: <a href="https://wa.me/6282240404612" target="_blank" style="color: #16a34a; font-weight: 700; text-decoration: none;">082240404612 (Chat Only)</a> &bull; 
            ✉️ Email: <a href="mailto:notreseller.magazine@gmail.com" style="color: #6366f1; text-decoration: none;">notreseller.magazine@gmail.com</a>
          </p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            © ${new Date().getFullYear()} DIGITALPITSTOP MAGAZINES. All rights reserved.<br>
            <a href="${siteUrl}" target="_blank" style="color: #94a3b8; text-decoration: underline;">majalahpdf.my.id</a>
          </p>
        </div>
        </div>

      </div>
    </body>
    </html>
  `

  if (!transporter) {
    console.log(`[Mailer Mock] Email to ${order.customerEmail} prepared: Order ${order.orderCode}`)
    return {
      success: true,
      messageId: "mock-" + Date.now(),
    }
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: order.customerEmail,
      subject: `[DIGITALPITSTOP] Akses Majalah Digital Anda (Order #${order.orderCode})`,
      html: emailHtml,
    })

    console.log(`[Mailer] Order confirmation email sent to ${order.customerEmail}: ${info.messageId}`)
    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error: any) {
    console.error(`[Mailer] Failed to send email to ${order.customerEmail}:`, error)
    return {
      success: false,
      error: error.message || String(error),
    }
  }
}
