/** True when a value is still an encryption envelope rather than plaintext. */
export function isEncryptedPatientScalar(value: unknown): boolean {
  if (value == null || typeof value !== "string") return false;
  const trimmed = value.trim();
  return (
    trimmed.startsWith("{") && /encryptedDEK|algorithm|kid/i.test(trimmed)
  );
}

/** Plaintext for UI when API decrypt succeeded; hides raw encryption envelopes if not. */
export function displayPatientScalar(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  if (typeof value !== "string") return String(value);
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (isEncryptedPatientScalar(trimmed)) {
    return fallback;
  }
  return trimmed;
}

/** Patient record needs a per-id fetch to resolve a decrypted display name. */
export function needsPatientNameFetch(
  patient: { firstName?: unknown; lastName?: unknown } | undefined,
): boolean {
  if (!patient) return true;
  return (
    isEncryptedPatientScalar(patient.firstName) ||
    isEncryptedPatientScalar(patient.lastName)
  );
}

export function displayPatientName(patient: {
  firstName?: unknown;
  lastName?: unknown;
}): string {
  const first = displayPatientScalar(patient.firstName, "");
  const last = displayPatientScalar(patient.lastName, "");
  const full = `${first} ${last}`.trim();
  return full || "Unknown patient";
}

/** Resolve invoice patient name when stored value is still an encryption envelope. */
export function getInvoicePatientDisplayName(
  invoice: { patientName?: unknown; patientId?: string },
  patients?: Array<{ patientId?: string; firstName?: unknown; lastName?: unknown }>,
): string {
  const stored =
    typeof invoice.patientName === "string" ? invoice.patientName.trim() : "";
  if (stored && !isEncryptedPatientScalar(stored)) {
    return stored;
  }
  if (patients && invoice.patientId) {
    const patient = patients.find((p) => p.patientId === invoice.patientId);
    if (patient) {
      return displayPatientName(patient);
    }
  }
  return invoice.patientId || "Unknown patient";
}
