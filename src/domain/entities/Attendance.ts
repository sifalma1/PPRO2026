/**
 * Domain Entity Attendance
 * Represents student attendance on a specific teaching day.
 */
export interface IAttendanceProps {
  id?: string;
  teachingDayId: string;
  studentId: string;
  studentName?: string;
  isPresent: boolean;
  note?: string | null;
  createdAt?: Date;
}

export class Attendance {
  public readonly id?: string;
  public readonly teachingDayId: string;
  public readonly studentId: string;
  public readonly studentName?: string;
  public readonly isPresent: boolean;
  public readonly note: string | null;
  public readonly createdAt?: Date;

  constructor(props: IAttendanceProps) {
    this.id = props.id;
    this.teachingDayId = props.teachingDayId;
    this.studentId = props.studentId;
    this.studentName = props.studentName;
    this.isPresent = Boolean(props.isPresent);
    this.note = props.note ?? null;
    this.createdAt = props.createdAt;

    this.validate();
  }

  private validate(): void {
    if (!this.teachingDayId) {
      throw new Error("Attendance record must reference a teaching day.");
    }
    if (!this.studentId) {
      throw new Error("Attendance record must reference a student.");
    }
  }
}
