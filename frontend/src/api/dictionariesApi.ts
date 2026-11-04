import { request } from "./apiClient";
import { Classroom, Lecturer, AnalyticsData } from "../types";

export const dictionariesApi = {
  async getLecturers(): Promise<Lecturer[]> {
    return request<Lecturer[]>("/api/lecturers");
  },

  async getClassrooms(): Promise<Classroom[]> {
    return request<Classroom[]>("/api/classrooms");
  },

  async getAnalytics(): Promise<AnalyticsData> {
    return request<AnalyticsData>("/api/analytics");
  },
};
