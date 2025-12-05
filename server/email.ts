import type { Booking, User, Event } from "@shared/schema";

interface EmailService {
  sendEmail(to: string, subject: string, html: string): Promise<boolean>;
}

class ResendEmailService implements EmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.EMAIL_FROM || 'The Quarterdeck <onboarding@resend.dev>';
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.apiKey) {
      console.log('[email] Resend API key not configured - email would be sent to:', to);
      console.log('[email] Subject:', subject);
      return false;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [to],
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[email] Failed to send email:', error);
        return false;
      }

      console.log('[email] Email sent successfully to:', to);
      return true;
    } catch (error) {
      console.error('[email] Error sending email:', error);
      return false;
    }
  }
}

const emailService = new ResendEmailService();

const baseStyles = `
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 10px 0 0; opacity: 0.9; }
    .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
    .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
    .button { display: inline-block; background: #2563eb; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 15px 0; }
    .button:hover { background: #1d4ed8; }
    .info-box { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 15px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748b; font-size: 14px; }
    .info-value { font-weight: 600; color: #1e293b; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-confirmed { background: #d1fae5; color: #065f46; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
    .highlight { background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
    .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
  </style>
`;

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${baseStyles}
</head>
<body>
  ${content}
</body>
</html>
`;

export const emailTemplates = {
  bookingCreated: (booking: any, user: any, facilityName: string) => {
    const isPendingPayment = booking.paymentStatus === 'PENDING_PAYMENT';
    const isBankTransfer = booking.paymentMethod === 'bank_transfer';
    
    return emailWrapper(`
      <div class="header">
        <h1>The Quarterdeck</h1>
        <p>Booking Confirmation</p>
      </div>
      <div class="content">
        <h2>Hello ${user.firstName || 'Member'},</h2>
        <p>Your booking has been successfully created! Here are the details:</p>
        
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Booking ID</span>
            <span class="info-value">${booking.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Facility</span>
            <span class="info-value">${facilityName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date</span>
            <span class="info-value">${booking.date}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Time</span>
            <span class="info-value">${booking.startTime} - ${booking.endTime}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Duration</span>
            <span class="info-value">${booking.durationMinutes} minutes</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total Amount</span>
            <span class="info-value">PKR ${booking.totalPrice?.toLocaleString()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value"><span class="status-badge status-pending">Tentative - Awaiting Payment</span></span>
          </div>
        </div>
        
        ${isPendingPayment && isBankTransfer ? `
          <div class="warning">
            <strong>Payment Required</strong><br>
            Please complete your bank transfer to confirm this booking:
            <ul style="margin: 10px 0;">
              <li><strong>Bank:</strong> Habib Bank Limited (HBL)</li>
              <li><strong>Account Number:</strong> 24517900455903</li>
              <li><strong>IBAN:</strong> PK71HABB0024517900455903</li>
              <li><strong>Account Title:</strong> The Quarterdeck</li>
            </ul>
            <p style="margin: 0;">After payment, please share your payment receipt via WhatsApp or email for verification.</p>
          </div>
        ` : isPendingPayment ? `
          <div class="warning">
            <strong>Payment Required</strong><br>
            Please pay at the facility on your booking date. Your booking will be confirmed upon payment.
          </div>
        ` : ''}
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br><strong>The Quarterdeck Team</strong></p>
      </div>
      <div class="footer">
        <p>The Quarterdeck Sports & Recreation Complex</p>
        <p>F-7/4, Islamabad, Pakistan | +92 51 1234567</p>
        <p>info@thequarterdeck.pk</p>
      </div>
    `);
  },

  paymentVerified: (booking: any, user: any, facilityName: string) => {
    return emailWrapper(`
      <div class="header">
        <h1>The Quarterdeck</h1>
        <p>Payment Confirmed</p>
      </div>
      <div class="content">
        <h2>Hello ${user.firstName || 'Member'},</h2>
        
        <div class="success">
          <strong>Great News!</strong><br>
          Your payment has been verified and your booking is now confirmed!
        </div>
        
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Booking ID</span>
            <span class="info-value">${booking.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Facility</span>
            <span class="info-value">${facilityName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date</span>
            <span class="info-value">${booking.date}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Time</span>
            <span class="info-value">${booking.startTime} - ${booking.endTime}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Amount Paid</span>
            <span class="info-value">PKR ${booking.totalPrice?.toLocaleString()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value"><span class="status-badge status-confirmed">Confirmed</span></span>
          </div>
        </div>
        
        <div class="highlight">
          <strong>What's Next?</strong><br>
          Please arrive 15 minutes before your scheduled time. Don't forget to bring appropriate sports attire and equipment if required.
        </div>
        
        <p>We look forward to seeing you!</p>
        
        <p>Best regards,<br><strong>The Quarterdeck Team</strong></p>
      </div>
      <div class="footer">
        <p>The Quarterdeck Sports & Recreation Complex</p>
        <p>F-7/4, Islamabad, Pakistan | +92 51 1234567</p>
        <p>info@thequarterdeck.pk</p>
      </div>
    `);
  },

  paymentRejected: (booking: any, user: any, facilityName: string, reason?: string) => {
    return emailWrapper(`
      <div class="header" style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);">
        <h1>The Quarterdeck</h1>
        <p>Payment Verification Issue</p>
      </div>
      <div class="content">
        <h2>Hello ${user.firstName || 'Member'},</h2>
        
        <div class="warning" style="background: #fee2e2; border-left-color: #dc2626;">
          <strong>Payment Verification Failed</strong><br>
          Unfortunately, we were unable to verify your payment for the booking below.
        </div>
        
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Booking ID</span>
            <span class="info-value">${booking.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Facility</span>
            <span class="info-value">${facilityName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date</span>
            <span class="info-value">${booking.date}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Time</span>
            <span class="info-value">${booking.startTime} - ${booking.endTime}</span>
          </div>
          ${reason ? `
          <div class="info-row">
            <span class="info-label">Reason</span>
            <span class="info-value">${reason}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="highlight">
          <strong>What You Can Do</strong><br>
          <ul style="margin: 10px 0;">
            <li>Check your payment details and try again</li>
            <li>Contact our support team for assistance</li>
            <li>Create a new booking if needed</li>
          </ul>
        </div>
        
        <p>If you believe this is an error, please contact us with your payment proof.</p>
        
        <p>Best regards,<br><strong>The Quarterdeck Team</strong></p>
      </div>
      <div class="footer">
        <p>The Quarterdeck Sports & Recreation Complex</p>
        <p>F-7/4, Islamabad, Pakistan | +92 51 1234567</p>
        <p>info@thequarterdeck.pk</p>
      </div>
    `);
  },

  bookingCancelled: (booking: any, user: any, facilityName: string, reason?: string) => {
    return emailWrapper(`
      <div class="header" style="background: linear-gradient(135deg, #64748b 0%, #94a3b8 100%);">
        <h1>The Quarterdeck</h1>
        <p>Booking Cancelled</p>
      </div>
      <div class="content">
        <h2>Hello ${user.firstName || 'Member'},</h2>
        
        <p>Your booking has been cancelled. Here are the details:</p>
        
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Booking ID</span>
            <span class="info-value">${booking.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Facility</span>
            <span class="info-value">${facilityName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date</span>
            <span class="info-value">${booking.date}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Time</span>
            <span class="info-value">${booking.startTime} - ${booking.endTime}</span>
          </div>
          ${reason ? `
          <div class="info-row">
            <span class="info-label">Reason</span>
            <span class="info-value">${reason}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value"><span class="status-badge status-cancelled">Cancelled</span></span>
          </div>
        </div>
        
        <p>If you'd like to make a new booking, please visit our website.</p>
        
        <p>Best regards,<br><strong>The Quarterdeck Team</strong></p>
      </div>
      <div class="footer">
        <p>The Quarterdeck Sports & Recreation Complex</p>
        <p>F-7/4, Islamabad, Pakistan | +92 51 1234567</p>
        <p>info@thequarterdeck.pk</p>
      </div>
    `);
  },

  eventRegistration: (event: any, user: any, registrationStatus: 'pending' | 'approved' | 'cancelled') => {
    const statusConfig = {
      pending: {
        title: 'Registration Received',
        color: '#f59e0b',
        badge: 'Pending Approval',
        badgeClass: 'status-pending',
        message: 'Your registration is pending approval. We will notify you once it has been reviewed.'
      },
      approved: {
        title: 'Registration Approved',
        color: '#10b981',
        badge: 'Approved',
        badgeClass: 'status-confirmed',
        message: 'Great news! Your registration has been approved. We look forward to seeing you!'
      },
      cancelled: {
        title: 'Registration Cancelled',
        color: '#dc2626',
        badge: 'Cancelled',
        badgeClass: 'status-cancelled',
        message: 'Your registration has been cancelled.'
      }
    };

    const config = statusConfig[registrationStatus];

    return emailWrapper(`
      <div class="header" style="background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%);">
        <h1>The Quarterdeck</h1>
        <p>${config.title}</p>
      </div>
      <div class="content">
        <h2>Hello ${user.firstName || user.fullName || 'Member'},</h2>
        
        <p>${config.message}</p>
        
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Event</span>
            <span class="info-value">${event.title}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Type</span>
            <span class="info-value">${event.type || 'Event'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Schedule</span>
            <span class="info-value">${event.scheduleDay || ''} ${event.scheduleTime || ''}</span>
          </div>
          ${event.instructor ? `
          <div class="info-row">
            <span class="info-label">Instructor</span>
            <span class="info-value">${event.instructor}</span>
          </div>
          ` : ''}
          ${event.price ? `
          <div class="info-row">
            <span class="info-label">Fee</span>
            <span class="info-value">PKR ${event.price.toLocaleString()}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value"><span class="status-badge ${config.badgeClass}">${config.badge}</span></span>
          </div>
        </div>
        
        ${registrationStatus === 'approved' ? `
        <div class="success">
          <strong>What's Next?</strong><br>
          Please arrive 15 minutes before the scheduled time. Don't forget to bring appropriate attire and equipment.
        </div>
        ` : ''}
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br><strong>The Quarterdeck Team</strong></p>
      </div>
      <div class="footer">
        <p>The Quarterdeck Sports & Recreation Complex</p>
        <p>F-7/4, Islamabad, Pakistan | +92 51 1234567</p>
        <p>info@thequarterdeck.pk</p>
      </div>
    `);
  },

  welcomeEmail: (user: any) => {
    return emailWrapper(`
      <div class="header">
        <h1>The Quarterdeck</h1>
        <p>Welcome Aboard!</p>
      </div>
      <div class="content">
        <h2>Hello ${user.firstName || 'Member'},</h2>
        
        <div class="success">
          <strong>Welcome to The Quarterdeck!</strong><br>
          Your account has been created successfully. You're now part of Islamabad's premier sports and recreation community.
        </div>
        
        <div class="highlight">
          <strong>What You Can Do Now:</strong><br>
          <ul style="margin: 10px 0;">
            <li>Book our world-class facilities</li>
            <li>Register for events and academies</li>
            <li>Join our leaderboard competitions</li>
            <li>Explore membership benefits</li>
          </ul>
        </div>
        
        <p style="text-align: center;">
          <a href="https://thequarterdeck.pk" class="button">Explore Our Facilities</a>
        </p>
        
        <p>We're excited to have you as part of our community!</p>
        
        <p>Best regards,<br><strong>The Quarterdeck Team</strong></p>
      </div>
      <div class="footer">
        <p>The Quarterdeck Sports & Recreation Complex</p>
        <p>F-7/4, Islamabad, Pakistan | +92 51 1234567</p>
        <p>info@thequarterdeck.pk</p>
      </div>
    `);
  },

  contactFormSubmission: (submission: { name: string; email: string; phone?: string; message: string }) => {
    return emailWrapper(`
      <div class="header">
        <h1>The Quarterdeck</h1>
        <p>Contact Form Submission</p>
      </div>
      <div class="content">
        <h2>New Contact Form Submission</h2>
        
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Name</span>
            <span class="info-value">${submission.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">${submission.email}</span>
          </div>
          ${submission.phone ? `
          <div class="info-row">
            <span class="info-label">Phone</span>
            <span class="info-value">${submission.phone}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="highlight">
          <strong>Message:</strong><br>
          ${submission.message}
        </div>
        
        <p>Please respond to this inquiry within 24 hours.</p>
      </div>
      <div class="footer">
        <p>The Quarterdeck Admin System</p>
      </div>
    `);
  },

  careerApplicationReceived: (application: { name: string; email: string; position: string }) => {
    return emailWrapper(`
      <div class="header">
        <h1>The Quarterdeck</h1>
        <p>Application Received</p>
      </div>
      <div class="content">
        <h2>Hello ${application.name},</h2>
        
        <div class="success">
          <strong>Application Received!</strong><br>
          Thank you for applying to join The Quarterdeck team.
        </div>
        
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Position</span>
            <span class="info-value">${application.position}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value"><span class="status-badge status-pending">Under Review</span></span>
          </div>
        </div>
        
        <div class="highlight">
          <strong>What Happens Next?</strong><br>
          Our HR team will review your application and get back to you within 5-7 business days. If your qualifications match our requirements, we'll contact you for an interview.
        </div>
        
        <p>Best regards,<br><strong>The Quarterdeck HR Team</strong></p>
      </div>
      <div class="footer">
        <p>The Quarterdeck Sports & Recreation Complex</p>
        <p>F-7/4, Islamabad, Pakistan | +92 51 1234567</p>
        <p>careers@thequarterdeck.pk</p>
      </div>
    `);
  },
};

export async function sendBookingCreatedEmail(booking: any, user: any, facilityName: string): Promise<boolean> {
  if (!user.email) {
    console.log('[email] No email address for user, skipping notification');
    return false;
  }
  
  const html = emailTemplates.bookingCreated(booking, user, facilityName);
  return emailService.sendEmail(
    user.email,
    `Booking Confirmation - ${facilityName} | The Quarterdeck`,
    html
  );
}

export async function sendPaymentVerifiedEmail(booking: any, user: any, facilityName: string): Promise<boolean> {
  if (!user.email) return false;
  
  const html = emailTemplates.paymentVerified(booking, user, facilityName);
  return emailService.sendEmail(
    user.email,
    `Payment Confirmed - Your Booking is Ready! | The Quarterdeck`,
    html
  );
}

export async function sendPaymentRejectedEmail(booking: any, user: any, facilityName: string, reason?: string): Promise<boolean> {
  if (!user.email) return false;
  
  const html = emailTemplates.paymentRejected(booking, user, facilityName, reason);
  return emailService.sendEmail(
    user.email,
    `Payment Verification Issue - Action Required | The Quarterdeck`,
    html
  );
}

export async function sendBookingCancelledEmail(booking: any, user: any, facilityName: string, reason?: string): Promise<boolean> {
  if (!user.email) return false;
  
  const html = emailTemplates.bookingCancelled(booking, user, facilityName, reason);
  return emailService.sendEmail(
    user.email,
    `Booking Cancelled - ${facilityName} | The Quarterdeck`,
    html
  );
}

export async function sendEventRegistrationEmail(event: any, user: any, status: 'pending' | 'approved' | 'cancelled'): Promise<boolean> {
  const email = user.email;
  if (!email) return false;
  
  const html = emailTemplates.eventRegistration(event, user, status);
  const subjects = {
    pending: `Registration Received - ${event.title} | The Quarterdeck`,
    approved: `Registration Approved - ${event.title} | The Quarterdeck`,
    cancelled: `Registration Cancelled - ${event.title} | The Quarterdeck`,
  };
  
  return emailService.sendEmail(email, subjects[status], html);
}

export async function sendWelcomeEmail(user: any): Promise<boolean> {
  if (!user.email) return false;
  
  const html = emailTemplates.welcomeEmail(user);
  return emailService.sendEmail(
    user.email,
    `Welcome to The Quarterdeck! | Your Sports Journey Begins`,
    html
  );
}

export async function sendContactFormEmail(submission: { name: string; email: string; phone?: string; message: string }): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@thequarterdeck.pk';
  const html = emailTemplates.contactFormSubmission(submission);
  return emailService.sendEmail(
    adminEmail,
    `New Contact Form Submission from ${submission.name}`,
    html
  );
}

export async function sendCareerApplicationEmail(application: { name: string; email: string; position: string }): Promise<boolean> {
  const html = emailTemplates.careerApplicationReceived(application);
  return emailService.sendEmail(
    application.email,
    `Application Received - ${application.position} | The Quarterdeck`,
    html
  );
}

export { emailService };
