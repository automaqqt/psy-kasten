import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from '@prisma/client';

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Check for ADMIN role for /admin paths
    if (pathname.startsWith("/admin") && token?.role !== UserRole.ADMIN) {
        console.warn(`Middleware: Admin access denied for ${token?.email} to ${pathname}`);
        // Redirect to dashboard or a generic forbidden page
        return NextResponse.redirect(new URL('/dashboard?error=forbidden', req.url));
        // Alternatively return NextResponse.rewrite(new URL('/403', req.url));
    }

    // Allow request if authenticated for dashboard/protected API or if admin access granted
    return NextResponse.next();
  },
  {
    callbacks: {
        // Role needs to be added to token in [...nextauth].js callbacks.jwt
      authorized: ({ token, req }) => {
          const { pathname } = req.nextUrl;
           // Allow access to API submit/download if token exists, further checks in API
           if (pathname.startsWith('/api/proposals/upload') || pathname.startsWith('/api/proposals/mine')) {
               return !!token; // Must be logged in
           }
          // Admin API routes need stricter check, handled by middleware function above
           if (pathname.startsWith('/api/admin')) {
               return !!token; // Let middleware function handle role check
           }
          // Dashboard/Admin pages also handled by middleware function or require token
          if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
              return !!token;
          }
          // Allow access to other pages (or define stricter rules)
          return true;
      },
    },
     pages: { signIn: "/auth/signin", error: "/auth/error" },
  }
);

// Update Matcher
export const config = {
  matcher: [
      "/dashboard/:path*",
      "/admin/:path*", // Protect admin UI pages
      "/api/studies/:path*",
      "/api/participants/:path*",
      "/api/assignments/:path*",
      "/api/proposals/upload", // Protect researcher upload route
      "/api/proposals/mine",   // Protect researcher status route
      "/api/admin/:path*",    // Protect ALL admin API routes
      // Exclude public routes like /api/auth, /api/results (POST), /api/test-session
    ],
};