import { request, requestRaw } from "./apiClient";
import { CourseTerm, Enrollment } from "../types";

export interface CreateTermPayload {
  courseId: string;
  classroomId?: string;
  startDate: string;
  endDate: string;
  capacity: number;
  lecturerIds?: string[];
}

export interface CreateEnrollmentPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  organization?: string;
  note?: string;
}

export const termsApi = {
  async getAll(): Promise<CourseTerm[]> {
    return request<CourseTerm[]>("/api/terms");
  },

  async getById(id: string): Promise<CourseTerm> {
    return request<CourseTerm>(`/api/terms/${id}`);
  },

  async create(payload: CreateTermPayload): Promise<CourseTerm> {
    return request<CourseTerm>("/api/terms", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getEnrollments(termId: string): Promise<Enrollment[]> {
    return request<Enrollment[]>(`/api/terms/${termId}/enrollments`);
  },

  async createEnrollment(
    termId: string,
    payload: CreateEnrollmentPayload
  ): Promise<{ enrollment: Enrollment; message: string }> {
    const raw = await requestRaw<Enrollment>(`/api/terms/${termId}/enrollments`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return {
      enrollment: raw.data!,
      message: raw.message || "Student byl úspěšně zaregistrován.",
    };
  },

  async cancelEnrollment(
    enrollmentId: string
  ): Promise<{ message: string; promotedEnrollmentId?: string | null }> {
    const raw = await requestRaw<{ promotedEnrollmentId?: string | null }>(
      `/api/enrollments/${enrollmentId}/cancel`,
      {
        method: "POST",
      }
    );
    return {
      message: raw.message || "Přihláška byla zrušena.",
      promotedEnrollmentId: raw.data?.promotedEnrollmentId,
    };
  },
};
