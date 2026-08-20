import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const homePath = `/workspaces/${process.env.NEXT_PUBLIC_WORKSPACE_ID}`;

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtected = !path.startsWith('/auth');
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has('accessToken');

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
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
