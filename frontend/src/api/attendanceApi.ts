import { request, requestRaw } from "./apiClient";
import { TeachingDay, AttendanceRosterStudent, AttendanceSummaryItem } from "../types";

export interface CreateTeachingDayPayload {
  dayDate: string;
  hours: number;
  topic: string;
  lecturerId?: string;
}

export interface MarkAttendancePayload {
  studentId: string;
  isPresent: boolean;
  note?: string;
}

export const attendanceApi = {
  async getDays(termId: string): Promise<TeachingDay[]> {
    return request<TeachingDay[]>(`/api/attendance/terms/${termId}/days`);
  },

  async createDay(termId: string, payload: CreateTeachingDayPayload): Promise<TeachingDay> {
    return request<TeachingDay>(`/api/attendance/terms/${termId}/days`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getDayAttendance(dayId: string): Promise<AttendanceRosterStudent[]> {
    return request<AttendanceRosterStudent[]>(`/api/attendance/days/${dayId}`);
  },

  async markAttendance(dayId: string, payload: MarkAttendancePayload): Promise<string> {
    const raw = await requestRaw<void>(`/api/attendance/days/${dayId}/mark`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return raw.message || "Docházka byla uložena.";
  },

  async getSummary(termId: string): Promise<AttendanceSummaryItem[]> {
    return request<AttendanceSummaryItem[]>(`/api/attendance/terms/${termId}/summary`);
  },
};
