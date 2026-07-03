// src/app/api/flash-sales/active/route.ts — 当前活跃的秒杀活动
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    const flashSales = await prisma.flashSale.findMany({
      where: {
        isActive: true,
        startTime: { lte: now },
        endTime: { gt: now },
        product: { isPublished: true },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { endTime: "asc" },
    });

    return NextResponse.json(flashSales);
  } catch {
    return NextResponse.json(
      { error: "获取秒杀活动失败" },
      { status: 500 }
    );
  }
}
