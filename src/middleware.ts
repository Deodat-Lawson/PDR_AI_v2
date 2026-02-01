import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Pool } from '@neondatabase/serverless';
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import { users } from "~/server/db/schema";

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
    '/signup/employer(.*)',
    '/signup/employee(.*)',
    '/employer(.*)',
    '/employee(.*)',
]);

// Routes that are always public
const isPublicRoute = createRouteMatcher([
    '/',
    '/pricing',
    '/deployment',
    '/contact',
    '/about',
    '/signup',
    '/api/webhooks(.*)',
]);

// Routes where authenticated users should be redirected to their dashboard
const isAuthRedirectRoute = createRouteMatcher([
    '/',
    '/signup',
]);

// Create a lazy database connection for middleware
const getDb = () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    return drizzle(pool, { schema: { users } });
};

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();
    const pathname = req.nextUrl.pathname;
    
    // Skip API routes and static files for redirect logic
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
        if (isProtectedRoute(req) && !isPublicRoute(req)) {
            await auth.protect();
        }
        return;
    }

    // If user is authenticated and on a route where they should be redirected
    if (userId && isAuthRedirectRoute(req)) {
        try {
            const db = getDb();
            const [existingUser] = await db
                .select({ role: users.role })
                .from(users)
                .where(eq(users.userId, userId));

            if (!existingUser) {
                // User exists in Clerk but not in DB - let them complete signup
                if (pathname !== '/signup') {
                    return NextResponse.redirect(new URL('/signup', req.url));
                }
            } else if (existingUser.role === "employer" || existingUser.role === "owner") {
                return NextResponse.redirect(new URL('/employer/home', req.url));
            } else if (existingUser.role === "employee") {
                return NextResponse.redirect(new URL('/employee/documents', req.url));
            }
        } catch (error) {
            // If DB query fails, let the request continue without redirect
            console.error("Middleware DB query failed:", error);
        }
    }

    // Protect routes that require authentication
    if (isProtectedRoute(req) && !isPublicRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
