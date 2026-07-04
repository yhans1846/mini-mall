// src/app/api/admin/orders/route.ts — 后台订单列表
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;
  const user = await prisma.adminUser.findUnique({ where: { id: parseInt(session.user.id as string, 10) } });
  return !!user;
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}
