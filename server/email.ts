import type { Booking, User, Event } from "@shared/schema";
import logger from "./logger";
import nodemailer from "nodemailer";

interface EmailService {
  sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<boolean>;
}

class NodemailerEmailService implements EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private isConfigured: boolean;

  constructor() {
    const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';
    this.fromEmail = process.env.EMAIL_FROM || '"The Quarterdeck" <noreply@thequarterdeck.pk>';
    
    this.isConfigured = !!(smtpUser && smtpPass);

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
    logger.debug('Attempting to send email', { 
      source: 'email',
      to, 
      subject,
      smtpConfigured: this.isConfigured 
    });
    
    if (!this.isConfigured) {
      logger.warn('SMTP credentials not configured (SMTP_USER/SMTP_PASS)', { source: 'email', to, subject });
      return false;
    }

    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: this.fromEmail,
        to,
        subject,
        html,
      };
      
      if (replyTo) {
        mailOptions.replyTo = replyTo;
      }

      await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { source: 'email', to, subject });
      return true;
    } catch (error) {
      logger.error('Error sending email', { source: 'email', to, error });
      return false;
    }
  }
}

const emailService = new NodemailerEmailService();

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
  console.log('[email] Contact form - ADMIN_EMAIL env:', process.env.ADMIN_EMAIL ? 'SET' : 'NOT SET');
  console.log('[email] Contact form - Sending to:', adminEmail);
  console.log('[email] Contact form - Reply-To:', submission.email);
  const html = emailTemplates.contactFormSubmission(submission);
  return emailService.sendEmail(
    adminEmail,
    `New Contact Form Submission from ${submission.name}`,
    html,
    submission.email
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

export async function sendEmailVerificationEmail(user: { email: string; firstName: string; verificationToken: string }): Promise<boolean> {
  const verificationUrl = `${process.env.APP_URL || 'https://thequarterdeck.pk'}/verify-email?token=${user.verificationToken}`;
  
  const html = emailWrapper(`
    <div class="header">
      <h1>Verify Your Email</h1>
      <p>Welcome to The Quarterdeck</p>
    </div>
    <div class="content">
      <p>Hello ${user.firstName},</p>
      <p>Thank you for signing up! Please verify your email address to complete your registration and access all features.</p>
      
      <div class="highlight">
        <p style="margin: 0;"><strong>This verification link will expire in 15 minutes.</strong></p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      
      <p style="font-size: 12px; color: #64748b;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="font-size: 12px; word-break: break-all; color: #2563eb;">${verificationUrl}</p>
      
      <div class="warning">
        <p style="margin: 0;">If you did not create an account, please ignore this email.</p>
      </div>
    </div>
    <div class="footer">
      <p>The Quarterdeck Sports & Recreation Complex</p>
      <p>Islamabad, Pakistan</p>
    </div>
  `);
  
  return emailService.sendEmail(
    user.email,
    `Verify Your Email | The Quarterdeck`,
    html
  );
}

export async function sendPasswordResetEmail(user: { email: string; firstName: string; resetToken: string }): Promise<boolean> {
  const resetUrl = `${process.env.APP_URL || 'https://thequarterdeck.pk'}/reset-password?token=${user.resetToken}`;
  
  const html = emailWrapper(`
    <div class="header">
      <h1>Reset Your Password</h1>
      <p>The Quarterdeck</p>
    </div>
    <div class="content">
      <p>Hello ${user.firstName},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      
      <div class="highlight">
        <p style="margin: 0;"><strong>This link will expire in 60 minutes.</strong></p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      
      <p style="font-size: 12px; color: #64748b;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="font-size: 12px; word-break: break-all; color: #2563eb;">${resetUrl}</p>
      
      <div class="warning">
        <p style="margin: 0;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
      </div>
    </div>
    <div class="footer">
      <p>The Quarterdeck Sports & Recreation Complex</p>
      <p>Islamabad, Pakistan</p>
    </div>
  `);
  
  return emailService.sendEmail(
    user.email,
    `Reset Your Password | The Quarterdeck`,
    html
  );
}

export async function sendMembershipApprovedEmail(user: { email: string; firstName: string; membershipNumber: string; tier: string; expiresAt: string }): Promise<boolean> {
  const html = emailWrapper(`
    <div class="header">
      <h1>Membership Approved</h1>
      <p>Welcome to The Quarterdeck Family!</p>
    </div>
    <div class="content">
      <h2>Congratulations ${user.firstName}!</h2>
      
      <div class="success">
        <strong>Your membership has been approved!</strong><br>
        You now have access to all our world-class facilities and exclusive member benefits.
      </div>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Membership Number</span>
          <span class="info-value">${user.membershipNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tier</span>
          <span class="info-value">${user.tier}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Valid Until</span>
          <span class="info-value">${user.expiresAt}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="info-value"><span class="status-badge status-confirmed">Active</span></span>
        </div>
      </div>
      
      <div class="highlight">
        <strong>Member Benefits Include:</strong>
        <ul style="margin: 10px 0;">
          <li>Discounted facility bookings during off-peak hours</li>
          <li>Priority access to events and academies</li>
          <li>Exclusive member-only tournaments</li>
          <li>Guest privileges for family and friends</li>
        </ul>
      </div>
      
      <p style="text-align: center;">
        <a href="https://thequarterdeck.pk/booking" class="button">Book a Facility Now</a>
      </p>
      
      <p>Welcome aboard!</p>
      <p>Best regards,<br><strong>The Quarterdeck Team</strong></p>
    </div>
    <div class="footer">
      <p>The Quarterdeck Sports & Recreation Complex</p>
      <p>F-7/4, Islamabad, Pakistan | +92 51 1234567</p>
      <p>info@thequarterdeck.pk</p>
    </div>
  `);
  
  return emailService.sendEmail(
    user.email,
    `Membership Approved - Welcome to The Quarterdeck!`,
    html
  );
}

export async function sendMembershipRejectedEmail(user: { email: string; firstName: string; reason?: string }): Promise<boolean> {
  const html = emailWrapper(`
    <div class="header" style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);">
      <h1>Membership Application Update</h1>
      <p>The Quarterdeck</p>
    </div>
    <div class="content">
      <h2>Hello ${user.firstName},</h2>
      
      <div class="warning" style="background: #fee2e2; border-left-color: #dc2626;">
        <strong>Membership Application Not Approved</strong><br>
        We regret to inform you that your membership application could not be approved at this time.
      </div>
      
      ${user.reason ? `
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Reason</span>
          <span class="info-value">${user.reason}</span>
        </div>
      </div>
      ` : ''}
      
      <div class="highlight">
        <strong>Next Steps:</strong>
        <ul style="margin: 10px 0;">
          <li>Review your application details</li>
          <li>Contact our membership team for clarification</li>
          <li>Reapply once you've addressed any issues</li>
        </ul>
      </div>
      
      <p>If you have any questions, please contact our membership team.</p>
      
      <p>Best regards,<br><strong>The Quarterdeck Membership Team</strong></p>
    </div>
    <div class="footer">
      <p>The Quarterdeck Sports & Recreation Complex</p>
      <p>F-7/4, Islamabad, Pakistan | +92 51 1234567</p>
      <p>membership@thequarterdeck.pk</p>
    </div>
  `);
  
  return emailService.sendEmail(
    user.email,
    `Membership Application Update | The Quarterdeck`,
    html
  );
}

export async function sendMembershipRenewalReminderEmail(user: { email: string; firstName: string; membershipNumber: string; tier: string; expiresAt: string; daysRemaining: number }): Promise<boolean> {
  const urgencyColor = user.daysRemaining <= 1 ? '#dc2626' : user.daysRemaining <= 3 ? '#f59e0b' : '#2563eb';
  const urgencyText = user.daysRemaining <= 1 ? 'Expires Tomorrow!' : user.daysRemaining <= 3 ? 'Expiring Soon!' : 'Renewal Reminder';
  
  const html = emailWrapper(`
    <div class="header" style="background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%);">
      <h1>${urgencyText}</h1>
      <p>Your membership renewal is due</p>
    </div>
    <div class="content">
      <h2>Hello ${user.firstName},</h2>
      
      <div class="${user.daysRemaining <= 3 ? 'warning' : 'highlight'}" style="${user.daysRemaining <= 1 ? 'background: #fee2e2; border-left-color: #dc2626;' : ''}">
        <strong>Your membership expires in ${user.daysRemaining} day${user.daysRemaining === 1 ? '' : 's'}!</strong><br>
        Renew now to continue enjoying your member benefits without interruption.
      </div>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Membership Number</span>
          <span class="info-value">${user.membershipNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Current Tier</span>
          <span class="info-value">${user.tier}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Expires On</span>
          <span class="info-value">${user.expiresAt}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Days Remaining</span>
          <span class="info-value"><span class="status-badge ${user.daysRemaining <= 1 ? 'status-cancelled' : user.daysRemaining <= 3 ? 'status-pending' : 'status-confirmed'}">${user.daysRemaining} day${user.daysRemaining === 1 ? '' : 's'}</span></span>
        </div>
      </div>
      
      <div class="highlight">
        <strong>Don't Lose Your Benefits:</strong>
        <ul style="margin: 10px 0;">
          <li>Discounted facility bookings</li>
          <li>Priority event registration</li>
          <li>Leaderboard participation</li>
          <li>Guest privileges</li>
        </ul>
      </div>
      
      <p style="text-align: center;">
        <a href="https://thequarterdeck.pk/profile" class="button">Renew Membership</a>
      </p>
      
      <p>If you have any questions about renewal, please contact our membership team.</p>
      
      <p>Best regards,<br><strong>The Quarterdeck Team</strong></p>
    </div>
    <div class="footer">
      <p>The Quarterdeck Sports & Recreation Complex</p>
      <p>F-7/4, Islamabad, Pakistan | +92 51 1234567</p>
      <p>membership@thequarterdeck.pk</p>
    </div>
  `);
  
  return emailService.sendEmail(
    user.email,
    `${urgencyText} - ${user.daysRemaining} Day${user.daysRemaining === 1 ? '' : 's'} Left | The Quarterdeck`,
    html
  );
}

// Admin alert email functions
const getAdminEmail = () => process.env.ADMIN_EMAIL || 'admin@thequarterdeck.pk';

export async function sendAdminNewUserAlert(user: { email: string; firstName: string; lastName: string; createdAt?: string }): Promise<boolean> {
  const html = emailWrapper(`
    <div class="header" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
      <h1>New User Registration</h1>
      <p>A new user has signed up</p>
    </div>
    <div class="content">
      <h2>New Member Alert</h2>
      <p>A new user has registered on The Quarterdeck platform:</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Name</span>
          <span class="info-value">${user.firstName} ${user.lastName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">${user.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Registered At</span>
          <span class="info-value">${user.createdAt || new Date().toLocaleString()}</span>
        </div>
      </div>
      
      <p style="text-align: center;">
        <a href="https://thequarterdeck.pk/admin/users" class="button">View in Admin Panel</a>
      </p>
    </div>
    <div class="footer">
      <p>The Quarterdeck Admin Notification</p>
    </div>
  `);
  
  return emailService.sendEmail(
    getAdminEmail(),
    `New User Registration: ${user.firstName} ${user.lastName} | The Quarterdeck`,
    html
  );
}

export async function sendAdminMembershipSelectionAlert(user: { email: string; firstName: string; lastName: string }, tier: string, amount: number): Promise<boolean> {
  const html = emailWrapper(`
    <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%);">
      <h1>Membership Selection</h1>
      <p>A user has selected a membership tier</p>
    </div>
    <div class="content">
      <h2>Membership Interest Alert</h2>
      <p>A user has selected a membership tier on The Quarterdeck platform:</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">User</span>
          <span class="info-value">${user.firstName} ${user.lastName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">${user.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Selected Tier</span>
          <span class="info-value" style="color: #f59e0b; font-weight: bold;">${tier}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Amount</span>
          <span class="info-value">PKR ${amount.toLocaleString()}</span>
        </div>
      </div>
      
      <div class="highlight">
        <strong>Action Required:</strong> This user is interested in becoming a member. They will need to submit payment proof before their membership can be activated.
      </div>
      
      <p style="text-align: center;">
        <a href="https://thequarterdeck.pk/admin/membership-applications" class="button">View Applications</a>
      </p>
    </div>
    <div class="footer">
      <p>The Quarterdeck Admin Notification</p>
    </div>
  `);
  
  return emailService.sendEmail(
    getAdminEmail(),
    `Membership Selection: ${user.firstName} wants ${tier} | The Quarterdeck`,
    html
  );
}

export async function sendAdminPaymentSubmissionAlert(
  user: { email: string; firstName: string; lastName: string },
  application: { tier: string; amount: number; paymentMethod: string; paymentReference?: string; paymentProofUrl?: string }
): Promise<boolean> {
  const html = emailWrapper(`
    <div class="header" style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);">
      <h1>Payment Submitted</h1>
      <p>Verification Required</p>
    </div>
    <div class="content">
      <h2>Payment Verification Required</h2>
      <p>A user has submitted payment proof for their membership application:</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">User</span>
          <span class="info-value">${user.firstName} ${user.lastName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">${user.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Requested Tier</span>
          <span class="info-value" style="color: #2563eb; font-weight: bold;">${application.tier}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Amount</span>
          <span class="info-value">PKR ${application.amount.toLocaleString()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method</span>
          <span class="info-value">${application.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : application.paymentMethod}</span>
        </div>
        ${application.paymentReference ? `
        <div class="info-row">
          <span class="info-label">Reference</span>
          <span class="info-value">${application.paymentReference}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="warning">
        <strong>Action Required:</strong> Please verify the payment and approve or reject the membership application.
      </div>
      
      ${application.paymentProofUrl ? `
      <p style="text-align: center;">
        <a href="${application.paymentProofUrl}" class="button" style="background: #059669;">View Payment Proof</a>
      </p>
      ` : ''}
      
      <p style="text-align: center;">
        <a href="https://thequarterdeck.pk/admin/membership-applications" class="button">Review Application</a>
      </p>
    </div>
    <div class="footer">
      <p>The Quarterdeck Admin Notification</p>
    </div>
  `);
  
  return emailService.sendEmail(
    getAdminEmail(),
    `PAYMENT VERIFICATION REQUIRED: ${user.firstName} ${user.lastName} | The Quarterdeck`,
    html
  );
}

// Certification enrollment email
export async function sendCertificationEnrollmentEmail(
  user: { email: string; firstName: string },
  certClass: { name: string; scheduledDate: string; scheduledTime: string; location?: string; facilityName: string }
): Promise<boolean> {
  if (!user.email) return false;
  
  const html = emailWrapper(`
    <div class="header" style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);">
      <h1>The Quarterdeck</h1>
      <p>Certification Class Enrollment</p>
    </div>
    <div class="content">
      <h2>Hello ${user.firstName},</h2>
      
      <div class="success">
        <strong>You're Enrolled!</strong><br>
        You have successfully enrolled in a certification class.
      </div>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Class</span>
          <span class="info-value">${certClass.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Facility</span>
          <span class="info-value">${certClass.facilityName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${certClass.scheduledDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Time</span>
          <span class="info-value">${certClass.scheduledTime}</span>
        </div>
        ${certClass.location ? `
        <div class="info-row">
          <span class="info-label">Location</span>
          <span class="info-value">${certClass.location}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="highlight">
        <strong>What to Expect:</strong><br>
        Please arrive 15 minutes before the scheduled time. Bring valid ID and any required safety gear. 
        Upon successful completion, you'll receive your certification to book this facility.
      </div>
      
      <p style="text-align: center;">
        <a href="https://thequarterdeck.pk/certifications" class="button">View My Enrollments</a>
      </p>
      
      <p>If you need to cancel, please do so at least 24 hours in advance.</p>
      
      <p>Best regards,<br><strong>The Quarterdeck Team</strong></p>
    </div>
    <div class="footer">
      <p>The Quarterdeck Sports & Recreation Complex</p>
      <p>F-7/4, Islamabad, Pakistan | +92 51 1234567</p>
      <p>info@thequarterdeck.pk</p>
    </div>
  `);
  
  return emailService.sendEmail(
    user.email,
    `Certification Enrollment Confirmed - ${certClass.name} | The Quarterdeck`,
    html
  );
}

// Event reminder email (for scheduled jobs)
export async function sendEventReminderEmail(
  user: { email: string; firstName: string },
  event: { title: string; date: string; time: string; location?: string },
  daysUntil: number
): Promise<boolean> {
  if (!user.email) return false;
  
  const html = emailWrapper(`
    <div class="header" style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);">
      <h1>The Quarterdeck</h1>
      <p>Event Reminder</p>
    </div>
    <div class="content">
      <h2>Hello ${user.firstName},</h2>
      
      <div class="warning">
        <strong>Your event is coming up ${daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}!</strong><br>
        Don't forget about your upcoming event at The Quarterdeck.
      </div>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Event</span>
          <span class="info-value">${event.title}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${event.date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Time</span>
          <span class="info-value">${event.time}</span>
        </div>
        ${event.location ? `
        <div class="info-row">
          <span class="info-label">Location</span>
          <span class="info-value">${event.location}</span>
        </div>
        ` : ''}
      </div>
      
      <p style="text-align: center;">
        <a href="https://thequarterdeck.pk/events" class="button">View Event Details</a>
      </p>
      
      <p>We look forward to seeing you!</p>
      
      <p>Best regards,<br><strong>The Quarterdeck Team</strong></p>
    </div>
    <div class="footer">
      <p>The Quarterdeck Sports & Recreation Complex</p>
      <p>F-7/4, Islamabad, Pakistan | +92 51 1234567</p>
      <p>events@thequarterdeck.pk</p>
    </div>
  `);
  
  return emailService.sendEmail(
    user.email,
    `Reminder: ${event.title} ${daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil} Days`} | The Quarterdeck`,
    html
  );
}

export { emailService };
