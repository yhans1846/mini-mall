// src/app/api/admin/users/route.ts — 后台用户管理 API（分页 + 搜索 + 等级筛选）
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/utils";

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));
  const level = searchParams.get("level") || "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (level) {
    where.membershipLevel = parseInt(level, 10);
  }

  const [total, users] = await Promise.all([
    prisma.mallUser.count({ where }),
    prisma.mallUser.findMany({
      where,
      select: {
        id: true, name: true, email: true, avatar: true,
        membershipLevel: true, totalSpent: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}
