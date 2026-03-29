"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CharacterBuilderEmbed from "@/components/CharacterBuilderEmbed";

function StudioInner() {
  const params = useSearchParams();
  const characterId = params.get("id") ?? undefined;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
          <ArrowRight className="w-3.5 h-3.5" />
          الكتالوج
        </Link>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-xs text-white/60">{characterId ? "تعديل شخصية" : "شخصية جديدة"}</span>
      </div>
      <CharacterBuilderEmbed characterId={characterId} />
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense>
      <StudioInner />
    </Suspense>
  );
}
