"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GAMES, seededScores, type GameId } from "@/app/data";
import { Podium, HallTable } from "@/components/Podium";
import { useAuth } from "@/components/AuthProvider";

export default function HallOfFamePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<GameId>(GAMES[0].id);

  const rows = useMemo(() => seededScores(tab.length * 23 + 7, 12), [tab]);
  const game = GAMES.find((g) => g.id === tab)!;

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA</p>
      </div>

      <div className="hall-tabs">
        {GAMES.map((g) => (
          <button key={g.id} className={"chip" + (tab === g.id ? " active" : "")} onClick={() => setTab(g.id)}>
            {g.title}
          </button>
        ))}
      </div>

      <Podium rows={rows} />
      <HallTable rows={rows} gameTitle={game.title} user={user} />

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/" className="btn lg">VOLVER A LA BIBLIOTECA</Link>
      </div>
    </div>
  );
}
