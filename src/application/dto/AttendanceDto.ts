export interface CreateTeachingDayDto {
  termId: string;
  lecturerId?: string;
  dayDate: string;
  hours: number;
  topic: string;
}

export interface MarkAttendanceDto {
  teachingDayId: string;
  studentId: string;
  isPresent: boolean;
  note?: string;
}

export interface TeachingDayResponseDto {
  id: string;
  termId: string;
  lecturerId?: string | null;
  lecturerName?: string | null;
  dayDate: string;
  hours: number;
  topic: string;
  attendanceCount: number;
  presentCount: number;
}

export interface AttendanceSummaryDto {
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalDays: number;
  attendedDays: number;
  attendancePercentage: number;
  qualifiesForCertificate: boolean;
  certificateIssued: boolean;
  certificateNumber?: string;
}
