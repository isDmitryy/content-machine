"use client";

import { useState, useCallback, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import {
  Card,
  SavedIdea,
  PIPELINE_STAGES,
  GLOW_CLASS,
  generateCardsFromAI,
  delay,
} from "@/lib/content";

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();

  // Content state
  const [idea,          setIdea         ] = useState("");
  const [phase,         setPhase        ] = useState<"idle" | "generating" | "done">("idle");
  const [pipelineStage, setPipelineStage] = useState(-1);
  const [cards,         setCards        ] = useState<Card[]>([]);
  const [visibleIds,    setVisibleIds   ] = useState<Set<string>>(new Set());
  const [copiedId,      setCopiedId     ] = useState<string | null>(null);
  const [genError,      setGenError     ] = useState<string | null>(null);

  // Auth state
  const [session,     setSession    ] = useState<Session | null>(null);
  const [showLogin,   setShowLogin  ] = useState(false);
  const [authEmail,   setAuthEmail  ] = useState("");
  const [authSent,    setAuthSent   ] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Ideas state
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [showIdeas,  setShowIdeas ] = useState(false);
  const [savingIdea, setSavingIdea] = useState(false);
  const [savedNow,   setSavedNow  ] = useState(false);

  // ─── Auth effect ─────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // ─── Content handlers ─────────────────────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!idea.trim() || phase !== "idle") return;

    setPhase("generating");
    setPipelineStage(-1);
    setCards([]);
    setVisibleIds(new Set());
    setGenError(null);

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
        generateCardsFromAI(idea.trim()),
      ]);
      aiCards = cards;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ошибка генерации";
      setGenError(msg);
      setPhase("idle");
      setPipelineStage(-1);
      return;
    }

    setCards(aiCards);
    setPhase("done");

    for (const card of aiCards) {
      await delay(210);
      setVisibleIds((prev) => new Set([...prev, card.id]));
    }
  }, [idea, phase]);

  const copy = useCallback(async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* ignore */ }
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setPipelineStage(-1);
    setCards([]);
    setVisibleIds(new Set());
    setIdea("");
    setSavedNow(false);
  }, []);

  // ─── Auth handlers ────────────────────────────────────────────────────────────
  const handleSignIn = useCallback(async () => {
    if (!authEmail.trim()) return;
    setAuthLoading(true);
    await supabase.auth.signInWithOtp({
      email: authEmail.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setAuthLoading(false);
    setAuthSent(true);
  }, [authEmail]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSavedIdeas([]);
    setShowIdeas(false);
  }, []);

  const openLogin = useCallback(() => {
    setAuthSent(false);
    setAuthEmail("");
    setShowLogin(true);
  }, []);

  // ─── Ideas handlers ───────────────────────────────────────────────────────────
  const saveIdea = useCallback(async () => {
    if (!session || !idea.trim() || savingIdea) return;
    setSavingIdea(true);
    await supabase.from("saved_ideas").insert({ user_id: session.user.id, idea: idea.trim() });
    setSavingIdea(false);
    setSavedNow(true);
    setTimeout(() => setSavedNow(false), 2500);
  }, [session, idea, savingIdea]);

  const loadIdeas = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from("saved_ideas")
      .select("id, idea, created_at")
      .order("created_at", { ascending: false });
    if (data) setSavedIdeas(data);
  }, [session]);

  const handleShowIdeas = useCallback(() => {
    setShowIdeas(true);
    loadIdeas();
  }, [loadIdeas]);

  const deleteIdea = useCallback(async (id: string) => {
    await supabase.from("saved_ideas").delete().eq("id", id);
    setSavedIdeas((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen">

      {/* ── Fixed auth controls ── */}
      <div
        style={{
          position: "fixed",
          top: "16px",
          right: "20px",
          zIndex: 100,
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}
      >
        {session ? (
          <>
            <button
              onClick={handleShowIdeas}
              className="text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200"
              style={{
                background: "rgba(124,58,237,0.12)",
                border: "1px solid rgba(124,58,237,0.28)",
                color: "#A78BFA",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.22)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,58,237,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.12)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,58,237,0.28)";
              }}
            >
              Мои идеи
            </button>
            <button
              onClick={handleSignOut}
              className="text-xs px-4 py-2 rounded-xl transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#4B5280",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#8890C0";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.14)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#4B5280";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
              }}
            >
              Выйти
            </button>
          </>
        ) : (
          <button
            onClick={openLogin}
            className="text-xs font-bold px-4 py-2 rounded-xl tracking-wider transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(37,99,235,0.15))",
              border: "1px solid rgba(124,58,237,0.3)",
              color: "#A78BFA",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(124,58,237,0.28), rgba(37,99,235,0.28))";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,58,237,0.55)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(37,99,235,0.15))";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,58,237,0.3)";
            }}
          >
            Войти в приложение
          </button>
        )}
      </div>

      {/* ── Login modal ── */}
      {showLogin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(7,7,15,0.85)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowLogin(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0C0C18",
              border: "1px solid rgba(124,58,237,0.25)",
              borderRadius: "20px",
              padding: "40px",
              width: "100%",
              maxWidth: "400px",
              margin: "0 16px",
              boxShadow: "0 0 60px rgba(124,58,237,0.12), 0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            {!authSent ? (
              <>
                <div
                  className="text-xs font-semibold tracking-widest uppercase mb-2"
                  style={{ color: "#A78BFA" }}
                >
                  Вход
                </div>
                <h2
                  className="text-2xl font-black tracking-tight mb-2"
                  style={{ color: "#E0E0FF", letterSpacing: "-0.02em" }}
                >
                  Войти в приложение
                </h2>
                <p className="text-sm mb-8" style={{ color: "#3D4470", lineHeight: "1.6" }}>
                  Введи email — пришлём magic link для входа. Пароль не нужен.
                </p>

                <label
                  className="block text-xs font-semibold tracking-widest uppercase mb-2"
                  style={{ color: "#3D4470" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                  placeholder="you@example.com"
                  autoFocus
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-4 transition-all duration-200"
                  style={{
                    background: "#0A0A16",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#C8C8E8",
                    caretColor: "#8B5CF6",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(124,58,237,0.45)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />

                <button
                  onClick={handleSignIn}
                  disabled={!authEmail.trim() || authLoading}
                  className="w-full py-3 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 disabled:opacity-35 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
                    color: "#fff",
                    letterSpacing: "0.04em",
                    boxShadow: authEmail.trim() && !authLoading
                      ? "0 0 24px rgba(124,58,237,0.35)"
                      : "none",
                  }}
                >
                  {authLoading ? "Отправляем…" : "Отправить ссылку для входа"}
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-5">✉️</div>
                <h2
                  className="text-xl font-black mb-3 tracking-tight"
                  style={{ color: "#E0E0FF" }}
                >
                  Проверь почту
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "#3D4470" }}>
                  Мы отправили magic link на{" "}
                  <span style={{ color: "#A78BFA" }}>{authEmail}</span>.
                  <br />
                  Нажми на ссылку в письме, чтобы войти.
                </p>
                <button
                  onClick={() => setShowLogin(false)}
                  className="mt-6 text-xs px-5 py-2 rounded-lg transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "#4B5280",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "#8890C0";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "#4B5280";
                  }}
                >
                  Закрыть
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Ideas sidebar ── */}
      {showIdeas && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
          <div
            style={{ flex: 1, background: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowIdeas(false)}
          />
          <div
            style={{
              width: "420px",
              maxWidth: "100vw",
              background: "#09091A",
              borderLeft: "1px solid rgba(255,255,255,0.06)",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              animation: "slideInRight 0.25s ease both",
            }}
          >
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
                background: "#09091A",
                zIndex: 1,
              }}
            >
              <div>
                <div
                  className="text-xs font-semibold tracking-widest uppercase mb-1"
                  style={{ color: "#A78BFA" }}
                >
                  Архив
                </div>
                <h3
                  className="text-lg font-black tracking-tight"
                  style={{ color: "#E0E0FF", letterSpacing: "-0.02em" }}
                >
                  Мои идеи
                </h3>
              </div>
              <button
                onClick={() => setShowIdeas(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all duration-200"
                style={{
                  color: "#3D4470",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#C8C8E8"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#3D4470"; }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "16px", flex: 1 }}>
              {savedIdeas.length === 0 ? (
                <div className="text-center py-16" style={{ color: "#2D3260" }}>
                  <div className="text-3xl mb-3">💡</div>
                  <div className="text-sm mb-1">Нет сохранённых идей</div>
                  <div className="text-xs" style={{ color: "#1C1E38" }}>
                    Сгенерируй контент и нажми «Сохранить»
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {savedIdeas.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl p-4 cursor-pointer"
                      style={{
                        background:  "#0C0C1A",
                        border:      "1px solid rgba(255,255,255,0.05)",
                        transition:  "border-color 0.2s, box-shadow 0.2s",
                      }}
                      onClick={() => {
                        setShowIdeas(false);
                        router.push(`/ideas/${item.id}`);
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,58,237,0.35)";
                        (e.currentTarget as HTMLDivElement).style.boxShadow   = "0 0 20px rgba(124,58,237,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.05)";
                        (e.currentTarget as HTMLDivElement).style.boxShadow   = "none";
                      }}
                    >
                      <p
                        className="text-sm leading-relaxed mb-3"
                        style={{ color: "#B0B0D0" }}
                      >
                        {item.idea}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="text-xs" style={{ color: "#252850" }}>
                            {new Date(item.created_at).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span style={{ color: "#1C1E38", fontSize: "10px" }}>·</span>
                          <span className="text-xs" style={{ color: "#A78BFA" }}>
                            Открыть →
                          </span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteIdea(item.id); }}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all duration-200"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border:     "1px solid rgba(255,255,255,0.06)",
                            color:      "#3D4470",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.color = "#F87171";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(248,113,113,0.3)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.color = "#3D4470";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)";
                          }}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top accent line */}
      <div style={{
        height:     "2px",
        background: "linear-gradient(90deg, transparent 0%, #7C3AED 25%, #2563EB 55%, #22D3EE 80%, transparent 100%)",
      }} />

      <div className="mx-auto px-5 py-14" style={{ maxWidth: "860px" }}>

        {/* ── Header ── */}
        <header className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
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

          <h1
            className="text-5xl font-black tracking-tighter mb-4 leading-none"
            style={{
              background:           "linear-gradient(135deg, #F0F0FF 0%, #C4B5FD 45%, #60A5FA 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor:  "transparent",
              letterSpacing:        "-0.03em",
            }}
          >
            CONTENT MACHINE
          </h1>

          <p className="text-sm tracking-wide" style={{ color: "#3D4470" }}>
            Одна идея&nbsp;→&nbsp;полноценная медиасистема
          </p>
        </header>

        {/* ── Input ── */}
        <section className="mb-8">
          <label
            className="block text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "#3D4470" }}
          >
            Введи идею
          </label>

          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            disabled={phase !== "idle"}
            placeholder="Например: почему большинство людей неправильно выстраивают личный бренд и теряют на этом деньги…"
            rows={4}
            className="w-full resize-none rounded-2xl p-5 text-sm leading-relaxed outline-none transition-all duration-300"
            style={{
              background: "#0C0C18",
              border:     "1px solid rgba(255,255,255,0.06)",
              color:      "#C8C8E8",
              fontFamily: "var(--font-geist-mono), monospace",
              caretColor: "#8B5CF6",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(124,58,237,0.45)";
              e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(124,58,237,0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              e.currentTarget.style.boxShadow   = "none";
            }}
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={generate}
              disabled={!idea.trim() || phase !== "idle"}
              className="flex-1 py-4 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 disabled:opacity-35 disabled:cursor-not-allowed"
              style={{
                background:    "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
                color:         "#fff",
                boxShadow:     idea.trim() && phase === "idle" ? "0 0 32px rgba(124,58,237,0.38), 0 2px 8px rgba(0,0,0,0.4)" : "none",
                letterSpacing: "0.04em",
              }}
              onMouseEnter={(e) => { if (idea.trim() && phase === "idle") (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
            >
              {phase === "generating" ? "Генерирую систему…" : "⚡  Развернуть в контент-систему"}
            </button>

            {phase === "done" && session && (
              <button
                onClick={saveIdea}
                disabled={savingIdea || savedNow}
                className="px-5 py-4 rounded-xl text-sm font-medium transition-all duration-300 disabled:cursor-not-allowed"
                style={{
                  background: savedNow
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(124,58,237,0.08)",
                  border: savedNow
                    ? "1px solid rgba(34,197,94,0.3)"
                    : "1px solid rgba(124,58,237,0.2)",
                  color: savedNow ? "#4ADE80" : "#A78BFA",
                }}
                onMouseEnter={(e) => {
                  if (!savedNow) (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.18)";
                }}
                onMouseLeave={(e) => {
                  if (!savedNow) (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.08)";
                }}
              >
                {savedNow ? "✓ Сохранено" : savingIdea ? "Сохраняю…" : "💾 Сохранить"}
              </button>
            )}

            {phase === "done" && (
              <button
                onClick={reset}
                className="px-6 py-4 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border:     "1px solid rgba(255,255,255,0.07)",
                  color:      "#4B5280",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.14)";
                  (e.currentTarget as HTMLButtonElement).style.color       = "#8890C0";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLButtonElement).style.color       = "#4B5280";
                }}
              >
                Сбросить
              </button>
            )}
          </div>

          {phase === "done" && !session && (
            <p className="text-xs mt-3" style={{ color: "#2D3260" }}>
              <button
                onClick={openLogin}
                className="underline transition-colors duration-200"
                style={{ color: "#3D4470" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#A78BFA"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#3D4470"; }}
              >
                Войди в приложение
              </button>
              , чтобы сохранять идеи
            </p>
          )}
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
            <div className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: "#2D3260" }}>
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
          <div className="flex flex-col items-center py-8 gap-4" style={{ animation: "fadeInUp 0.3s ease" }}>
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full dot-pulse-1" style={{ background: "#7C3AED" }} />
              <span className="w-2 h-2 rounded-full dot-pulse-2" style={{ background: "#2563EB" }} />
              <span className="w-2 h-2 rounded-full dot-pulse-3" style={{ background: "#22D3EE" }} />
            </div>
            <div className="text-xs tracking-widest uppercase" style={{ color: "#2D3260" }}>
              {pipelineStage < 3 ? "Обрабатываю идею" : "Получаю ответ от AI…"}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {genError && (
          <div
            className="rounded-xl px-5 py-4 text-sm mb-4"
            style={{
              background: "rgba(248,113,113,0.06)",
              border:     "1px solid rgba(248,113,113,0.2)",
              color:      "#F87171",
            }}
          >
            {genError}
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
                        <span className="text-sm font-black tabular-nums" style={{ color: card.badgeText }}>
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

        {/* ── Footer ── */}
        <footer className="mt-20 pb-8 text-center text-xs" style={{ color: "#1C1E38" }}>
          Content Machine — AI era. One idea, infinite formats.
        </footer>
      </div>
    </main>
  );
}
