import PDFDocument from 'pdfkit';
import { Booking, EventRegistration, MembershipApplication, Facility, Event, PricingTier } from '@shared/schema';

interface ReceiptData {
  receiptNumber: string;
  transactionType: 'BOOKING' | 'EVENT_REGISTRATION' | 'MEMBERSHIP' | 'CREDIT_TOPUP';
  transactionCategory: string;
  transactionId: string;
  date: Date;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  items: {
    description: string;
    quantity?: number;
    unitPrice?: number;
    amount: number;
  }[];
  subtotal: number;
  discount?: number;
  discountDescription?: string;
  total: number;
  paymentMethod: string;
  paymentMethodLabel: string;
  paymentStatus: string;
  paymentReference?: string | null;
  paidBy?: 'self' | 'other_member' | 'credits';
  payerDetails?: string | null;
  notes?: string | null;
}

export function generateReceiptNumber(prefix: string = 'QD'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${year}${month}${day}-${random}`;
}

export function generateBookingReceiptData(
  booking: Booking,
  facility: Facility | null,
  customerName: string,
  customerEmail: string,
  customerPhone?: string | null,
  payerName?: string | null
): ReceiptData {
  const basePrice = booking.basePrice || 0;
  const discount = booking.discount || 0;
  const addOnTotal = booking.addOnTotal || 0;
  const total = booking.totalPrice || 0;
  
  const items: ReceiptData['items'] = [{
    description: `${facility?.name || 'Facility'} Booking - ${booking.date}`,
    quantity: 1,
    unitPrice: basePrice,
    amount: basePrice,
  }];
  
  if (addOnTotal > 0) {
    items.push({
      description: 'Add-ons',
      quantity: 1,
      unitPrice: addOnTotal,
      amount: addOnTotal,
    });
  }

  const paymentMethod = booking.paymentMethod || 'cash';
  const paidBy = determinePaidBy(paymentMethod, booking.payerType);
  let payerDetails: string | null = null;
  
  if (paidBy === 'other_member' && booking.payerMembershipNumber) {
    payerDetails = payerName 
      ? `${payerName} (Member #${booking.payerMembershipNumber})`
      : `Member #${booking.payerMembershipNumber}`;
  } else if (paidBy === 'credits') {
    payerDetails = 'Deducted from account credit balance';
  }

  return {
    receiptNumber: booking.receiptNumber || generateReceiptNumber('QD-BK'),
    transactionType: 'BOOKING',
    transactionCategory: `Facility Booking - ${facility?.name || 'Sports Facility'}`,
    transactionId: booking.id,
    date: booking.createdAt || new Date(),
    customerName,
    customerEmail,
    customerPhone,
    items,
    subtotal: basePrice + addOnTotal,
    discount: discount > 0 ? discount : undefined,
    discountDescription: discount > 0 ? 'Membership discount' : undefined,
    total,
    paymentMethod: paymentMethod,
    paymentMethodLabel: getPaymentMethodLabel(paymentMethod),
    paymentStatus: booking.paymentStatus || 'PENDING',
    paymentReference: booking.paymentProofUrl ? 'Payment proof uploaded' : null,
    paidBy,
    payerDetails,
    notes: `Time slot: ${booking.startTime} - ${booking.endTime}`,
  };
}

function determinePaidBy(paymentMethod: string, payerType?: string | null): 'self' | 'other_member' | 'credits' {
  if (paymentMethod === 'credits' || paymentMethod === 'CREDITS') {
    return 'credits';
  }
  if (payerType === 'OTHER' || payerType === 'other') {
    return 'other_member';
  }
  return 'self';
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    'cash': 'Cash Payment',
    'CASH': 'Cash Payment',
    'bank_transfer': 'Bank Transfer',
    'BANK_TRANSFER': 'Bank Transfer',
    'credits': 'Credit Balance',
    'CREDITS': 'Credit Balance',
    'card': 'Card Payment',
    'CARD': 'Card Payment',
  };
  return labels[method] || method || 'Not specified';
}

export function generateEventRegistrationReceiptData(
  registration: EventRegistration,
  event: Event | null,
): ReceiptData {
  const eventPrice = event?.price || registration.paymentAmount || 0;
  const guestCount = registration.guestCount || 0;
  const total = eventPrice * (1 + guestCount);
  
  const items = [{
    description: `${event?.title || 'Event'} Registration`,
    quantity: 1,
    unitPrice: eventPrice,
    amount: eventPrice,
  }];
  
  if (guestCount > 0) {
    items.push({
      description: `Guest Registration (${guestCount} guests)`,
      quantity: guestCount,
      unitPrice: eventPrice,
      amount: eventPrice * guestCount,
    });
  }

  const paymentMethod = registration.paymentMethod || 'cash';

  return {
    receiptNumber: generateReceiptNumber('QD-EV'),
    transactionType: 'EVENT_REGISTRATION',
    transactionCategory: `Event Registration - ${event?.title || 'Event'}`,
    transactionId: registration.id,
    date: registration.createdAt || new Date(),
    customerName: registration.fullName,
    customerEmail: registration.email,
    customerPhone: registration.phone,
    items,
    subtotal: total,
    total,
    paymentMethod: paymentMethod,
    paymentMethodLabel: getPaymentMethodLabel(paymentMethod),
    paymentStatus: registration.paymentStatus || 'PENDING',
    paymentReference: registration.paymentProofUrl ? 'Payment proof uploaded' : null,
    paidBy: 'self',
    notes: event ? `Event: ${event.scheduleDay} ${event.scheduleTime || ''}` : null,
  };
}

export function generateMembershipReceiptData(
  application: MembershipApplication,
  tier: PricingTier | null,
  customerName: string,
  customerEmail: string,
  customerPhone?: string | null
): ReceiptData {
  const price = application.paymentAmount || tier?.price || 0;
  const paymentMethod = application.paymentMethod || 'bank_transfer';
  
  return {
    receiptNumber: generateReceiptNumber('QD-MB'),
    transactionType: 'MEMBERSHIP',
    transactionCategory: `Membership Payment - ${tier?.name || application.tierDesired} Tier`,
    transactionId: application.id,
    date: application.createdAt || new Date(),
    customerName,
    customerEmail,
    customerPhone,
    items: [{
      description: `${tier?.name || application.tierDesired} Membership`,
      quantity: 1,
      unitPrice: price,
      amount: price,
    }],
    subtotal: price,
    total: price,
    paymentMethod: paymentMethod,
    paymentMethodLabel: getPaymentMethodLabel(paymentMethod),
    paymentStatus: application.status || 'PENDING',
    paymentReference: application.paymentProofUrl ? 'Payment proof uploaded' : null,
    paidBy: 'self',
    notes: `Billing: ${tier?.billingPeriod || 'monthly'}`,
  };
}

export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50,
      info: {
        Title: `Receipt - ${data.receiptNumber}`,
        Author: 'The Quarterdeck',
        Subject: `${data.transactionType} Receipt`,
      }
    });
    
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const primaryColor = '#0F172A';
    const accentColor = '#0EA5E9';
    const mutedColor = '#64748B';
    
    doc.fontSize(24).fillColor(primaryColor).text('THE QUARTERDECK', { align: 'center' });
    doc.fontSize(10).fillColor(mutedColor).text('Sports & Recreation Complex', { align: 'center' });
    doc.moveDown(0.5);
    
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E2E8F0').stroke();
    doc.moveDown();
    
    doc.fontSize(18).fillColor(accentColor).text('RECEIPT', { align: 'center' });
    doc.moveDown(0.5);
    
    const leftCol = 50;
    const rightCol = 350;
    const startY = doc.y;
    
    doc.fontSize(10).fillColor(mutedColor);
    doc.text('Receipt Number:', leftCol, startY);
    doc.text('Date:', leftCol, startY + 15);
    doc.text('Category:', leftCol, startY + 30);
    doc.text('Transaction ID:', leftCol, startY + 45);
    
    doc.fillColor(primaryColor);
    doc.text(data.receiptNumber, leftCol + 100, startY);
    doc.text(formatDate(data.date), leftCol + 100, startY + 15);
    doc.text(data.transactionCategory || formatTransactionType(data.transactionType), leftCol + 100, startY + 30);
    doc.text(data.transactionId.substring(0, 8) + '...', leftCol + 100, startY + 45);
    
    doc.fillColor(mutedColor);
    doc.text('Customer:', rightCol, startY);
    doc.text('Email:', rightCol, startY + 15);
    if (data.customerPhone) {
      doc.text('Phone:', rightCol, startY + 30);
    }
    
    doc.fillColor(primaryColor);
    doc.text(data.customerName, rightCol + 60, startY);
    doc.text(data.customerEmail, rightCol + 60, startY + 15);
    if (data.customerPhone) {
      doc.text(data.customerPhone, rightCol + 60, startY + 30);
    }
    
    doc.y = startY + 80;
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E2E8F0').stroke();
    doc.moveDown();
    
    doc.fontSize(12).fillColor(primaryColor).text('Transaction Details', { underline: true });
    doc.moveDown(0.5);
    
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 350;
    const col3 = 420;
    const col4 = 490;
    
    doc.fontSize(9).fillColor(mutedColor);
    doc.text('Description', col1, tableTop);
    doc.text('Qty', col2, tableTop);
    doc.text('Unit Price', col3, tableTop);
    doc.text('Amount', col4, tableTop);
    
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#E2E8F0').stroke();
    
    let itemY = tableTop + 25;
    doc.fontSize(10).fillColor(primaryColor);
    
    for (const item of data.items) {
      doc.text(item.description, col1, itemY, { width: 290 });
      if (item.quantity) doc.text(item.quantity.toString(), col2, itemY);
      if (item.unitPrice) doc.text(formatCurrency(item.unitPrice), col3, itemY);
      doc.text(formatCurrency(item.amount), col4, itemY);
      itemY += 20;
    }
    
    doc.moveTo(350, itemY + 5).lineTo(545, itemY + 5).strokeColor('#E2E8F0').stroke();
    itemY += 15;
    
    doc.fontSize(10).fillColor(mutedColor);
    doc.text('Subtotal:', col3, itemY);
    doc.fillColor(primaryColor).text(formatCurrency(data.subtotal), col4, itemY);
    itemY += 18;
    
    if (data.discount && data.discount > 0) {
      doc.fillColor(mutedColor).text('Discount:', col3, itemY);
      doc.fillColor('#10B981').text(`-${formatCurrency(data.discount)}`, col4, itemY);
      itemY += 18;
    }
    
    doc.moveTo(350, itemY).lineTo(545, itemY).strokeColor('#E2E8F0').stroke();
    itemY += 10;
    
    doc.fontSize(12).fillColor(primaryColor).font('Helvetica-Bold');
    doc.text('TOTAL:', col3, itemY);
    doc.fillColor(accentColor).text(formatCurrency(data.total), col4, itemY);
    doc.font('Helvetica');
    
    itemY += 40;
    doc.moveTo(50, itemY).lineTo(545, itemY).strokeColor('#E2E8F0').stroke();
    itemY += 15;
    
    doc.fontSize(11).fillColor(primaryColor).text('Payment Information', 50, itemY, { underline: true });
    itemY += 20;
    
    doc.fontSize(10).fillColor(mutedColor);
    doc.text('Payment Method:', 50, itemY);
    doc.fillColor(primaryColor).text(data.paymentMethodLabel || formatPaymentMethod(data.paymentMethod), 150, itemY);
    itemY += 15;
    
    doc.fillColor(mutedColor).text('Payment Status:', 50, itemY);
    const statusColor = data.paymentStatus === 'PAID' || data.paymentStatus === 'VERIFIED' ? '#10B981' : 
                        data.paymentStatus === 'PENDING' ? '#F59E0B' : mutedColor;
    doc.fillColor(statusColor).text(data.paymentStatus, 150, itemY);
    itemY += 15;
    
    if (data.paidBy) {
      doc.fillColor(mutedColor).text('Paid By:', 50, itemY);
      const paidByLabel = data.paidBy === 'self' ? 'Self' : 
                          data.paidBy === 'other_member' ? 'Another Member' :
                          data.paidBy === 'credits' ? 'Credit Balance' : data.paidBy;
      doc.fillColor(primaryColor).text(paidByLabel, 150, itemY);
      itemY += 15;
    }
    
    if (data.payerDetails) {
      doc.fillColor(mutedColor).text('Payer Details:', 50, itemY);
      doc.fillColor(primaryColor).text(data.payerDetails, 150, itemY);
      itemY += 15;
    }
    
    if (data.paymentReference) {
      doc.fillColor(mutedColor).text('Reference:', 50, itemY);
      doc.fillColor(primaryColor).text(data.paymentReference, 150, itemY);
      itemY += 15;
    }
    
    if (data.notes) {
      itemY += 10;
      doc.fillColor(mutedColor).text('Notes:', 50, itemY);
      doc.fillColor(primaryColor).text(data.notes, 150, itemY);
    }
    
    const bottomY = 750;
    doc.moveTo(50, bottomY).lineTo(545, bottomY).strokeColor('#E2E8F0').stroke();
    
    doc.fontSize(8).fillColor(mutedColor);
    doc.text('The Quarterdeck Sports & Recreation Complex', 50, bottomY + 10, { align: 'center', width: 495 });
    doc.text('Islamabad, Pakistan | www.thequarterdeck.pk | admin@thequarterdeck.pk', 50, bottomY + 22, { align: 'center', width: 495 });
    doc.text('This is a computer-generated receipt and does not require a signature.', 50, bottomY + 34, { align: 'center', width: 495 });
    doc.text(`Generated on ${formatDate(new Date())} at ${formatTime(new Date())}`, 50, bottomY + 46, { align: 'center', width: 495 });
    
    doc.end();
  });
}

function formatCurrency(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTransactionType(type: string): string {
  const types: Record<string, string> = {
    'BOOKING': 'Facility Booking',
    'EVENT_REGISTRATION': 'Event Registration',
    'MEMBERSHIP': 'Membership Payment',
    'CREDIT_TOPUP': 'Credit Balance Top-up',
  };
  return types[type] || type;
}

function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    'bank_transfer': 'Bank Transfer',
    'BANK_TRANSFER': 'Bank Transfer',
    'cash': 'Cash Payment',
    'CASH': 'Cash Payment',
    'card': 'Card Payment',
    'CARD': 'Card Payment',
  };
  return methods[method] || method || 'Not specified';
}
