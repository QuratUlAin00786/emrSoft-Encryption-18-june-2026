export type DemoSeedUser = {
  role: string;
  roleLabel: string;
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  department?: string | null;
  workingDays?: string[];
  workingHours?: { start: string; end: string };
};

/** Login-screen demo accounts — single source of truth for seed + UI */
export const DEMO_SEED_USERS: DemoSeedUser[] = [
  {
    role: "doctor",
    roleLabel: "Doctor",
    email: "paul@emrsoft.ai",
    username: "paul",
    password: "doctor123",
    firstName: "Paul",
    lastName: "Smith",
    department: "Cardiology",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    workingHours: { start: "08:00", end: "17:00" },
  },
  {
    role: "nurse",
    roleLabel: "Nurse",
    email: "emma@emrsoft.ai",
    username: "emma",
    password: "nurse123",
    firstName: "Emma",
    lastName: "Johnson",
    department: "General Medicine",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    workingHours: { start: "07:00", end: "19:00" },
  },
  {
    role: "patient",
    roleLabel: "Patient",
    email: "john@emrsoft.ai",
    username: "john",
    password: "patient123",
    firstName: "John",
    lastName: "Patient",
    department: null,
  },
  {
    role: "lab_technician",
    roleLabel: "Lab-Technician",
    email: "amelia@emrsoft.ai",
    username: "amelia",
    password: "lab123",
    firstName: "Amelia",
    lastName: "Rodriguez",
    department: "Laboratory",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    workingHours: { start: "06:00", end: "14:00" },
  },
  {
    role: "sample_taker",
    roleLabel: "Sample-Taker",
    email: "sampletaker@emrsoft.ai",
    username: "sampletaker",
    password: "sample123",
    firstName: "James",
    lastName: "Wilson",
    department: "Laboratory",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    workingHours: { start: "06:00", end: "14:00" },
  },
  {
    role: "pharmacist",
    roleLabel: "Pharmacist",
    email: "Pharmacist@emrsoft.ai",
    username: "pharmacist",
    password: "pharmacist123",
    firstName: "Sarah",
    lastName: "Thompson",
    department: "Pharmacy",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    workingHours: { start: "08:00", end: "18:00" },
  },
  {
    role: "admin",
    roleLabel: "Admin",
    email: "james@emrsoft.ai",
    username: "james",
    password: "467fe887",
    firstName: "James",
    lastName: "Administrator",
    department: "Administration",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    workingHours: { start: "09:00", end: "17:00" },
  },
];

export const DEMO_CREDENTIALS = DEMO_SEED_USERS.map((user) => ({
  role: user.roleLabel,
  email: user.email,
  password: user.password,
}));

/** SaaS administration portal — organization_id 0, is_saas_owner true */
export const SAAS_SEED_USER = {
  username: "saas_admin",
  email: "saas_admin@emrsoft.ai",
  password: "admin123",
  firstName: "SaaS",
  lastName: "Administrator",
  role: "admin" as const,
  organizationId: 0,
};

export const SAAS_CREDENTIALS = {
  role: "SaaS Admin",
  username: SAAS_SEED_USER.username,
  email: SAAS_SEED_USER.email,
  password: SAAS_SEED_USER.password,
};

/** Tenant org shown in SaaS admin → Customers (demo admin is org admin, not org 0) */
export const DEMO_TENANT_ORG = {
  name: "emrSoft Healthcare",
  subdomain: "cura",
  brandName: "emrSoft",
  /** Contact email on the org record; demo admin user is james@emrsoft.ai */
  email: "james@emrsoft.ai",
  region: "UK" as const,
};

export const DEMO_ORG_ADMIN = DEMO_SEED_USERS.find((u) => u.role === "admin")!;

export const EMR_LOGO_PUBLIC_PATH = "/EMR-Soft-Logo/emr-logo.png";
