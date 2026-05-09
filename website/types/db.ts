export type ColorVariant = "primary" | "secondary" | "tertiary" | "neutral";

export type Habit = {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  icon: string;
  color: ColorVariant;
  target: number | null;
  unit: string | null;
  reminder_time: string | null;
  reminder_times: string[] | null;
  reminder_days: number[] | null;
  reminders_enabled: boolean | null;
  created_at: string;
  archived_at: string | null;
};

export type HabitCompletion = {
  id: string;
  habit_id: string;
  user_id: string | null;
  completed_on: string;
  value: number | null;
  note: string | null;
  created_at: string;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earned_at?: string;
  tone: "yellow" | "purple" | "teal" | "red" | "indigo" | "orange";
};
