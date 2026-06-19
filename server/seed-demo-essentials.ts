import { db, pool } from "./db.js";
import { storage } from "./storage.js";
import { preparePatientForStorage, assertEncryptedPatientInsertRow } from "./utils/encryption-sdk.js";
import {
  ensureSystemRolesForOrganization,
  syncSystemRolePermissions,
} from "./default-system-roles.js";
import { DEMO_SEED_USERS } from "@shared/demo-credentials.js";
import {
  users,
  patients,
  appointments,
  invoices,
  medicalImages,
  doctorsFee,
  labTestPricing,
  imagingPricing,
  treatments,
  treatmentsInfo,
  staffShifts,
  doctorDefaultShifts,
  saasSubscriptions,
  saasPackages,
  medicalRecords,
} from "@shared/schema.js";
import { eq, and } from "drizzle-orm";

async function getOrgUser(organizationId: number, email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.organizationId, organizationId), eq(users.email, email)))
    .limit(1);
  return user;
}

async function ensureDemoPatientForUser(
  organizationId: number,
  user: { id: number; email: string; firstName: string; lastName: string },
) {
  const [existing] = await db
    .select()
    .from(patients)
    .where(
      and(eq(patients.organizationId, organizationId), eq(patients.userId, user.id)),
    )
    .limit(1);

  if (existing) return existing;

  const [byEmail] = await db
    .select()
    .from(patients)
    .where(
      and(eq(patients.organizationId, organizationId), eq(patients.email, user.email)),
    )
    .limit(1);

  if (byEmail) {
    if (!byEmail.userId) {
      await db.update(patients).set({ userId: user.id }).where(eq(patients.id, byEmail.id));
    }
    return byEmail;
  }

  const patientRow = await preparePatientForStorage({
    organizationId,
    userId: user.id,
    patientId: `P-DEMO-${user.id}`,
    firstName: user.firstName,
    lastName: user.lastName,
    dateOfBirth: new Date("1990-01-15"),
    email: user.email,
    phone: "+92 300 0000000",
    nhsNumber: `DEMO-${user.id}`,
    relation: "Self",
    address: {
      street: "1 Demo Street",
      city: "Karachi",
      state: "Sindh",
      postcode: "75500",
      country: "PK",
    },
    emergencyContact: {
      name: "Emergency Contact",
      relationship: "Family",
      phone: "+92 300 1111111",
    },
    medicalHistory: { allergies: [], chronicConditions: [], medications: [] },
    riskLevel: "low",
    isActive: true,
  } as Record<string, unknown>);
  assertEncryptedPatientInsertRow(patientRow);

  const [created] = await db.insert(patients).values(patientRow as any).returning();
  return created;
}

export async function ensureSaasSubscription(organizationId: number) {
  const [existing] = await db
    .select()
    .from(saasSubscriptions)
    .where(eq(saasSubscriptions.organizationId, organizationId))
    .limit(1);

  if (existing) return existing;

  let [pkg] = await db.select().from(saasPackages).where(eq(saasPackages.id, 1)).limit(1);
  if (!pkg) {
    [pkg] = await db
      .insert(saasPackages)
      .values({
        name: "Professional",
        description: "Demo professional plan",
        price: "79.00",
        billingCycle: "monthly",
        features: { aiEnabled: true, billingEnabled: true, maxUsers: 50, maxPatients: 1000 },
        isActive: true,
      })
      .returning();
  }

  const now = new Date();
  const expires = new Date(now);
  expires.setMonth(expires.getMonth() + 1);

  const [sub] = await db
    .insert(saasSubscriptions)
    .values({
      organizationId,
      packageId: pkg.id,
      status: "active",
      paymentStatus: "paid",
      currentPeriodStart: now,
      currentPeriodEnd: expires,
      cancelAtPeriodEnd: false,
      maxUsers: 50,
      maxPatients: 1000,
      details: "Demo subscription created during seeding",
      expiresAt: expires,
      metadata: { paymentProvider: "demo" },
    } as any)
    .returning();

  return sub;
}

export async function ensureRolesTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY NOT NULL,
      organization_id INTEGER NOT NULL,
      name VARCHAR(50) NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT NOT NULL,
      permissions JSONB NOT NULL,
      is_system BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

export async function seedDemoEssentials(organizationId: number) {
  console.log(`[SEED-DEMO] Seeding mandatory demo data for org ${organizationId}...`);

  await ensureRolesTable();
  await ensureSystemRolesForOrganization(organizationId);
  await syncSystemRolePermissions(organizationId);

  const admin = await getOrgUser(organizationId, "james@emrsoft.ai");
  const doctor = await getOrgUser(organizationId, "paul@emrsoft.ai");
  const nurse = await getOrgUser(organizationId, "emma@emrsoft.ai");
  const patientUser = await getOrgUser(organizationId, "john@emrsoft.ai");

  if (!admin || !doctor || !patientUser) {
    console.warn("[SEED-DEMO] Demo users missing — run ensureDemoUsers first");
    return;
  }

  await ensureSaasSubscription(organizationId);

  const demoPatient = await ensureDemoPatientForUser(organizationId, {
    id: patientUser.id,
    email: patientUser.email,
    firstName: patientUser.firstName ?? "John",
    lastName: patientUser.lastName ?? "Patient",
  });

  const [existingDoctorFee] = await db
    .select()
    .from(doctorsFee)
    .where(eq(doctorsFee.organizationId, organizationId))
    .limit(1);

  if (!existingDoctorFee) {
    await db.insert(doctorsFee).values([
      {
        organizationId,
        doctorId: doctor.id,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        doctorRole: "doctor",
        serviceName: "General Consultation",
        serviceCode: "CONS-001",
        category: "Consultation",
        basePrice: "75.00",
        currency: "GBP",
        createdBy: admin.id,
        notes: "Demo consultation fee",
      },
      {
        organizationId,
        doctorId: doctor.id,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        doctorRole: "doctor",
        serviceName: "Follow-up Visit",
        serviceCode: "CONS-002",
        category: "Consultation",
        basePrice: "45.00",
        currency: "GBP",
        createdBy: admin.id,
        notes: "Demo follow-up fee",
      },
    ]);
    console.log("[SEED-DEMO] Created doctor fee records");
  }

  const [existingLabPricing] = await db
    .select()
    .from(labTestPricing)
    .where(eq(labTestPricing.organizationId, organizationId))
    .limit(1);

  if (!existingLabPricing) {
    await db.insert(labTestPricing).values([
      {
        organizationId,
        doctorId: doctor.id,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        doctorRole: "doctor",
        testName: "Complete Blood Count (CBC)",
        testCode: "CBC-001",
        category: "Hematology",
        basePrice: "35.00",
        currency: "GBP",
        createdBy: admin.id,
        notes: "Demo lab pricing",
      },
      {
        organizationId,
        doctorId: doctor.id,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        doctorRole: "doctor",
        testName: "Blood Glucose",
        testCode: "GLU-001",
        category: "Chemistry",
        basePrice: "20.00",
        currency: "GBP",
        createdBy: admin.id,
      },
    ]);
    console.log("[SEED-DEMO] Created lab test pricing");
  }

  const [existingImagingPricing] = await db
    .select()
    .from(imagingPricing)
    .where(eq(imagingPricing.organizationId, organizationId))
    .limit(1);

  if (!existingImagingPricing) {
    await db.insert(imagingPricing).values([
      {
        organizationId,
        imagingType: "Chest X-Ray",
        imagingCode: "IMG-XR-001",
        modality: "X-Ray",
        bodyPart: "Chest",
        category: "Radiology",
        basePrice: "95.00",
        currency: "GBP",
        createdBy: admin.id,
        notes: "Demo imaging fee",
      },
      {
        organizationId,
        imagingType: "MRI Brain",
        imagingCode: "IMG-MRI-001",
        modality: "MRI",
        bodyPart: "Brain",
        category: "Radiology",
        basePrice: "350.00",
        currency: "GBP",
        createdBy: admin.id,
      },
    ]);
    console.log("[SEED-DEMO] Created imaging pricing");
  }

  let [treatmentInfo] = await db
    .select()
    .from(treatmentsInfo)
    .where(eq(treatmentsInfo.organizationId, organizationId))
    .limit(1);

  if (!treatmentInfo) {
    [treatmentInfo] = await db
      .insert(treatmentsInfo)
      .values({
        organizationId,
        name: "General Consultation",
        colorCode: "#2563eb",
        createdBy: admin.id,
      })
      .returning();
  }

  const [existingTreatment] = await db
    .select()
    .from(treatments)
    .where(eq(treatments.organizationId, organizationId))
    .limit(1);

  if (!existingTreatment) {
    await db.insert(treatments).values({
      organizationId,
      doctorId: doctor.id,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      doctorRole: "doctor",
      name: "General Consultation",
      colorCode: "#2563eb",
      basePrice: "75.00",
      currency: "GBP",
      createdBy: admin.id,
      notes: "Demo treatment",
    });
    console.log("[SEED-DEMO] Created treatment records");
  }

  const [existingDefaultShift] = await db
    .select()
    .from(doctorDefaultShifts)
    .where(eq(doctorDefaultShifts.organizationId, organizationId))
    .limit(1);

  if (!existingDefaultShift) {
    for (const staff of [doctor, nurse].filter(Boolean)) {
      await db.insert(doctorDefaultShifts).values({
        organizationId,
        userId: staff!.id,
        startTime: "09:00",
        endTime: "17:00",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      });
    }
    console.log("[SEED-DEMO] Created default staff shifts");
  }

  const [existingStaffShift] = await db
    .select()
    .from(staffShifts)
    .where(eq(staffShifts.organizationId, organizationId))
    .limit(1);

  if (!existingStaffShift) {
    const shiftDate = new Date();
    shiftDate.setHours(0, 0, 0, 0);
    await db.insert(staffShifts).values([
      {
        organizationId,
        staffId: doctor.id,
        date: shiftDate,
        shiftType: "regular",
        startTime: "09:00",
        endTime: "17:00",
        status: "scheduled",
        notes: "Demo doctor shift",
        createdBy: admin.id,
      },
      {
        organizationId,
        staffId: nurse?.id ?? doctor.id,
        date: shiftDate,
        shiftType: "regular",
        startTime: "07:00",
        endTime: "15:00",
        status: "scheduled",
        notes: "Demo nurse shift",
        createdBy: admin.id,
      },
    ]);
    console.log("[SEED-DEMO] Created staff shift schedule");
  }

  const [existingAppointment] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.organizationId, organizationId))
    .limit(1);

  if (!existingAppointment) {
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 1);
    scheduledAt.setHours(10, 0, 0, 0);

    await db.insert(appointments).values({
      organizationId,
      appointmentId: `APT-DEMO-${Date.now()}`,
      patientId: demoPatient.id,
      providerId: doctor.id,
      assignedRole: "doctor",
      title: "Demo Consultation",
      description: "Initial demo appointment for emrSoft",
      scheduledAt,
      duration: 30,
      status: "scheduled",
      type: "consultation",
      appointmentType: "consultation",
      location: "Clinic Room 1",
      isVirtual: false,
      createdBy: admin.id,
    });
    console.log("[SEED-DEMO] Created demo appointment");
  }

  await storage.seedLabResults(organizationId);

  const [existingImage] = await db
    .select()
    .from(medicalImages)
    .where(eq(medicalImages.organizationId, organizationId))
    .limit(1);

  if (!existingImage) {
    await db.insert(medicalImages).values({
      organizationId,
      patientId: demoPatient.id,
      uploadedBy: doctor.id,
      imageId: `IMG-DEMO-${Date.now()}`,
      studyType: "Chest X-Ray",
      modality: "X-Ray",
      bodyPart: "Chest",
      indication: "Routine screening",
      priority: "routine",
      fileName: "demo-chest-xray.png",
      fileSize: 68,
      mimeType: "image/png",
      imageData:
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      status: "uploaded",
      findings: "No acute cardiopulmonary abnormality.",
      impression: "Normal chest X-ray.",
      radiologist: `${doctor.firstName} ${doctor.lastName}`,
      performedAt: new Date(),
    });
    console.log("[SEED-DEMO] Created demo medical imaging record");
  }

  const [existingInvoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.organizationId, organizationId))
    .limit(1);

  if (!existingInvoice) {
    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + 14);

    await db.insert(invoices).values({
      organizationId,
      invoiceNumber: `INV-DEMO-${Date.now()}`,
      patientId: demoPatient.patientId ?? `P-DEMO-${patientUser.id}`,
      patientName: `${demoPatient.firstName ?? "John"} ${demoPatient.lastName ?? "Patient"}`,
      nhsNumber: "DEMO-001",
      serviceType: "consultation",
      serviceId: "CONS-001",
      dateOfService: now,
      invoiceDate: now,
      dueDate: due,
      status: "sent",
      invoiceType: "payment",
      doctorId: doctor.id,
      subtotal: "75.00",
      tax: "0.00",
      discount: "0.00",
      totalAmount: "75.00",
      paidAmount: "0.00",
      items: [
        {
          code: "CONS-001",
          description: "General Consultation",
          quantity: 1,
          unitPrice: 75,
          total: 75,
        },
      ],
      payments: [],
      notes: "Demo invoice",
      createdBy: admin.id,
    });
    console.log("[SEED-DEMO] Created demo invoice");
  }

  const [existingRecord] = await db
    .select()
    .from(medicalRecords)
    .where(eq(medicalRecords.organizationId, organizationId))
    .limit(1);

  if (!existingRecord) {
    await db.insert(medicalRecords).values({
      organizationId,
      patientId: demoPatient.id,
      providerId: doctor.id,
      type: "consultation",
      title: "Demo Clinical Note",
      notes: "Patient reviewed during emrSoft demo seed. Vitals stable.",
      diagnosis: "General health check (Z00.00)",
      treatment: "Continue healthy lifestyle",
      prescription: { medications: [] },
      attachments: [],
      aiSuggestions: {
        riskAssessment: "Low",
        recommendations: ["Annual follow-up"],
        drugInteractions: [],
      },
    });
    console.log("[SEED-DEMO] Created demo medical record");
  }

  console.log(
    `[SEED-DEMO] Complete — ${DEMO_SEED_USERS.length} demo login accounts configured for org ${organizationId}`,
  );
}
