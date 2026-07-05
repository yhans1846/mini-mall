// src/app/api/admin/auth/login/route.ts — 管理员登录 API（自定义 JWT，独立于 next-auth）
import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/utils";

// 使用与 next-auth 相同的 JWT 编码方式
async function encode(token: Record<string, unknown>): Promise<string> {
  const { encode: jwtEncode } = await import("next-auth/jwt");
  return jwtEncode({ token, secret: getAuthSecret(), salt: "admin-token" });
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "请填写邮箱和密码" }, { status: 400 });
    }

    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    // 签发 JWT（与 next-auth 兼容的格式）
    const token = await encode({
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: "ADMIN",
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    });

    // 设置独立 cookie，与 next-auth 的 session cookie 完全隔离
    response.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 小时
    });

    return response;
  } catch (e) {
    console.error("Admin login error:", e);
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
