import bcrypt from 'bcryptjs';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: 'STUDENT' | 'INSTRUCTOR';
}

export async function registerUser(input: RegisterInput) {
  const { name, email, password, role = 'STUDENT' } = input;

  if (!email || !password || !name) {
    return { error: 'Please provide all required fields.' };
  }

  // Prevent public admin registration
  const finalRole = role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT';

  try {
    const { prisma } = await import('@/lib/prisma');
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return { error: 'An account with this email already exists.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: finalRole,
        profile: {
          create: {},
        },
        ...(finalRole === 'INSTRUCTOR'
          ? {
              instructorProfile: {
                create: {
                  title: 'Instructor',
                },
              },
            }
          : {}),
      },
    });

    return { success: true, userId: newUser.id };
  } catch (error: any) {
    console.error('Registration error:', error?.message || error);
    return { error: error?.message || 'Failed to register user.' };
  }
}
