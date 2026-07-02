// src/app/api/member/profile/route.ts — 修改昵称 API
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = parseInt(session.user.id as string, 10);
  const { name } = await request.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "昵称不能为空" }, { status: 400 });
  }

  if (name.trim().length > 20) {
    return NextResponse.json({ error: "昵称不能超过20个字符" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: name.trim() },
    select: { name: true },
  });

  return NextResponse.json(user);
}
