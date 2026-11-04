/**
 * Domain Entity Certificate
 * Represents an official certificate issued upon successful course completion.
 * Enforces business rule ADR-01: 70% attendance required, or instructor waiver with reason.
 */
export interface ICertificateProps {
  id?: string;
  enrollmentId: string;
  studentId: string;
  studentName?: string;
  termId: string;
  courseTitle?: string;
  certificateNumber: string; // Format: AT-YYYY-XXXX
  issueDate: string;
  attendanceRate: number; // 0.0 to 100.0
  hasWaiver?: boolean;
  waiverReason?: string | null;
  createdAt?: Date;
}

export class Certificate {
  public readonly id?: string;
  public readonly enrollmentId: string;
  public readonly studentId: string;
  public readonly studentName?: string;
  public readonly termId: string;
  public readonly courseTitle?: string;
  public readonly certificateNumber: string;
  public readonly issueDate: string;
  public readonly attendanceRate: number;
  public readonly hasWaiver: boolean;
  public readonly waiverReason: string | null;
  public readonly createdAt?: Date;

  constructor(props: ICertificateProps) {
    this.id = props.id;
    this.enrollmentId = props.enrollmentId;
    this.studentId = props.studentId;
    this.studentName = props.studentName;
    this.termId = props.termId;
    this.courseTitle = props.courseTitle;
    this.certificateNumber = props.certificateNumber ? props.certificateNumber.trim() : "";
    this.issueDate = props.issueDate;
    this.attendanceRate = Number(props.attendanceRate);
    this.hasWaiver = Boolean(props.hasWaiver);
    this.waiverReason = props.waiverReason ? props.waiverReason.trim() : null;
    this.createdAt = props.createdAt;

    this.validate();
  }

  private validate(): void {
    if (!this.enrollmentId) {
      throw new Error("Certificate must reference an enrollment.");
    }
    if (!this.studentId) {
      throw new Error("Certificate must reference a student.");
    }
    if (!this.termId) {
      throw new Error("Certificate must reference a course term.");
    }

    const certRegex = /^AT-\d{4}-\d{4,}$/;
    if (!certRegex.test(this.certificateNumber)) {
      throw new Error(`Invalid certificate number format '${this.certificateNumber}'. Expected format: AT-YYYY-XXXX`);
    }

    if (isNaN(this.attendanceRate) || this.attendanceRate < 0 || this.attendanceRate > 100) {
      throw new Error("Attendance rate must be a percentage between 0 and 100.");
    }

    // Business rule ADR-01: 70% threshold or instructor waiver
    if (this.attendanceRate < 70 && !this.hasWaiver) {
      throw new Error(
        `Student does not meet the 70% attendance requirement (${this.attendanceRate.toFixed(1)}%). An instructor waiver with written reason is required.`
      );
    }

    if (this.hasWaiver && (!this.waiverReason || this.waiverReason.length < 5)) {
      throw new Error("Instructor waiver requires a written justification of at least 5 characters.");
    }
  }
}
