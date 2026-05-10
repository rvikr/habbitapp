function authErrorText(error: unknown): string {
  if (error instanceof Error) return `${error.name} ${error.message}`;
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") return "";

  const record = error as Record<string, unknown>;
  return [
    record.name,
    record.message,
    record.error,
    record.error_description,
    record.code,
    record.status,
  ]
    .filter((value) => typeof value === "string" || typeof value === "number")
    .join(" ");
}

export function isMissingRefreshTokenError(error: unknown): boolean {
  const text = authErrorText(error).toLowerCase();
  return (
    text.includes("invalid refresh token") ||
    text.includes("refresh token not found") ||
    text.includes("refresh_token_not_found")
  );
}
