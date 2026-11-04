/**
 * Domain Entity Student
 * Represents a student enrolled in Akademie Trutnov courses.
 */
export interface IStudentProps {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  createdAt?: Date;
}

export class Student {
  public readonly id?: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly email: string;
  public readonly phone: string | null;
  public readonly organization: string | null;
  public readonly createdAt?: Date;

  constructor(props: IStudentProps) {
    this.id = props.id;
    this.firstName = props.firstName ? props.firstName.trim() : "";
    this.lastName = props.lastName ? props.lastName.trim() : "";
    this.email = props.email ? props.email.trim().toLowerCase() : "";
    this.phone = props.phone ? props.phone.trim() : null;
    this.organization = props.organization ? props.organization.trim() : null;
    this.createdAt = props.createdAt;

    this.validate();
  }

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  private validate(): void {
    if (!this.firstName || this.firstName.length < 2) {
      throw new Error("Student first name must have at least 2 characters.");
    }
    if (!this.lastName || this.lastName.length < 2) {
      throw new Error("Student last name must have at least 2 characters.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email || !emailRegex.test(this.email)) {
      throw new Error("Invalid student email address format.");
    }
  }
}
