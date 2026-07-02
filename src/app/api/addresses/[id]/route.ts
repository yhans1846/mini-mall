// src/app/api/addresses/[id]/route.ts — 收货地址 API (修改/删除)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = parseInt(session.user.id as string, 10);
  const { id } = await params;
  const addressId = parseInt(id, 10);

  // 验证所有权
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "地址不存在" }, { status: 404 });
  }

  const body = await request.json();
  const { name, phone, province, city, district, detail, isDefault } = body;

  if (!name || !phone || !province || !city || !detail) {
    return NextResponse.json({ error: "请填写完整的收货信息" }, { status: 400 });
  }

  if (!/^1\d{10}$/.test(phone)) {
    return NextResponse.json({ error: "手机号格式不正确" }, { status: 400 });
  }

  // 如果是设为默认，先取消其他地址的默认状态
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true, id: { not: addressId } },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.update({
    where: { id: addressId },
    data: {
      name: name.trim(),
      phone,
      province: province.trim(),
      city: city.trim(),
      district: district?.trim() || "",
      detail: detail.trim(),
      isDefault: isDefault ?? existing.isDefault,
    },
  });

  return NextResponse.json(address);
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = parseInt(session.user.id as string, 10);
  const { id } = await params;
  const addressId = parseInt(id, 10);

  // 验证所有权
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "地址不存在" }, { status: 404 });
  }

  await prisma.address.delete({ where: { id: addressId } });

  return NextResponse.json({ message: "删除成功" });
}
