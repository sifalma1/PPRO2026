import { request, requestRaw } from "./apiClient";
import { Course } from "../types";

export interface CreateCoursePayload {
  title: string;
  annotation: string;
  hours: number;
  price: number;
  isAccredited: boolean;
}

export interface UpdateCoursePayload {
  title: string;
  annotation: string;
  hours: number;
  price: number;
  isAccredited: boolean;
}

export const coursesApi = {
  async getAll(): Promise<Course[]> {
    return request<Course[]>("/api/courses");
  },

  async getById(id: string): Promise<Course> {
    return request<Course>(`/api/courses/${id}`);
  },

  async create(payload: CreateCoursePayload): Promise<Course> {
    return request<Course>("/api/courses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async update(id: string, payload: UpdateCoursePayload): Promise<Course> {
    return request<Course>(`/api/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async delete(id: string): Promise<string> {
    const raw = await requestRaw<void>(`/api/courses/${id}`, {
      method: "DELETE",
    });
    return raw.message || "Kurz byl úspěšně smazán.";
  },
};
