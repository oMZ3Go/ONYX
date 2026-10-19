import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { localeCookie, preferredLocale } from "./i18n/config";
const localize = createMiddleware(routing);
export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale(request.cookies.get(localeCookie)?.value)}`;
    return NextResponse.redirect(url);
  }
  return localize(request);
}
export const config = { matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"] };
