/**
 * Domain Entity Classroom
 * Represents a teaching venue with capacity limits.
 */
export interface IClassroomProps {
  id?: string;
  name: string;
  address: string;
  capacity: number;
  createdAt?: Date;
}

export class Classroom {
  public readonly id?: string;
  public readonly name: string;
  public readonly address: string;
  public readonly capacity: number;
  public readonly createdAt?: Date;

  constructor(props: IClassroomProps) {
    this.id = props.id;
    this.name = props.name ? props.name.trim() : "";
    this.address = props.address ? props.address.trim() : "";
    this.capacity = props.capacity;
    this.createdAt = props.createdAt;

    this.validate();
  }

  private validate(): void {
    if (!this.name || this.name.length < 2) {
      throw new Error("Classroom name must have at least 2 characters.");
    }
    if (!this.address || this.address.length < 3) {
      throw new Error("Classroom address must have at least 3 characters.");
    }
    if (!Number.isInteger(this.capacity) || this.capacity <= 0) {
      throw new Error("Classroom capacity must be a positive integer.");
    }
  }
}
