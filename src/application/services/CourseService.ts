import { Course } from "../../domain/entities/Course.js";
import { ICourseRepository, CourseFilter } from "../../domain/repositories/ICourseRepository.js";
import { CreateCourseDto, CourseResponseDto, UpdateCourseDto } from "../dto/CourseDto.js";

/**
 * Application service for course management.
 * Coordinates use cases and mappings between domain entities and DTOs.
 */
export class CourseService {
  constructor(private readonly courseRepository: ICourseRepository) {}

  public async getAllCourses(filter?: CourseFilter): Promise<CourseResponseDto[]> {
    const courses = await this.courseRepository.findAll(filter);
    return courses.map((c) => this.toResponseDto(c));
  }

  public async getCourseById(id: string): Promise<CourseResponseDto> {
    const course = await this.courseRepository.findById(id);
    if (!course) {
      throw new Error(`Course with ID '${id}' was not found.`);
    }
    return this.toResponseDto(course);
  }

  public async createCourse(dto: CreateCourseDto): Promise<CourseResponseDto> {
    const domainCourse = new Course({
      title: dto.title,
      annotation: dto.annotation,
      hours: dto.hours,
      price: dto.price,
      isAccredited: Boolean(dto.isAccredited),
    });

    const created = await this.courseRepository.create(domainCourse);
    return this.toResponseDto(created);
  }

  public async updateCourse(id: string, dto: UpdateCourseDto): Promise<CourseResponseDto> {
    const existing = await this.courseRepository.findById(id);
    if (!existing) {
      throw new Error(`Course with ID '${id}' was not found.`);
    }

    const updatedCourse = new Course({
      id: existing.id,
      title: dto.title !== undefined ? dto.title : existing.title,
      annotation: dto.annotation !== undefined ? dto.annotation : existing.annotation,
      hours: dto.hours !== undefined ? dto.hours : existing.hours,
      price: dto.price !== undefined ? dto.price : existing.price,
      isAccredited: dto.isAccredited !== undefined ? dto.isAccredited : existing.isAccredited,
      createdAt: existing.createdAt,
    });

    const saved = await this.courseRepository.update(id, updatedCourse);
    if (!saved) {
      throw new Error(`Failed to update course '${id}'.`);
    }

    return this.toResponseDto(saved);
  }

  public async deleteCourse(id: string): Promise<boolean> {
    const existing = await this.courseRepository.findById(id);
    if (!existing) {
      throw new Error(`Course with ID '${id}' was not found.`);
    }
    return await this.courseRepository.delete(id);
  }

  private toResponseDto(course: Course): CourseResponseDto {
    return {
      id: course.id || "",
      title: course.title,
      annotation: course.annotation,
      hours: course.hours,
      price: course.price,
      isAccredited: course.isAccredited,
      createdAt: course.createdAt ? course.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: course.updatedAt ? course.updatedAt.toISOString() : new Date().toISOString(),
    };
  }
}
