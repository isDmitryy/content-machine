import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `Ты — эксперт по контент-маркетингу. По идее пользователя создай контент-систему для русскоязычной аудитории.

Ответь СТРОГО в следующем формате — используй разделители точно как указано, без отступлений:

===YOUTUBE===
(структура YouTube-видео ~15-18 мин: заголовок, хронометраж, таймкоды с описанием каждого блока, ключевой месседж)

===TELEGRAM===
(пост для Telegram: сильный крючок с эмодзи, 3-4 смысловых блока со стрелками →, CTA в конце)

===REEL1===
(хук «Парадокс» — 3-4 строки: неожиданное противоречие + обещание раскрыть)

===REEL2===
(хук «Тайна» — 3-4 строки: то, о чём молчат + обещание правды)

===REEL3===
(хук «Провокация» — 3-4 строки: вызов убеждениям + призыв досмотреть)

===REEL4===
(хук «Инсайдер» — 3-4 строки: закрытое знание + почему важно)

===REEL5===
(хук «Переосмысление» — 3-4 строки: банальная тема + поворот меняющий всё)

Пиши конкретный контент по теме. Никаких плейсхолдеров. Весь текст на русском языке.`;

const KEYS = ["YOUTUBE", "TELEGRAM", "REEL1", "REEL2", "REEL3", "REEL4", "REEL5"] as const;
type Key = typeof KEYS[number];

// Matches any reasonable delimiter the model might use:
// ===YOUTUBE===  |  ## YOUTUBE ===  |  ## YOUTUBE  |  YOUTUBE:  |  **YOUTUBE**
function keyPattern(key: string) {
  return new RegExp(`(?:^|\\n)[#=* ]*${key}[#=* :*]*(?:\\n|$)`, "i");
}

function findKeyPos(text: string, key: string): number {
  const m = keyPattern(key).exec(text);
  return m ? m.index + m[0].indexOf(key) : -1;
}

function parseDelimited(text: string): Record<Key, string> {
  const positions: Array<{ key: Key; pos: number; end: number }> = [];

  for (const key of KEYS) {
    const pos = findKeyPos(text, key);
    if (pos !== -1) positions.push({ key, pos, end: pos });
  }

  positions.sort((a, b) => a.pos - b.pos);

  const result = {} as Record<Key, string>;

  for (let i = 0; i < positions.length; i++) {
    const { key, pos } = positions[i];
    const afterKey  = text.indexOf("\n", pos) + 1;
    const nextStart = positions[i + 1]?.pos ?? text.length;
    result[key] = text.slice(afterKey, nextStart).trim();
  }

  // Fill missing keys with empty string
  for (const key of KEYS) {
    if (!(key in result)) result[key] = "";
  }

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { idea } = await req.json();
    if (!idea?.trim()) {
      return NextResponse.json({ error: "Idea is required" }, { status: 400 });
    }

    const client = new OpenAI({
      baseURL: process.env.API_BASE_URL ?? "https://openrouter.ai/api/v1",
      apiKey:  process.env.API_KEY,
    });

    const model = process.env.MODEL ?? "deepseek/deepseek-chat-v3-0324";

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: idea.trim() },
      ],
    });

    const raw = completion.choices[0].message.content ?? "";
    console.log("[/api/generate] raw response:\n", raw.slice(0, 500));

    const data = parseDelimited(raw);

    const missing = KEYS.filter((k) => !data[k]);
    if (missing.length === KEYS.length) {
      console.error("[/api/generate] parsing failed, raw:", raw.slice(0, 800));
      return NextResponse.json(
        { error: `Модель вернула неожиданный формат. Фрагмент ответа: ${raw.slice(0, 200)}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
