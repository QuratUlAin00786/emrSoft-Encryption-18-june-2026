import {
  DEMO_ORG_ADMIN,
  DEMO_TENANT_ORG,
  EMR_LOGO_PUBLIC_PATH,
} from "@shared/demo-credentials";
import { organizations } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { ensureDemoUsers } from "./ensure-demo-users.js";
import { ensureSaaSAdmin } from "./ensure-saas-admin.js";
import { ensureSaasSubscription } from "./seed-demo-essentials.js";
import { ensureSystemRolesForOrganization } from "./default-system-roles.js";
import { storage } from "./storage.js";

/**
 * Seeds SaaS platform + one demo tenant organization for the SaaS admin portal.
 *
 * - saas_admin → organization_id 0 (SaaS portal login at /saas)
 * - james@emrsoft.ai (demo admin) → tenant org (clinic login + admin contact in SaaS Customers)
 */
export async function ensureSaasOrganizationSeed() {
  const saasAdmin = await ensureSaaSAdmin();

  let [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.subdomain, DEMO_TENANT_ORG.subdomain))
    .limit(1);

  if (!org) {
    [org] = await db
      .insert(organizations)
      .values({
        name: DEMO_TENANT_ORG.name,
        subdomain: DEMO_TENANT_ORG.subdomain,
        email: DEMO_ORG_ADMIN.email,
        region: DEMO_TENANT_ORG.region,
        brandName: DEMO_TENANT_ORG.brandName,
        subscriptionStatus: "active",
        settings: {
          theme: { primaryColor: "#3b82f6", logoUrl: EMR_LOGO_PUBLIC_PATH },
          compliance: { gdprEnabled: true, dataResidency: DEMO_TENANT_ORG.region },
          features: { aiEnabled: true, billingEnabled: true },
        },
      })
      .returning();
    console.log(
      `[SAAS-SEED] Created tenant org "${org.name}" (id=${org.id}) for SaaS Customers list`,
    );
  } else {
    await db
      .update(organizations)
      .set({
        name: DEMO_TENANT_ORG.name,
        brandName: DEMO_TENANT_ORG.brandName,
        email: DEMO_ORG_ADMIN.email,
        subscriptionStatus: "active",
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, org.id));
    console.log(`[SAAS-SEED] Using tenant org "${org.name}" (id=${org.id})`);
  }

  await ensureSystemRolesForOrganization(org.id);
  const demoUsers = await ensureDemoUsers(org.id);
  await ensureSaasSubscription(org.id);

  const demoAdmin =
    (await storage.getUserByEmail(DEMO_ORG_ADMIN.email, org.id)) ??
    (await storage.getUserByUsername(DEMO_ORG_ADMIN.username, org.id));

  if (!demoAdmin || demoAdmin.role !== "admin") {
    console.warn(
      `[SAAS-SEED] Demo org admin missing in org ${org.id} — SaaS Customers may show no admin email`,
    );
  } else {
    console.log(
      `[SAAS-SEED] Demo org admin ${demoAdmin.email} linked to org ${org.id} (role=${demoAdmin.role})`,
    );
  }

  return {
    saasAdmin,
    organization: {
      id: org.id,
      name: org.name,
      subdomain: org.subdomain,
    },
    demoAdmin: demoAdmin
      ? {
          id: demoAdmin.id,
          email: demoAdmin.email,
          username: demoAdmin.username,
          organizationId: demoAdmin.organizationId,
          role: demoAdmin.role,
        }
      : null,
    demoUsers,
  };
}
