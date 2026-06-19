export const MODULE_KEYS = [
  "dashboard",
  "patients",
  "appointments",
  "prescriptions",
  "labResults",
  "medicalImaging",
  "forms",
  "messaging",
  "analytics",
  "aiInsights",
  "clinicalDecision",
  "symptomChecker",
  "telemedicine",
  "voiceDocumentation",
  "financialIntelligence",
  "billing",
  "quickbooks",
  "inventory",
  "userManagement",
  "shiftManagement",
  "subscription",
  "settings",
  "userManual",
  "medicalRecords",
] as const;

export const FIELD_KEYS = [
  "patientSensitiveInfo",
  "financialData",
  "medicalHistory",
  "prescriptionDetails",
  "labResults",
  "imagingResults",
  "billingInformation",
  "insuranceDetails",
] as const;

export type ModulePermission = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};

export type FieldPermission = {
  view: boolean;
  edit: boolean;
};

export function buildAllModulePermissions(granted = true): Record<string, ModulePermission> {
  const value: ModulePermission = granted
    ? { view: true, create: true, edit: true, delete: true }
    : { view: false, create: false, edit: false, delete: false };
  return Object.fromEntries(MODULE_KEYS.map((key) => [key, { ...value }]));
}

export function buildAllFieldPermissions(canEdit = true): Record<string, FieldPermission> {
  return Object.fromEntries(
    FIELD_KEYS.map((key) => [key, { view: true, edit: canEdit }]),
  );
}
