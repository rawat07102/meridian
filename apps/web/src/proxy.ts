import { NextRequest, NextResponse } from 'next/server';

const homePath = `/workspaces/${process.env.NEXT_PUBLIC_WORKSPACE_ID}`;

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtected = !path.startsWith('/auth');
  const token = req.cookies.get('accessToken')?.value;
  const isAuthenticated = !!token && token.trim().length > 0;

  console.log(
    `[PROXY] ${path} - ${isProtected ? 'Protected' : 'Not Protected'} - ${isAuthenticated ? 'Authenticated' : 'Not Authenticated'}`,
  );

  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/login', req.nextUrl));
  }

  if (!isProtected && isAuthenticated) {
    return NextResponse.redirect(new URL(homePath, req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Proxy should not run on
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
