import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json(
      { error: "获取分类失败" },
      { status: 500 }
    );
  }
}
