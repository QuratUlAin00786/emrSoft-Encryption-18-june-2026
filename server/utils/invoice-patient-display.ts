import { isEncryptedScalarField } from "./encryption-sdk";

type InvoiceLike = {
  patientName?: string | null;
  patientId?: string | null;
};

type PatientLike = {
  patientId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export function buildPatientNameByPatientId(
  patients: PatientLike[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const patient of patients) {
    if (!patient.patientId) continue;
    const name = `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim();
    if (name) {
      map.set(patient.patientId, name);
    }
  }
  return map;
}

export function resolveInvoicePatientName(
  invoice: InvoiceLike,
  patientNameByPatientId: Map<string, string>,
): string {
  const stored = invoice.patientName?.trim() ?? "";
  if (stored && !isEncryptedScalarField(stored)) {
    return stored;
  }
  if (invoice.patientId) {
    const fromPatient = patientNameByPatientId.get(invoice.patientId);
    if (fromPatient) return fromPatient;
  }
  return invoice.patientId || "Unknown patient";
}

export function enrichInvoicesWithPatientNames<T extends InvoiceLike>(
  invoices: T[],
  patients: PatientLike[],
): T[] {
  const patientNameByPatientId = buildPatientNameByPatientId(patients);
  return invoices.map((invoice) => ({
    ...invoice,
    patientName: resolveInvoicePatientName(invoice, patientNameByPatientId),
  }));
}
