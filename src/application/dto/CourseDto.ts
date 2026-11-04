export interface CreateCourseDto {
  title: string;
  annotation: string;
  hours: number;
  price: number;
  isAccredited?: boolean;
}

export interface UpdateCourseDto {
  title?: string;
  annotation?: string;
  hours?: number;
  price?: number;
  isAccredited?: boolean;
}

export interface CourseResponseDto {
  id: string;
  title: string;
  annotation: string;
  hours: number;
  price: number;
  isAccredited: boolean;
  createdAt: string;
  updatedAt: string;
}
