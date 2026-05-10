"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function logAdminAction(
  adminEmail: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: Record<string, unknown>
) {
  try {
    const admin = createAdminClient();
    await admin.from("admin_audit_log").insert({
      admin_email: adminEmail,
      action,
      resource_type: resourceType ?? null,
      resource_id:   resourceId   ?? null,
      details:       details      ?? null,
    });
  } catch {
    // Silently fail — never let audit logging break the primary action
  }
}
