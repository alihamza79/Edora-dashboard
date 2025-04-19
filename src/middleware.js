import { NextResponse } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = [
  '/auth/auth1/login',
  '/auth/auth1/register',
  '/auth/auth1/forgot-password',
];

// List of allowed routes/directories
const allowedRoutes = [
  '/student',
  '/courses',
  '/dashboard',
  '/teacher',
  // Include auth routes as they're needed for login
  '/auth',
  // Include API routes for functionality
  '/api',
  // Include landingpage routes
  '/landingpage',
  // Include frontend-pages routes
  '/frontend-pages',
  // Include root page
  '/'
];

// Function to check if a path is allowed
function isPathAllowed(path) {
  // Always allow public routes
  if (publicRoutes.includes(path)) return true;
  
  // Check if the path starts with any of the allowed routes
  return allowedRoutes.some(route => path.startsWith(route));
}

export function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // Always allow static files and favicon
  if (
    path.startsWith('/_next') || 
    path.startsWith('/favicon') ||
    path.startsWith('/images') ||
    path.startsWith('/assets')
  ) {
    return NextResponse.next();
  }
  
  // Explicitly check for restricted paths
  const explicitlyRestrictedPaths = [
    '/apps',
    '/ui-components',
    '/theme-pages',
    '/tables',
    '/sample-page',
    '/react-tables',
    '/charts',
    '/dashboards',
    '/forms',
    '/icons',
    '/widgets'
  ];
  
  if (explicitlyRestrictedPaths.some(restrictedPath => path.startsWith(restrictedPath))) {
    // For restricted paths, redirect based on user type
    const userType = request.cookies.get('userType')?.value || 'student';
    const redirectPath = userType === 'tutor' ? '/dashboard/tutor' : '/dashboard/student';
    
    // If not logged in yet, redirect to login
    const isLoggedIn = request.cookies.get('authSession')?.value;
    const finalRedirect = isLoggedIn ? redirectPath : '/auth/auth1/login';
    
    return NextResponse.redirect(new URL(finalRedirect, request.url));
  }
  
  // Check if the path is allowed
  if (!isPathAllowed(path)) {
    // Get userType from cookies to determine redirect destination
    const userType = request.cookies.get('userType')?.value || 'student';
    const redirectPath = userType === 'tutor' ? '/dashboard/tutor' : '/dashboard/student';
    
    // If not logged in yet, redirect to login
    const isLoggedIn = request.cookies.get('authSession')?.value;
    const finalRedirect = isLoggedIn ? redirectPath : '/auth/auth1/login';
    
    return NextResponse.redirect(new URL(finalRedirect, request.url));
  }
  
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /fonts, /images (static files)
     * 4. /favicon.ico, /robots.txt (static files)
     */
    '/((?!_next|fonts|images|assets|favicon.ico|robots.txt).*)',
  ],
}; 