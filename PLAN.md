# ER Intake Flow — Full Build Plan

## Context
Building a greenfield digital patient intake system to replace paper-based ER registration. Currently only a README exists. The system has 3 surfaces: an iPad intake kiosk, a front desk dashboard, and a mobile PDF form filler sent via SMS.

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: Supabase (Postgres) — patient records, status tracking, form state; realtime via `postgres_changes`
- **SMS**: Twilio — send PDF form links to patients
- **PDF**: pdf-lib — parse form fields, render custom mobile UI, fill + flatten PDF on submit
- **Styling**: Tailwind CSS + shadcn/ui + Framer Motion — "Precision Clinical" aesthetic
- **Fonts**: Geist Sans (body) + IBM Plex Mono (clock/timestamps)
- **Auth**: None for now

---

## Database Schema (Supabase)

### `patients` table
```sql
id (uuid, pk)
created_at (timestamp)
name (text)
dob (date)
phone (text)
reason (text)
id_photo_url (text)        -- Supabase Storage URL
insurance_photo_url (text) -- Supabase Storage URL
status (enum: 'waiting_for_forms' | 'filling_forms' | 'submitted' | 'audited')
forms_to_send (text[])     -- ['registration', 'mva', 'workers_comp']
form_submission_url (text) -- URL of filled PDF after patient submits
updated_at (timestamp)
```

### Supabase Storage Buckets
- `patient-photos` — ID and insurance card photos from intake
- `patient-forms` — Filled/flattened PDFs after submission

---

## Routes & Pages

### `/intake` — iPad Kiosk (Patient-facing)

**Aesthetic**: Full-screen, dark slate background — feels like checking into an airline or modern hotel, not a hospital. Large, confident typography. One thing on screen at a time. Progress bar across the top.

**Layout**: Centered card, max-width 560px, vertically centered. `min-h-screen bg-slate-900`. No navigation, no sidebar — distraction-free.

**Progress indicator** — top of screen, 3 steps:
```
●━━━━━━━━━●━━━━━━━━━○
Step 1     Step 2     Done
```
Animated fill bar using Framer Motion `scaleX`.

---

**Step 1 — Basic Info** (`/intake` default view)

Card: `bg-slate-800 rounded-3xl p-10 shadow-2xl border border-slate-700`

Fields (large, tap-friendly, 56px height inputs):
- Full Name — text input
- Date of Birth — date input (native picker works well on iPad)
- Phone Number — tel input with US formatting
- Reason for Visit — textarea (3 rows), "Briefly describe your symptoms"

Input style: `bg-slate-700/60 border border-slate-600 text-white text-lg rounded-xl px-5 py-4 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20` — dark inputs, white text, blue focus ring

"Continue →" button: full-width, `bg-blue-500 hover:bg-blue-400 text-white font-semibold text-lg h-14 rounded-xl` — large, confident

Validation: inline error messages below each field (red-400 text), no form submission until all fields valid

Transition to Step 2: `AnimatePresence` — step 1 slides left out, step 2 slides in from right

---

**Step 2 — Photo Capture**

Two photo capture sections stacked vertically:

```
┌─────────────────────────────────────┐
│  Government-issued ID               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   [Camera icon]             │    │  ← tap to open camera
│  │   Tap to take photo         │    │
│  └─────────────────────────────┘    │
│                                     │
│  Insurance Card                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   [Camera icon]             │    │
│  │   Tap to take photo         │    │
│  └─────────────────────────────┘    │
│                                     │
│  [← Back]          [Submit →]       │
└─────────────────────────────────────┘
```

Photo capture: `<input type="file" accept="image/*" capture="environment" />` hidden, triggered by tapping the camera zone

After capture: shows image preview in place of camera icon (object-cover, rounded-xl), with a "Retake" button overlay

"Skip" option below each section (small, muted text) — photos are optional

"Submit →" button: disabled until Step 1 data is valid; enabled even if photos are skipped
- On tap: shows loading state ("Submitting...")
- POST to `/api/patients` with FormData (name, dob, phone, reason, id_photo?, insurance_photo?)
- Photos uploaded to Supabase Storage bucket `patient-photos`

---

**Thank You Screen** (after successful submit)

Full-screen centered, animate in with scale + fade:
```
        ✓  (large emerald checkmark, animated draw-on)

   You're all checked in

   Watch for a text message at (555) 012-3456
   with a link to complete your forms.

   [Return to Start]   ← resets after 30s automatically
```

Background: subtle emerald glow behind the checkmark (`radial-gradient`)
Auto-reset countdown: "Returning to start in 28s..." counts down, resets page state

---

**API route**: `POST /api/patients`
- Receives FormData
- Uploads photos to Supabase Storage `patient-photos` bucket → gets public URLs
- Inserts patient row with `status: 'waiting_for_forms'`
- Returns `{ id, name }`

**Key files**:
- `src/app/intake/page.tsx` — kiosk page (client component, multi-step state)
- `src/components/intake/StepIndicator.tsx` — animated progress bar
- `src/components/intake/BasicInfoStep.tsx` — Step 1 form
- `src/components/intake/PhotoCaptureStep.tsx` — Step 2 camera
- `src/components/intake/ThankYouScreen.tsx` — confirmation
- `src/app/api/patients/route.ts` — POST handler

---

### `/` — Front Desk Dashboard ✅ BUILT

**Layout**: Full-height sidebar + main content area

**Sidebar** (`src/components/dashboard/Sidebar.tsx`)
- Dark slate-900, fixed left, 256px wide
- Logo with red glow indicator ("system live")
- Nav links: Queue (active), Intake Kiosk, Audit
- Live status breakdown: Waiting / Filling / Submitted / Audited with live counts
- Total patient count
- IBM Plex Mono live clock at the bottom

**Top bar** — sticky, frosted glass (`bg-white/60 backdrop-blur-sm`)
- "Today's Queue" heading + full date (`EEEE, MMMM d, yyyy`)

**Stat cards row** — 5 cards: Total / Waiting / Filling / Submitted / Audited
- Each card: colored bg + border + icon + big monospace number
- Colors: slate / amber / blue / violet / emerald

**Patient queue table** (`src/components/dashboard/PatientQueue.tsx`)
- Column headers: Patient | Phone | Check-in | Status
- Rounded-2xl white card with shadow

**Patient rows** (`src/components/dashboard/PatientRow.tsx`)
- Status-colored 4px left border (CSS transition on status change)
- Initials avatar (colored to match status)
- Name (bold, 16px) + reason on second line
- Phone, check-in time (IBM Plex Mono) + relative time
- Status badge (pill with animated pulse ring for "Waiting")
- "NEW" pill for patients < 5 min old
- Spring physics entry/exit animation (Framer Motion `layout`)

**Patient slide-over** (`src/components/dashboard/PatientSlideOver.tsx`)
- Springs in from right (420px wide), backdrop blur
- Patient info: name, DOB + age, phone, reason
- Photo thumbnails (ID + Insurance) with full-screen lightbox
- Form selector: Registration (required) + MVA + Workers Comp checkboxes
- Send Forms button: 3-state (idle → loading → success/error)
- Conditional CTAs: "Review & Audit" (violet) or "Download PDF" (emerald) by status

**Realtime**: Supabase `postgres_changes` subscription on `patients` — INSERT prepends to top, UPDATE swaps in place; slide-over stays in sync

---

### `/form/[patientId]` — Patient PDF Form Filler (Mobile)

**Aesthetic**: Clean white mobile-first UI — feels like a well-designed insurance app. Single column, generous padding, large tap targets. No chrome, no sidebar. Progress bar at top showing how many forms are left.

**Layout**: `min-h-screen bg-white`, max-width 480px centered, safe-area padding for iPhone notch.

**Entry flow**:
1. Patient opens SMS link on phone → page loads, fetches their record
2. Shows which forms they need to fill (`patient.forms_to_send`)
3. Renders one form at a time as a multi-section mobile UI (not the raw PDF)
4. On final submit: pdf-lib fills + flattens all PDFs → uploads to Supabase → status → `submitted`

---

**Header** (sticky, white, border-b):
```
← Back   Registration Packet (1 of 2)   [●●○]
```
- Form name + progress dots
- Back button only shown after page 1

**Form rendering** (`/form/[patientId]`):

Each PDF has its fields extracted via pdf-lib at build time into a field map (`src/lib/pdf-fields.ts`). Fields are grouped into logical sections:

*Registration Packet sections*:
- **Personal Information** — Full name, DOB, SSN (last 4), address, city, state, zip
- **Emergency Contact** — Name, relationship, phone
- **Insurance Information** — Provider, policy number, group number, subscriber name
- **Consent** — Checkbox: "I consent to treatment" + signature field

*MVA (Motor Vehicle Accident) sections*:
- **Accident Details** — Date of accident, description, fault party
- **Vehicle Info** — Make, model, year, insurance carrier
- **Attorney Info** — Name, firm, phone (optional)

*Workers' Comp sections*:
- **Employer Info** — Employer name, address, supervisor name, phone
- **Injury Details** — Date of injury, how it happened, body part affected
- **Case Info** — Claim number (optional)

**Input style** (mobile-optimized):
```
bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base
text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15
w-full h-14 (text inputs) / h-28 (textareas)
```

**Section headers**: `text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4`

**Pre-filled fields** (from intake data, shown with a blue "Pre-filled" indicator):
- Full Name, Date of Birth — locked, can't be edited (shown grayed with lock icon)

**Signature field**: Canvas-based (`react-signature-canvas`), inside a bordered box — `border-2 border-dashed border-slate-300 rounded-xl`, "Sign here" placeholder text, "Clear" button

**Navigation**:
- "Next Section →" button (full-width, blue) — validates current section before advancing
- "← Previous" link (top-left)
- Final section: "Submit Forms →" (green, full-width)

**Submit flow**:
1. Client-side: for each form in `forms_to_send`, load the PDF from `/public/forms/`, fill all fields via pdf-lib, flatten
2. Bundle all filled PDFs into a zip or merge into one PDF
3. Upload to Supabase Storage `patient-forms` bucket
4. `POST /api/patients/[id]/submit` with the storage URL
5. Redirect to thank-you screen

**Thank you screen**:
```
     ✓ Forms submitted!

  Thank you, Sarah. Your forms have been
  received and are being reviewed.

  You can close this window.
```
Emerald checkmark, same animated draw-on style as intake kiosk.

---

**Key files**:
- `src/app/form/[patientId]/page.tsx` — main form page (client component)
- `src/components/form/FormProgress.tsx` — top progress bar + form name
- `src/components/form/FormSection.tsx` — renders a group of fields
- `src/components/form/SignatureField.tsx` — canvas signature pad
- `src/components/form/FormThankYou.tsx` — confirmation screen
- `src/lib/pdf-fields.ts` — field map for each PDF (name → label → section)
- `src/lib/pdf.ts` — pdf-lib helpers (load, fill, flatten, merge)
- `src/app/api/patients/[id]/submit/route.ts` — POST handler

---

### `/audit/[patientId]` — Front Desk Audit View

**Aesthetic**: Matches the front desk dashboard — white/slate, professional. Split-pane layout on desktop: PDF viewer on left, audit tools on right.

**Layout**:
```
┌──────────────────────────────────┬─────────────────────┐
│  PDF Viewer (flex-1)             │  Audit Panel (320px) │
│                                  │                      │
│  ┌────────────────────────────┐  │  Patient: Sarah J.   │
│  │                            │  │  Submitted: 2:34 PM  │
│  │   [Filled PDF iframe]      │  │                      │
│  │                            │  │  SIGNATURES NEEDED   │
│  │                            │  │  ┌────────────────┐  │
│  │                            │  │  │  Sign here     │  │
│  │                            │  │  └────────────────┘  │
│  │                            │  │  [Clear]             │
│  └────────────────────────────┘  │                      │
│  [← Prev page]  [1/3]  [Next →]  │  NOTES (optional)    │
│                                  │  ┌────────────────┐  │
│                                  │  │  textarea      │  │
│                                  │  └────────────────┘  │
│                                  │                      │
│                                  │  ┌────────────────┐  │
│                                  │  │ Complete Audit │  │ ← emerald
│                                  │  └────────────────┘  │
└──────────────────────────────────┴─────────────────────┘
```

**PDF viewer**: `<iframe src={patient.form_submission_url} />` — renders the filled PDF directly. Page navigation controls below (if multi-page).

**Audit panel** (right side, `w-80`, `bg-white`, `border-l border-slate-200`):
- Patient name + submission time
- "SIGNATURES NEEDED" section label
- Canvas signature pad (`react-signature-canvas`) — 280×120px, dashed border
- "Clear" button below canvas
- "AUDITOR NOTES" — optional textarea
- "Complete Audit →" button (emerald, full-width, disabled until signature is drawn)

**Complete Audit flow**:
1. Get drawn signature as PNG data URL from canvas
2. Load the submitted PDF bytes from Supabase Storage
3. Use pdf-lib to stamp the signature image at the designated signature coordinates
4. Flatten + re-upload to Supabase Storage `patient-forms` (overwrites or new file)
5. `POST /api/patients/[id]/audit` → sets status to `audited`, saves notes
6. Redirect back to dashboard with success toast

**Key files**:
- `src/app/audit/[patientId]/page.tsx` — audit page
- `src/components/audit/PdfViewer.tsx` — iframe-based PDF viewer with page controls
- `src/components/audit/AuditPanel.tsx` — signature + notes + CTA
- `src/app/api/patients/[id]/audit/route.ts` — POST handler

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/patients` | Create patient, upload photos to Supabase Storage |
| GET | `/api/patients` | List all patients (dashboard) |
| GET | `/api/patients/[id]` | Get single patient |
| POST | `/api/send-forms` | Update forms selection, send Twilio SMS |
| POST | `/api/patients/[id]/submit` | Upload filled PDF, set status to submitted |
| POST | `/api/patients/[id]/audit` | Upload audited PDF, set status to audited |

---

## PDF Handling Strategy

**Original PDFs**: place in `/public/forms/` — `registration.pdf`, `mva.pdf`, `workers_comp.pdf`

**Field map** (`src/lib/pdf-fields.ts`): a static config mapping each PDF's AcroForm field names to human-readable labels + section groupings. Built by inspecting the PDF once with pdf-lib. Example:
```ts
export const FORM_FIELDS = {
  registration: [
    { section: 'Personal Information', fields: [
      { pdfName: 'patient_name', label: 'Full Name', type: 'text', prefill: 'name' },
      { pdfName: 'dob', label: 'Date of Birth', type: 'date', prefill: 'dob' },
      ...
    ]},
  ],
}
```

**Fill flow** (client-side in `/form/[patientId]`):
```ts
import { PDFDocument } from 'pdf-lib'

// 1. Fetch original PDF bytes
const pdfBytes = await fetch('/forms/registration.pdf').then(r => r.arrayBuffer())
// 2. Load and get form
const pdfDoc = await PDFDocument.load(pdfBytes)
const form = pdfDoc.getForm()
// 3. Fill each field
form.getTextField('patient_name').setText(values.name)
// 4. Flatten (makes fields non-editable)
form.flatten()
// 5. Serialize
const filledBytes = await pdfDoc.save()
```

**Signature stamping** (audit view, server-side):
```ts
// Load submitted PDF, embed signature PNG, stamp at coordinates, flatten, re-save
const sigImage = await pdfDoc.embedPng(signatureDataUrl)
const page = pdfDoc.getPages()[signaturePage]
page.drawImage(sigImage, { x, y, width, height })
```

**Storage paths**:
- Photos: `patient-photos/{patientId}/id.jpg`, `patient-photos/{patientId}/insurance.jpg`
- Filled forms: `patient-forms/{patientId}/filled.pdf`
- Audited forms: `patient-forms/{patientId}/audited.pdf`

---

## Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
NEXT_PUBLIC_BASE_URL=
```

---

## Build Order

1. ✅ Project setup — Next.js 16, Tailwind, shadcn/ui, Framer Motion, date-fns, twilio
2. ✅ Supabase — `patients` table + enum + RLS + realtime publication
3. ✅ `/` dashboard — sidebar, stat cards, patient queue, slide-over, realtime
4. ✅ `/intake` — iPad kiosk (dark, full-screen, 3-step flow)
5. ✅ Supabase Storage — `patient-photos` + `patient-forms` buckets
6. ✅ `POST /api/patients` — create patient, upload photos
7. 🔄 `/form/[patientId]` — **approach changed: use embedded PDF viewer (see note below)**
8. ⬜ `/audit/[patientId]` — front desk audit + signature
9. ⬜ Polish — loading skeletons, error boundaries, empty states

### Note on `/form/[patientId]` approach

Originally built as a custom mobile UI form (collecting data section by section, then filling PDFs via pdf-lib on submit). **Decision: replace with an embedded PDF viewer** so patients fill the actual PDF directly — similar to how DocuSign works.

**PDF field findings:**
- `registration.pdf` — has real AcroForm fields (88 fields including text, checkboxes, signatures)
- `mva.pdf` — scanned form, **no AcroForm fields**
- `workers_comp.pdf` — scanned form, **no AcroForm fields**

**New approach for `/form/[patientId]`:**
- Render the PDF inline in the browser using a PDF.js-based viewer (e.g. `@mikecousins/react-pdf` or `react-pdf` + custom overlay)
- For `registration.pdf`: overlay inputs directly on top of the AcroForm field positions, pre-fill name/DOB/phone from intake data
- For `mva.pdf` + `workers_comp.pdf`: since they have no AcroForm fields, options are:
  - (a) Render PDF as background image + float inputs at hardcoded coordinates
  - (b) Replace PDFs with proper fillable versions (recommended long-term)
  - (c) Keep custom UI form for those two, PDF viewer only for registration
- Patient fills in the PDF visually, signs where indicated, submits
- On submit: use pdf-lib to bake values into the PDF → upload to Supabase → status → `submitted`

**Files built (custom UI approach — to be reworked):**
- `src/app/form/[patientId]/page.tsx` — multi-step form page
- `src/components/form/FormProgress.tsx` — section progress header
- `src/components/form/FormSection.tsx` — renders section fields
- `src/components/form/SignatureField.tsx` — canvas signature pad
- `src/components/form/FormThankYou.tsx` — confirmation screen
- `src/lib/pdf-fields.ts` — field map (real AcroForm names for registration)
- `src/lib/pdf.ts` — pdf-lib fill/flatten/merge helpers
- `src/app/api/patients/[id]/route.ts` — GET single patient
- `src/app/api/patients/[id]/submit/route.ts` — POST submit handler

---

## Key Files

```
src/
  app/
    page.tsx                              # ✅ Front desk dashboard
    layout.tsx                            # ✅ Fonts (Geist + IBM Plex Mono)
    globals.css                           # ✅ Keyframes, scrollbar, body bg
    intake/
      page.tsx                            # ⬜ iPad kiosk (multi-step)
    form/[patientId]/
      page.tsx                            # ⬜ Patient PDF form filler
    audit/[patientId]/
      page.tsx                            # ⬜ Audit view
    api/
      patients/route.ts                   # ⬜ POST /api/patients
      patients/[id]/route.ts              # ⬜ GET single patient
      patients/[id]/submit/route.ts       # ⬜ POST form submission
      patients/[id]/audit/route.ts        # ⬜ POST audit complete
      send-forms/route.ts                 # ✅ Twilio SMS
  components/
    dashboard/
      Sidebar.tsx                         # ✅ Dark sidebar with nav + status counts
      PatientQueue.tsx                    # ✅ Animated list with column headers
      PatientRow.tsx                      # ✅ Avatar + name + reason + status badge
      StatusBadge.tsx                     # ✅ Colored pill with pulse ring
      PatientSlideOver.tsx               # ✅ Spring slide-over panel
      PatientDetail.tsx                  # ✅ Slide-over content
      FormSelector.tsx                   # ✅ Form checkboxes
      PhotoThumbnail.tsx                 # ✅ Thumbnail + lightbox
      SendFormsButton.tsx                # ✅ 3-state CTA button
      LiveClock.tsx                      # ✅ IBM Plex Mono ticking clock
      PatientCountBadge.tsx             # ✅ Animated count swap
    intake/
      StepIndicator.tsx                  # ✅ Progress bar (3 steps)
      BasicInfoStep.tsx                  # ✅ Step 1 form
      PhotoCaptureStep.tsx               # ✅ Step 2 camera
      ThankYouScreen.tsx                 # ✅ Confirmation + auto-reset
    form/
      FormProgress.tsx                   # ✅ Section progress header (custom UI)
      FormSection.tsx                    # ✅ Field renderer (custom UI)
      SignatureField.tsx                 # ✅ Canvas signature pad
      FormThankYou.tsx                   # ✅ Thank you screen
  lib/
    supabase.ts                          # ✅ Supabase browser client
    pdf-fields.ts                        # ✅ Field map (real AcroForm names for registration)
    pdf.ts                               # ✅ pdf-lib fill/flatten/merge helpers
  types/
    patient.ts                           # ✅ Patient type + PatientStatus union
public/
  forms/
    registration.pdf                     # ✅ Frisco ER — has real AcroForm fields
    mva.pdf                              # ✅ Frisco ER — scanned, no AcroForm fields
    workers_comp.pdf                     # ✅ Frisco ER — scanned, no AcroForm fields
```

---

## Verification
1. Run `npm run dev`, navigate to `/intake` on iPad — complete a patient intake
2. Open `/` on desktop — verify patient appears in queue with "Waiting for Forms" status
3. Click patient → select forms → "Send Forms" → verify Twilio SMS arrives on phone
4. Open SMS link on phone → fill out form → submit
5. Dashboard status updates to "Forms Submitted" (realtime, no refresh needed)
6. Click "Audit Forms" → review PDF → add signature → complete audit
7. "Download Forms" button downloads the final flattened PDF
