// ============================================================
// /cms/characters — Character Room Page
// ============================================================
import { CharacterRoom } from "@/components/character-room";

export const dynamic = "force-dynamic";
export const metadata = { title: "غرفة النجم | AI Animation Factory" };

export default function CharactersPage() {
  return (
    <div className="h-screen flex flex-col p-4 bg-transparent">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">غرفة النجم</h1>
        <p className="text-sm text-white/40">ابنِ شخصيتك بتفاصيل احترافية</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <CharacterRoom
          onSave={async ({ name, dna }) => {
            await fetch("/api/characters", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, dna }),
            });
          }}
        />
      </div>
    </div>
  );
}
