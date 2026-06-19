import { SAAS_SEED_USER } from "@shared/demo-credentials";
import { authService } from "./services/auth.js";
import { storage } from "./storage.js";
import type { User } from "@shared/schema";

/**
 * Idempotent upsert of the SaaS owner account (users.organization_id = 0, is_saas_owner = true).
 */
export async function ensureSaaSAdmin() {
  const passwordHash = await authService.hashPassword(SAAS_SEED_USER.password);

  let existing: User | undefined =
    (await storage.getUserByUsername(SAAS_SEED_USER.username, SAAS_SEED_USER.organizationId)) ??
    (await storage.getUserByUsernameGlobal(SAAS_SEED_USER.username));

  if (!existing) {
    existing =
      (await storage.getUserByEmail(SAAS_SEED_USER.email, SAAS_SEED_USER.organizationId)) ??
      (await storage.getUserByEmailGlobal(SAAS_SEED_USER.email));
  }

  const userFields = {
    email: SAAS_SEED_USER.email,
    username: SAAS_SEED_USER.username,
    passwordHash,
    firstName: SAAS_SEED_USER.firstName,
    lastName: SAAS_SEED_USER.lastName,
    role: SAAS_SEED_USER.role,
    department: null,
    workingDays: [] as string[],
    workingHours: {} as Record<string, string>,
    permissions: {} as Record<string, unknown>,
    isActive: true,
    isSaaSOwner: true,
  };

  if (!existing) {
    const created = await storage.createUser({
      ...userFields,
      organizationId: SAAS_SEED_USER.organizationId,
    });
    return {
      action: "created" as const,
      userId: created.id,
      username: SAAS_SEED_USER.username,
      email: SAAS_SEED_USER.email,
    };
  }

  const orgId = existing.organizationId;
  await storage.updateUser(existing.id, orgId, userFields);

  return {
    action: "updated" as const,
    userId: existing.id,
    username: SAAS_SEED_USER.username,
    email: SAAS_SEED_USER.email,
  };
}
