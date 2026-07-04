// src/app/api/member/password/route.ts — 修改密码 API
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = parseInt(session.user.id as string, 10);
  const { oldPassword, newPassword } = await request.json();

  // 参数校验
  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: "原密码和新密码不能为空" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "新密码不能少于6位" }, { status: 400 });
  }

  if (oldPassword === newPassword) {
    return NextResponse.json({ error: "新密码不能与原密码相同" }, { status: 400 });
  }

  // 验证原密码
  const user = await prisma.mallUser.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const isValid = await bcrypt.compare(oldPassword, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "原密码错误" }, { status: 400 });
  }

  // 更新密码
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.mallUser.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ message: "密码修改成功" });
}
