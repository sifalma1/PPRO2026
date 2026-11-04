export type EnrollmentStatus = "CONFIRMED" | "WAITLIST" | "CANCELLED" | "COMPLETED";

/**
 * Domain Entity Enrollment
 * Represents a student registration for a course term, including waitlist tracking (ADR-02).
 */
export interface IEnrollmentProps {
  id?: string;
  termId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string | null;
  studentOrganization?: string | null;
  submittedAt?: string;
  status: EnrollmentStatus;
  waitlistPosition?: number | null;
  note?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Enrollment {
  public readonly id?: string;
  public readonly termId: string;
  public readonly studentId: string;
  public readonly studentName?: string;
  public readonly studentEmail?: string;
  public readonly studentPhone?: string | null;
  public readonly studentOrganization?: string | null;
  public readonly submittedAt?: string;
  public readonly status: EnrollmentStatus;
  public readonly waitlistPosition: number | null;
  public readonly note: string | null;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: IEnrollmentProps) {
    this.id = props.id;
    this.termId = props.termId;
    this.studentId = props.studentId;
    this.studentName = props.studentName;
    this.studentEmail = props.studentEmail;
    this.studentPhone = props.studentPhone ?? null;
    this.studentOrganization = props.studentOrganization ?? null;
    this.submittedAt = props.submittedAt;
    this.status = props.status;
    this.waitlistPosition = props.waitlistPosition ?? null;
    this.note = props.note ?? null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;

    this.validate();
  }

  private validate(): void {
    if (!this.termId) {
      throw new Error("Enrollment must reference a course term.");
    }
    if (!this.studentId) {
      throw new Error("Enrollment must reference a student.");
    }
    if (
      this.status === "WAITLIST" &&
      (this.waitlistPosition === null || this.waitlistPosition <= 0)
    ) {
      throw new Error("Waitlisted enrollment must have a positive waitlist position number.");
    }
  }

  public get isConfirmed(): boolean {
    return this.status === "CONFIRMED";
  }

  public get isWaitlisted(): boolean {
    return this.status === "WAITLIST";
  }
}
