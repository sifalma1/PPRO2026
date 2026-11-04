export interface CreateEnrollmentDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  organization?: string;
  note?: string;
}

export interface EnrollmentResponseDto {
  id: string;
  termId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string | null;
  studentOrganization?: string | null;
  submittedAt: string;
  status: string;
  waitlistPosition?: number | null;
  note?: string | null;
}
