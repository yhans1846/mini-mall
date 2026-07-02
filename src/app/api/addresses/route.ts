// src/app/api/addresses/route.ts — 收货地址 API (列表/新增)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = parseInt(session.user.id as string, 10);

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(addresses);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = parseInt(session.user.id as string, 10);
  const body = await request.json();

  const { name, phone, province, city, district, detail, isDefault } = body;

  // 参数校验
  if (!name || !phone || !province || !city || !detail) {
    return NextResponse.json({ error: "请填写完整的收货信息" }, { status: 400 });
  }

  if (!/^1\d{10}$/.test(phone)) {
    return NextResponse.json({ error: "手机号格式不正确" }, { status: 400 });
  }

  // 如果是设为默认，先取消其他地址的默认状态
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  // 如果这是第一个地址，自动设为默认
  const count = await prisma.address.count({ where: { userId } });
  const shouldDefault = count === 0 || isDefault;

  const address = await prisma.address.create({
    data: {
      userId,
      name: name.trim(),
      phone,
      province: province.trim(),
      city: city.trim(),
      district: district?.trim() || "",
      detail: detail.trim(),
      isDefault: shouldDefault,
    },
  });

  return NextResponse.json(address, { status: 201 });
}
