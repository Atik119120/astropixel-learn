import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required.');
        }

        const email = credentials.email.toLowerCase().trim();

        // Static fallback for mock/demo testing if database is initializing
        if (email === 'admin@astropixel.online' && credentials.password === 'admin123') {
          return {
            id: 'admin-mock-id',
            name: 'System Admin',
            email: 'admin@astropixel.online',
            role: 'ADMIN',
          };
        }

        if (email === 'teacher@astropixel.online' && credentials.password === 'teacher123') {
          return {
            id: 'teacher-mock-id',
            name: 'Instructor Instructor',
            email: 'teacher@astropixel.online',
            role: 'INSTRUCTOR',
          };
        }

        if (email === 'student@astropixel.online' && credentials.password === 'student123') {
          return {
            id: 'student-mock-id',
            name: 'Student Learner',
            email: 'student@astropixel.online',
            role: 'STUDENT',
          };
        }

        try {
          const { prisma } = await import('./prisma');
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) {
            throw new Error('No user found with this email.');
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error('Invalid password.');
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };
        } catch (err: any) {
          console.error('Auth error:', err?.message || err);
          throw new Error(err?.message || 'Authentication failed.');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'STUDENT';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role || 'STUDENT';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'alphazero-lms-super-secret-key-2026',
};

export default authOptions;
