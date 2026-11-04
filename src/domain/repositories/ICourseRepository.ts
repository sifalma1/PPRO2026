import { Course } from "../entities/Course.js";

export interface CourseFilter {
  isAccredited?: boolean;
  query?: string;
}

export interface ICourseRepository {
  findAll(filter?: CourseFilter): Promise<Course[]>;
  findById(id: string): Promise<Course | null>;
  create(course: Course): Promise<Course>;
  update(id: string, course: Course): Promise<Course | null>;
  delete(id: string): Promise<boolean>;
}
