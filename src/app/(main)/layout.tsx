import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 pt-16">
        <div className="mx-auto max-w-7xl px-4">{children}</div>
      </div>
      <Footer />
    </div>
  );
}
