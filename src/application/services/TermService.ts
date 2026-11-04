import { PostgresTermRepository } from "../../infrastructure/database/PostgresTermRepository.js";
import { CreateTermDto, TermResponseDto } from "../dto/TermDto.js";
import { CreateEnrollmentDto } from "../dto/EnrollmentDto.js";

export class TermService {
  constructor(private readonly repo: PostgresTermRepository) {}

  public async getAllTerms(): Promise<TermResponseDto[]> {
    return await this.repo.findAll();
  }

  public async getTermById(id: string): Promise<TermResponseDto> {
    const term = await this.repo.findById(id);
    if (!term) throw new Error("Course term was not found.");
    return term;
  }

  public async createTerm(dto: CreateTermDto): Promise<string> {
    if (!dto.courseId) throw new Error("Course ID is required.");
    if (!dto.startDate || !dto.endDate) throw new Error("Start date and end date are required.");
    if (new Date(dto.startDate) > new Date(dto.endDate)) {
      throw new Error("Start date cannot be after end date.");
    }
    if (!dto.capacity || dto.capacity <= 0) {
      throw new Error("Capacity must be a positive integer.");
    }
    return await this.repo.createTerm(dto);
  }

  public async getEnrollmentsForTerm(termId: string): Promise<any[]> {
    return await this.repo.getEnrollmentsForTerm(termId);
  }

  public async createEnrollment(termId: string, studentData: CreateEnrollmentDto): Promise<any> {
    if (!studentData.firstName || !studentData.lastName || !studentData.email) {
      throw new Error("Student first name, last name, and email are required.");
    }
    return await this.repo.createEnrollment(termId, studentData);
  }

  public async cancelEnrollment(enrollmentId: string): Promise<any> {
    return await this.repo.cancelEnrollment(enrollmentId);
  }

  public async getLecturers(): Promise<any[]> {
    return await this.repo.getLecturers();
  }

  public async getClassrooms(): Promise<any[]> {
    return await this.repo.getClassrooms();
  }

  public async getStudents(): Promise<any[]> {
    return await this.repo.getStudents();
  }

  public async getAnalytics(): Promise<any> {
    return await this.repo.getAnalytics();
  }
}
