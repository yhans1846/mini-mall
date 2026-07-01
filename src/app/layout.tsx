import type { Metadata } from "next";
import SessionProvider from "@/components/provider/SessionProvider";
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
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}