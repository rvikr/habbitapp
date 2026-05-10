import { Share } from "react-native";

const APP_URL = "https://lagan.health";

export async function shareBadge(name: string, description: string) {
  try {
    await Share.share({
      message: `I just earned the "${name}" badge on Lagan! 🏆\n${description}\n\nTrack your habits at ${APP_URL}`,
      title: `${name} Badge — Lagan`,
    });
  } catch {
    // user dismissed
  }
}

export async function shareRank(rank: number, xp: number, level: number, streak: number) {
  try {
    await Share.share({
      message: `I'm ranked #${rank} globally on Lagan! 🏅\n${xp.toLocaleString()} XP · Level ${level} · ${streak} day streak\n\nJoin me at ${APP_URL}/leaderboard`,
      title: `Rank #${rank} — Lagan Leaderboard`,
    });
  } catch {
    // user dismissed
  }
}
