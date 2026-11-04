export type TermStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

/**
 * Domain Entity CourseTerm
 * Represents a scheduled instance of a course with dates, venue and capacity limits.
 */
export interface ICourseTermProps {
  id?: string;
  courseId: string;
  courseTitle?: string;
  classroomId?: string | null;
  classroomName?: string | null;
  startDate: string;
  endDate: string;
  capacity: number;
  status?: TermStatus;
  confirmedCount?: number;
  waitlistCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CourseTerm {
  public readonly id?: string;
  public readonly courseId: string;
  public readonly courseTitle?: string;
  public readonly classroomId: string | null;
  public readonly classroomName?: string | null;
  public readonly startDate: string;
  public readonly endDate: string;
  public readonly capacity: number;
  public readonly status: TermStatus;
  public readonly confirmedCount: number;
  public readonly waitlistCount: number;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: ICourseTermProps) {
    this.id = props.id;
    this.courseId = props.courseId;
    this.courseTitle = props.courseTitle;
    this.classroomId = props.classroomId ?? null;
    this.classroomName = props.classroomName;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.capacity = props.capacity;
    this.status = props.status || "PLANNED";
    this.confirmedCount = props.confirmedCount || 0;
    this.waitlistCount = props.waitlistCount || 0;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;

    this.validate();
  }

  private validate(): void {
    if (!this.courseId) {
      throw new Error("Course term must be assigned to a course.");
    }
    if (!this.startDate || !this.endDate) {
      throw new Error("Course term requires both start date and end date.");
    }
    if (new Date(this.startDate) > new Date(this.endDate)) {
      throw new Error("Start date cannot be after end date.");
    }
    if (!Number.isInteger(this.capacity) || this.capacity <= 0) {
      throw new Error("Term capacity must be a positive integer.");
    }
  }

  public get isFull(): boolean {
    return this.confirmedCount >= this.capacity;
  }

  public get availableSpots(): number {
    return Math.max(0, this.capacity - this.confirmedCount);
  }
}
