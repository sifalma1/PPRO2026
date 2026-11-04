/**
 * Domain Entity Lecturer
 * Represents an external lecturer instructing course terms.
 */
export interface ILecturerProps {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  specialization?: string | null;
  createdAt?: Date;
}

export class Lecturer {
  public readonly id?: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly email: string;
  public readonly phone: string | null;
  public readonly specialization: string | null;
  public readonly createdAt?: Date;

  constructor(props: ILecturerProps) {
    this.id = props.id;
    this.firstName = props.firstName ? props.firstName.trim() : "";
    this.lastName = props.lastName ? props.lastName.trim() : "";
    this.email = props.email ? props.email.trim().toLowerCase() : "";
    this.phone = props.phone ? props.phone.trim() : null;
    this.specialization = props.specialization ? props.specialization.trim() : null;
    this.createdAt = props.createdAt;

    this.validate();
  }

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  private validate(): void {
    if (!this.firstName || this.firstName.length < 2) {
      throw new Error("First name must have at least 2 characters.");
    }
    if (!this.lastName || this.lastName.length < 2) {
      throw new Error("Last name must have at least 2 characters.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email || !emailRegex.test(this.email)) {
      throw new Error("Invalid email address format.");
    }
  }
}
