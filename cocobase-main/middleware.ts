import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { cookies } from "next/headers";

export async function middleware(request: NextRequest) {
  const token = (await cookies()).get("token");
  if (new URL(request.url).pathname === '/auth/login' || new URL(request.url).pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/admin', request.url))
    } {
      return NextResponse.next()
    }
  } else if (new URL(request.url).pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/auth/:path'],
}