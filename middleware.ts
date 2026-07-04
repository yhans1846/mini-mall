// middleware.ts — 双认证中间件：后台用 admin-token cookie，商城用 next-auth session
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { decode } = await import("next-auth/jwt");
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET!;
    const decoded = await decode({ token, secret, salt: "admin-token" });
    return decoded?.role === "ADMIN";
  } catch {
    return false;
  }
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  // 管理员独立登录页 — 未登录可访问
  if (pathname === "/admin-login") {
    return NextResponse.next();
  }

  // 后台路由：检查 admin-token cookie（完全独立于 next-auth）
  if (pathname.startsWith("/admin")) {
    const adminToken = req.cookies.get("admin-token")?.value;
    const isValid = await verifyAdminToken(adminToken);
    if (!isValid) {
      const loginUrl = new URL("/admin-login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 购物车、订单、会员中心：使用 next-auth session（商城用户）
  if (
    pathname.startsWith("/cart") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/member")
  ) {
    if (!req.auth) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/admin-login", "/cart/:path*", "/orders/:path*", "/member/:path*"],
};
