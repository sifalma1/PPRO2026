/**
 * Domain Entity TeachingDay
 * Represents a single day/block of instruction within a course term (ADR-05).
 */
export interface ITeachingDayProps {
  id?: string;
  termId: string;
  lecturerId?: string | null;
  lecturerName?: string | null;
  dayDate: string;
  hours: number;
  topic: string;
  createdAt?: Date;
}

export class TeachingDay {
  public readonly id?: string;
  public readonly termId: string;
  public readonly lecturerId: string | null;
  public readonly lecturerName?: string | null;
  public readonly dayDate: string;
  public readonly hours: number;
  public readonly topic: string;
  public readonly createdAt?: Date;

  constructor(props: ITeachingDayProps) {
    this.id = props.id;
    this.termId = props.termId;
    this.lecturerId = props.lecturerId ?? null;
    this.lecturerName = props.lecturerName;
    this.dayDate = props.dayDate;
    this.hours = props.hours;
    this.topic = props.topic ? props.topic.trim() : "";
    this.createdAt = props.createdAt;

    this.validate();
  }

  private validate(): void {
    if (!this.termId) {
      throw new Error("Teaching day must be assigned to a course term.");
    }
    if (!this.dayDate) {
      throw new Error("Teaching day requires a valid date.");
    }
    if (!Number.isInteger(this.hours) || this.hours <= 0) {
      throw new Error("Teaching day hours must be a positive integer.");
    }
    if (!this.topic || this.topic.length < 3) {
      throw new Error("Teaching day topic must be at least 3 characters long.");
    }
  }
}
