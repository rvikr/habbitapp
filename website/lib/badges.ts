import type { Badge } from "@/types/db";

const ALL_BADGES: Omit<Badge, "earned" | "earned_at">[] = [
  { id: "early-bird",    name: "Early Bird",      description: "Complete a habit before 8 AM for 7 days",  icon: "wb_sunny",            tone: "yellow"  },
  { id: "momentum",      name: "Momentum",         description: "Maintain a 30-day habit streak",           icon: "local_fire_department", tone: "orange" },
  { id: "bookworm",      name: "Bookworm",         description: "Read for 30 consecutive days",             icon: "menu_book",           tone: "purple"  },
  { id: "zen-master",    name: "Zen Master",       description: "Complete 100 meditation sessions",         icon: "self_improvement",    tone: "teal"    },
  { id: "hydration",     name: "Hydration Hero",   description: "Hit water goal 21 days in a row",          icon: "water_drop",          tone: "teal"    },
  { id: "marathon-mind", name: "Marathon Mind",    description: "Complete 50 exercise sessions",            icon: "directions_run",      tone: "indigo"  },
  { id: "polyglot",      name: "Polyglot",         description: "Practice a language for 14 days",          icon: "translate",           tone: "purple"  },
  { id: "perfect-week",  name: "Perfect Week",     description: "Complete all habits for 7 days straight",  icon: "star",                tone: "yellow"  },
  { id: "century",       name: "Century Runner",   description: "Log 100 total habit completions",          icon: "emoji_events",        tone: "orange"  },
  { id: "mind-palace",   name: "Mind Palace",      description: "Complete 365 total habit days",            icon: "psychology",          tone: "indigo"  },
  { id: "diamond",       name: "Lagan Legend",     description: "Complete 500 habits total",                icon: "diamond",             tone: "purple"  },
  { id: "week-1",        name: "First Week",       description: "Complete any habit for 7 days",            icon: "calendar_today",      tone: "teal"    },
];

export function computeBadges(stats: {
  totalCompletions: number;
  streak: number;
  totalHabits: number;
}): Badge[] {
  const { totalCompletions, streak } = stats;

  return ALL_BADGES.map((b) => {
    let earned = false;
    switch (b.id) {
      case "early-bird":    earned = streak >= 7;           break;
      case "momentum":      earned = streak >= 30;          break;
      case "bookworm":      earned = streak >= 30;          break;
      case "zen-master":    earned = totalCompletions >= 100; break;
      case "hydration":     earned = streak >= 21;          break;
      case "marathon-mind": earned = totalCompletions >= 50; break;
      case "polyglot":      earned = streak >= 14;          break;
      case "perfect-week":  earned = streak >= 7;           break;
      case "century":       earned = totalCompletions >= 100; break;
      case "mind-palace":   earned = totalCompletions >= 365; break;
      case "diamond":       earned = totalCompletions >= 500; break;
      case "week-1":        earned = totalCompletions >= 7;  break;
    }
    return { ...b, earned };
  });
}
