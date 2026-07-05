// src/app/api/admin/auth/me/route.ts — 获取当前管理员信息
import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils";

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未登录或登录已过期" }, { status: 401 });
  }

  return NextResponse.json({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: "ADMIN",
  });
}
