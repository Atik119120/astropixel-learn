export async function updateLessonProgressAction(input: {
  studentId: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  watchProgress?: number;
}) {
  const { studentId, courseId, lessonId, completed, watchProgress = 0 } = input;

  if (!studentId || !courseId || !lessonId) {
    return { error: 'Student, Course, and Lesson IDs required.' };
  }

  try {
    const { prisma } = await import('@/lib/prisma');

    // 1. Ensure enrollment exists
    const enrollment = await prisma.enrollment.upsert({
      where: {
        studentId_courseId: { studentId, courseId },
      },
      update: {},
      create: {
        studentId,
        courseId,
        progress: 0,
      },
    });

    // 2. Upsert lesson progress
    await prisma.lessonProgress.upsert({
      where: {
        studentId_lessonId: { studentId, lessonId },
      },
      update: {
        completed,
        watchProgress,
        completedAt: completed ? new Date() : null,
      },
      create: {
        enrollmentId: enrollment.id,
        studentId,
        lessonId,
        completed,
        watchProgress,
        completedAt: completed ? new Date() : null,
      },
    });

    // 3. Recalculate total course progress
    const totalLessons = await prisma.lesson.count({
      where: {
        section: {
          courseId,
        },
      },
    });

    const completedLessons = await prisma.lessonProgress.count({
      where: {
        studentId,
        completed: true,
        lesson: {
          section: {
            courseId,
          },
        },
      },
    });

    const progressPercentage = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 100;

    const isCourseCompleted = progressPercentage >= 100;

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: progressPercentage,
        completedAt: isCourseCompleted ? new Date() : null,
      },
    });

    // 4. Generate certificate if 100% completed
    let certificate: any = null;
    if (isCourseCompleted) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: { instructor: true },
      });
      const student = await prisma.user.findUnique({
        where: { id: studentId },
      });

      if (course && student) {
        const certCode = `CERT-${studentId.slice(0, 4)}-${courseId.slice(0, 4)}-${Date.now().toString().slice(-6)}`.toUpperCase();

        certificate = await prisma.certificate.upsert({
          where: { certificateId: certCode },
          update: {},
          create: {
            certificateId: certCode,
            studentId,
            courseId,
            studentName: student.name || 'Student Learner',
            courseTitle: course.title,
            instructorName: course.instructor?.name || 'Lead Instructor',
            issueDate: new Date(),
          },
        });
      }
    }

    return {
      success: true,
      progress: progressPercentage,
      completedLessons,
      totalLessons,
      isCourseCompleted,
      certificate,
    };
  } catch (error: any) {
    console.error('Update progress error:', error?.message || error);
    return { error: error?.message || 'Failed to update progress.' };
  }
}
