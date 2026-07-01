import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    // 检查邮箱是否已注册
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 },
      );
    }

    // 加密密码并创建用户
    const hashedPassword = await hash(data.password, 10);

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: "注册成功" },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "输入数据无效", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 },
    );
  }
}
