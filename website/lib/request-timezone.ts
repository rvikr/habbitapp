import { cookies } from "next/headers";

const DEFAULT_TIME_ZONE = "UTC";

export async function getRequestTimeZone(): Promise<string> {
  const cookieStore = await cookies();
  const value = cookieStore.get("lagan_tz")?.value;
  if (!value) return DEFAULT_TIME_ZONE;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return value;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}
