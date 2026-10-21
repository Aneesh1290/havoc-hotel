import nodemailer from 'nodemailer';
import db from './db.js';

// Retrieve an active SMTP transporter configured via Environment Variables or Admin Settings
export function getMailTransporter() {
  // 1. First check environment variables
  const envUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const envPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const envHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const envPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;

  if (envUser && envPass) {
    return {
      transporter: nodemailer.createTransport({
        host: envHost,
        port: envPort,
        secure: envPort === 465, // true for 465, false for 587
        auth: {
          user: envUser,
          pass: envPass
        }
      }),
      fromEmail: envUser,
      senderName: process.env.SMTP_FROM_NAME || 'Hotel Sabharwal Hospitality'
    };
  }

  // 2. Fall back to settings stored in SQLite database
  try {
    const getSetting = (key) => {
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
      if (!row) return '';
      try {
        return JSON.parse(row.value);
      } catch (e) {
        return row.value;
      }
    };

    const dbUser = getSetting('smtpUser');
    const dbPass = getSetting('smtpPass');
    const dbHost = getSetting('smtpHost') || 'smtp.gmail.com';
    const dbPort = parseInt(getSetting('smtpPort')) || 465;
    const dbFromName = getSetting('smtpFromName') || 'Hotel Sabharwal Hospitality';

    if (dbUser && dbPass) {
      return {
        transporter: nodemailer.createTransport({
          host: dbHost,
          port: dbPort,
          secure: dbPort === 465,
          auth: {
            user: dbUser,
            pass: dbPass
          }
        }),
        fromEmail: dbUser,
        senderName: dbFromName
      };
    }
  } catch (err) {
    console.error('[EmailService] Error retrieving SMTP settings from database:', err);
  }

  return null;
}

// Format date into human-readable format
function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

// Generate premium HTML confirmation email
export function generateBookingConfirmationHtml(booking) {
  const checkInFormatted = formatDate(booking.checkIn);
  const checkOutFormatted = formatDate(booking.checkOut);
  const bookingId = booking.id ? `#${booking.id}` : 'PENDING';
  const amountFormatted = Number(booking.amount || 0).toLocaleString('en-IN');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation - Hotel Sabharwal</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6; padding: 30px 15px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
            
            <!-- Header Banner -->
            <tr>
              <td style="background-color: #0A192F; padding: 36px 30px; text-align: center;">
                <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                  HOTEL SABHARWAL
                </h1>
                <p style="color: #93C5FD; margin: 6px 0 0 0; font-size: 13px; letter-spacing: 2px; text-transform: uppercase;">
                  HOSPITALITY • ESTD. 1965
                </p>
              </td>
            </tr>

            <!-- Confirmation Badge -->
            <tr>
              <td style="padding: 32px 30px 20px 30px; text-align: center;">
                <div style="display: inline-block; background-color: #ECFDF5; color: #047857; font-weight: 600; font-size: 14px; padding: 6px 18px; border-radius: 30px; border: 1px solid #A7F3D0;">
                  ✓ Reservation Confirmed
                </div>
                <h2 style="color: #111827; margin: 18px 0 8px 0; font-size: 22px; font-weight: 700;">
                  We look forward to welcoming you, ${booking.name}!
                </h2>
                <p style="color: #6B7280; margin: 0; font-size: 15px; line-height: 1.5;">
                  Thank you for booking with us. Below are the complete details of your confirmed reservation.
                </p>
              </td>
            </tr>

            <!-- Booking Overview Card -->
            <tr>
              <td style="padding: 10px 30px 20px 30px;">
                <table role="presentation" width="100%" style="background-color: #F9FAFB; border-radius: 12px; border: 1px solid #E5E7EB; padding: 20px;">
                  <tr>
                    <td style="padding-bottom: 12px; border-bottom: 1px solid #E5E7EB;">
                      <span style="font-size: 12px; text-transform: uppercase; color: #6B7280; font-weight: 600;">Booking Reference</span>
                      <div style="font-size: 18px; font-weight: 700; color: #1E3A8A; margin-top: 2px;">${bookingId}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 14px;">
                      <span style="font-size: 12px; text-transform: uppercase; color: #6B7280; font-weight: 600;">Property / Hotel</span>
                      <div style="font-size: 16px; font-weight: 700; color: #111827; margin-top: 2px;">${booking.hotelName}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Stay Details Grid -->
            <tr>
              <td style="padding: 0 30px 20px 30px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="48%" style="background-color: #EFF6FF; border-radius: 10px; padding: 16px; border: 1px solid #DBEAFE;">
                      <div style="font-size: 12px; text-transform: uppercase; color: #1E40AF; font-weight: 600;">Check-In</div>
                      <div style="font-size: 15px; font-weight: 700; color: #1E3A8A; margin-top: 4px;">${checkInFormatted}</div>
                      <div style="font-size: 12px; color: #60A5FA; margin-top: 2px;">From 2:00 PM</div>
                    </td>
                    <td width="4%"></td>
                    <td width="48%" style="background-color: #EFF6FF; border-radius: 10px; padding: 16px; border: 1px solid #DBEAFE;">
                      <div style="font-size: 12px; text-transform: uppercase; color: #1E40AF; font-weight: 600;">Check-Out</div>
                      <div style="font-size: 15px; font-weight: 700; color: #1E3A8A; margin-top: 4px;">${checkOutFormatted}</div>
                      <div style="font-size: 12px; color: #60A5FA; margin-top: 2px;">Until 11:00 AM</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Reservation Specifications -->
            <tr>
              <td style="padding: 0 30px 20px 30px;">
                <table role="presentation" width="100%" style="border-collapse: collapse; font-size: 14px;">
                  <tr style="border-bottom: 1px solid #F3F4F6;">
                    <td style="padding: 10px 0; color: #6B7280;">Number of Rooms:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #111827;">${booking.rooms || 1} Room(s)</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #F3F4F6;">
                    <td style="padding: 10px 0; color: #6B7280;">Guests:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #111827;">${booking.adults || 1} Adult(s)${booking.children ? `, ${booking.children} Child(ren)` : ''}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #F3F4F6;">
                    <td style="padding: 10px 0; color: #6B7280;">Primary Contact:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #111827;">${booking.phone || 'N/A'}</td>
                  </tr>
                  ${booking.notes ? `
                  <tr style="border-bottom: 1px solid #F3F4F6;">
                    <td style="padding: 10px 0; color: #6B7280;">Special Requests:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 500; color: #111827;">${booking.notes}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 14px 0 6px 0; font-size: 16px; font-weight: 700; color: #111827;">Total Paid:</td>
                    <td style="padding: 14px 0 6px 0; text-align: right; font-size: 20px; font-weight: 800; color: #047857;">₹${amountFormatted}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Notice / Help Box -->
            <tr>
              <td style="padding: 10px 30px 30px 30px;">
                <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; padding: 14px 18px; font-size: 13px; color: #92400E; line-height: 1.5;">
                  <strong>Need to manage or reschedule your stay?</strong><br>
                  Log into your account anytime at our guest portal using your email address <strong>${booking.email}</strong>.
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 24px 30px; text-align: center; font-size: 12px; color: #9CA3AF; line-height: 1.6;">
                Sabharwal Hospitality • A unit of Sabharwal Group • Estd. 1965<br>
                For assistance or front desk enquiries, please reply to this email or contact support.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

// Function to trigger sending confirmation mail
export async function sendBookingConfirmationEmail(booking) {
  if (!booking.email) {
    console.log('[EmailService] Skipped sending email: No customer email provided.');
    return { success: false, reason: 'No customer email provided' };
  }

  const mailConfig = getMailTransporter();
  if (!mailConfig) {
    console.warn('[EmailService] SMTP credentials not configured (GMAIL_USER & GMAIL_APP_PASSWORD or Admin Settings). Email was not sent.');
    return { success: false, reason: 'SMTP credentials not configured' };
  }

  const { transporter, fromEmail, senderName } = mailConfig;

  const mailOptions = {
    from: `"${senderName}" <${fromEmail}>`,
    to: booking.email,
    subject: `Booking Confirmed: ${booking.hotelName} (Ref #${booking.id || 'CONFIRMED'})`,
    html: generateBookingConfirmationHtml(booking),
    text: `Hello ${booking.name},\n\nYour reservation at ${booking.hotelName} is confirmed!\n\nBooking ID: #${booking.id}\nCheck-in: ${formatDate(booking.checkIn)}\nCheck-out: ${formatDate(booking.checkOut)}\nRooms: ${booking.rooms || 1}\nAmount: ₹${Number(booking.amount || 0).toLocaleString('en-IN')}\n\nThank you for choosing Hotel Sabharwal Hospitality.`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] ✓ Booking confirmation email sent to ${booking.email} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] ✕ Failed to send booking confirmation email to ${booking.email}:`, error.message);
    return { success: false, error: error.message };
  }
}
