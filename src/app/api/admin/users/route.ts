// src/app/api/admin/users/route.ts — 后台用户管理 API
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;
  const user = await prisma.adminUser.findUnique({ where: { id: parseInt(session.user.id as string, 10) } });
  return !!user;
}

/** 获取用户列表（分页 + 搜索） */
export async function GET(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = 20;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.mallUser.count({ where }),
    prisma.mallUser.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        membershipLevel: true,
        totalSpent: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}
