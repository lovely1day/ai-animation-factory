import AppHeader from "@/components/layout/header";
import { AnimatedBackground } from "@/components/animated-background";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col relative">
      <AnimatedBackground />
      <AppHeader />
      <main className="flex-1 pt-16 relative z-10">
        {children}
      </main>
      {/* Footer removed - already in root layout */}
    </div>
  );
}
