'use client'
import { useRef, useState, useEffect } from 'react'
import { ShieldCheck } from 'lucide-react'

type TermsSection = { title: string; body: string }

const TERMS_1: TermsSection[] = [
  {
    title: 'Consent to Treatment',
    body: 'I consent to the procedures that may be performed during this visit including emergency treatment and/or services which may include, but are not limited to, laboratory services, x-ray examination, diagnostic procedures, physician, nursing, or services rendered to me as ordered by my physician or other health care professional. I voluntarily request and consent for independently contracted physicians (via Frisco ER) to order all necessary tests and treatments while I am a patient at Frisco ER. I understand that medical care is not an exact science and that no guarantee or warrantee is being made as to my examination, treatment, result, or outcome. I understand that I am free to withdraw my consent and to discontinue participation in these procedures at any time. However, I understand that doing so may hinder my treatment and/or medical outcome.',
  },
  {
    title: 'Consent to Photograph',
    body: 'I consent to photographs, videotapes, digital or audio recording, and/or images of me being recorded for security purpose and/or Frisco ER healthcare treatment and/or operations purposes (e.g., quality improvement activities). I understand that the facility retains the ownership rights to the images and/or recordings. I will be allowed to request access to or copies of the images and/or recording when technologically feasible unless otherwise prohibited by law. I understand that these images and/or recordings will be securely stored and protected. Images and/or recordings in which I am identified will not be released and/or used outside of the facility without a specific written authorization from me or my legal representatives unless otherwise required by law.',
  },
  {
    title: 'Notice of Privacy Practices',
    body: 'I acknowledge that I have received Frisco ER Notice of Privacy Practices, which describes the way in which the emergency room may use and disclose my healthcare information for its treatments, payments, healthcare operations and other described and permitted uses and disclosures. I understand that I may contact Frisco ER at (469) 200-5222 if I have questions or complaints.',
  },
  {
    title: 'Accidental Bodily Fluid Exposure to Healthcare Worker',
    body: "This consent includes testing for communicable blood-borne diseases, including, without limitation of, Human Immunodeficiency Virus (HIV), Acquired Immunodeficiency Virus (AIDS), and Hepatitis if a physician orders such test(s) for diagnostic or treatment purposes. I understand that in the case of an accidental exposure to blood or other body fluids, state law allows the Emergency Room to test a patient that has exposed healthcare worker to HIV without obtaining the person's consent. I understand the potential side effects and complications of this testing are generally minor and are comparable to the routine collections of blood specimens, including discomfort from the needle stick and/or slight burning, bleeding, or soreness at the puncture site. The results of this test will become part of my confidential medical record.",
  },
  {
    title: 'Smoking Policy',
    body: 'To maintain the health and safety of patients, visitors, and staff, Frisco ER is a strictly enforced smoke-free environment. Frisco ER is not responsible for any claim or harm arising from smoking, or from my leaving the facility for the purpose of smoking or consuming tobacco products.',
  },
  {
    title: 'Personal Valuables',
    body: 'Although the facility will make all reasonable efforts in safeguarding my valuables, I understand that Frisco ER is not responsible for the loss or damage of personal valuables.',
  },
  {
    title: 'Assignment of Insurance Benefits',
    body: 'I assign Frisco ER all rights, title, and interest in any and all health insurance and/or health plan proceeds/benefits from any plans(s) arising from the provision of any goods and services provided by Frisco ER and/or physicians/healthcare providers thereof. This assignment is made in accordance with §1204.054, Texas Insurance Code.\n\nI also assign and transfer to Frisco ER all rights, title, and interest in any claims against any health insurers, sponsors and/or plan administrators of any of my health benefit plan(s) arising from or pertaining to any wrongful acts and/or omission pertaining to any of said health/benefit plan(s) or health insurance policy(ies) including, but not limited to, claims for a non-payment or underpayment of health provider invoices and claims. I further expressly and knowingly assign all rights under my insurer and/or benefit plan. I understand that any payment received from these policies and/or plans will be applied to the payments I have agreed to pay for services rendered during this emergency room visit.\n\nFrisco ER will file primary and secondary insurance claims for insured patients. I authorize the facility and/or physicians indicated above to release medical information about me as may be necessary for the completion of my insurance claims for this occasion of service to any insurance carrier or health plan. I have read and been given the opportunity to ask questions about this assignment of benefits, and I have signed this document freely and without inducement.',
  },
  {
    title: 'ER Acknowledgement',
    body: 'I understand that I am checking into a free-standing emergency room, and this is not an urgent care.',
  },
]

const TERMS_2: TermsSection[] = [
  {
    title: 'Consent to Use and Disclose Information',
    body: 'I agree and consent to the use and disclosure of my health information for the purpose of treatment, payment from third party payers, and other healthcare operations, such as the maintenance of medical records, communication of health information with other health professionals who contribute to my care, and quality peer reviews and assessments.',
  },
  {
    title: 'Financial Agreement and Patient Guarantee',
    body: 'I agree, whether signing as agent or a patient, that in consideration of the services to be rendered, I hereby am responsible for paying facility co-payments, deductibles, estimated facility coinsurance amounts, and any balances deemed not to be a covered benefit of the insurance policy. Monthly statements will be sent to guarantors for patient balances. Acceptable means of payments are cash, money order, cashier\'s check, credit card, or personal checks.\n\nSelf-pay balances must be paid in full prior to discharge unless otherwise arrangements have been made with Frisco ER. If the balance due is referred to a collection agency or attorney, I understand that there may be additional fees, interest, and expenses that I will be responsible for.\n\nFrisco ER will provide a medical screening as required to all patients who are seeking medical services to determine if there is an emergency medical condition, without regard to patient\'s ability to pay. If there is an emergency medical condition, the facility will provide stabilizing treatment and/or transfer to another facility within its capacity.',
  },
  {
    title: 'Non-Covered Services',
    body: 'If any of the provided services are not covered by my insurance company, or if Frisco ER is not able to verify eligibility, I am responsible for all charges incurred for services rendered.',
  },
  {
    title: 'Patient Rights and Responsibilities',
    body: 'Patient has received a copy of patient\'s rights and responsibilities.',
  },
  {
    title: 'Complaints Against Frisco ER',
    body: 'For any questions or concerns regarding Frisco ER please contact our facility and ask for our Administrator at (469) 200-5222 or the Department of State Health Services at (888) 973-0222.\n\nThe physicians, nurses, and the entire staff at Frisco ER are committed to always assure your safe and reasonable care at all times. To file or voice a complaint, grievance about the organization, the care provided, or patient rights, and to receive a timely response without reprisal or prejudicial treatment — contact our office. Presentation of a complaint will not compromise your care under any circumstances. If your complaint or grievance is not resolved to your satisfaction, you may contact:\n\nDepartment of State Health Services Complaint Hotline\nHealth Facility Compliance Group (MC 1979) — (888) 973-0022\nTexas Department of State Health Services\nP.O. Box 149347, Austin, TX 78714-9347',
  },
]

const TERMS_3: TermsSection[] = [
  {
    title: 'HIPAA Acknowledgement of Receipt of Notice of Privacy Practices',
    body: "I understand that under the Health Insurance Portability & Accountability Act of 1996 ('HIPAA'), I have certain rights to privacy regarding my protected health information. I understand that this information can and will be used to:\n\n• Conduct, plan, and direct my treatment and follow-up among the multiple healthcare providers who may be involved in the treatment directly and indirectly.\n• Obtain payment from third-party payers.\n• Conduct normal healthcare operations such as quality assessments and physician certifications.\n\nI have received, read, and understand your Notice of Privacy Practices containing a more complete description of the uses and disclosures of my health information. I understand that this organization has the right to change its Notice of Privacy Practices from time to time and that I can contact this organization at any time at the address above to obtain a current copy of the Notice of Privacy Practices.\n\nI understand that I may request in writing that you restrict how my private information is used or disclosed to carry out treatment, payment, or health care operations. I also understand you are not required to agree to my requested restrictions, but if you do agree then you are bound to abide by such restrictions.",
  },
]

const TERMS_4: TermsSection[] = [
  {
    title: 'Patient Notice & Disclosure',
    body: 'This facility is a freestanding emergency medical care facility.\n\nThis facility charges rates comparable to a hospital emergency room and may charge a facility fee.\n\nThis facility or a physician providing medical care in this facility may be an out-of-network provider for the patient\'s health benefit plan provider network.\n\nA physician providing medical care at this facility may bill separately from the facility for the medical care provided to a patient.\n\nThis facility is an out-of-network provider for all health benefit plans.\n\nThis facility charges a facility fee for medical treatment. This facility charges an observation fee for medical treatment.\n\nA list of fees charged by this facility can be found on our website.',
  },
]

export const TERMS_PAGES = [TERMS_1, TERMS_2, TERMS_3, TERMS_4] as const

const PAGE_TITLES = ['Consent & Terms', 'Financial & Patient Rights', 'HIPAA Acknowledgement', 'Patient Notice & Disclosure']
const PAGE_SUBTITLES = [
  'Page 1 of 4 — Please read all sections before accepting',
  'Page 2 of 4 — Please read all sections before accepting',
  'Page 3 of 4 — Please read all sections before accepting',
  'Page 4 of 4 — Please read all sections before accepting',
]

interface Props {
  sections: TermsSection[]
  pageIndex: number
  onAccept: (accepted: boolean | null) => void
}

export function FormTerms({ sections, pageIndex, onAccept }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [accepted, setAccepted] = useState<boolean | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function check() {
      if (!el) return
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
      if (atBottom) setHasScrolledToBottom(true)
    }

    el.addEventListener('scroll', check)
    check()
    return () => el.removeEventListener('scroll', check)
  }, [])

  return (
    <div className="max-w-[480px] mx-auto px-5 pt-8 pb-36">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={18} className="text-blue-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{PAGE_TITLES[pageIndex]}</h2>
          <p className="text-sm text-slate-400">{PAGE_SUBTITLES[pageIndex]}</p>
        </div>
      </div>

      {/* Scrollable terms box */}
      <div
        ref={scrollRef}
        className="mt-5 h-[52vh] overflow-y-auto rounded-2xl border-2 border-slate-200 bg-white p-5 space-y-5 scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {sections.map((s) => (
          <div key={s.title}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{s.title}</p>
            {s.body.split('\n\n').map((para, i) => (
              <p key={i} className="text-sm text-slate-700 leading-relaxed mb-2 last:mb-0">
                {para}
              </p>
            ))}
          </div>
        ))}
        <div className="h-4" />
      </div>

      {/* Scroll hint */}
      {!hasScrolledToBottom && (
        <p className="mt-2 text-center text-xs text-slate-400">Scroll to read all terms</p>
      )}

      {/* Accept / Decline */}
      <div className="mt-5 space-y-3">
        <button
          type="button"
          onClick={() => setAccepted(true)}
          className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-colors ${
            accepted === true ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'
          }`}
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            accepted === true ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
          }`}>
            {accepted === true && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
          <span className="text-sm font-medium text-slate-800">I accept the terms and conditions</span>
        </button>

        <button
          type="button"
          onClick={() => setAccepted(false)}
          className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-colors ${
            accepted === false ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'
          }`}
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            accepted === false ? 'border-red-500 bg-red-500' : 'border-slate-300'
          }`}>
            {accepted === false && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
          <span className="text-sm font-medium text-slate-800">I decline</span>
        </button>

      </div>

      {/* Fixed bottom continue button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-5 py-4">
        <div className="max-w-[480px] mx-auto">
          <button
            onClick={() => onAccept(accepted)}
            className="w-full h-14 rounded-2xl font-semibold text-base bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white transition-all"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  )
}
