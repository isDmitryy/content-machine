export type Glow = "purple" | "blue" | "cyan";

export interface Card {
  id: string;
  format: string;
  subtitle: string;
  icon: string;
  content: string;
  leverageScore: number;
  glow: Glow;
  badgeBg: string;
  badgeText: string;
  barFrom: string;
  barTo: string;
}

export interface SavedIdea {
  id: string;
  idea: string;
  created_at: string;
}

export const PIPELINE_STAGES = [
  { label: "Идея",        icon: "💡", desc: "Исходный концепт" },
  { label: "Нарратив",    icon: "🧠", desc: "Смысловой каркас" },
  { label: "Форматы",     icon: "📐", desc: "Мульти-платформа" },
  { label: "Дистрибуция", icon: "🚀", desc: "Охват аудитории"  },
];

export const GLOW_CLASS: Record<Glow, string> = {
  purple: "glow-purple",
  blue:   "glow-blue",
  cyan:   "glow-cyan",
};

interface AIGenerateResponse {
  YOUTUBE:  string;
  TELEGRAM: string;
  REEL1:    string;
  REEL2:    string;
  REEL3:    string;
  REEL4:    string;
  REEL5:    string;
}

function buildCards(data: AIGenerateResponse): Card[] {
  return [
    {
      id:            "youtube",
      format:        "YouTube",
      subtitle:      "Структура видео",
      icon:          "▶",
      leverageScore: 94,
      glow:          "purple",
      badgeBg:       "rgba(124,58,237,0.2)",
      badgeText:     "#A78BFA",
      barFrom:       "#7C3AED",
      barTo:         "#A78BFA",
      content:       data.YOUTUBE,
    },
    {
      id:            "telegram",
      format:        "Telegram",
      subtitle:      "Пост в канал",
      icon:          "✈",
      leverageScore: 87,
      glow:          "blue",
      badgeBg:       "rgba(37,99,235,0.2)",
      badgeText:     "#60A5FA",
      barFrom:       "#2563EB",
      barTo:         "#60A5FA",
      content:       data.TELEGRAM,
    },
    {
      id:            "reel1",
      format:        "Reels / Shorts",
      subtitle:      "Хук #1 — Парадокс",
      icon:          "⚡",
      leverageScore: 91,
      glow:          "cyan",
      badgeBg:       "rgba(8,145,178,0.18)",
      badgeText:     "#22D3EE",
      barFrom:       "#0891B2",
      barTo:         "#22D3EE",
      content:       data.REEL1,
    },
    {
      id:            "reel2",
      format:        "Reels / Shorts",
      subtitle:      "Хук #2 — Тайна",
      icon:          "⚡",
      leverageScore: 88,
      glow:          "cyan",
      badgeBg:       "rgba(8,145,178,0.18)",
      badgeText:     "#22D3EE",
      barFrom:       "#0891B2",
      barTo:         "#22D3EE",
      content:       data.REEL2,
    },
    {
      id:            "reel3",
      format:        "Reels / Shorts",
      subtitle:      "Хук #3 — Провокация",
      icon:          "⚡",
      leverageScore: 93,
      glow:          "purple",
      badgeBg:       "rgba(124,58,237,0.2)",
      badgeText:     "#A78BFA",
      barFrom:       "#7C3AED",
      barTo:         "#A78BFA",
      content:       data.REEL3,
    },
    {
      id:            "reel4",
      format:        "Reels / Shorts",
      subtitle:      "Хук #4 — Инсайдер",
      icon:          "⚡",
      leverageScore: 85,
      glow:          "blue",
      badgeBg:       "rgba(37,99,235,0.2)",
      badgeText:     "#60A5FA",
      barFrom:       "#2563EB",
      barTo:         "#60A5FA",
      content:       data.REEL4,
    },
    {
      id:            "reel5",
      format:        "Reels / Shorts",
      subtitle:      "Хук #5 — Переосмысление",
      icon:          "⚡",
      leverageScore: 89,
      glow:          "purple",
      badgeBg:       "rgba(124,58,237,0.2)",
      badgeText:     "#A78BFA",
      barFrom:       "#7C3AED",
      barTo:         "#C4B5FD",
      content:       data.REEL5,
    },
  ];
}

export async function generateCardsFromAI(idea: string): Promise<Card[]> {
  const response = await fetch("/api/generate", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ idea }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "AI generation failed");
  }

  const data = await response.json() as AIGenerateResponse;
  return buildCards(data);
}

export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
