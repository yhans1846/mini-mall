// src/app/api/member/avatar/route.ts — 上传头像 API
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = parseInt(session.user.id as string, 10);

  try {
    const { image } = await request.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "图片数据不能为空" }, { status: 400 });
    }

    // 验证 base64 图片格式
    const matches = image.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ error: "不支持的图片格式" }, { status: 400 });
    }

    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    // 限制文件大小 (2MB)
    if (buffer.length > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "图片大小不能超过 2MB" }, { status: 400 });
    }

    const fileName = `avatar_${userId}_${Date.now()}.${ext}`;
    const filePath = path.join(process.cwd(), "public", "uploads", "avatars", fileName);

    await writeFile(filePath, buffer);

    const avatarUrl = `/uploads/avatars/${fileName}`;

    await prisma.mallUser.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({ avatarUrl });
  } catch {
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
