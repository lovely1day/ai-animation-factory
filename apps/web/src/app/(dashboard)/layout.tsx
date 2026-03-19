import AppHeader from "@/components/layout/header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <AppHeader />
      <main className="flex-1 pt-16 relative z-10">
        {children}
      </main>
      {/* Footer removed - already in root layout */}
    </div>
  );
}
