import { ImageResponse } from "next/og";
import { getBadgeShareMessage, getRankShareMessage } from "@/lib/share-messages";
import fs from "fs";
import path from "path";

type Tone = "yellow" | "orange" | "purple" | "teal" | "indigo" | "red";

const TONE_GRADIENT: Record<Tone, [string, string]> = {
  yellow: ["#f59e0b", "#fcd34d"],
  orange: ["#ea580c", "#fb923c"],
  purple: ["#7c3aed", "#a78bfa"],
  teal:   ["#0d9488", "#2dd4bf"],
  indigo: ["#4338ca", "#818cf8"],
  red:    ["#dc2626", "#f87171"],
};

function rankAccent(pct: number): [string, string] {
  if (pct <= 1)  return TONE_GRADIENT.purple;
  if (pct <= 5)  return ["#d97706", "#fcd34d"];
  if (pct <= 10) return TONE_GRADIENT.teal;
  return TONE_GRADIENT.indigo;
}

const fontsDir = path.join(process.cwd(), "public", "fonts");
const fontBold    = fs.readFileSync(path.join(fontsDir, "PlusJakartaSans-Bold.ttf"));
const fontRegular = fs.readFileSync(path.join(fontsDir, "PlusJakartaSans-Regular.ttf"));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const type    = searchParams.get("type") ?? "badge";
  const ratio   = searchParams.get("ratio") === "portrait" ? "portrait" : "wide";
  const width   = ratio === "portrait" ? 1080 : 1200;
  const height  = ratio === "portrait" ? 1350 : 630;

  const taglineSz  = ratio === "portrait" ? 80  : 64;
  const subtitleSz = ratio === "portrait" ? 32  : 28;
  const attrSz     = ratio === "portrait" ? 20  : 18;
  const padX       = ratio === "portrait" ? 100 : 100;
  const padY       = ratio === "portrait" ? 120 : 80;

  let tagline: string;
  let subtitle: string;
  let accent: [string, string];

  if (type === "rank") {
    const rank   = parseInt(searchParams.get("rank")   ?? "1",  10);
    const streak = parseInt(searchParams.get("streak") ?? "0",  10);
    const pct    = parseInt(searchParams.get("pct")    ?? "50", 10);
    const msg = getRankShareMessage({ rank, streak, topPct: pct });
    tagline  = msg.tagline;
    subtitle = msg.subtitle;
    accent   = rankAccent(pct);
  } else {
    const id      = searchParams.get("id")   ?? "";
    const name    = searchParams.get("name") ?? "Badge";
    const tone    = (searchParams.get("tone") ?? "indigo") as Tone;
    const msg = getBadgeShareMessage(id, name);
    tagline  = msg.tagline;
    subtitle = msg.subtitle;
    accent   = TONE_GRADIENT[tone] ?? TONE_GRADIENT.indigo;
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "#0D0D0D",
          position: "relative",
          flexDirection: "column",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(to right, ${accent[0]}, ${accent[1]})`,
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            padding: `${padY}px ${padX}px`,
            gap: 20,
          }}
        >
          <div
            style={{
              fontSize: taglineSz,
              fontWeight: 700,
              color: "#FFFFFF",
              lineHeight: 1.1,
              letterSpacing: -2,
              fontFamily: "Plus Jakarta Sans",
              maxWidth: ratio === "portrait" ? 800 : 900,
            }}
          >
            {tagline}
          </div>
          <div
            style={{
              fontSize: subtitleSz,
              fontWeight: 400,
              color: "rgba(255,255,255,0.45)",
              fontFamily: "Plus Jakarta Sans",
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Attribution */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 60,
            fontSize: attrSz,
            color: "rgba(255,255,255,0.25)",
            fontWeight: 400,
            fontFamily: "Plus Jakarta Sans",
          }}
        >
          lagan.health
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts: [
        { name: "Plus Jakarta Sans", data: fontBold,    weight: 700, style: "normal" },
        { name: "Plus Jakarta Sans", data: fontRegular, weight: 400, style: "normal" },
      ],
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    },
  );
}
