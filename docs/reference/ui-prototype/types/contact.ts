export type InquirySubject =
  | 'Custom Cake Order'
  | 'Bulk / Corporate Order'
  | 'Wedding Consultation'
  | 'General Enquiry'
  | 'Feedback';

export interface ContactInquiry {
  fullName: string;
  phone: string;
  email: string;
  subject: InquirySubject;
  message: string;
  createdAt?: string;
}

export interface InquirySubmissionResult {
  success: boolean;
  message: string;
  inquiryId?: string;
}

export interface ContactState {
  inquiry: ContactInquiry;
  isSubmitting: boolean;
  submitted: boolean;
  resultMessage?: string;
}
