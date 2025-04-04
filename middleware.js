import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    // console.log("Middleware token:", req.nextauth.token); // Debugging: view token data

    // Example: Redirect based on role if you add roles later
    // if (req.nextUrl.pathname.startsWith("/admin") && req.nextauth.token?.role !== "admin") {
    //   return NextResponse.rewrite(new URL("/denied", req.url));
    // }

    // If accessing dashboard and not logged in, `withAuth` handles redirect automatically
    // based on `pages.signIn` in authOptions.
     return NextResponse.next(); // Allow request to proceed if authenticated
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // If there is a token, the user is authorized
    },
    pages: {
      signIn: "/auth/signin", // Redirect here if unauthorized
      error: "/auth/error", // Redirect here on error
    },
  }
);

// Apply the middleware to specific paths
export const config = {
  matcher: [
      "/dashboard/:path*", // Protect all dashboard routes
      "/api/studies/:path*", // Protect relevant API routes (can be more granular)
      "/api/participants/:path*",
      "/api/assignments/:path*",
      // Exclude public API routes like /api/results (POST) and /api/test-session/[key]
      // You can use negative lookaheads in matcher if needed, or handle auth within the API route itself for more control.
      // For API routes called by the server (getServerSideProps), checking the session there is often sufficient.
      // For API routes called by the client dashboard, middleware protection is good.
    ],
};