// Production legal & policy documents for Martial X × RedZone Security.
// Plain-text sections rendered by src/pages/Legal.tsx.

export interface LegalDoc {
  slug: string;
  title: string;
  summary: string;
  sections: { heading: string; body: string[] }[];
}

const contactLine =
  "Questions about this document: recruit@resofit.fit or +234 813 225 5842 (WhatsApp).";

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    summary: "How Martial X collects, uses, stores and protects personal data.",
    sections: [
      {
        heading: "Data we collect",
        body: [
          "Identity and contact data supplied in the application form (name, email, phone, city, age band).",
          "Recruitment data: programme of interest, cohort, screening notes, interview scorecards, stage history.",
          "Academy data: enrolments, lesson progress, assessment attempts and certificate records.",
          "Payment metadata from Paystack (reference, tier, amount, status). Card details are never stored by us.",
          "Technical data: device/browser information, campaign attribution parameters and analytics events.",
        ],
      },
      {
        heading: "How we use it",
        body: [
          "To assess eligibility, screen, interview, admit, train, certify and place candidates.",
          "To operate payments, enrolment and certificate verification.",
          "To send service communications and, where you consent, recruitment and programme updates.",
          "To measure marketing performance and improve the platform.",
        ],
      },
      {
        heading: "Sharing",
        body: [
          "With licensed client security firms only where you are being considered for deployment.",
          "With processors that run the platform: our cloud database/auth provider, Paystack (payments) and Make.com (workflow automation).",
          "Where required by Nigerian law or lawful regulatory request.",
        ],
      },
      {
        heading: "Storage, retention and security",
        body: [
          "Applicant documents are held in a private storage bucket and are only reachable through short-lived signed URLs.",
          "Row-level security restricts records to the owning applicant, their assigned recruiter and administrators.",
          "Recruitment records are retained for up to 24 months after the last activity; certification records are retained permanently so certificates remain verifiable.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You may request access, correction, deletion or export of your personal data, and may withdraw marketing consent at any time.",
          contactLine,
        ],
      },
    ],
  },
  {
    slug: "terms-and-conditions",
    title: "Terms & Conditions",
    summary: "The agreement governing use of the Martial X platform.",
    sections: [
      {
        heading: "Agreement",
        body: [
          "By using this platform you agree to these terms, the Privacy Policy and the policies linked from them.",
          "You must be at least 18 years old to apply, enrol or purchase.",
        ],
      },
      {
        heading: "Accounts",
        body: [
          "You are responsible for the accuracy of the information you submit and for keeping your account credentials secure.",
          "Accounts found to contain falsified identity, qualification or medical information will be suspended and any application withdrawn.",
        ],
      },
      {
        heading: "Acceptable use",
        body: [
          "No scraping, automated access, resale of course material, sharing of account access, or circumvention of access controls.",
          "Course material, certificates and platform content remain the intellectual property of Martial X × RedZone Security.",
        ],
      },
      {
        heading: "Limitation",
        body: [
          "Training and certification are supplied as described. Placement outcomes depend on client demand, vetting results and candidate performance and are not guaranteed by purchase alone.",
        ],
      },
    ],
  },
  {
    slug: "refund-policy",
    title: "Refund Policy",
    summary: "When programme fees can be refunded.",
    sections: [
      {
        heading: "Cooling-off",
        body: [
          "A full refund is available within 48 hours of payment provided you have not accessed gated academy content or attended a scheduled session.",
        ],
      },
      {
        heading: "After access",
        body: [
          "Once academy content has been accessed or practical training has commenced, fees are non-refundable but may be transferred once to a later cohort on request.",
        ],
      },
      {
        heading: "Cancelled cohorts",
        body: [
          "If we cancel a cohort and cannot offer an acceptable alternative date, the full fee is refunded to the original payment method.",
        ],
      },
      {
        heading: "How to request",
        body: [
          "Email recruit@resofit.fit with your payment reference. Approved refunds are returned via Paystack within 5–10 business days.",
          contactLine,
        ],
      },
    ],
  },
  {
    slug: "recruitment-policy",
    title: "Recruitment Policy",
    summary: "How candidates are sourced, screened and placed.",
    sections: [
      {
        heading: "Fair selection",
        body: [
          "Selection is based on eligibility, verified competence, conduct and client role requirements.",
          "We do not discriminate on ethnicity, religion, state of origin, gender or disability where the role can be performed safely.",
        ],
      },
      {
        heading: "No recruitment fees for placement",
        body: [
          "Programme fees pay for training and certification only. We never charge a candidate a fee to be offered a specific deployment.",
        ],
      },
      {
        heading: "Vetting",
        body: [
          "Identity, guarantor, address, medical fitness and character checks are completed before deployment eligibility is granted.",
          "Deployment eligibility is granted only after assessment and certification are complete — never on the basis of an application alone.",
        ],
      },
      {
        heading: "Record keeping",
        body: [
          "Every stage change, assignment and decision is written to an immutable activity and audit trail.",
        ],
      },
    ],
  },
  {
    slug: "candidate-terms",
    title: "Candidate Terms",
    summary: "Obligations accepted when you submit a recruitment application.",
    sections: [
      {
        heading: "Declarations",
        body: [
          "You confirm that the information supplied is true, that you are legally permitted to work in Nigeria, and that you are medically fit for physical training.",
        ],
      },
      {
        heading: "Participation",
        body: [
          "You agree to attend scheduled screening, interview and training sessions, and to notify your recruiter in advance if you cannot attend.",
        ],
      },
      {
        heading: "Withdrawal",
        body: [
          "You may withdraw at any stage in writing. Withdrawal after admission is subject to the Refund Policy.",
        ],
      },
    ],
  },
  {
    slug: "academy-terms",
    title: "Academy Terms",
    summary: "Rules for enrolment, study, assessment and certification.",
    sections: [
      {
        heading: "Access",
        body: [
          "Academy content is gated by paid enrolment tier and is licensed to you personally and non-transferably.",
        ],
      },
      {
        heading: "Attendance and assessment",
        body: [
          "Each course states its theory and practical hours, attendance requirement, pass criteria and resit policy. All must be met before a certificate is issued.",
          "Certificates are issued server-side only after every required lesson and assessment is recorded as complete.",
        ],
      },
      {
        heading: "Academic integrity",
        body: [
          "Impersonation, sharing of assessment answers or falsifying practical attendance results in withdrawal of certification.",
        ],
      },
    ],
  },
  {
    slug: "code-of-conduct",
    title: "Code of Conduct",
    summary: "Standards expected of candidates, students and deployed officers.",
    sections: [
      {
        heading: "Professional standards",
        body: [
          "Punctuality, correct turnout, sobriety on duty, respectful communication and lawful use of force only.",
          "Confidentiality of client premises, personnel and information at all times.",
        ],
      },
      {
        heading: "Prohibited conduct",
        body: [
          "Harassment, bullying, intimidation, bribery, theft, substance misuse, or possession of unauthorised weapons.",
        ],
      },
      {
        heading: "Consequences",
        body: [
          "Breaches are investigated and may result in suspension from training, withdrawal of certification and removal from deployment eligibility.",
        ],
      },
    ],
  },
  {
    slug: "safeguarding",
    title: "Safeguarding Policy",
    summary: "Protecting vulnerable people during training and deployment.",
    sections: [
      {
        heading: "Commitment",
        body: [
          "Everyone involved in Martial X training or deployment has a duty to protect children and vulnerable adults from harm, abuse and exploitation.",
        ],
      },
      {
        heading: "Reporting",
        body: [
          "Any safeguarding concern must be reported immediately to the designated safeguarding lead at recruit@resofit.fit and, where a crime is suspected, to the Nigeria Police Force.",
          "Reports are recorded, investigated and retained in the compliance record.",
        ],
      },
      {
        heading: "Protection of reporters",
        body: [
          "No candidate or officer will be penalised for raising a concern in good faith.",
        ],
      },
    ],
  },
  {
    slug: "health-and-safety",
    title: "Health & Safety Policy",
    summary: "Safety requirements for combat fitness and tactical training.",
    sections: [
      {
        heading: "Fitness to train",
        body: [
          "Candidates must declare medical conditions before physical training. We may require medical clearance.",
        ],
      },
      {
        heading: "On-site safety",
        body: [
          "Approved protective equipment must be worn for contact drills. Instructors run a documented risk assessment for each practical session.",
          "First aid provision and an emergency evacuation procedure are in place at every training venue.",
        ],
      },
      {
        heading: "Incidents",
        body: [
          "All injuries and near misses are logged and reviewed. Serious incidents suspend the session immediately.",
        ],
      },
    ],
  },
  {
    slug: "complaints",
    title: "Complaints Procedure",
    summary: "How to raise and escalate a complaint.",
    sections: [
      {
        heading: "Step 1 — Raise it",
        body: [
          "Email recruit@resofit.fit with your name, reference number and a description of the issue. We acknowledge within 2 business days.",
        ],
      },
      {
        heading: "Step 2 — Investigation",
        body: [
          "A recruiter or academy lead not involved in the matter investigates and responds within 10 business days.",
        ],
      },
      {
        heading: "Step 3 — Escalation",
        body: [
          "If unresolved, request escalation to management. The outcome and any corrective action are recorded in the compliance log.",
        ],
      },
    ],
  },
  {
    slug: "cookie-policy",
    title: "Cookie Policy",
    summary: "Cookies and local storage used by this site.",
    sections: [
      {
        heading: "Essential",
        body: [
          "Authentication session storage is strictly necessary to keep you signed in and cannot be disabled while you use an account.",
          "A referral code and campaign attribution record may be stored locally so that referrals and ad performance are credited correctly.",
        ],
      },
      {
        heading: "Analytics and advertising",
        body: [
          "Where configured, GA4, Meta Pixel and TikTok Pixel set cookies to measure funnel performance and advertising conversions.",
        ],
      },
      {
        heading: "Control",
        body: [
          "You can clear or block cookies in your browser settings. Blocking essential storage will sign you out and break gated academy access.",
          "We never store passwords, payment card data or API secrets in cookies or local storage.",
        ],
      },
    ],
  },
  {
    slug: "accessibility",
    title: "Accessibility Statement",
    summary: "Our commitment to an accessible platform.",
    sections: [
      {
        heading: "Standard",
        body: [
          "We aim to meet WCAG 2.1 AA. The interface supports keyboard navigation, visible focus, semantic landmarks and descriptive alternative text.",
          "Background motion, including the hero video, is disabled automatically when your device requests reduced motion.",
        ],
      },
      {
        heading: "Known limits and feedback",
        body: [
          "Some data-dense admin tables are optimised for larger screens. If you encounter a barrier, contact recruit@resofit.fit and we will provide the information in an alternative format.",
        ],
      },
    ],
  },
  {
    slug: "disclaimer",
    title: "Disclaimer",
    summary: "Limits on information published on this site.",
    sections: [
      {
        heading: "Training and employment",
        body: [
          "Salary bands shown are indicative market ranges for the Nigerian private security sector and are not an offer of employment or a guarantee of earnings.",
          "Placement depends on client demand, vetting outcomes and candidate performance.",
        ],
      },
      {
        heading: "Not professional advice",
        body: [
          "Content on this site is training and informational material and is not legal, medical or financial advice.",
        ],
      },
      {
        heading: "External links",
        body: [
          "We are not responsible for the content or practices of third-party sites linked from this platform.",
        ],
      },
    ],
  },
  {
    slug: "certificate-verification",
    title: "Certificate Verification Policy",
    summary: "How third parties can validate a Martial X certificate.",
    sections: [
      {
        heading: "How to verify",
        body: [
          "Every certificate carries a unique certificate code. Open /certificate/{code} to check it, or send the code to recruit@resofit.fit.",
        ],
      },
      {
        heading: "What verification returns",
        body: [
          "Validity status, holder name, course title, issue date, issuer and accreditation metadata. No account identifiers or unrelated personal data are disclosed.",
        ],
      },
      {
        heading: "Integrity",
        body: [
          "Issuance records are immutable and are created server-side only after all assessment and attendance requirements are met. Suspected forgery should be reported to recruit@resofit.fit.",
        ],
      },
    ],
  },
];

export const legalBySlug = (slug?: string) =>
  LEGAL_DOCS.find((d) => d.slug === slug);
