import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "ADMIN";

  // 后台路由：未登录跳登录，非管理员拦截
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // 购物车、订单、会员中心：需登录
  if (
    pathname.startsWith("/cart") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/member")
  ) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/cart/:path*", "/orders/:path*", "/member/:path*"],
};
