export type FieldType = 'text' | 'date' | 'tel' | 'textarea' | 'checkbox' | 'signature'
export type PrefillKey = 'firstName' | 'lastName' | 'fullName' | 'dob' | 'phone'

export interface FormField {
  pdfName: string
  label: string
  type: FieldType
  prefill?: PrefillKey
  required?: boolean
  placeholder?: string
}

export interface FormSection {
  title: string
  fields: FormField[]
}

export const FORM_FIELDS: Record<string, FormSection[]> = {
  // registration.pdf has real AcroForm fields — pdfName values are the exact field names
  registration: [
    {
      title: 'Patient Information',
      fields: [
        { pdfName: 'LAST NAME',        label: 'Last Name',      type: 'text', prefill: 'lastName',  required: true },
        { pdfName: 'FIRST NAME',       label: 'First Name',     type: 'text', prefill: 'firstName', required: true },
        { pdfName: 'MI',               label: 'Middle Initial', type: 'text', placeholder: 'M' },
        { pdfName: 'DOB',              label: 'Date of Birth',  type: 'date', prefill: 'dob',        required: true },
        { pdfName: 'PHONE NUMBER',     label: 'Phone Number',   type: 'tel',  prefill: 'phone',      required: true },
        { pdfName: 'SOCIAL SECURITY NUMBER', label: 'Social Security Number', type: 'text', placeholder: 'XXX-XX-XXXX' },
        { pdfName: 'STREET ADDRESS APT', label: 'Street Address & Apt', type: 'text', required: true },
        { pdfName: 'CITYSTATEZIP',     label: 'City, State, ZIP', type: 'text', placeholder: 'Dallas, TX 75001', required: true },
        { pdfName: 'EMAIL ADDRESS',    label: 'Email Address',  type: 'text', placeholder: 'you@example.com' },
        { pdfName: 'EMPLOYER',         label: 'Employer',       type: 'text' },
        { pdfName: 'EMPLOYER PHONE NUMBER', label: 'Employer Phone', type: 'tel' },
      ],
    },
    {
      title: 'Emergency Contact',
      fields: [
        { pdfName: 'NAME OF CONTACT',  label: 'Contact Name',   type: 'text', required: true },
        { pdfName: 'CONTACT PHONE NUMBER', label: 'Contact Phone', type: 'tel', required: true },
        { pdfName: 'LEAVE MESSAGE YES NO RELATIONSHIP', label: 'Relationship to Patient', type: 'text', required: true, placeholder: 'Spouse, Parent, Friend...' },
      ],
    },
    {
      title: 'Insurance Information',
      fields: [
        { pdfName: 'SUBSCRIBERS LAST NAME FIRST NAME MI', label: 'Subscriber Name', type: 'text', placeholder: 'Last, First, MI' },
        { pdfName: 'MEMBER ID',        label: 'Member ID',      type: 'text' },
        { pdfName: 'SOCIAL SECURITY NUMBER_2', label: 'Subscriber SSN', type: 'text', placeholder: 'XXX-XX-XXXX' },
        { pdfName: 'PRIMARY CARE PHYSICIAN PCP', label: 'Primary Care Physician', type: 'text' },
        { pdfName: 'PCP PHONE NUMBER', label: 'PCP Phone Number', type: 'tel' },
      ],
    },
    {
      title: 'Consent & Signature',
      fields: [
        { pdfName: 'Acknowledge', label: 'Initials — I understand I am checking into a free-standing emergency room, not an urgent care.', type: 'text', required: true, placeholder: 'Your initials' },
        { pdfName: 'Patient Name', label: 'Print Your Full Name', type: 'text', prefill: 'fullName', required: true },
        { pdfName: 'Date of Birth', label: 'Date of Birth (confirm)', type: 'date', prefill: 'dob', required: true },
        { pdfName: 'Patient Signature', label: 'Signature', type: 'signature', required: true },
      ],
    },
  ],

  // mva.pdf is a scanned form — no AcroForm fields, pdfName values are for data capture only
  mva: [
    {
      title: 'Accident Details',
      fields: [
        { pdfName: 'accident_datetime',    label: 'Date & Time of Accident',     type: 'text',     required: true, placeholder: 'e.g. 01/15/2025, 2:30 PM' },
        { pdfName: 'accident_location',    label: 'Location of Accident',        type: 'text',     required: true, placeholder: 'Intersection, highway, address...' },
        { pdfName: 'accident_description', label: 'Describe the accident and who was at fault', type: 'textarea', required: true },
        { pdfName: 'impact_location',      label: 'Location of impact to vehicle', type: 'text',   placeholder: 'Front, rear, driver side...' },
      ],
    },
    {
      title: 'Police & Vehicle',
      fields: [
        { pdfName: 'police_called',        label: 'Were the police called?',     type: 'text',     placeholder: 'Yes / No' },
        { pdfName: 'ticket_number',        label: 'Ticket # (if issued)',         type: 'text' },
        { pdfName: 'accident_report',      label: 'Accident Report #',           type: 'text' },
        { pdfName: 'airbags_deployed',     label: 'Did airbags deploy?',         type: 'text',     placeholder: 'Yes / No' },
        { pdfName: 'seatbelts_worn',       label: 'Seatbelts worn by all passengers?', type: 'text', placeholder: 'Yes / No' },
        { pdfName: 'other_driver_info',    label: 'Other driver name & insurance info', type: 'textarea', placeholder: 'Name, insurance company, policy number...' },
      ],
    },
    {
      title: 'Your Insurance Information',
      fields: [
        { pdfName: 'mv_policy_name',       label: 'Motor Vehicle Policy Name',   type: 'text' },
        { pdfName: 'mv_policy_number',     label: 'Motor Vehicle Policy Number', type: 'text' },
        { pdfName: 'claims_adjuster_name', label: "Claims Adjuster's Name",      type: 'text' },
        { pdfName: 'claims_adjuster_phone',label: "Claims Adjuster's Phone",     type: 'tel' },
        { pdfName: 'claims_address',       label: 'Claims Address',              type: 'text' },
      ],
    },
    {
      title: 'Attorney Information',
      fields: [
        { pdfName: 'attorney_office_name', label: 'Attorney Office Name',        type: 'text', placeholder: 'Leave blank if none' },
        { pdfName: 'attorney_name',        label: 'Attorney Name',               type: 'text' },
        { pdfName: 'attorney_phone',       label: 'Attorney Office Phone',       type: 'tel' },
      ],
    },
  ],

  // workers_comp.pdf is a scanned form — no AcroForm fields, pdfName values are for data capture only
  workers_comp: [
    {
      title: 'Patient Information',
      fields: [
        { pdfName: 'wc_patient_name',  label: 'Patient Name',          type: 'text', prefill: 'fullName', required: true },
        { pdfName: 'wc_dob',           label: 'Date of Birth',         type: 'date', prefill: 'dob',      required: true },
        { pdfName: 'wc_ssn',           label: 'Social Security Number', type: 'text', placeholder: 'XXX-XX-XXXX' },
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
        { pdfName: 'injury_date',         label: 'Date of Injury',            type: 'date', required: true },
        { pdfName: 'chief_complaint',     label: 'Chief Complaint / Disposition', type: 'textarea', required: true, placeholder: 'Describe the injury and how it happened...' },
        { pdfName: 'insurance_company',   label: 'Workers Comp Insurance Company', type: 'text' },
        { pdfName: 'claims_mail_address', label: 'Claims Mailing Address',    type: 'text' },
        { pdfName: 'claim_number',        label: 'Claim Number (if known)',   type: 'text', placeholder: 'Leave blank if unknown' },
      ],
    },
  ],
}

export const FORM_LABELS: Record<string, string> = {
  registration: 'Registration Packet',
  mva: 'Motor Vehicle Accident',
  workers_comp: "Worker's Compensation",
}
