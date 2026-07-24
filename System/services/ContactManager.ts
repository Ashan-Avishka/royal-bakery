import { ContactInquiry, InquirySubmissionResult } from '../types/contact';

export class ContactManager {
  private submittedInquiries: ContactInquiry[] = [];

  public validateInquiry(inquiry: ContactInquiry): { valid: boolean; error?: string } {
    if (!inquiry.fullName || !inquiry.fullName.trim()) {
      return { valid: false, error: 'Full name is required.' };
    }
    if (!inquiry.phone || !inquiry.phone.trim()) {
      return { valid: false, error: 'Phone number is required.' };
    }
    if (!inquiry.email || !inquiry.email.includes('@')) {
      return { valid: false, error: 'Valid email address is required.' };
    }
    if (!inquiry.message || !inquiry.message.trim()) {
      return { valid: false, error: 'Message content cannot be empty.' };
    }
    return { valid: true };
  }

  public submitInquiry(inquiry: ContactInquiry): InquirySubmissionResult {
    const validation = this.validateInquiry(inquiry);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'Validation failed.',
      };
    }

    const timestamp = new Date().toISOString();
    const inquiryRecord: ContactInquiry = {
      ...inquiry,
      createdAt: timestamp,
    };

    this.submittedInquiries.push(inquiryRecord);

    const inquiryId = `INQ-${Math.floor(100000 + Math.random() * 900000)}`;

    return {
      success: true,
      message: 'Thank you for reaching out! We will respond within 2 business hours.',
      inquiryId,
    };
  }

  public getInquiries(): ContactInquiry[] {
    return [...this.submittedInquiries];
  }
}
