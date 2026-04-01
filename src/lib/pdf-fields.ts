// ─── Types ────────────────────────────────────────────────────────────────────
//
// To add a new form step: add a new object to a form's sections array below.
// To add a new form packet: add a new key to FORM_FIELDS and a label to FORM_LABELS.

export type FieldType = 'text' | 'date' | 'tel' | 'textarea' | 'checkbox' | 'signature' | 'radio' | 'select'
export type PrefillKey = 'firstName' | 'lastName' | 'fullName' | 'dob' | 'phone'

export interface FormField {
  pdfName: string
  label: string
  type: FieldType
  prefill?: PrefillKey
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
  // When true, the selected radio option's value IS the PDF checkbox field name.
  // The group's pdfName is for data storage only; the option value is set to "true" in the PDF.
  expandToPdfCheckboxes?: boolean
  // When true, this field is captured elsewhere (e.g. intake kiosk) and should not
  // be rendered in the patient questionnaire, but still participates in PDF filling.
  hidden?: boolean
}

export interface FormSection {
  title: string
  fields: FormField[]
}

/**
 * Before passing values to loadAndFillPdf, call this to expand radio selections
 * into individual PDF checkbox entries (fieldName → "true").
 */
export function expandRadioValues(
  formName: string,
  values: Record<string, string>
): Record<string, string> {
  const result = { ...values }
  for (const section of FORM_FIELDS[formName] ?? []) {
    for (const field of section.fields) {
      if (field.expandToPdfCheckboxes && field.options) {
        const selected = values[field.pdfName]
        if (selected) {
          // The option value IS the PDF field name to check
          result[selected] = 'true'
        }
        // Remove the group key — it has no corresponding PDF field
        delete result[field.pdfName]
      }
    }
  }
  return result
}

export const FORM_FIELDS: Record<string, FormSection[]> = {

  // ─── REGISTRATION ──────────────────────────────────────────────────────────
  // registration.pdf has real AcroForm fields.
  // pdfName values must match the exact field names in the PDF.
  // Radio fields with expandToPdfCheckboxes:true → each option value IS the PDF checkbox name.
  registration: [
    {
      title: 'Your Name',
      fields: [
        { pdfName: 'LAST NAME',  label: 'Last Name',      type: 'text', prefill: 'lastName',  required: true },
        { pdfName: 'FIRST NAME', label: 'First Name',     type: 'text', prefill: 'firstName', required: true },
        { pdfName: 'MI',         label: 'Middle Initial', type: 'text', placeholder: 'M' },
      ],
    },
    {
      title: 'Personal Details',
      fields: [
        { pdfName: 'DOB', label: 'Date of Birth', type: 'date', prefill: 'dob', required: true },
        {
          // PDF has checkboxes undefined_2 (M) and undefined_3 (F) — expand to check the right one
          pdfName: 'GENDER',
          label: 'Gender',
          type: 'radio',
          expandToPdfCheckboxes: true,
          options: [
            { label: 'Male',   value: 'undefined_2' },
            { label: 'Female', value: 'undefined_3' },
          ],
        },
        {
          // PDF has separate checkboxes named Single / Married / Divorced / Separated / Widowed
          pdfName: 'MARITAL STATUS',
          label: 'Marital Status',
          type: 'radio',
          expandToPdfCheckboxes: true,
          options: [
            { label: 'Single',    value: 'Single' },
            { label: 'Married',   value: 'Married' },
            { label: 'Divorced',  value: 'Divorced' },
            { label: 'Separated', value: 'Separated' },
            { label: 'Widowed',   value: 'Widowed' },
          ],
        },
      ],
    },
    {
      title: 'Contact Info',
      fields: [
        { pdfName: 'PHONE NUMBER',           label: 'Phone Number',           type: 'tel',  prefill: 'phone', required: true },
        { pdfName: 'SOCIAL SECURITY NUMBER', label: 'Social Security Number', type: 'text', placeholder: 'XXX-XX-XXXX' },
        { pdfName: 'EMAIL ADDRESS',          label: 'Email Address',          type: 'text', placeholder: 'you@example.com' },
      ],
    },
    {
      title: 'Home Address',
      fields: [
        { pdfName: 'STREET ADDRESS APT', label: 'Street Address & Apt', type: 'text', required: true },
        { pdfName: 'CITYSTATEZIP',       label: 'City, State, ZIP',     type: 'text', placeholder: 'Dallas, TX 75001', required: true },
      ],
    },
    {
      title: 'Employment',
      fields: [
        { pdfName: 'EMPLOYER',              label: 'Employer',       type: 'text', placeholder: 'Leave blank if unemployed' },
        { pdfName: 'EMPLOYER PHONE NUMBER', label: 'Employer Phone', type: 'tel' },
      ],
    },
    {
      title: 'Your Doctor & Preferences',
      fields: [
        { pdfName: 'PRIMARY CARE PHYSICIAN PCP', label: 'Primary Care Physician (PCP)', type: 'text', placeholder: 'Dr. Name' },
        { pdfName: 'PCP PHONE NUMBER',           label: 'PCP Phone Number',             type: 'tel' },
        {
          // PDF has checkboxes: "Spanish" (PDFCheckBox) and "Other" (PDFCheckBox).
          // "English" has no real checkbox — it's the implicit default.
          // Using a non-existent key for English so pdf-lib skips it silently.
          pdfName: 'PREFERRED LANGUAGE',
          label: 'Preferred Language',
          type: 'radio',
          expandToPdfCheckboxes: true,
          options: [
            { label: 'English', value: 'lang_english' },
            { label: 'Spanish', value: 'Spanish' },
            { label: 'Other',   value: 'Other' },
          ],
        },
        {
          // Captured at intake kiosk — hidden from questionnaire but still fills PDF checkboxes
          pdfName: 'HOW DID YOU HEAR',
          label: 'How Did You Hear About Us?',
          type: 'radio',
          hidden: true,
          expandToPdfCheckboxes: true,
          options: [
            { label: 'Drive By',        value: 'Drive by' },
            { label: 'Internet',        value: 'Internet' },
            { label: 'Doctor',          value: 'Doctor' },
            { label: 'Advertisement',   value: 'Advertisement' },
            { label: 'Friend / Family', value: 'FriendFamily' },
          ],
        },
      ],
    },
    {
      title: 'Ethnicity & Race',
      fields: [
        {
          // PDF checkboxes: undefined_11 = Hispanic or Latino, undefined_12 = Not Hispanic or Latino
          pdfName: 'ETHNICITY',
          label: 'Ethnicity',
          type: 'radio',
          required: true,
          expandToPdfCheckboxes: true,
          options: [
            { label: 'Hispanic or Latino',     value: 'undefined_11' },
            { label: 'Not Hispanic or Latino', value: 'undefined_12' },
          ],
        },
        // Race — pdfName matches the exact PDF checkbox field name
        { pdfName: 'American Indian Alaskan Native',      label: 'American Indian / Alaskan Native',    type: 'checkbox' },
        { pdfName: 'Asian',                               label: 'Asian',                               type: 'checkbox' },
        { pdfName: 'undefined_13',                        label: 'Black or African American',           type: 'checkbox' },
        { pdfName: 'Native Hawaiian or Pacific Islander', label: 'Native Hawaiian or Pacific Islander', type: 'checkbox' },
        { pdfName: 'White',                               label: 'White',                               type: 'checkbox' },
        { pdfName: 'Other_4',                             label: 'Other race',                          type: 'checkbox' },
      ],
    },
    {
      title: 'Emergency Contact',
      fields: [
        // CONTACT FIRST NAME + CONTACT LAST NAME are combined into "NAME OF CONTACT" before PDF filling
        { pdfName: 'CONTACT FIRST NAME',                label: 'Contact First Name',      type: 'text', required: true },
        { pdfName: 'CONTACT LAST NAME',                 label: 'Contact Last Name',       type: 'text', required: true },
        { pdfName: 'CONTACT PHONE NUMBER',              label: 'Contact Phone',           type: 'tel',  required: true },
        { pdfName: 'LEAVE MESSAGE YES NO RELATIONSHIP', label: 'Relationship to Patient', type: 'text', required: true, placeholder: 'Spouse, Parent, Friend...' },
      ],
    },
    {
      title: 'Insurance Information',
      fields: [
        { pdfName: 'SUBSCRIBERS LAST NAME FIRST NAME MI', label: 'Subscriber Name',  type: 'text', placeholder: 'Last, First, MI' },
        { pdfName: 'MEMBER ID',                           label: 'Member ID',        type: 'text' },
        { pdfName: 'SOCIAL SECURITY NUMBER_2',            label: 'Subscriber SSN',   type: 'text', placeholder: 'XXX-XX-XXXX' },
      ],
    },
    {
      title: 'Consent & Signature',
      fields: [
        { pdfName: 'Acknowledge',       label: 'Initials — I understand I am checking into a free-standing emergency room, not an urgent care.', type: 'text', required: true, placeholder: 'Your initials' },
        { pdfName: 'Patient Name',      label: 'Print Your Full Name',    type: 'text', prefill: 'fullName', required: true },
        { pdfName: 'Date of Birth',     label: 'Date of Birth (confirm)', type: 'date', prefill: 'dob',      required: true },
        { pdfName: 'Patient Signature', label: 'Signature',               type: 'signature', required: true },
        // Hidden: pre-fills "Print Patient Name" on HIPAA page
        { pdfName: 'Text3', label: 'Patient Name (HIPAA)', type: 'text', prefill: 'fullName', hidden: true },
      ],
    },
  ],

  // ─── MOTOR VEHICLE ACCIDENT ────────────────────────────────────────────────
  // mva.pdf is a scanned form — no AcroForm fields.
  mva: [
    {
      title: 'Accident Details',
      fields: [
        { pdfName: 'accident_datetime',    label: 'Date & Time of Accident',                    type: 'text',     required: true, placeholder: 'e.g. 01/15/2025, 2:30 PM' },
        { pdfName: 'accident_location',    label: 'Location of Accident',                       type: 'text',     required: true, placeholder: 'Intersection, highway, address...' },
        { pdfName: 'accident_description', label: 'Describe the accident and who was at fault', type: 'textarea', required: true },
        { pdfName: 'impact_location',      label: 'Location of impact to vehicle',              type: 'text',     placeholder: 'Front, rear, driver side...' },
      ],
    },
    {
      title: 'Police & Vehicle',
      fields: [
        { pdfName: 'police_called',    label: 'Were the police called?',            type: 'radio', options: [{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }] },
        { pdfName: 'ticket_number',    label: 'Ticket # (if issued)',               type: 'text' },
        { pdfName: 'accident_report',  label: 'Accident Report #',                 type: 'text' },
        { pdfName: 'airbags_deployed', label: 'Did airbags deploy?',               type: 'radio', options: [{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }] },
        { pdfName: 'seatbelts_worn',   label: 'Seatbelts worn by all passengers?', type: 'radio', options: [{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }] },
      ],
    },
    {
      title: 'Other Driver',
      fields: [
        { pdfName: 'other_driver_info', label: 'Other driver name & insurance info', type: 'textarea', placeholder: 'Name, insurance company, policy number...' },
      ],
    },
    {
      title: 'Your Insurance',
      fields: [
        { pdfName: 'mv_policy_name',        label: 'Motor Vehicle Policy Name',   type: 'text' },
        { pdfName: 'mv_policy_number',      label: 'Motor Vehicle Policy Number', type: 'text' },
        { pdfName: 'claims_adjuster_name',  label: "Claims Adjuster's Name",      type: 'text' },
        { pdfName: 'claims_adjuster_phone', label: "Claims Adjuster's Phone",     type: 'tel' },
        { pdfName: 'claims_address',        label: 'Claims Address',              type: 'text' },
      ],
    },
    {
      title: 'Attorney Information',
      fields: [
        { pdfName: 'attorney_office_name', label: 'Attorney Office Name',  type: 'text', placeholder: 'Leave blank if none' },
        { pdfName: 'attorney_name',        label: 'Attorney Name',         type: 'text' },
        { pdfName: 'attorney_phone',       label: 'Attorney Office Phone', type: 'tel' },
      ],
    },
  ],

  // ─── WORKER'S COMPENSATION ─────────────────────────────────────────────────
  // workers_comp.pdf is a scanned form — no AcroForm fields.
  workers_comp: [
    {
      title: 'Patient Information',
      fields: [
        { pdfName: 'wc_patient_name', label: 'Patient Name',           type: 'text', prefill: 'fullName', required: true },
        { pdfName: 'wc_dob',          label: 'Date of Birth',          type: 'date', prefill: 'dob',      required: true },
        { pdfName: 'wc_ssn',          label: 'Social Security Number', type: 'text', placeholder: 'XXX-XX-XXXX' },
      ],
    },
    {
      title: 'Employer Information',
      fields: [
        { pdfName: 'employer_name',    label: 'Employer Name',         type: 'text', required: true },
        { pdfName: 'employer_address', label: 'Employer Address',      type: 'text' },
        { pdfName: 'supervisor_name',  label: "Supervisor's Name",     type: 'text' },
        { pdfName: 'supervisor_phone', label: 'Supervisor Phone No.',  type: 'tel' },
        { pdfName: 'fax_number',       label: 'Fax No.',               type: 'tel' },
      ],
    },
    {
      title: 'Injury Details',
      fields: [
        { pdfName: 'injury_date',         label: 'Date of Injury',                        type: 'date',     required: true },
        { pdfName: 'chief_complaint',     label: 'Chief Complaint / Describe the Injury', type: 'textarea', required: true, placeholder: 'Describe the injury and how it happened...' },
        { pdfName: 'insurance_company',   label: 'Workers Comp Insurance Company',        type: 'text' },
        { pdfName: 'claims_mail_address', label: 'Claims Mailing Address',               type: 'text' },
        { pdfName: 'claim_number',        label: 'Claim Number (if known)',               type: 'text', placeholder: 'Leave blank if unknown' },
      ],
    },
  ],
}

export const FORM_LABELS: Record<string, string> = {
  registration:  'Registration',
  mva:           'Motor Vehicle Accident',
  workers_comp:  "Worker's Compensation",
}
