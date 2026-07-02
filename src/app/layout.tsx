import type { Metadata } from "next";
import SessionProvider from "@/components/provider/SessionProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Mall",
  description: "微型电商平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <SessionProvider>
          <Header />
          <div className="flex-1 pt-16">
            <div className="mx-auto max-w-7xl px-4">{children}</div>
          </div>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}