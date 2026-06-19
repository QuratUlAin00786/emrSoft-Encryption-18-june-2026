import { db } from "./db.js";
import { organizations, users, patients, appointments, medicalRecords, notifications, prescriptions, subscriptions, aiInsights, roles, saasSubscriptions, saasPackages } from "@shared/schema.js";
import {
  ensureSystemRolesForAllOrganizations,
} from "./default-system-roles.js";
import { authService } from "./services/auth.js";
import { storage } from "./storage.js";
import { preparePatientForStorage, assertEncryptedPatientInsertRow } from "./utils/encryption-sdk.js";
import { eq, inArray, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { SAAS_SEED_USER } from "@shared/demo-credentials.js";
import { ensureSaasOrganizationSeed } from "./ensure-saas-organization-seed.js";
import { seedDemoEssentials } from "./seed-demo-essentials.js";

export async function seedDatabase() {
  try {
    console.log("Seeding database with sample data...");

    const saasSeed = await ensureSaasOrganizationSeed();
    const org = (await db.select().from(organizations).where(eq(organizations.id, saasSeed.organization.id)))[0]!;
    console.log(
      `SaaS platform: ${saasSeed.saasAdmin.username} / ${SAAS_SEED_USER.password} (org 0)`,
    );
    console.log(
      `SaaS customer org: ${org.name} — demo admin ${saasSeed.demoAdmin?.email ?? "missing"}`,
    );
    
    // Fix sequence for users table to prevent duplicate key errors
    try {
      await db.execute(sql`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1) + 1, false)`);
      console.log("Reset users sequence to prevent duplicate key errors");
    } catch (seqError) {
      console.log("Could not reset users sequence (may not be needed)");
    }

    // Tenant org + demo users already created by ensureSaasOrganizationSeed()
    const demoUserResult = saasSeed.demoUsers;

    await seedDemoEssentials(org.id);

    console.log(
      `Demo credentials: ${demoUserResult.created.length} created, ${demoUserResult.updated.length} updated`,
    );

    // Create sample users - only create extra staff if none exist yet
    const existingUsers = await db.select().from(users).where(eq(users.organizationId, org.id));
    
    console.log(`Found ${existingUsers.length} existing users in organization`);
    
    let createdUsers = existingUsers;
    
    // Only create additional sample users if the org is mostly empty
    if (existingUsers.length <= demoUserResult.total) {
      const hashedDoctorPassword = await authService.hashPassword("doctor123");
      const hashedAdminPassword = await authService.hashPassword("467fe887");
      
      const extraSampleUsers = [
        {
          organizationId: org.id,
          email: "doctor2@cura.com",
          username: "doctor2",
          passwordHash: hashedDoctorPassword,
          firstName: "Michael",
          lastName: "Johnson",
          role: "doctor",
          department: "Neurology",
          workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          workingHours: { start: "09:00", end: "18:00" },
          isActive: true
        },
        {
          organizationId: org.id,
          email: "doctor3@cura.com",
          username: "doctor3",
          passwordHash: hashedDoctorPassword,
          firstName: "David",
          lastName: "Wilson",
          role: "doctor",
          department: "Orthopedics",
          workingDays: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          workingHours: { start: "08:30", end: "16:30" },
          isActive: true
        },
        {
          organizationId: org.id,
          email: "doctor4@cura.com",
          username: "doctor4",
          passwordHash: hashedDoctorPassword,
          firstName: "Lisa",
          lastName: "Anderson",
          role: "doctor",
          department: "Pediatrics",
          workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          workingHours: { start: "08:00", end: "16:00" },
          isActive: true
        },
        {
          organizationId: org.id,
          email: "doctor5@cura.com",
          username: "doctor5",
          passwordHash: hashedDoctorPassword,
          firstName: "Robert",
          lastName: "Brown",
          role: "doctor",
          department: "Dermatology",
          workingDays: ["Monday", "Wednesday", "Friday"],
          workingHours: { start: "10:00", end: "18:00" },
          isActive: true
        },
        {
          organizationId: org.id,
          email: "receptionist@cura.com",
          username: "receptionist",
          passwordHash: hashedAdminPassword,
          firstName: "Jane",
          lastName: "Thompson",
          role: "receptionist",
          department: "Front Desk",
          workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          workingHours: { start: "08:00", end: "17:00" },
          isActive: true
        }
      ];

      const inserted = await db.insert(users).values(extraSampleUsers).returning();
      createdUsers = [...existingUsers, ...inserted];
      console.log(`Created ${extraSampleUsers.length} additional sample users`);
    } else {
      console.log(`Preserving existing ${existingUsers.length} users including demo accounts`);
    }

    // Create patient user accounts (role: patient) if they don't exist
    const existingPatientUsers = await db.select().from(users).where(
      and(eq(users.organizationId, org.id), eq(users.role, "patient"))
    );
    
    let patientUsers = existingPatientUsers;
    
    if (existingPatientUsers.length === 0) {
      const patientPassword = await bcrypt.hash("patient123", 12);
      const samplePatientUsers = [
        {
          organizationId: org.id,
          email: "john.patient@email.com",
          username: "john.patient",
          passwordHash: patientPassword,
          firstName: "John",
          lastName: "Patient",
          role: "patient",
          department: "Patient",
          workingDays: [],
          workingHours: {},
          isActive: true
        },
        {
          organizationId: org.id,
          email: "alice.williams@email.com",
          username: "alice.williams",
          passwordHash: patientPassword,
          firstName: "Alice",
          lastName: "Williams",
          role: "patient",
          department: "Patient",
          workingDays: [],
          workingHours: {},
          isActive: true
        },
        {
          organizationId: org.id,
          email: "robert.davis@email.com",
          username: "robert.davis",
          passwordHash: patientPassword,
          firstName: "Robert",
          lastName: "Davis",
          role: "patient",
          department: "Patient",
          workingDays: [],
          workingHours: {},
          isActive: true
        }
      ];
      
      patientUsers = await db.insert(users).values(samplePatientUsers).returning();
      console.log(`Created ${patientUsers.length} patient user accounts`);
    } else {
      console.log(`Using existing ${existingPatientUsers.length} patient users`);
    }

    // Create sample patients only if they don't exist
    const existingPatients = await db.select().from(patients).where(eq(patients.organizationId, org.id));
    
    let createdPatients = existingPatients;
    
    if (existingPatients.length === 0) {
      // Find the patient user IDs
      const johnUser = patientUsers.find(u => u.email === "john.patient@email.com");
      const aliceUser = patientUsers.find(u => u.email === "alice.williams@email.com");
      const robertUser = patientUsers.find(u => u.email === "robert.davis@email.com");
      
      const samplePatients = [
        {
          organizationId: org.id,
          userId: johnUser?.id,
          patientId: "P001",
          firstName: "John",
          lastName: "Patient",
          dateOfBirth: new Date("1990-06-15"),
          email: "john.patient@email.com",
          phone: "+44 7700 900120",
          nhsNumber: "111 222 3333",
          address: {
            street: "10 Healthcare Lane",
            city: "London",
            state: "Greater London",
            postcode: "EC1A 1BB",
            country: "UK"
          },
          emergencyContact: {
            name: "Jane Patient",
            relationship: "Spouse",
            phone: "+44 7700 900121"
          },
          medicalHistory: {
            allergies: ["Aspirin"],
            chronicConditions: ["Asthma"],
            medications: ["Salbutamol inhaler"]
          },
          riskLevel: "low",
          isActive: true
        },
        {
          organizationId: org.id,
          userId: aliceUser?.id,
          patientId: "P002",
          firstName: "Alice",
          lastName: "Williams",
          dateOfBirth: new Date("1985-03-15"),
          email: "alice.williams@email.com",
          phone: "+44 7700 900123",
          nhsNumber: "123 456 7890",
          address: {
            street: "123 Main Street",
            city: "London",
            state: "Greater London",
            postcode: "SW1A 1AA",
            country: "UK"
          },
          emergencyContact: {
            name: "Bob Williams",
            relationship: "Spouse",
            phone: "+44 7700 900124"
          },
          medicalHistory: {
            allergies: ["Penicillin", "Nuts"],
            chronicConditions: ["Hypertension"],
            medications: ["Lisinopril 10mg"]
          },
          riskLevel: "medium",
          isActive: true
        },
        {
          organizationId: org.id,
          userId: robertUser?.id,
          patientId: "P003",
          firstName: "Robert",
          lastName: "Davis",
          dateOfBirth: new Date("1970-07-22"),
          email: "robert.davis@email.com",
          phone: "+44 7700 900125",
          nhsNumber: "234 567 8901",
          address: {
            street: "456 Oak Avenue",
            city: "Manchester",
            state: "Greater Manchester",
            postcode: "M1 1AA",
            country: "UK"
          },
          emergencyContact: {
            name: "Susan Davis",
            relationship: "Spouse",
            phone: "+44 7700 900126"
          },
          medicalHistory: {
            allergies: ["Shellfish"],
            chronicConditions: ["Diabetes Type 2", "High Cholesterol"],
            medications: ["Metformin 500mg", "Simvastatin 20mg"]
          },
          riskLevel: "high",
          isActive: true
        }
      ];

      const encryptedSamplePatients = await Promise.all(
        samplePatients.map(async (row) => {
          const insertData = await preparePatientForStorage(row as Record<string, unknown>);
          assertEncryptedPatientInsertRow(insertData);
          return insertData;
        }),
      );
      createdPatients = await db.insert(patients).values(encryptedSamplePatients as any).returning();
      console.log(`Created ${createdPatients.length} encrypted patients linked to user accounts`);
    } else {
      console.log(`Using existing ${existingPatients.length} patients`);
      
      // Link existing patients to user accounts if not already linked
      for (const rawExisting of existingPatients) {
        const existingPatient = await storage.normalizePatientFromRow(rawExisting);
        if (!existingPatient) continue;
        if (!rawExisting.userId && existingPatient.email) {
          // Find or create a patient user for this patient
          const existingPatientUser = patientUsers.find(u => u.email === existingPatient.email);
          if (existingPatientUser) {
            // Link the patient to the existing user
            await db.update(patients)
              .set({ userId: existingPatientUser.id })
              .where(eq(patients.id, rawExisting.id));
            console.log(`Linked patient ${existingPatient.firstName} ${existingPatient.lastName} to user account`);
          } else {
            // Check if a user with this email already exists
            const [existingUserWithEmail] = await db.select().from(users).where(eq(users.email, existingPatient.email)).limit(1);
            
            if (existingUserWithEmail) {
              // Link to existing user
              await db.update(patients)
                .set({ userId: existingUserWithEmail.id })
                .where(eq(patients.id, rawExisting.id));
              console.log(`Linked patient ${existingPatient.firstName} ${existingPatient.lastName} to existing user account`);
            } else {
              // Create a new patient user and link
              try {
                const patientPassword = await bcrypt.hash("patient123", 12);
                const [newPatientUser] = await db.insert(users).values({
                  organizationId: org.id,
                  email: existingPatient.email,
                  username: existingPatient.email.split('@')[0],
                  passwordHash: patientPassword,
                  firstName: existingPatient.firstName,
                  lastName: existingPatient.lastName,
                  role: "patient",
                  department: "Patient",
                  workingDays: [],
                  workingHours: {},
                  isActive: true
                }).returning();
                
                await db.update(patients)
                  .set({ userId: newPatientUser.id })
                  .where(eq(patients.id, rawExisting.id));
                console.log(`Created user account and linked patient ${existingPatient.firstName} ${existingPatient.lastName}`);
              } catch (error: any) {
                console.log(`Could not create user for patient ${existingPatient.firstName} ${existingPatient.lastName}: ${error.message}`);
              }
            }
          }
        }
      }
    }

    // Skip appointment seeding - system is now fully database-driven
    console.log(`[SEED] Appointments are now database-driven - no seed data created`);

    // Create sample medical records (skip if seedDemoEssentials already added one)
    const [existingMedicalRecord] = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.organizationId, org.id))
      .limit(1);

    if (!existingMedicalRecord) {
    const sampleRecords = [
      {
        organizationId: org.id,
        patientId: createdPatients[0].id,
        providerId: createdUsers[1].id,
        type: "consultation",
        title: "Initial Cardiac Assessment",
        notes: "Patient presents with mild chest discomfort. ECG shows normal sinus rhythm. Blood pressure elevated at 150/95. Recommended lifestyle modifications and continued antihypertensive therapy.",
        diagnosis: "Essential Hypertension (I10)",
        treatment: "Continue current medication, dietary consultation recommended",
        prescription: {
          medications: [
            {
              name: "Lisinopril",
              dosage: "10mg",
              frequency: "Once daily",
              duration: "30 days"
            }
          ]
        },
        attachments: [],
        aiSuggestions: {
          riskAssessment: "Moderate cardiovascular risk",
          recommendations: ["Monitor BP weekly", "Reduce sodium intake", "Regular exercise"],
          drugInteractions: []
        }
      }
    ];

    await db.insert(medicalRecords).values(sampleRecords);
    console.log("Created sample medical records");
    }

    // Create sample notifications - only if none exist
    const existingNotifications = await db.select().from(notifications).where(eq(notifications.organizationId, org.id)).limit(1);
    
    if (existingNotifications.length === 0) {
      const sampleNotifications = [
      {
        organizationId: org.id,
        userId: createdUsers[1].id, // Dr. Smith
        title: "Lab Results Available",
        message: "Blood work results for Sarah Johnson are now available for review.",
        type: "lab_result",
        priority: "normal" as const,
        status: "unread" as const,
        isActionable: true,
        actionUrl: "/patients/1/lab-results",
        relatedEntityType: "patient",
        relatedEntityId: createdPatients[0].id,
        metadata: {
          patientId: createdPatients[0].id,
          patientName: "Sarah Johnson",
          urgency: "medium" as const,
          department: "Laboratory",
          icon: "Activity",
          color: "blue"
        }
      },
      {
        organizationId: org.id,
        userId: createdUsers[1].id, // Dr. Smith
        title: "Appointment Reminder",
        message: "Upcoming appointment with Sarah Johnson tomorrow at 10:00 AM.",
        type: "appointment_reminder",
        priority: "high" as const,
        status: "unread" as const,
        isActionable: true,
        actionUrl: "/calendar",
        relatedEntityType: "appointment",
        relatedEntityId: 912, // Use existing appointment ID
        metadata: {
          patientId: createdPatients[0].id,
          patientName: "Sarah Johnson",
          appointmentId: 912, // Use existing appointment ID
          urgency: "high" as const,
          department: "Cardiology",
          icon: "Calendar",
          color: "orange"
        }
      },
      {
        organizationId: org.id,
        userId: createdUsers[0].id, // Admin
        title: "Critical Drug Interaction Alert",
        message: "Potential interaction detected between Warfarin and Aspirin for patient Robert Davis.",
        type: "prescription_alert",
        priority: "critical" as const,
        status: "unread" as const,
        isActionable: true,
        actionUrl: "/patients/2/prescriptions",
        relatedEntityType: "patient",
        relatedEntityId: createdPatients[1].id,
        metadata: {
          patientId: createdPatients[1].id,
          patientName: "Robert Davis",
          urgency: "critical" as const,
          department: "Pharmacy",
          icon: "AlertTriangle",
          color: "red",
          requiresResponse: true
        }
      },
      {
        organizationId: org.id,
        userId: createdUsers[2].id, // Nurse Williams
        title: "Patient Message",
        message: "Sarah Johnson has sent a message regarding her medication side effects.",
        type: "message",
        priority: "normal" as const,
        status: "read" as const,
        isActionable: true,
        actionUrl: "/messaging/conversations/1",
        relatedEntityType: "patient",
        relatedEntityId: createdPatients[0].id,
        readAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Read 2 hours ago
        metadata: {
          patientId: createdPatients[0].id,
          patientName: "Sarah Johnson",
          urgency: "medium" as const,
          department: "General",
          icon: "MessageSquare",
          color: "green"
        }
      },
      {
        organizationId: org.id,
        userId: createdUsers[1].id, // Dr. Smith
        title: "System Maintenance Alert",
        message: "Scheduled system maintenance will occur tonight from 2:00 AM - 4:00 AM.",
        type: "system_alert",
        priority: "low" as const,
        status: "unread" as const,
        isActionable: false,
        metadata: {
          urgency: "low" as const,
          department: "IT",
          icon: "Settings",
          color: "gray",
          autoMarkAsRead: true
        }
      }
      ];

      await db.insert(notifications).values(sampleNotifications);
      console.log(`Created ${sampleNotifications.length} sample notifications`);
    } else {
      console.log(`Notifications already exist for organization ${org.id}, skipping notification seed`);
    }

    // Create sample prescriptions - only if none exist
    const existingPrescriptions = await db.select().from(prescriptions).where(eq(prescriptions.organizationId, org.id));
    
    if (existingPrescriptions.length === 0) {
      const samplePrescriptions = [
        {
          organizationId: org.id,
          patientId: createdPatients[0].id, // Sarah Johnson
          doctorId: createdUsers[1].id, // Dr. Smith
          prescriptionNumber: `RX-${Date.now()}-001`,
          status: "active" as const,
          diagnosis: "Hypertension",
          // Legacy columns (for backward compatibility)
          medicationName: "Lisinopril",
          dosage: "10mg",
          frequency: "Once daily",
          duration: "30 days",
          instructions: "Take with or without food. Monitor blood pressure.",
          // Modern JSONB columns
          medications: [
            {
              name: "Lisinopril",
              dosage: "10mg",
              frequency: "Once daily",
              duration: "30 days",
              quantity: 30,
              refills: 5,
              instructions: "Take with or without food. Monitor blood pressure.",
              genericAllowed: true
            }
          ],
          pharmacy: {
            name: "City Pharmacy",
            address: "123 Main St, London",
            phone: "+44 20 7946 0958"
          },
          notes: "Patient tolerates ACE inhibitors well"
        },
        {
          organizationId: org.id,
          patientId: createdPatients[1].id, // Robert Davis
          doctorId: createdUsers[1].id, // Dr. Smith
          prescriptionNumber: `RX-${Date.now()}-002`,
          status: "active" as const,
          diagnosis: "Type 2 Diabetes",
          // Legacy columns (for backward compatibility)
          medicationName: "Metformin",
          dosage: "500mg",
          frequency: "Twice daily with meals",
          duration: "90 days",
          instructions: "Take with breakfast and dinner",
          // Modern JSONB columns
          medications: [
            {
              name: "Metformin",
              dosage: "500mg",
              frequency: "Twice daily with meals",
              duration: "90 days",
              quantity: 180,
              refills: 3,
              instructions: "Take with breakfast and dinner",
              genericAllowed: true
            }
          ],
          pharmacy: {
            name: "Local Pharmacy",
            address: "456 High St, London",
            phone: "+44 20 7946 0959"
          },
          notes: "Monitor blood glucose levels"
        }
      ];

      const createdPrescriptions = await db.insert(prescriptions).values(samplePrescriptions).returning();
      console.log(`Created ${createdPrescriptions.length} sample prescriptions`);
    } else {
      console.log(`Prescriptions already exist for organization ${org.id}, skipping prescription seed`);
    }

    // Create sample AI insights
    const sampleAiInsights = [
      {
        organizationId: org.id,
        patientId: createdPatients[0].id, // Sarah Johnson
        type: "risk_alert",
        title: "Cardiovascular Risk Assessment",
        description: "Based on recent blood pressure readings and family history, patient shows elevated cardiovascular risk factors. Consider lifestyle modifications and medication review.",
        severity: "medium" as const,
        actionRequired: true,
        confidence: "0.85",
        metadata: {
          relatedConditions: ["Hypertension", "Family History CVD"],
          suggestedActions: ["Diet consultation", "Exercise program", "Medication review"],
          references: ["AHA Guidelines 2023", "ESC Guidelines"]
        },
        status: "active" as const
      },
      {
        organizationId: org.id,
        patientId: createdPatients[1].id, // Robert Davis
        type: "drug_interaction",
        title: "Potential Drug Interaction Alert",
        description: "Interaction detected between Metformin and newly prescribed medication. Monitor glucose levels closely and consider dosage adjustment.",
        severity: "high" as const,
        actionRequired: true,
        confidence: "0.92",
        metadata: {
          relatedConditions: ["Type 2 Diabetes", "Drug Interaction"],
          suggestedActions: ["Monitor blood glucose", "Review medication timing", "Patient education"],
          references: ["Drug Interaction Database", "FDA Guidelines"]
        },
        status: "active" as const
      },
      {
        organizationId: org.id,
        patientId: createdPatients[0].id, // Sarah Johnson
        type: "treatment_suggestion",
        title: "Hypertension Management Optimization",
        description: "Current treatment plan shows good response. Consider adding lifestyle interventions to potentially reduce medication dependency.",
        severity: "low" as const,
        actionRequired: false,
        confidence: "0.78",
        metadata: {
          relatedConditions: ["Hypertension", "ACE Inhibitor Therapy"],
          suggestedActions: ["DASH diet counseling", "Regular exercise program", "Weight management"],
          references: ["JNC 8 Guidelines", "AHA Lifestyle Guidelines"]
        },
        status: "active" as const
      },
      {
        organizationId: org.id,
        patientId: createdPatients[1].id, // Robert Davis
        type: "preventive_care",
        title: "Diabetic Screening Recommendations",
        description: "Patient due for annual diabetic complications screening. Schedule eye exam, foot examination, and kidney function tests.",
        severity: "medium" as const,
        actionRequired: true,
        confidence: "0.95",
        metadata: {
          relatedConditions: ["Type 2 Diabetes", "Preventive Care"],
          suggestedActions: ["Ophthalmology referral", "Podiatry consultation", "Lab work: HbA1c, microalbumin"],
          references: ["ADA Standards of Care", "Diabetic Complications Guidelines"]
        },
        status: "active" as const
      },
      {
        organizationId: org.id,
        patientId: createdPatients[0].id, // Sarah Johnson
        type: "risk_alert",
        title: "Medication Adherence Concern",
        description: "AI analysis of prescription refill patterns suggests potential adherence issues. Patient may benefit from medication management support.",
        severity: "medium" as const,
        actionRequired: true,
        confidence: "0.73",
        metadata: {
          relatedConditions: ["Medication Adherence", "Hypertension"],
          suggestedActions: ["Adherence counseling", "Pill organizer", "Follow-up call"],
          references: ["Medication Adherence Guidelines", "Patient Education Resources"]
        },
        status: "active" as const
      }
    ];

    const createdAiInsights = await db.insert(aiInsights).values(sampleAiInsights).returning();
    console.log(`Created ${createdAiInsights.length} sample AI insights`);

    // Create sample subscription if it doesn't exist
    const existingSubscription = await db.select().from(subscriptions).where(eq(subscriptions.organizationId, org.id));
    
    if (existingSubscription.length === 0) {
      const sampleSubscription = {
        organizationId: org.id,
        planName: "Professional Plan",
        plan: "professional",
        status: "active",
        currentUsers: 3,
        userLimit: 25,
        monthlyPrice: "79.00",
        nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        trialEndsAt: null,
        features: {
          aiInsights: true,
          advancedReporting: true,
          apiAccess: true,
          whiteLabel: false
        }
      };

      const createdSubscription = await db.insert(subscriptions).values([sampleSubscription]).returning();
      console.log(`Created subscription for organization: ${createdSubscription[0].plan}`);
    } else {
      console.log("Subscription already exists for this organization");
    }

    // Lab results seeded in seedDemoEssentials
    const roleSeedSummary = await ensureSystemRolesForAllOrganizations();
    console.log(
      `System roles: ${roleSeedSummary.created} created, ${roleSeedSummary.existing} already present (${roleSeedSummary.expectedPerOrg} roles per org, ${roleSeedSummary.organizations} orgs)`,
    );

    // SaaS admin seeded at start via ensureSaaSAdmin()

    // Create SaaS subscriptions for organizations without subscriptions
    console.log("💳 Creating SaaS subscriptions for organizations...");
    
    try {
      // Get all organizations (excluding system org with id 0)
      const allOrgs = await db.select({
        id: organizations.id,
        name: organizations.name
      }).from(organizations).where(eq(organizations.id, org.id));

      if (allOrgs.length > 0) {
        const orgIds = allOrgs.map(o => o.id);
        
        // Check which organizations already have subscriptions
        const existingSubscriptions = await db.select({
          organizationId: saasSubscriptions.organizationId
        }).from(saasSubscriptions).where(inArray(saasSubscriptions.organizationId, orgIds));
        
        const existingOrgIds = new Set(existingSubscriptions.map(s => s.organizationId));
        const orgsWithoutSubscriptions = allOrgs.filter(o => !existingOrgIds.has(o.id));

        if (orgsWithoutSubscriptions.length > 0) {
          // Get the default package (gold plan)
          const [defaultPackage] = await db.select({
            id: saasPackages.id
          }).from(saasPackages).where(eq(saasPackages.id, 1));

          if (defaultPackage) {
            const now = new Date();
            const oneMonthLater = new Date(now);
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

            const subscriptionsToCreate = orgsWithoutSubscriptions.map(o => ({
              organizationId: o.id,
              packageId: defaultPackage.id,
              status: "active",
              paymentStatus: "paid",
              currentPeriodStart: now,
              currentPeriodEnd: oneMonthLater,
              cancelAtPeriodEnd: false,
              maxUsers: 50,
              maxPatients: 1000,
              details: "Initial subscription created during seeding",
              expiresAt: oneMonthLater,
              metadata: {
                paymentProvider: "stripe",
                lastPaymentDate: now.toISOString(),
                nextPaymentDate: oneMonthLater.toISOString()
              }
            }));

            await db.insert(saasSubscriptions).values(subscriptionsToCreate);
            console.log(`✅ Created ${subscriptionsToCreate.length} SaaS subscriptions for organizations: ${orgsWithoutSubscriptions.map(o => o.name).join(', ')}`);
          } else {
            console.log("⚠️ No default package found - skipping subscription creation");
          }
        } else {
          console.log("✅ All organizations already have subscriptions");
        }
      }
    } catch (subscriptionError) {
      console.error('❌ Failed to create SaaS subscriptions:', subscriptionError);
      // Don't fail the entire seeding - subscriptions can be created manually
    }

    console.log("🎉 Database seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}