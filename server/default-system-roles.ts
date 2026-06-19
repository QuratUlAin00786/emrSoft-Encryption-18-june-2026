import { db } from "./db";
import { organizations, roles } from "@shared/schema";
import type { InsertRole } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { DEFAULT_SYSTEM_ROLE_TEMPLATES } from "./default-system-role-templates";

export type SystemRoleTemplate = Omit<InsertRole, "organizationId">;

export { DEFAULT_SYSTEM_ROLE_TEMPLATES };

export const SYSTEM_ROLE_NAMES = DEFAULT_SYSTEM_ROLE_TEMPLATES.map((r) => r.name);

export type EnsureRolesResult = {
  created: number;
  existing: number;
  updated: number;
  expectedPerOrg: number;
  organizations: number;
};

/** Keep system role permission JSON aligned with templates (idempotent). */
export async function syncSystemRolePermissions(
  organizationId: number,
): Promise<number> {
  let updated = 0;
  for (const template of DEFAULT_SYSTEM_ROLE_TEMPLATES) {
    const [existing] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(
        and(
          eq(roles.organizationId, organizationId),
          eq(roles.name, template.name),
        ),
      )
      .limit(1);

    if (!existing) continue;

    await db
      .update(roles)
      .set({
        permissions: template.permissions,
        displayName: template.displayName,
        description: template.description,
        isSystem: true,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, existing.id));
    updated += 1;
  }
  return updated;
}

/** Insert any missing system roles for one organization (by role name). */
export async function ensureSystemRolesForOrganization(
  organizationId: number,
): Promise<{ created: number; existing: number; updated: number }> {
  const existing = await db
    .select({ name: roles.name })
    .from(roles)
    .where(eq(roles.organizationId, organizationId));

  const existingNames = new Set(existing.map((r) => r.name));
  const toInsert: InsertRole[] = DEFAULT_SYSTEM_ROLE_TEMPLATES.filter(
    (t) => !existingNames.has(t.name),
  ).map((t) => ({ ...t, organizationId }));

  if (toInsert.length > 0) {
    await db.insert(roles).values(toInsert);
  }

  const updated = await syncSystemRolePermissions(organizationId);

  return {
    created: toInsert.length,
    existing: existingNames.size,
    updated,
  };
}

/** Ensure all default system roles exist for every organization in the database. */
export async function ensureSystemRolesForAllOrganizations(): Promise<EnsureRolesResult> {
  const orgs = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations);

  let created = 0;
  let existing = 0;
  let updated = 0;

  for (const org of orgs) {
    const result = await ensureSystemRolesForOrganization(org.id);
    created += result.created;
    existing += result.existing;
    updated += result.updated;
    if (result.created > 0) {
      console.log(
        `[ROLES] Organization ${org.id} (${org.name}): added ${result.created} missing system role(s)`,
      );
    }
  }

  return {
    created,
    existing,
    updated,
    expectedPerOrg: DEFAULT_SYSTEM_ROLE_TEMPLATES.length,
    organizations: orgs.length,
  };
}
