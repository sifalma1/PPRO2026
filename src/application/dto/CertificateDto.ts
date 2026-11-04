export interface IssueCertificateDto {
  enrollmentId: string;
  hasWaiver?: boolean;
  waiverReason?: string;
}

export interface CertificateResponseDto {
  id: string;
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentOrganization?: string | null;
  termId: string;
  courseTitle: string;
  certificateNumber: string;
  issueDate: string;
  attendanceRate: number;
  hasWaiver: boolean;
  waiverReason?: string | null;
  createdAt: string;
}
