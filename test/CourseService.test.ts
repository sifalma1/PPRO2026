import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Course } from "../src/domain/entities/Course.js";
import { ICourseRepository } from "../src/domain/repositories/ICourseRepository.js";
import { CourseService } from "../src/application/services/CourseService.js";

/**
 * In-memory mock repository for isolated unit tests
 */
class InMemoryCourseRepository implements ICourseRepository {
  private items: Course[] = [];

  constructor(initialItems: Course[] = []) {
    this.items = [...initialItems];
  }

  async findAll(filter?: { isAccredited?: boolean; query?: string }): Promise<Course[]> {
    return this.items.filter(c => {
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
    return this.items.find(c => c.id === id) || null;
  }

  async create(course: Course): Promise<Course> {
    const created = new Course({
      ...course,
      id: "mock-uuid-" + (this.items.length + 1),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.items.push(created);
    return created;
  }

  async update(id: string, course: Course): Promise<Course | null> {
    const idx = this.items.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const updated = new Course({
      ...course,
      id,
      createdAt: this.items[idx].createdAt,
      updatedAt: new Date()
    });
    this.items[idx] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.items.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    return true;
  }
}

describe("CourseService and Course Entity (Unit Tests)", () => {
  test("Successfully creates course with valid parameters", async () => {
    const repo = new InMemoryCourseRepository();
    const service = new CourseService(repo);

    const result = await service.createCourse({
      title: "Python Programming & Data Analysis",
      annotation: "Comprehensive practical course covering Python from basics to web and data analysis.",
      hours: 60,
      price: 14500,
      isAccredited: true
    });

    assert.ok(result.id);
    assert.strictEqual(result.title, "Python Programming & Data Analysis");
    assert.strictEqual(result.hours, 60);
    assert.strictEqual(result.price, 14500);
    assert.strictEqual(result.isAccredited, true);
  });

  test("Throws error when course title is too short (< 3 characters)", async () => {
    const repo = new InMemoryCourseRepository();
    const service = new CourseService(repo);

    await assert.rejects(
      async () => {
        await service.createCourse({
          title: "Py",
          annotation: "Annotation with sufficient character length.",
          hours: 20,
          price: 5000,
          isAccredited: false
        });
      },
      { message: "Course title must be between 3 and 150 characters." }
    );
  });

  test("Throws error when course hours are non-positive", async () => {
    const repo = new InMemoryCourseRepository();
    const service = new CourseService(repo);

    await assert.rejects(
      async () => {
        await service.createCourse({
          title: "Valid Course Title",
          annotation: "Annotation with sufficient character length.",
          hours: 0,
          price: 5000,
          isAccredited: false
        });
      },
      { message: "Course hours must be a positive integer greater than 0." }
    );
  });

  test("Throws error when course price is negative", async () => {
    const repo = new InMemoryCourseRepository();
    const service = new CourseService(repo);

    await assert.rejects(
      async () => {
        await service.createCourse({
          title: "Valid Course Title",
          annotation: "Annotation with sufficient character length.",
          hours: 30,
          price: -500,
          isAccredited: false
        });
      },
      { message: "Course price cannot be negative." }
    );
  });

  test("Filters courses by accreditation status and query text", async () => {
    const initialCourses = [
      new Course({
        id: "c-1",
        title: "Accounting & Tax Records",
        annotation: "Professional accounting training.",
        hours: 120,
        price: 15000,
        isAccredited: true
      }),
      new Course({
        id: "c-2",
        title: "Digital Marketing & SEO",
        annotation: "Online marketing strategies.",
        hours: 30,
        price: 8000,
        isAccredited: false
      })
    ];

    const repo = new InMemoryCourseRepository(initialCourses);
    const service = new CourseService(repo);

    const accreditedOnly = await service.getAllCourses({ isAccredited: true });
    assert.strictEqual(accreditedOnly.length, 1);
    assert.strictEqual(accreditedOnly[0].title, "Accounting & Tax Records");

    const searchMarketing = await service.getAllCourses({ query: "marketing" });
    assert.strictEqual(searchMarketing.length, 1);
    assert.strictEqual(searchMarketing[0].id, "c-2");
  });

  test("Updates existing course details", async () => {
    const repo = new InMemoryCourseRepository([
      new Course({
        id: "c-1",
        title: "Original Title",
        annotation: "Original annotation of sufficient length.",
        hours: 40,
        price: 9000,
        isAccredited: false
      })
    ]);
    const service = new CourseService(repo);

    const updated = await service.updateCourse("c-1", {
      title: "Updated Course Title",
      price: 11000,
      isAccredited: true
    });

    assert.strictEqual(updated.title, "Updated Course Title");
    assert.strictEqual(updated.price, 11000);
    assert.strictEqual(updated.isAccredited, true);
    assert.strictEqual(updated.hours, 40);
  });

  test("Deletes course and verifies it no longer exists", async () => {
    const repo = new InMemoryCourseRepository([
      new Course({
        id: "c-to-delete",
        title: "Course to Delete",
        annotation: "Annotation of sufficient length.",
        hours: 20,
        price: 3000,
        isAccredited: false
      })
    ]);
    const service = new CourseService(repo);

    const deleted = await service.deleteCourse("c-to-delete");
    assert.strictEqual(deleted, true);

    await assert.rejects(
      async () => {
        await service.getCourseById("c-to-delete");
      },
      { message: "Course with ID 'c-to-delete' was not found." }
    );
  });
});
