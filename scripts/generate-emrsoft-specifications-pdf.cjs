/**
 * Generates: docs/EmrSoft-Application-Specifications.pdf
 * Run: npm run docs:emrsoft-spec-pdf
 */
const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;

const OUT_DIR = path.join(__dirname, "..", "docs");
const OUT_FILE = path.join(OUT_DIR, "EmrSoft-Application-Specifications.pdf");
const GENERATED = new Date().toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const MARGIN = 15;
const PAGE_H = 297;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BRAND_BLUE = [30, 58, 138];
const BRAND_ACCENT = [30, 64, 175];

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;
  let pageNum = 1;

  const footer = () => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("EmrSoft Application Specifications v1.0", MARGIN, PAGE_H - 8);
    doc.text(`Page ${pageNum}`, PAGE_W - MARGIN, PAGE_H - 8, { align: "right" });
    doc.setTextColor(0, 0, 0);
  };

  const newPage = () => {
    footer();
    doc.addPage();
    pageNum++;
    y = MARGIN;
  };

  const checkPage = (needed = 20) => {
    if (y + needed > PAGE_H - MARGIN - 10) newPage();
  };

  const h1 = (text) => {
    checkPage(14);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_BLUE);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    doc.text(lines, MARGIN, y);
    y += lines.length * 7 + 4;
    doc.setTextColor(0, 0, 0);
  };

  const h2 = (text) => {
    checkPage(12);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_ACCENT);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    doc.text(lines, MARGIN, y);
    y += lines.length * 6 + 3;
    doc.setTextColor(0, 0, 0);
  };

  const h3 = (text) => {
    checkPage(10);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const lines = doc.splitTextToSize(text, CONTENT_W);
    doc.text(lines, MARGIN, y);
    y += lines.length * 5 + 2;
  };

  const p = (text) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, CONTENT_W);
    const h = lines.length * 4.5 + 4;
    checkPage(h);
    doc.text(lines, MARGIN, y);
    y += h;
  };

  const bullet = (text) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(`• ${text}`, CONTENT_W - 4);
    const h = lines.length * 4.2 + 2;
    checkPage(h);
    doc.text(lines, MARGIN + 2, y);
    y += h;
  };

  const table = (headers, rows) => {
    checkPage(30);
    autoTable(doc, {
      startY: y,
      head: [headers],
      body: rows,
      margin: { left: MARGIN, right: MARGIN },
      tableWidth: CONTENT_W,
      styles: { fontSize: 8.5, cellPadding: 2 },
      headStyles: { fillColor: [232, 238, 247], textColor: [15, 23, 42], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 6;
  };

  // ── Cover ──────────────────────────────────────────────────────────────
  y = 70;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Averox Private Ltd.", MARGIN, y);
  y += 12;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_BLUE);
  doc.text("EmrSoft", MARGIN, y);
  y += 12;
  doc.setFontSize(16);
  doc.setTextColor(51, 65, 85);
  doc.text("Application Specifications", MARGIN, y);
  y += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("AI-Powered Healthcare Platform — Complete System Reference", MARGIN, y);
  y += 20;
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Version 1.0  |  Generated: ${GENERATED}`, MARGIN, y);
  y += 6;
  doc.text("Multi-Tenant SaaS EMR  |  Web + Mobile  |  Field-Level Encryption", MARGIN, y);
  y += 30;
  doc.setDrawColor(...BRAND_BLUE);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 8;
  p(
    "This document describes the complete EmrSoft electronic medical records platform: architecture, modules, roles, database, APIs, integrations, security, and deployment configuration."
  );
  newPage();

  // ── 1. Executive Summary ───────────────────────────────────────────────
  h1("1. Executive Summary");
  p(
    "EmrSoft is a comprehensive, multi-tenant Electronic Medical Records (EMR) and practice management platform. It serves healthcare organizations through isolated tenant subdomains, role-based portals for clinical and administrative staff, a SaaS owner console for subscription management, and patient-facing self-service features."
  );
  h2("1.1 Platform Identity");
  table(
    ["Property", "Value"],
    [
      ["Product Name", "EmrSoft"],
      ["Platform Title", "EmrSoft- AI-Powered Healthcare Platform"],
      ["Production URL", "https://app.emrsoft.ai/"],
      ["Demo Tenant Subdomain", "emrsoft"],
      ["Demo Organization", "emrSoft Healthcare"],
      ["Copyright", "© 2025 Averox Private Ltd. All rights reserved."],
      ["Primary Logo", "/EMR-Soft-Logo/emr-logo.png"],
      ["Favicon / Title Logo", "/EMR-Soft-Logo/emr-title-logo.png"],
    ]
  );

  h2("1.2 Core Capabilities");
  bullet("Patient demographics, medical records, and encrypted PHI storage");
  bullet("Appointment scheduling, calendar, shifts, and telemedicine (LiveKit)");
  bullet("Prescriptions, lab results, medical imaging, and clinical photography");
  bullet("Billing, invoicing, insurance claims, and revenue analytics");
  bullet("Inventory, pharmacy, and supply chain management");
  bullet("Dynamic forms, surveys, and patient communication (email/SMS)");
  bullet("AI clinical insights, chatbot, voice documentation, and decision support");
  bullet("GDPR compliance, audit trails, and data subject rights");
  bullet("SaaS subscription billing via Stripe with packages and trials");
  bullet("QuickBooks accounting integration and PayPal payments");

  h2("1.3 Technology Stack Summary");
  table(
    ["Layer", "Technologies"],
    [
      ["Frontend", "React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI, Wouter, TanStack Query"],
      ["Backend", "Node.js, Express, TypeScript, Socket.IO, Drizzle ORM"],
      ["Database", "PostgreSQL (custom schema, e.g. emrsoft_encrypted)"],
      ["Mobile", "Flutter (Doctor App + Patient App)"],
      ["Auth", "JWT, bcrypt, session cookies, RBAC"],
      ["Encryption", "@averox/curaemrencryption-crypto-sdk (field-level patient data)"],
      ["AI", "OpenAI GPT, Anthropic Claude"],
      ["Payments", "Stripe, PayPal"],
      ["Comms", "Nodemailer/SMTP (Stackmail), Twilio SMS/WhatsApp"],
      ["Video", "LiveKit via mk1.averox.com infrastructure"],
    ]
  );
  newPage();

  // ── 2. Architecture ────────────────────────────────────────────────────
  h1("2. System Architecture");
  h2("2.1 Multi-Tenant SaaS Model");
  p(
    "A single application instance serves multiple healthcare organizations. Each organization is identified by a unique subdomain and organizationId. All data tables include tenant isolation via organizationId. The X-Tenant-Subdomain HTTP header routes requests to the correct tenant context."
  );
  bullet("SaaS Owner (org 0): platform administration at /saas");
  bullet("Tenant Organizations: clinic portals at /{subdomain}/...");
  bullet("Public routes: landing, auth, legal, trial signup, form sharing");
  bullet("Legacy subdomain cura is migrated to emrsoft on seed");

  h2("2.2 Architecture Layers");
  table(
    ["Layer", "Description"],
    [
      ["Presentation", "React SPA — 80+ pages, role-based dashboards, responsive UI"],
      ["API Gateway", "Express server — auth, tenant middleware, 294+ REST endpoints"],
      ["Business Logic", "27+ domain services (AI, billing, pharmacy, GDPR, etc.)"],
      ["Data Access", "Drizzle ORM + storage.ts — PostgreSQL with 117+ tables"],
      ["Real-time", "Socket.IO, Server-Sent Events for notifications"],
      ["External", "Stripe, Twilio, QuickBooks, LiveKit, OpenAI, Anthropic"],
    ]
  );

  h2("2.3 Request Flow");
  bullet("Client sends Authorization: Bearer <JWT> and X-Tenant-Subdomain: <subdomain>");
  bullet("Tenant middleware resolves organization and validates subscription status");
  bullet("Auth middleware validates JWT and injects user + role context");
  bullet("Route handler executes business logic with organizationId scoping");
  bullet("Encrypted patient fields decrypted per-row via encryption SDK session");

  h2("2.4 Project Structure");
  table(
    ["Path", "Purpose"],
    [
      ["client/src/", "React frontend — pages, components, hooks, services"],
      ["server/", "Express API — routes.ts, middleware, services, seed scripts"],
      ["shared/", "Drizzle schema, demo credentials, shared types"],
      ["encryption-sdk/", "Averox field-level encryption SDK"],
      ["SQL Files/", "Database seed scripts (demo users INSERT)"],
      ["public/", "Static assets, chatbot embed, manifest"],
      ["docs/", "Generated documentation PDFs"],
    ]
  );
  newPage();

  // ── 3. User Roles ──────────────────────────────────────────────────────
  h1("3. User Roles & Access");
  h2("3.1 Supported Roles");
  table(
    ["Role", "Portal Access", "Primary Functions"],
    [
      ["SaaS Admin", "/saas", "Manage customers, packages, subscriptions, billing"],
      ["Admin", "Full tenant", "Users, settings, billing, analytics, compliance"],
      ["Doctor", "Clinical", "Patients, consultations, prescriptions, imaging"],
      ["Nurse", "Clinical", "Patient care, appointments, records, messaging"],
      ["Lab Technician", "Lab", "Lab results processing and dashboard"],
      ["Sample Taker", "Lab", "Sample collection workflows"],
      ["Pharmacist", "Pharmacy", "Prescription fulfillment, inventory, reports"],
      ["Patient", "Portal", "Appointments, records, prescriptions, messaging"],
      ["Receptionist", "Front desk", "Scheduling, registration (where enabled)"],
    ]
  );

  h2("3.2 Demo Credentials (Development)");
  p("Login: /auth/login  |  SaaS: /saas  |  Header: X-Tenant-Subdomain: emrsoft");
  table(
    ["Role", "Email", "Password"],
    [
      ["Doctor", "paul@emrsoft.ai", "doctor123"],
      ["Nurse", "emma@emrsoft.ai", "nurse123"],
      ["Patient", "john@emrsoft.ai", "patient123"],
      ["Lab Technician", "amelia@emrsoft.ai", "lab123"],
      ["Sample Taker", "sampletaker@emrsoft.ai", "sample123"],
      ["Pharmacist", "Pharmacist@emrsoft.ai", "pharmacist123"],
      ["Admin", "james@emrsoft.ai", "467fe887"],
      ["SaaS Admin", "saas_admin@emrsoft.ai", "admin123"],
    ]
  );

  h2("3.3 Authentication");
  bullet("JWT tokens with 7-day expiry; login via email or username");
  bullet("Password hashing: bcrypt (12 salt rounds)");
  bullet("Password reset via email token flow");
  bullet("Trial signup with email verification at /create-trial");
  bullet("Role hierarchy enforces endpoint and UI access control");
  newPage();

  // ── 4. Application Modules ─────────────────────────────────────────────
  h1("4. Application Modules & Pages");
  h2("4.1 Clinical & Patient Care");
  table(
    ["Module", "Route", "Description"],
    [
      ["Dashboard", "/:subdomain/dashboard", "Role-specific KPIs and quick actions"],
      ["Patients", "/:subdomain/patients", "Patient search, profiles, encrypted records"],
      ["Calendar", "/:subdomain/calendar", "Appointments, scheduling, availability"],
      ["Prescriptions", "/:subdomain/prescriptions", "E-prescribing, sharing, pharmacy handoff"],
      ["Lab Results", "/:subdomain/lab-results", "Orders, results, reporting, PDF export"],
      ["Imaging", "/:subdomain/imaging", "Radiology studies and DICOM-style workflows"],
      ["Telemedicine", "/:subdomain/telemedicine", "LiveKit video consultations"],
      ["Consultation", "Embedded UI", "Full consultation interface with body map"],
      ["Clinical Procedures", "/clinical-procedures", "Procedure documentation"],
      ["Emergency Protocols", "/emergency-protocols", "Protocol reference and workflows"],
    ]
  );

  h2("4.2 Administrative & Financial");
  table(
    ["Module", "Route", "Description"],
    [
      ["Billing", "/:subdomain/billing", "Invoices, payments, insurance, claims"],
      ["Analytics", "/:subdomain/analytics", "Financial and operational dashboards"],
      ["Inventory", "/:subdomain/inventory", "Stock, POs, warehouses, alerts"],
      ["Pharmacy", "/:subdomain/pharmacy", "Dispensing, reports, pharmacy invoices"],
      ["QuickBooks", "/:subdomain/quickbooks", "Accounting sync and OAuth"],
      ["User Management", "/:subdomain/users", "Staff accounts and roles"],
      ["Shifts", "/:subdomain/shifts", "Staff scheduling and holiday settings"],
      ["Settings", "/:subdomain/settings", "Clinic branding, headers, footers, theme"],
      ["Subscription", "/:subdomain/subscription", "Tenant plan and payment methods"],
    ]
  );

  h2("4.3 AI, Automation & Communication");
  table(
    ["Module", "Route", "Description"],
    [
      ["AI Insights", "/:subdomain/ai-insights", "Automated clinical insights"],
      ["AI Agent", "/:subdomain/ai-agent", "Conversational AI assistant"],
      ["Chatbot", "/:subdomain/chatbot", "Patient-facing embeddable chatbot"],
      ["Voice Documentation", "/voice-documentation", "Speech-to-text clinical notes"],
      ["Clinical Decision Support", "/clinical-decision-support", "Evidence-based guidance"],
      ["Messaging", "/:subdomain/messaging", "Bulk patient SMS/email campaigns"],
      ["Automation", "/:subdomain/automation", "Workflow automation rules"],
      ["Notifications", "/:subdomain/notifications", "In-app notification center"],
      ["Forms", "/:subdomain/forms", "Form builder, sharing, responses"],
    ]
  );

  h2("4.4 SaaS Portal");
  table(
    ["Module", "Route", "Description"],
    [
      ["SaaS Login", "/saas", "Platform owner authentication"],
      ["SaaS Dashboard", "/saas/dashboard", "Customer overview and metrics"],
      ["Customers", "/saas/customers", "Tenant organization management"],
      ["Packages", "/saas/packages", "Subscription plan definitions"],
      ["Billing", "/saas/billing", "Platform-level invoicing"],
      ["Settings", "/saas/settings", "Global platform configuration"],
    ]
  );

  h2("4.5 Public & Legal");
  bullet("Landing pages: /, /features, /pricing, /about, /help");
  bullet("Legal: /privacy, /terms, /gdpr, /press");
  bullet("Auth: /auth/login, /auth/reset-password, /patient-register");
  bullet("Trial: /create-trial, verify, set-password flows");
  bullet("Tech spec export: in-app PDF generation page");
  newPage();

  // ── 5. Database ────────────────────────────────────────────────────────
  h1("5. Database Schema");
  p(
    "PostgreSQL database managed via Drizzle ORM. Schema name configured via DB_SCHEMA (e.g. emrsoft_encrypted). Bootstrap via server/ensure-db-schema.ts and npm run db:push."
  );

  h2("5.1 Schema Domains (117+ tables)");
  table(
    ["Domain", "Key Tables"],
    [
      ["SaaS Platform", "saas_owners, saas_packages, saas_subscriptions, saas_payments, saas_invoices, saas_settings"],
      ["Tenancy", "organizations, clinic_headers, clinic_footers, roles, users"],
      ["Patients", "patients, patient_import_staging, patient_import_audit, patient_communications"],
      ["Clinical", "medical_records, consultations, prescriptions, lab_results, medical_images, radiology_images"],
      ["Scheduling", "appointments, staff_shifts, doctor_default_shifts, organization_holidays"],
      ["Billing", "invoices, payments, claims, insurance_payments, revenue_records, subscriptions"],
      ["Inventory", "inventory_items, inventory_sales, inventory_purchase_orders, inventory_warehouses, inventory_batches"],
      ["Forms", "forms, form_fields, form_sections, form_shares, form_responses"],
      ["GDPR", "gdpr_consents, gdpr_data_requests, gdpr_audit_trail, gdpr_processing_activities"],
      ["AI & Analytics", "ai_insights, risk_assessments, forecast_models, financial_forecasts"],
      ["Integrations", "quickbooks_tokens, chatbot_sessions (and related)"],
    ]
  );

  h2("5.2 Data Protection");
  bullet("organizationId on all tenant-scoped tables — no cross-tenant access");
  bullet("Patient PHI encrypted at field level via Averox encryption SDK");
  bullet("Search hashes for encrypted patient name/email lookup");
  bullet("JSONB columns for flexible metadata (permissions, settings, medical history)");
  bullet("Audit trails for GDPR and compliance reporting");

  h2("5.3 Seeding & Demo Data");
  bullet("server/ensure-saas-organization-seed.ts — idempotent org + users + subscription");
  bullet("server/ensure-demo-users.ts — demo role accounts");
  bullet("server/ensure-saas-admin.ts — SaaS owner account (org 0)");
  bullet("SQL Files/emrsoft_demo_users_insert.sql — manual INSERT with pgcrypto");
  bullet("POST /api/production-demo-setup — production bootstrap endpoint");
  newPage();

  // ── 6. API ─────────────────────────────────────────────────────────────
  h1("6. API Specification");
  p(
    "RESTful JSON API served from Express. All authenticated tenant requests require JWT and X-Tenant-Subdomain headers. 294+ endpoints organized by domain in server/routes.ts."
  );

  h2("6.1 Required Headers");
  table(
    ["Header", "Value", "Required"],
    [
      ["Authorization", "Bearer <jwt_token>", "Authenticated routes"],
      ["X-Tenant-Subdomain", "emrsoft (demo)", "Tenant-scoped routes"],
      ["Content-Type", "application/json", "POST/PATCH/PUT bodies"],
    ]
  );

  h2("6.2 Core Endpoint Groups");
  table(
    ["Group", "Examples", "Notes"],
    [
      ["Authentication", "POST /api/auth/login, GET /api/auth/me", "Public login; JWT response"],
      ["SaaS", "POST /api/saas/login, GET /api/saas/customers", "Platform owner only"],
      ["Patients", "GET/POST/PATCH /api/patients", "Encrypted field handling"],
      ["Appointments", "GET/POST/PATCH /api/appointments", "Calendar integration"],
      ["Prescriptions", "GET/POST /api/prescriptions", "Pharmacy workflow"],
      ["Lab Results", "GET/POST /api/lab-results", "PDF generation, sharing"],
      ["Billing", "GET/POST /api/invoices, /api/payments", "Stripe webhooks"],
      ["Inventory", "GET/POST /api/inventory/*", "Stock management"],
      ["Forms", "GET/POST /api/forms, /api/form-shares", "Public form fill URLs"],
      ["Chatbot", "POST /api/chatbot/message", "API key + org ID auth"],
      ["GDPR", "GET/POST /api/gdpr/*", "Data subject requests"],
      ["Dashboard", "GET /api/dashboard/*", "Role-specific stats"],
      ["Telemedicine", "POST /api/livekit/*", "Room creation via LiveKit"],
    ]
  );

  h2("6.3 Response Conventions");
  bullet("Success: JSON object with entity data or { message: 'Success' }");
  bullet("Errors: { error: string, code?: string, details?: array } with HTTP 4xx/5xx");
  bullet("Pagination: limit/offset or cursor on list endpoints where applicable");
  bullet("File uploads: multipart/form-data via Multer middleware");
  newPage();

  // ── 7. Backend Services ────────────────────────────────────────────────
  h1("7. Backend Services");
  table(
    ["Service", "File", "Responsibility"],
    [
      ["Authentication", "services/auth.ts", "JWT issue/verify, password hashing"],
      ["Email", "services/email.ts", "SMTP templates — welcome, reset, reminders"],
      ["AI", "services/ai.ts", "OpenAI integration, clinical NLP, drug interactions"],
      ["Chatbot AI", "services/chatbot-ai.ts", "Embeddable patient chatbot logic"],
      ["Anthropic", "anthropic.ts", "Claude clinical assistant"],
      ["GDPR", "services/gdpr-compliance.ts", "Consent, data requests, audit trail"],
      ["Appointments", "services/appointment-scheduler.ts", "Scheduling rules and conflicts"],
      ["Prescriptions", "services/prescription-management.ts", "Medication workflows"],
      ["Clinical CDS", "services/clinical-decision-support.ts", "Decision support rules"],
      ["Inventory", "services/inventory.ts", "Stock, sales, purchase orders"],
      ["Pharmacy", "services/pharmacy.ts", "Dispensing and pharmacy reports"],
      ["Stripe", "services/stripe-*.ts", "Subscriptions, payments, webhooks"],
      ["QuickBooks", "services/quickbooks/*", "OAuth, API sync, webhooks"],
      ["Twilio", "services/twilio-connector.ts", "SMS and WhatsApp delivery"],
      ["SMS Scheduler", "services/sms-scheduler.ts", "Scheduled message dispatch"],
      ["Subscription Reminders", "services/subscription-reminders.ts", "Billing reminder emails"],
      ["Patient Import", "services/patient-import.ts", "Bulk patient CSV import"],
      ["Health Dashboard", "services/health-dashboard.ts", "Aggregated dashboard metrics"],
      ["Audit", "services/audit-compliance.ts", "Compliance audit logging"],
    ]
  );

  h2("7.1 Middleware");
  bullet("tenant.ts — subdomain resolution, subscription validation");
  bullet("auth — JWT validation, user context injection");
  bullet("role checks — per-route RBAC enforcement");
  bullet("Multer — file upload handling for images and documents");
  newPage();

  // ── 8. Security ────────────────────────────────────────────────────────
  h1("8. Security, Encryption & Compliance");
  h2("8.1 Field-Level Encryption");
  p(
    "Patient sensitive data is encrypted using @averox/curaemrencryption-crypto-sdk. Each patient record has a data encryption key (DEK) wrapped with organization secrets. Encryption constants (cura-emr:patient-record:v1) are stable identifiers — do not change in production without migration."
  );
  bullet("server/utils/encryption-sdk.ts — encrypt/decrypt helpers");
  bullet("server/utils/patient-search-hashes.ts — blind index for search");
  bullet("Row-level encryption sessions per patient access");

  h2("8.2 Authentication Security");
  bullet("JWT_SECRET must be set in production (never use fallback default)");
  bullet("bcrypt password hashing with 12 rounds");
  bullet("Password reset tokens with expiry");
  bullet("Session cookies for web auth alongside JWT");

  h2("8.3 GDPR Compliance");
  bullet("Data subject rights: access, rectification, erasure, portability");
  bullet("Consent tracking with withdrawal support");
  bullet("Processing activity records and audit trails");
  bullet("Dedicated GDPR compliance pages and API endpoints");

  h2("8.4 Production Security Checklist");
  table(
    ["Item", "Environment Variable / Action"],
    [
      ["JWT secret", "JWT_SECRET=<strong-random-value>"],
      ["Database", "DATABASE_URL, DB_SCHEMA, DB_USER, DB_PASSWORD"],
      ["SMTP", "SMTP_HOST, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM"],
      ["Stripe", "STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET"],
      ["OpenAI", "OPENAI_API_KEY"],
      ["Twilio", "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN"],
      ["QuickBooks", "QUICKBOOKS_CLIENT_ID, QUICKBOOKS_REDIRECT_URI"],
      ["HTTPS", "TLS termination at reverse proxy / load balancer"],
      ["Secrets", "Never commit .env; rotate credentials regularly"],
    ]
  );
  newPage();

  // ── 9. Integrations ────────────────────────────────────────────────────
  h1("9. Third-Party Integrations");
  h2("9.1 Payments & Billing");
  table(
    ["Provider", "Use Case", "Configuration"],
    [
      ["Stripe", "SaaS subscriptions, tenant billing, payment methods", "STRIPE_SECRET_KEY, webhook endpoints"],
      ["PayPal", "Alternative payment capture and refunds", "PayPal SDK env vars"],
      ["QuickBooks", "Accounting sync, invoice export", "OAuth redirect: app.emrsoft.ai"],
    ]
  );

  h2("9.2 Communications");
  table(
    ["Provider", "Use Case", "Configuration"],
    [
      ["Stackmail SMTP", "Transactional email (noreply@emrsoft.ai)", "SMTP_HOST=smtp.stackmail.com:465"],
      ["Twilio", "SMS reminders, WhatsApp messaging", "TWILIO_* env vars"],
      ["SendGrid", "Alternative email provider (optional)", "SENDGRID_API_KEY"],
    ]
  );

  h2("9.3 AI & Video");
  table(
    ["Provider", "Use Case", "Configuration"],
    [
      ["OpenAI", "Clinical insights, NLP, documentation", "OPENAI_API_KEY"],
      ["Anthropic Claude", "Alternative AI clinical assistant", "ANTHROPIC_API_KEY"],
      ["LiveKit", "Telemedicine video rooms", "LIVEKIT_SERVER_URL, mk1.averox.com API"],
    ]
  );

  h2("9.4 Embeddable Chatbot");
  p(
    "External sites embed EmrSoft chatbot via public/chatbot-embed.js. Configuration: window.EmrSoftChatbot = { organizationId, apiKey, title, primaryColor, position, welcomeMessage }. Container element: <div id=\"emrsoft-chatbot\"></div>. Legacy CuraChatbot aliases supported for backward compatibility."
  );
  newPage();

  // ── 10. Frontend ───────────────────────────────────────────────────────
  h1("10. Frontend Architecture");
  h2("10.1 Stack & Patterns");
  bullet("React 18 + TypeScript compiled by Vite");
  bullet("Wouter for client-side routing with subdomain-aware paths");
  bullet("TanStack Query for server state, caching, and mutations");
  bullet("shadcn/ui + Radix UI + Tailwind CSS design system");
  bullet("React Hook Form + Zod for form validation");
  bullet("Theme: emrsoft-theme with light/dark mode (CSS variables --emrsoft-*)");

  h2("10.2 Branding Assets");
  table(
    ["Asset", "Path"],
    [
      ["Primary Logo", "/EMR-Soft-Logo/emr-logo.png"],
      ["Title Logo", "/EMR-Soft-Logo/emr-title-logo.png"],
      ["Dark Mode Logo", "/EMR-Soft-Logo/logo-Emrsoft-night.png"],
      ["Favicon", "/EMR-Soft-Logo/emr-title-logo.png"],
    ]
  );

  h2("10.3 Key Component Areas");
  bullet("components/auth/ — login, demo credentials panel, password reset");
  bullet("components/dashboards/ — role-specific dashboard widgets");
  bullet("components/consultation/ — full consultation interface");
  bullet("components/forms/ — form builder, fill, and share UI");
  bullet("components/integrations/ — QuickBooks, Stripe config panels");
  bullet("pages/saas/ — SaaS owner portal components");
  newPage();

  // ── 11. Deployment ───────────────────────────────────────────────────────
  h1("11. Deployment & Operations");
  h2("11.1 Build & Run Commands");
  table(
    ["Command", "Purpose"],
    [
      ["npm install", "Install deps + build encryption SDK"],
      ["npm run dev", "Development server (tsx server/index.ts + Vite HMR)"],
      ["npm run build", "Production build (Vite client + esbuild server bundle)"],
      ["npm start", "Run production server from dist/"],
      ["npm run db:push", "Sync Drizzle schema to PostgreSQL"],
      ["npm run db:demo-users-sql", "Generate demo user INSERT SQL"],
      ["npm run docs:emrsoft-spec-pdf", "Generate this specifications PDF"],
    ]
  );

  h2("11.2 Environment Variables (Key)");
  table(
    ["Variable", "Purpose"],
    [
      ["DATABASE_URL", "PostgreSQL connection string"],
      ["DB_SCHEMA", "PostgreSQL schema name (e.g. emrsoft_encrypted)"],
      ["BASE_URL", "Public app URL (https://app.emrsoft.ai/)"],
      ["JWT_SECRET", "JWT signing secret"],
      ["FORCE_SEED", "Force re-seed demo data on startup"],
      ["SMTP_* / EMAIL_FROM", "Email delivery configuration"],
      ["STRIPE_*", "Payment processing"],
      ["OPENAI_API_KEY", "AI features"],
      ["LIVEKIT_SERVER_URL", "Video telemedicine"],
      ["QUICKBOOKS_REDIRECT_URI", "QuickBooks OAuth callback"],
    ]
  );

  h2("11.3 Database Bootstrap");
  bullet("server/ensure-db-schema.ts creates schema if missing");
  bullet("Auto-runs drizzle-kit push when organizations table absent");
  bullet("Seed runs on startup when FORCE_SEED=true or empty database");
  bullet("Migrates legacy cura subdomain to emrsoft automatically");

  h2("11.4 Mobile Applications");
  p(
    "Flutter-based Doctor App and Patient App connect to the same REST API. Mobile clients require JWT auth and X-Tenant-Subdomain header. Features include appointments, records, prescriptions, lab results, push notifications, and offline sync."
  );
  newPage();

  // ── 12. Appendix ───────────────────────────────────────────────────────
  h1("12. Appendix");
  h2("12.1 NPM Dependencies (Selected)");
  table(
    ["Package", "Version", "Purpose"],
    [
      ["react", "^18.3.1", "UI framework"],
      ["express", "^4.21.2", "HTTP server"],
      ["drizzle-orm", "^0.39.1", "Database ORM"],
      ["stripe", "^18.5.0", "Payments"],
      ["openai", "^4.52.0", "AI"],
      ["@anthropic-ai/sdk", "^0.37.0", "Claude AI"],
      ["livekit-client", "^2.16.0", "Video calls"],
      ["socket.io", "^4.8.1", "Real-time events"],
      ["twilio", "^5.3.2", "SMS/WhatsApp"],
      ["jspdf", "^3.0.2", "PDF generation"],
      ["bcrypt", "^6.0.0", "Password hashing"],
      ["jsonwebtoken", "^9.0.2", "JWT auth"],
    ]
  );

  h2("12.2 Document History");
  table(
    ["Version", "Date", "Changes"],
    [
      ["1.0", GENERATED, "Initial EmrSoft application specifications — full platform reference"],
    ]
  );

  y += 10;
  doc.setDrawColor(...BRAND_BLUE);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 8;
  p("© 2025 Averox Private Ltd. All rights reserved. EmrSoft — AI-Powered Healthcare Platform.");
  p("Confidential — for authorized stakeholders only.");

  footer();
  doc.save(OUT_FILE);
  console.log(`✅ Generated: ${OUT_FILE}`);
}

main();
