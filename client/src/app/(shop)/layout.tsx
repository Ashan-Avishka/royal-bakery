import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MainShell } from "@/components/MainShell";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <MainShell>{children}</MainShell>
      <Footer />
    </div>
  );
}
