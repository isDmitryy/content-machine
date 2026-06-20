"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Card,
  PIPELINE_STAGES,
  GLOW_CLASS,
  generateCardsFromAI,
  delay,
} from "@/lib/content";

export default function IdeaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [idea,         setIdea        ] = useState<string | null>(null);
  const [loading,      setLoading     ] = useState(true);
  const [phase,        setPhase       ] = useState<"idle" | "generating" | "done">("idle");
  const [pipelineStage,setPipelineStage] = useState(-1);
  const [cards,        setCards       ] = useState<Card[]>([]);
  const [visibleIds,   setVisibleIds  ] = useState<Set<string>>(new Set());
  const [copiedId,     setCopiedId    ] = useState<string | null>(null);

  const runGeneration = useCallback(async (ideaText: string) => {
    setPhase("generating");
    setPipelineStage(-1);
    setCards([]);
    setVisibleIds(new Set());

    const animatePipeline = async () => {
      await delay(300);
      for (let i = 0; i < 4; i++) {
        setPipelineStage(i);
        await delay(620);
      }
    };

    let aiCards: Card[];
    try {
      const [, cards] = await Promise.all([
        animatePipeline(),
        generateCardsFromAI(ideaText),
      ]);
      aiCards = cards;
    } catch {
      setPhase("idle");
      return;
    }

    setCards(aiCards);
    setPhase("done");

    for (const card of aiCards) {
      await delay(210);
      setVisibleIds((prev) => new Set([...prev, card.id]));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/"); return; }

      const { data } = await supabase
        .from("saved_ideas")
        .select("idea")
        .eq("id", id)
        .eq("user_id", session.user.id)
        .single();

      if (cancelled) return;
      if (!data) { router.replace("/"); return; }

      setIdea(data.idea);
      setLoading(false);
      runGeneration(data.idea);
    }

    load();
    return () => { cancelled = true; };
  }, [id, router, runGeneration]);

  const copy = useCallback(async (cardId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(cardId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* ignore */ }
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08080F",
          color: "#A78BFA",
          fontFamily: "monospace",
          fontSize: "13px",
          letterSpacing: "0.1em",
        }}
      >
        Загружаю идею…
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Top accent line */}
      <div
        style={{
          height:     "2px",
          background: "linear-gradient(90deg, transparent 0%, #7C3AED 25%, #2563EB 55%, #22D3EE 80%, transparent 100%)",
        }}
      />

      <div className="mx-auto px-5 py-10" style={{ maxWidth: "860px" }}>

        {/* ── Nav ── */}
        <div className="mb-10 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm transition-all duration-200"
            style={{ color: "#3D4470" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#A78BFA"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#3D4470"; }}
          >
            ← Назад
          </button>

          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase"
            style={{
              background: "rgba(124,58,237,0.12)",
              border:     "1px solid rgba(124,58,237,0.28)",
              color:      "#A78BFA",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#8B5CF6", boxShadow: "0 0 8px #8B5CF6" }}
            />
            AI Content Engine
          </div>
        </div>

        {/* ── Idea display ── */}
        <section className="mb-10" style={{ animation: "fadeInUp 0.4s ease both" }}>
          <div
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "#3D4470" }}
          >
            Идея
          </div>
          <div
            className="rounded-2xl px-6 py-5"
            style={{
              background: "#0C0C18",
              border:     "1px solid rgba(124,58,237,0.2)",
              boxShadow:  "0 0 30px rgba(124,58,237,0.06)",
            }}
          >
            <p
              className="text-sm leading-relaxed"
              style={{
                color:      "#C8C8E8",
                fontFamily: "var(--font-geist-mono), monospace",
              }}
            >
              {idea}
            </p>
          </div>
        </section>

        {/* ── Pipeline ── */}
        {phase !== "idle" && (
          <section
            className="mb-10 px-6 py-6 rounded-2xl"
            style={{
              background: "#0B0B17",
              border:     "1px solid rgba(255,255,255,0.05)",
              animation:  "fadeInUp 0.4s ease both",
            }}
          >
            <div
              className="text-xs font-semibold tracking-widest uppercase mb-5"
              style={{ color: "#2D3260" }}
            >
              Пайплайн генерации
            </div>

            <div className="flex items-start">
              {PIPELINE_STAGES.map((stage, i) => {
                const active = pipelineStage >= i;
                return (
                  <Fragment key={stage.label}>
                    <div className="flex flex-col items-center gap-2" style={{ minWidth: "90px" }}>
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all duration-500"
                        style={{
                          background: active ? "linear-gradient(135deg, #7C3AED, #2563EB)" : "#0E0E1C",
                          border:     active ? "none" : "1px solid rgba(255,255,255,0.08)",
                          boxShadow:  active ? "0 0 20px rgba(124,58,237,0.5), 0 0 40px rgba(37,99,235,0.2)" : "none",
                          transform:  active ? "scale(1.08)" : "scale(1)",
                        }}
                      >
                        {stage.icon}
                      </div>
                      <div className="text-center">
                        <div
                          className="text-xs font-semibold transition-colors duration-500"
                          style={{ color: active ? "#E0E0FF" : "#252850" }}
                        >
                          {stage.label}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: active ? "#3D4470" : "#1C1E38" }}>
                          {stage.desc}
                        </div>
                      </div>
                    </div>

                    {i < PIPELINE_STAGES.length - 1 && (
                      <div
                        className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.04)", marginTop: "22px" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width:      pipelineStage > i ? "100%" : "0%",
                            background: "linear-gradient(90deg, #7C3AED, #2563EB)",
                            boxShadow:  pipelineStage > i ? "0 0 8px rgba(124,58,237,0.6)" : "none",
                          }}
                        />
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Generating dots ── */}
        {phase === "generating" && (
          <div
            className="flex flex-col items-center py-8 gap-4"
            style={{ animation: "fadeInUp 0.3s ease" }}
          >
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full dot-pulse-1" style={{ background: "#7C3AED" }} />
              <span className="w-2 h-2 rounded-full dot-pulse-2" style={{ background: "#2563EB" }} />
              <span className="w-2 h-2 rounded-full dot-pulse-3" style={{ background: "#22D3EE" }} />
            </div>
            <div className="text-xs tracking-widest uppercase" style={{ color: "#2D3260" }}>
              {pipelineStage < 3 ? "Разворачиваю контент" : "Получаю ответ от AI…"}
            </div>
          </div>
        )}

        {/* ── Cards ── */}
        {cards.length > 0 && (
          <div className="flex flex-col gap-4">
            {cards.map((card) =>
              visibleIds.has(card.id) ? (
                <div
                  key={card.id}
                  className={`rounded-2xl overflow-hidden card-appear ${GLOW_CLASS[card.glow]}`}
                  style={{ background: "#0C0C18" }}
                >
                  {/* Header */}
                  <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{card.icon}</span>
                      <div>
                        <span
                          className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-lg"
                          style={{ background: card.badgeBg, color: card.badgeText }}
                        >
                          {card.format}
                        </span>
                        <div className="text-xs mt-1" style={{ color: "#2D3260" }}>
                          {card.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs mb-2" style={{ color: "#2D3260" }}>Leverage Score</div>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-20 h-1 rounded-full overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.05)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width:      `${card.leverageScore}%`,
                              background: `linear-gradient(90deg, ${card.barFrom}, ${card.barTo})`,
                              boxShadow:  `0 0 6px ${card.barFrom}`,
                              transition: "width 1s cubic-bezier(0.22,1,0.36,1) 0.2s",
                            }}
                          />
                        </div>
                        <span
                          className="text-sm font-black tabular-nums"
                          style={{ color: card.badgeText }}
                        >
                          {card.leverageScore}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-5">
                    <pre
                      className="whitespace-pre-wrap leading-relaxed"
                      style={{
                        color:      "#B0B0D0",
                        fontFamily: "var(--font-geist-mono), monospace",
                        fontSize:   "0.78rem",
                      }}
                    >
                      {card.content}
                    </pre>
                  </div>

                  {/* Footer */}
                  <div className="px-6 pb-5">
                    <button
                      onClick={() => copy(card.id, card.content)}
                      className="text-xs px-4 py-2 rounded-lg font-medium transition-all duration-200"
                      style={{
                        background: copiedId === card.id ? card.badgeBg : "rgba(255,255,255,0.03)",
                        border:     `1px solid ${copiedId === card.id ? card.barTo + "50" : "rgba(255,255,255,0.06)"}`,
                        color:      copiedId === card.id ? card.badgeText : "#3D4470",
                      }}
                      onMouseEnter={(e) => {
                        if (copiedId !== card.id) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.14)";
                          (e.currentTarget as HTMLButtonElement).style.color       = "#8890C0";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (copiedId !== card.id) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)";
                          (e.currentTarget as HTMLButtonElement).style.color       = "#3D4470";
                        }
                      }}
                    >
                      {copiedId === card.id ? "✓ Скопировано" : "Скопировать"}
                    </button>
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}

        <footer className="mt-20 pb-8 text-center text-xs" style={{ color: "#1C1E38" }}>
          Content Machine — AI era. One idea, infinite formats.
        </footer>
      </div>
    </main>
  );
}
