import { DEMO_SEED_USERS } from "@shared/demo-credentials";
import { authService } from "./services/auth.js";
import { storage } from "./storage.js";
import type { User } from "@shared/schema";

export async function ensureDemoUsers(organizationId: number) {
  const created: string[] = [];
  const updated: string[] = [];

  for (const demo of DEMO_SEED_USERS) {
    const passwordHash = await authService.hashPassword(demo.password);

    let existing: User | undefined =
      (await storage.getUserByEmail(demo.email, organizationId)) ??
      (await storage.getUserByEmailGlobal(demo.email));

    if (!existing) {
      existing = await storage.getUserByUsername(demo.username, organizationId);
    }

    const userFields = {
      email: demo.email,
      username: demo.username,
      passwordHash,
      firstName: demo.firstName,
      lastName: demo.lastName,
      role: demo.role,
      department: demo.department ?? null,
      workingDays: demo.workingDays ?? [],
      workingHours: demo.workingHours ?? {},
      isActive: true,
    };

    if (!existing) {
      await storage.createUser({
        ...userFields,
        organizationId,
      });
      created.push(`${demo.roleLabel}: ${demo.email}`);
      continue;
    }

    const priorOrgId = existing.organizationId;
    await storage.updateUser(existing.id, priorOrgId, {
      ...userFields,
      organizationId,
      isSaaSOwner: false,
    });
    updated.push(`${demo.roleLabel}: ${demo.email}`);
  }

  return { created, updated, total: DEMO_SEED_USERS.length };
}
