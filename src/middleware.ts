import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSecurityHeaders, getEnvironmentCSP } from "./lib/security-headers";

const isProtectedRoute = createRouteMatcher([
    '/signup/employer(.*)',
    '/signup/employee(.*)',
    '/employer(.*)',
    '/employee(.*)',
]);

const isPublicRoute = createRouteMatcher([
    '/',
    '/pricing',
    '/deployment',
    '/contact',
    '/about',
    '/signup',
    '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
    // Apply authentication protection
    if (isProtectedRoute(req) && !isPublicRoute(req)) {
        await auth.protect();
    }

    // Get the response from Clerk middleware
    const response = NextResponse.next();

    // Apply security headers to all responses
    const securityHeaders = getSecurityHeaders(getEnvironmentCSP());
    Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};