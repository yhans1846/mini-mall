"use client";

import { SWRConfig } from "swr";
import { swrConfig } from "@/lib/swr-config";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Toaster from "@/components/admin/Toaster";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SWRConfig value={swrConfig}>
      <div className="flex min-h-screen flex-col bg-gray-50/30">
        <Header />
        <div className="flex-1 pt-6">
          <div className="mx-auto w-full max-w-7xl px-4 xl:max-w-[1600px]">{children}</div>
        </div>
        <Footer />
      </div>
      <Toaster />
    </SWRConfig>
  );
}
