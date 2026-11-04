/**
 * Domain Entity Course
 * Represents an educational course offered by Akademie Trutnov.
 */
export interface ICourseProps {
  id?: string;
  title: string;
  annotation: string;
  hours: number;
  price: number;
  isAccredited: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Course {
  public readonly id?: string;
  public readonly title: string;
  public readonly annotation: string;
  public readonly hours: number;
  public readonly price: number;
  public readonly isAccredited: boolean;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: ICourseProps) {
    this.id = props.id;
    this.title = props.title ? props.title.trim() : "";
    this.annotation = props.annotation ? props.annotation.trim() : "";
    this.hours = props.hours;
    this.price = Number(props.price);
    this.isAccredited = Boolean(props.isAccredited);
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;

    this.validate();
  }

  /**
   * Domain validation invariants
   */
  private validate(): void {
    if (!this.title || this.title.length < 3 || this.title.length > 150) {
      throw new Error("Course title must be between 3 and 150 characters.");
    }

    if (!this.annotation || this.annotation.length < 10) {
      throw new Error("Course annotation must be at least 10 characters long.");
    }

    if (!Number.isInteger(this.hours) || this.hours <= 0) {
      throw new Error("Course hours must be a positive integer greater than 0.");
    }

    if (isNaN(this.price) || this.price < 0) {
      throw new Error("Course price cannot be negative.");
    }
  }
}
