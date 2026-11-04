import { PostgresAttendanceRepository } from "../../infrastructure/database/PostgresAttendanceRepository.js";
import { CreateTeachingDayDto, MarkAttendanceDto, AttendanceSummaryDto } from "../dto/AttendanceDto.js";

export class AttendanceService {
  constructor(private readonly repo: PostgresAttendanceRepository) {}

  public async getTeachingDays(termId: string): Promise<any[]> {
    return await this.repo.getTeachingDays(termId);
  }

  public async createTeachingDay(dto: CreateTeachingDayDto): Promise<string> {
    if (!dto.termId) throw new Error("Term ID is required.");
    if (!dto.dayDate) throw new Error("Date is required.");
    if (!dto.hours || dto.hours <= 0) throw new Error("Hours must be a positive integer.");
    if (!dto.topic || dto.topic.trim().length < 3) throw new Error("Topic must be at least 3 characters long.");
    return await this.repo.createTeachingDay(dto);
  }

  public async getAttendanceForDay(teachingDayId: string): Promise<any[]> {
    return await this.repo.getAttendanceForDay(teachingDayId);
  }

  public async markAttendance(dto: MarkAttendanceDto): Promise<void> {
    if (!dto.teachingDayId) throw new Error("Teaching day ID is required.");
    if (!dto.studentId) throw new Error("Student ID is required.");
    await this.repo.markAttendance(dto);
  }

  public async getAttendanceSummary(termId: string): Promise<AttendanceSummaryDto[]> {
    return await this.repo.getAttendanceSummary(termId);
  }
}
