import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "请求格式错误，请提供有效的 JSON" },
        { status: 400 },
      );
    }

    const data = registerSchema.parse(body);

    // 检查邮箱是否已注册
    const existing = await prisma.mallUser.findUnique({
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

    await prisma.mallUser.create({
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
    // 并发注册时的唯一约束冲突
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "该邮箱已被注册" },
          { status: 409 },
        );
      }
    }
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
