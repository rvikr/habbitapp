// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_COACH_MODEL = Deno.env.get("OPENAI_COACH_MODEL") ?? "gpt-5.4-mini";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CoachRequest = {
  signal?: {
    kind?: string;
    habitName?: string;
    tone?: string;
    suggestedValue?: number | null;
    unit?: string | null;
    progressPct?: number | null;
    fallbackMessage?: string;
  };
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function cleanMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed || trimmed.length > 180) return null;
  return trimmed;
}

function outputText(body: any): string | null {
  const direct = cleanMessage(body?.output_text);
  if (direct) return direct;
  for (const item of body?.output ?? []) {
    for (const content of item?.content ?? []) {
      const text = cleanMessage(content?.text);
      if (content?.type === "output_text" && text) return text;
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing authorization header" }, 401);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "Unauthorized" }, 401);
  if (!OPENAI_API_KEY) return json({ error: "OPENAI_API_KEY is not configured" }, 503);

  let body: CoachRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const signal = body.signal;
  const habitName = cleanMessage(signal?.habitName);
  const fallbackMessage = cleanMessage(signal?.fallbackMessage);
  if (!signal || !habitName || !fallbackMessage) return json({ error: "Invalid coach signal" }, 400);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_COACH_MODEL,
      max_output_tokens: 80,
      input: [
        {
          role: "system",
          content:
            "You write short habit-coach notifications. Be supportive, concrete, and non-medical. " +
            "Respect the requested tone. Return one sentence under 160 characters. Do not mention AI.",
        },
        {
          role: "user",
          content: JSON.stringify({
            kind: signal.kind,
            habitName,
            tone: signal.tone,
            suggestedValue: signal.suggestedValue,
            unit: signal.unit,
            progressPct: signal.progressPct,
            fallbackMessage,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI coach-message failed", { status: response.status, error });
    return json({ message: fallbackMessage, generated: false }, 200);
  }

  const result = await response.json();
  return json({ message: outputText(result) ?? fallbackMessage, generated: true });
});
