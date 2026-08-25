import { extractYouTubeVideoId } from '@/lib/youtube';

export interface CreateCourseInput {
  title: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  thumbnail?: string;
  categoryId?: string;
  instructorId: string;
  price?: number;
  discountPrice?: number;
  level?: string;
  language?: string;
  previewVideoId?: string;
}

export async function createCourseAction(input: CreateCourseInput) {
  const {
    title,
    shortDescription,
    description,
    thumbnail,
    categoryId,
    instructorId,
    price = 0,
    discountPrice,
    level = 'All Levels',
    language = 'Bangla',
    previewVideoId,
  } = input;

  if (!title || !instructorId) {
    return { error: 'Course title and instructor are required.' };
  }

  const slug = (input.slug || title)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const cleanPreviewVideoId = previewVideoId ? extractYouTubeVideoId(previewVideoId) : undefined;

  try {
    const { prisma } = await import('@/lib/prisma');

    const course = await prisma.course.create({
      data: {
        title,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        shortDescription,
        description,
        thumbnail,
        categoryId,
        instructorId,
        price,
        discountPrice,
        level,
        language,
        previewVideoId: cleanPreviewVideoId,
        status: 'DRAFT',
      },
    });

    return { success: true, course };
  } catch (error: any) {
    console.error('Create course error:', error?.message || error);
    return { error: error?.message || 'Failed to create course.' };
  }
}

export async function addSectionAction(courseId: string, title: string, order = 0) {
  if (!courseId || !title) return { error: 'Course ID and title required.' };

  try {
    const { prisma } = await import('@/lib/prisma');
    const section = await prisma.courseSection.create({
      data: {
        courseId,
        title,
        order,
      },
    });
    return { success: true, section };
  } catch (error: any) {
    return { error: error?.message || 'Failed to add section.' };
  }
}

export async function addLessonAction(input: {
  sectionId: string;
  title: string;
  description?: string;
  youtubeVideoId?: string;
  type?: 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'ASSIGNMENT';
  duration?: string;
  preview?: boolean;
  order?: number;
}) {
  const { sectionId, title, description, youtubeVideoId, type = 'VIDEO', duration, preview = false, order = 0 } = input;

  if (!sectionId || !title) return { error: 'Section ID and lesson title required.' };

  const cleanVideoId = youtubeVideoId ? extractYouTubeVideoId(youtubeVideoId) : undefined;

  try {
    const { prisma } = await import('@/lib/prisma');
    const lesson = await prisma.lesson.create({
      data: {
        sectionId,
        title,
        description,
        youtubeVideoId: cleanVideoId,
        type,
        duration,
        preview,
        order,
      },
    });
    return { success: true, lesson };
  } catch (error: any) {
    return { error: error?.message || 'Failed to add lesson.' };
  }
}

export async function submitCourseForReviewAction(courseId: string) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { status: 'PENDING_REVIEW' },
    });
    return { success: true, course: updated };
  } catch (error: any) {
    return { error: error?.message || 'Failed to submit course.' };
  }
}

export async function approveCourseAction(courseId: string) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { status: 'PUBLISHED' },
    });
    return { success: true, course: updated };
  } catch (error: any) {
    return { error: error?.message || 'Failed to approve course.' };
  }
}
