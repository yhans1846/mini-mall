// src/app/api/admin/auth/me/route.ts — 获取当前管理员信息
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function decode(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { decode: jwtDecode } = await import("next-auth/jwt");
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET!;
    return jwtDecode({ token, secret, salt: "admin-token" });
  } catch {
    return null;
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;

  if (!token) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const payload = await decode(token);
  if (!payload || !payload.id) {
    return NextResponse.json({ error: "登录已过期" }, { status: 401 });
  }

  return NextResponse.json({
    id: payload.id,
    name: payload.name,
    email: payload.email,
    role: payload.role,
  });
}
