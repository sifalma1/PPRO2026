import { describe, it, expect, beforeEach } from "@jest/globals";
import { Course } from "../../src/domain/entities/Course.js";
import {
  ICourseRepository,
  CourseFilter,
} from "../../src/domain/repositories/ICourseRepository.js";
import { CourseService } from "../../src/application/services/CourseService.js";

/**
 * In-memory repository mock for isolated unit testing
 */
class InMemoryCourseRepository implements ICourseRepository {
  private items: Course[] = [];

  constructor(initial: Course[] = []) {
    this.items = [...initial];
  }

  async findAll(filter?: CourseFilter): Promise<Course[]> {
    return this.items.filter((c) => {
      if (filter?.isAccredited !== undefined && c.isAccredited !== filter.isAccredited) {
        return false;
      }
      if (filter?.query) {
        const q = filter.query.toLowerCase();
        return c.title.toLowerCase().includes(q) || c.annotation.toLowerCase().includes(q);
      }
      return true;
    });
  }

  async findById(id: string): Promise<Course | null> {
    return this.items.find((c) => c.id === id) || null;
  }

  async create(course: Course): Promise<Course> {
    const created = new Course({
      ...course,
      id: `course-${this.items.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.items.push(created);
    return created;
  }

  async update(id: string, course: Course): Promise<Course | null> {
    const index = this.items.findIndex((c) => c.id === id);
    if (index === -1) return null;
    const updated = new Course({
      ...course,
      id,
      createdAt: this.items[index].createdAt,
      updatedAt: new Date(),
    });
    this.items[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.items.findIndex((c) => c.id === id);
    if (index === -1) return false;
    this.items.splice(index, 1);
    return true;
  }
}

describe("Course Domain Entity and CourseService (Jest Unit Tests)", () => {
  describe("Course Entity Validation Invariants", () => {
    it("creates a valid course instance with all properties set", () => {
      const course = new Course({
        title: "TypeScript & Node.js Masterclass",
        annotation: "Comprehensive deep-dive into backend architecture and patterns.",
        hours: 40,
        price: 12500,
        isAccredited: true,
      });

      expect(course.title).toBe("TypeScript & Node.js Masterclass");
      expect(course.annotation).toBe(
        "Comprehensive deep-dive into backend architecture and patterns."
      );
      expect(course.hours).toBe(40);
      expect(course.price).toBe(12500);
      expect(course.isAccredited).toBe(true);
    });

    it("allows a course with price 0 (free introductory workshop)", () => {
      const freeCourse = new Course({
        title: "Introductory Web Dev Seminar",
        annotation: "Free community workshop covering HTML, CSS, and basic JavaScript.",
        hours: 4,
        price: 0,
        isAccredited: false,
      });

      expect(freeCourse.price).toBe(0);
      expect(freeCourse.title).toBe("Introductory Web Dev Seminar");
    });

    it("trims whitespace from title and annotation", () => {
      const course = new Course({
        title: "   Python Data Science   ",
        annotation: "   Practical data analysis using Pandas and NumPy.   ",
        hours: 30,
        price: 9000,
        isAccredited: false,
      });

      expect(course.title).toBe("Python Data Science");
      expect(course.annotation).toBe("Practical data analysis using Pandas and NumPy.");
    });

    it("throws an error when title has fewer than 3 characters", () => {
      expect(() => {
        new Course({
          title: "JS",
          annotation: "Valid annotation with sufficient character length.",
          hours: 20,
          price: 5000,
          isAccredited: false,
        });
      }).toThrow("Course title must be between 3 and 150 characters.");
    });

    it("throws an error when title exceeds 150 characters", () => {
      const longTitle = "A".repeat(151);
      expect(() => {
        new Course({
          title: longTitle,
          annotation: "Valid annotation with sufficient character length.",
          hours: 20,
          price: 5000,
          isAccredited: false,
        });
      }).toThrow("Course title must be between 3 and 150 characters.");
    });

    it("throws an error when annotation has fewer than 10 characters", () => {
      expect(() => {
        new Course({
          title: "Valid Course Title",
          annotation: "Too short",
          hours: 20,
          price: 5000,
          isAccredited: false,
        });
      }).toThrow("Course annotation must be at least 10 characters long.");
    });

    it("throws an error when hours are zero or negative", () => {
      expect(() => {
        new Course({
          title: "Valid Course Title",
          annotation: "Valid annotation with sufficient character length.",
          hours: 0,
          price: 5000,
          isAccredited: false,
        });
      }).toThrow("Course hours must be a positive integer greater than 0.");

      expect(() => {
        new Course({
          title: "Valid Course Title",
          annotation: "Valid annotation with sufficient character length.",
          hours: -10,
          price: 5000,
          isAccredited: false,
        });
      }).toThrow("Course hours must be a positive integer greater than 0.");
    });

    it("throws an error when hours are a non-integer float", () => {
      expect(() => {
        new Course({
          title: "Valid Course Title",
          annotation: "Valid annotation with sufficient character length.",
          hours: 15.5,
          price: 5000,
          isAccredited: false,
        });
      }).toThrow("Course hours must be a positive integer greater than 0.");
    });

    it("throws an error when price is negative", () => {
      expect(() => {
        new Course({
          title: "Valid Course Title",
          annotation: "Valid annotation with sufficient character length.",
          hours: 20,
          price: -100,
          isAccredited: false,
        });
      }).toThrow("Course price cannot be negative.");
    });
  });

  describe("CourseService Use Cases", () => {
    let repo: InMemoryCourseRepository;
    let service: CourseService;

    beforeEach(() => {
      repo = new InMemoryCourseRepository();
      service = new CourseService(repo);
    });

    it("creates a course and returns a complete response DTO", async () => {
      const result = await service.createCourse({
        title: "Docker & Kubernetes DevOps",
        annotation: "Hands-on container orchestration for cloud deployments.",
        hours: 32,
        price: 11900,
        isAccredited: true,
      });

      expect(result.id).toBeDefined();
      expect(result.title).toBe("Docker & Kubernetes DevOps");
      expect(result.hours).toBe(32);
      expect(result.price).toBe(11900);
      expect(result.isAccredited).toBe(true);
    });

    it("retrieves a course by its ID", async () => {
      const created = await service.createCourse({
        title: "Cybersecurity Fundamentals",
        annotation: "Introduction to security analysis, cryptography, and defense.",
        hours: 24,
        price: 8500,
        isAccredited: false,
      });

      const found = await service.getCourseById(created.id);
      expect(found).toEqual(created);
    });

    it("throws an error when getting a non-existent course ID", async () => {
      await expect(service.getCourseById("non-existent-id")).rejects.toThrow(
        "Course with ID 'non-existent-id' was not found."
      );
    });

    it("filters courses by accreditation status and text search query", async () => {
      await service.createCourse({
        title: "Accounting & Financial Statements",
        annotation: "Accredited accounting education for certified professionals.",
        hours: 80,
        price: 18000,
        isAccredited: true,
      });

      await service.createCourse({
        title: "Creative Writing Workshop",
        annotation: "Interactive workshop for authors and copywriters.",
        hours: 16,
        price: 3500,
        isAccredited: false,
      });

      await service.createCourse({
        title: "Tax Specialist & Accounting",
        annotation: "Advanced tax regulations and corporate finance.",
        hours: 60,
        price: 16000,
        isAccredited: true,
      });

      // Filter: only accredited
      const accredited = await service.getAllCourses({ isAccredited: true });
      expect(accredited).toHaveLength(2);
      expect(accredited.every((c) => c.isAccredited)).toBe(true);

      // Filter: non-accredited
      const nonAccredited = await service.getAllCourses({ isAccredited: false });
      expect(nonAccredited).toHaveLength(1);
      expect(nonAccredited[0].title).toBe("Creative Writing Workshop");

      // Filter: search query 'tax'
      const searchTax = await service.getAllCourses({ query: "tax" });
      expect(searchTax).toHaveLength(1);
      expect(searchTax[0].title).toBe("Tax Specialist & Accounting");

      // Filter: search query 'accounting' + accredited
      const searchAccountingAccredited = await service.getAllCourses({
        isAccredited: true,
        query: "accounting",
      });
      expect(searchAccountingAccredited).toHaveLength(2);
    });

    it("updates course parameters successfully", async () => {
      const course = await service.createCourse({
        title: "Old Course Name",
        annotation: "Old annotation with sufficient character length.",
        hours: 20,
        price: 5000,
        isAccredited: false,
      });

      const updated = await service.updateCourse(course.id, {
        title: "New Updated Course Name",
        price: 6500,
        isAccredited: true,
      });

      expect(updated.title).toBe("New Updated Course Name");
      expect(updated.price).toBe(6500);
      expect(updated.isAccredited).toBe(true);
      expect(updated.hours).toBe(20); // preserved original
    });

    it("throws an error when updating a non-existent course", async () => {
      await expect(
        service.updateCourse("non-existent-id", {
          title: "New Title Here",
        })
      ).rejects.toThrow("Course with ID 'non-existent-id' was not found.");
    });

    it("deletes an existing course and verifies deletion", async () => {
      const course = await service.createCourse({
        title: "Course to Delete",
        annotation: "This course will be deleted shortly.",
        hours: 10,
        price: 2000,
        isAccredited: false,
      });

      const deleteResult = await service.deleteCourse(course.id);
      expect(deleteResult).toBe(true);

      await expect(service.getCourseById(course.id)).rejects.toThrow(
        `Course with ID '${course.id}' was not found.`
      );
    });

    it("throws an error when attempting to delete a non-existent course", async () => {
      await expect(service.deleteCourse("unknown-id")).rejects.toThrow(
        "Course with ID 'unknown-id' was not found."
      );
    });
  });
});
