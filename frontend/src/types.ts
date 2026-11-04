/**
 * Frontend Domain Models and DTOs
 * Akademie Trutnov Information System
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Course {
  id: string;
  title: string;
  annotation: string;
  hours: number;
  price: number;
  isAccredited: boolean;
  createdAt?: string;
}

export interface Lecturer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  specialization?: string | null;
  taughtHours: number;
  termCount: number;
}

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  address: string;
}

export interface CourseTerm {
  id: string;
  courseId: string;
  courseTitle: string;
  classroomId?: string | null;
  classroomName: string;
  startDate: string;
  endDate: string;
  capacity: number;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  confirmedCount: number;
  waitlistCount: number;
  lecturers: Array<{ id: string; name: string; specialization?: string }>;
}

export type EnrollmentStatus = "CONFIRMED" | "WAITLIST" | "CANCELLED" | "COMPLETED";

export interface Enrollment {
  id: string;
  termId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string | null;
  studentOrganization?: string | null;
  status: EnrollmentStatus;
  waitlistPosition?: number | null;
  submittedAt: string;
  note?: string | null;
}

export interface TeachingDay {
  id: string;
  termId: string;
  dayDate: string;
  hours: number;
  topic: string;
  lecturerId?: string | null;
  lecturerName?: string | null;
  presentCount: number;
  attendanceCount: number;
}

export interface AttendanceRosterStudent {
  studentId: string;
  studentName: string;
  studentEmail: string;
  isPresent: boolean;
  note?: string | null;
}

export interface AttendanceSummaryItem {
  studentId: string;
  studentName: string;
  studentEmail: string;
  attendedDays: number;
  totalDays: number;
  attendancePercentage: number;
  qualifiesForCertificate: boolean;
  certificateIssued: boolean;
  certificateNumber?: string | null;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  enrollmentId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  issueDate: string;
  attendanceRate: number;
  hasWaiver: boolean;
  waiverReason?: string | null;
}

export interface TermAnalyticsStat {
  termId: string;
  courseTitle: string;
  period: string;
  capacity: number;
  confirmed: number;
  waitlist: number;
  fillRate: number;
}

export interface LecturerAnalyticsStat {
  id: string;
  name: string;
  taughtHours: number;
  termCount: number;
}

export interface MultiCourseStudentStat {
  student: string;
  email: string;
  organization?: string | null;
  courseCount: number;
  courses: string[];
}

export interface AnalyticsData {
  termStats: TermAnalyticsStat[];
  lecturerStats: LecturerAnalyticsStat[];
  multiCourseStudents: MultiCourseStudentStat[];
}
