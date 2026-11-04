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
  classroomCapacity?: number;
  startDate: string;
  endDate: string;
  capacity: number;
  status: string;
  confirmedCount: number;
  waitlistCount: number;
  lecturers: Array<{ id: string; name: string; role: string }>;
}
