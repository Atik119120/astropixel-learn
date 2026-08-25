import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'alphazero-lms-super-secret-key-2026' });
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isInstructorRoute = pathname.startsWith('/instructor');
  const isAdminRoute = pathname.startsWith('/admin');
  const isLearnRoute = pathname.startsWith('/learn');

  // If user is trying to access protected routes without a token
  if (!token && (isDashboardRoute || isInstructorRoute || isAdminRoute || isLearnRoute)) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role authorization checks
  if (token) {
    const userRole = (token.role as string) || 'STUDENT';

    // Protect Admin route
    if (isAdminRoute && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Protect Instructor route
    if (isInstructorRoute && userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/instructor/:path*', '/admin/:path*', '/learn/:path*'],
};
