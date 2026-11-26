import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Giriş yapmamış (refresh cookie'si olmayan) kullanıcıyı /login sayfasına yönlendirir.
// Gerçek yetki kontrolü backend'dedir; burası sadece kullanıcı deneyimi içindir.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login") return NextResponse.next();
  if (!request.cookies.get("refresh_token")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
