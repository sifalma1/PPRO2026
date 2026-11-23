export interface CreateTermDto {
  courseId: string;
  classroomId?: string;
  startDate: string;
  endDate: string;
  capacity: number;
  lecturerIds?: string[];
}

export interface TermResponseDto {
  id: string;
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  courseHours: number;
  classroomId?: string;
  classroomName: string;
  classroomCapacity?: number | null;
  startDate: string;
  endDate: string;
  capacity: number;
  status: string;
  confirmedCount: number;
  waitlistCount: number;
  lecturers: Array<{ id: string; name: string; role: string }>;
  availableSpots?: number;
  isFull?: boolean;
}

export interface LecturerDto {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  specialization?: string | null;
  termCount: number;
  taughtHours: number;
}

export interface ClassroomDto {
  id: string;
  name: string;
  address?: string | null;
  capacity: number;
}

export interface StudentDto {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  enrollmentCount: number;
}

export interface TermStatDto {
  id: string;
  courseTitle: string;
  period: string;
  capacity: number;
  confirmed: number;
  waitlist: number;
  fillRate: number;
}

export interface LecturerStatDto {
  name: string;
  specialization?: string | null;
  taughtHours: number;
  termCount: number;
}

export interface MultiCourseStudentDto {
  student: string;
  email: string;
  organization?: string | null;
  courseCount: number;
  courses: string[];
}

export interface AnalyticsDto {
  termStats: TermStatDto[];
  lecturerStats: LecturerStatDto[];
  multiCourseStudents: MultiCourseStudentDto[];
}

export interface CancelEnrollmentResultDto {
  success: boolean;
  promotedStudentId?: string;
}
