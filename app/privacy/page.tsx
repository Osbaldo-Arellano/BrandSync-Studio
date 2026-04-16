import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — HustleRunner",
  description: "How HustleRunner collects, uses, and protects your personal information.",
};

const EFFECTIVE_DATE = "April 16, 2026";
const SUPPORT_EMAIL = "support@hustlerunner.com";
const SUPPORT_PHONE = "(503) 555-0100";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors">
            HustleRunner
          </Link>
          <nav className="flex items-center gap-5 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-900 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="font-medium text-blue-600">
              Privacy
            </Link>
          </nav>
        </div>
      </header>

      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">Legal</p>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500">Effective date: {EFFECTIVE_DATE}</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white border border-gray-200 rounded shadow-sm">

          {/* Intro banner */}
          <div className="border-b border-gray-100 bg-blue-50 px-8 py-5">
            <p className="text-sm text-blue-800">
              HustleRunner (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to protecting your privacy. This policy explains
              what information we collect, how we use it, and your rights regarding that information.
            </p>
          </div>

          {/* TOC */}
          <div className="border-b border-gray-100 px-8 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Contents</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {[
                ["#information-we-collect", "Information We Collect"],
                ["#how-we-use", "How We Use It"],
                ["#sharing", "Sharing"],
                ["#sms-data", "SMS Data"],
                ["#retention", "Data Retention"],
                ["#security", "Security"],
                ["#your-rights", "Your Rights"],
                ["#cookies", "Cookies"],
                ["#children", "Children"],
                ["#changes", "Changes"],
                ["#contact", "Contact"],
              ].map(([href, label]) => (
                <a key={href} href={href!} className="text-blue-600 hover:text-blue-700 hover:underline">
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div className="px-8 py-10 space-y-10 text-sm text-gray-700 leading-relaxed">

            {/* 1 */}
            <section id="information-we-collect">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">01</span>
                Information We Collect
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Information you provide directly</h3>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>Account registration data (name, email address, password)</li>
                    <li>Business profile information (company name, address, phone, logo, license number)</li>
                    <li>Customer records (names, addresses, contact information)</li>
                    <li>Estimate and invoice content (job descriptions, line items, amounts)</li>
                    <li>Payment information (processed by our payment processor — we do not store card numbers)</li>
                    <li>Communications with our support team</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Information collected automatically</h3>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>Log data (IP address, browser type, pages visited, timestamps)</li>
                    <li>Device information (operating system, screen size)</li>
                    <li>Usage analytics (features used, session duration)</li>
                    <li>Cookies and similar tracking technologies (see Cookies section)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Information from third parties</h3>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>Authentication providers (if you use social sign-in)</li>
                    <li>Payment processors (transaction confirmation and status)</li>
                    <li>SMS carriers (delivery status for messages sent through the Service)</li>
                  </ul>
                </div>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* 2 */}
            <section id="how-we-use">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">02</span>
                How We Use Your Information
              </h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="ml-4 list-disc space-y-1.5">
                <li>Provide, operate, and improve the Service</li>
                <li>Create and manage your account</li>
                <li>Process payments and send transaction confirmations</li>
                <li>Generate branded documents (estimates, invoices, print assets)</li>
                <li>Send transactional SMS and email messages you have requested</li>
                <li>Respond to customer support inquiries</li>
                <li>Send service-related notices and policy updates</li>
                <li>Detect and prevent fraud, abuse, and security incidents</li>
                <li>Comply with legal obligations</li>
                <li>Analyze aggregate usage trends to improve our product</li>
              </ul>
              <p className="mt-3">
                We do not sell your personal information to third parties. We do not use your data to train
                machine learning models without your explicit consent.
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* 3 */}
            <section id="sharing">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">03</span>
                How We Share Information
              </h2>
              <p className="mb-3">We share your information only in the following circumstances:</p>

              <div className="space-y-3">
                <div className="rounded border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="font-semibold text-gray-900 mb-1">Service Providers</p>
                  <p>
                    We share data with trusted vendors who help us operate the Service, including cloud hosting
                    (Supabase), SMS delivery (Twilio), payment processing (Stripe), and analytics. These providers
                    are contractually required to protect your data and use it only for the services they provide to us.
                    SMS messaging data is handled under the additional protections described in Section 04.
                  </p>
                </div>

                <div className="rounded border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="font-semibold text-gray-900 mb-1">Legal Requirements</p>
                  <p>
                    We may disclose your information if required to do so by law or in response to valid requests
                    by public authorities (e.g., a court order or government agency).
                  </p>
                </div>

                <div className="rounded border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="font-semibold text-gray-900 mb-1">Business Transfers</p>
                  <p>
                    If HustleRunner is involved in a merger, acquisition, or sale of assets, your information may
                    be transferred. We will notify you before your personal information becomes subject to a
                    different privacy policy.
                  </p>
                </div>

                <div className="rounded border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="font-semibold text-gray-900 mb-1">With Your Consent</p>
                  <p>We may share information for any other purpose with your explicit consent.</p>
                </div>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* 4 — SMS Data */}
            <section id="sms-data">
              <div className="border-l-4 border-blue-600 pl-5">
                <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <span className="text-blue-600 font-mono text-xs">04</span>
                  SMS Messaging — Data Practices
                </h2>
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-4">
                  How we handle SMS opt-in data
                </p>
              </div>

              <div className="space-y-4 pl-5 border-l-4 border-blue-100">
                <p>
                  When customers provide a phone number and consent to receive SMS messages through the Service,
                  we collect and store that consent record, including the date, time, and method of opt-in.
                </p>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">What SMS data we collect</h3>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>Phone number provided at opt-in</li>
                    <li>Timestamp and method of consent</li>
                    <li>Message content for transactional messages (estimates, invoices, job alerts)</li>
                    <li>Delivery status from the carrier</li>
                    <li>Opt-out records (STOP requests and confirmations)</li>
                    <li>
                      When a HustleRunner client business collects phone numbers through their own website or
                      signup forms, those phone numbers are provided to HustleRunner to deliver messages on the
                      client business&apos;s behalf. The client business is the sender of record for messages to
                      their customers and workers.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">SMS data sharing</h3>
                  <p>
                    SMS opt-in information and consent records will not be shared with third parties or affiliates
                    for their marketing purposes. Phone numbers collected for SMS messaging will not be sold,
                    rented, or shared with any entity other than our SMS delivery provider (Twilio) solely for
                    the purpose of sending messages you have requested.
                  </p>
                </div>

                <div className="rounded border border-gray-200 bg-white px-4 py-3">
                  <p className="font-semibold text-gray-900 mb-1">Opting Out</p>
                  <p>
                    Reply <strong>STOP</strong> to any SMS message to opt out at any time. Reply <strong>HELP</strong> for
                    support. See our <Link href="/terms#sms" className="text-blue-600 hover:underline">SMS Terms</Link> for
                    full details.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* 5 */}
            <section id="retention">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">05</span>
                Data Retention
              </h2>
              <p>
                We retain your personal information for as long as your account is active or as needed to provide
                the Service. If you close your account, we will delete or anonymize your personal information
                within 90 days, except where we are required to retain it for legal, tax, or compliance purposes
                (typically up to 7 years for financial records).
              </p>
              <p className="mt-3">
                SMS consent records and opt-out records are retained for a minimum of 4 years to comply with
                telecommunications regulations.
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* 6 */}
            <section id="security">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">06</span>
                Security
              </h2>
              <p>
                We implement industry-standard security measures including encryption in transit (TLS), encryption
                at rest, access controls, and regular security reviews. However, no method of transmission over the
                Internet or electronic storage is 100% secure.
              </p>
              <p className="mt-3">
                We will notify you promptly if we become aware of a breach that affects your personal information,
                in accordance with applicable law.
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* 7 */}
            <section id="your-rights">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">07</span>
                Your Rights and Choices
              </h2>
              <p className="mb-3">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <div className="rounded border border-gray-200 divide-y divide-gray-100">
                {[
                  ["Access", "Request a copy of the personal information we hold about you."],
                  ["Correction", "Request that we correct inaccurate or incomplete information."],
                  ["Deletion", "Request deletion of your personal information, subject to legal retention requirements."],
                  ["Portability", "Request your data in a structured, machine-readable format."],
                  ["Objection", "Object to certain uses of your information, including direct marketing."],
                  ["Withdrawal", "Withdraw consent at any time where processing is based on consent."],
                ].map(([right, description]) => (
                  <div key={right} className="px-4 py-3 flex gap-3">
                    <span className="font-semibold text-gray-900 w-28 shrink-0">{right}</span>
                    <span className="text-gray-600">{description}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4">
                To exercise any of these rights, contact us at{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 hover:underline">{SUPPORT_EMAIL}</a>.
                We will respond within 30 days.
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* 8 */}
            <section id="cookies">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">08</span>
                Cookies and Tracking
              </h2>
              <p>
                We use cookies and similar technologies to authenticate sessions, remember your preferences, and
                understand how the Service is used. Essential cookies are required for the Service to function.
                Analytics cookies help us improve the product and may be disabled without affecting core
                functionality.
              </p>
              <p className="mt-3">
                You can control cookies through your browser settings. Disabling cookies may affect some features
                of the Service.
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* 9 */}
            <section id="children">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">09</span>
                Children&apos;s Privacy
              </h2>
              <p>
                The Service is not directed to individuals under the age of 18. We do not knowingly collect
                personal information from children. If you believe we have inadvertently collected information
                from a child, please contact us immediately and we will delete it.
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* 10 */}
            <section id="changes">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">10</span>
                Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. When we make material changes, we will
                notify you by email or through a prominent notice in the Service at least 30 days before the
                change takes effect. Your continued use of the Service after the effective date constitutes
                acceptance of the updated policy.
              </p>
              <p className="mt-3">
                The current effective date is always shown at the top of this page.
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* 11 */}
            <section id="contact">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">11</span>
                Contact Us
              </h2>
              <p>For questions, concerns, or to exercise your rights, contact our privacy team:</p>
              <div className="mt-3 rounded border border-gray-200 bg-gray-50 px-5 py-4 space-y-1">
                <p className="font-semibold text-gray-900">HustleRunner Privacy</p>
                <p>
                  Email:{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 hover:underline">
                    {SUPPORT_EMAIL}
                  </a>
                </p>
                <p>
                  Phone:{" "}
                  <a href={`tel:${SUPPORT_PHONE.replace(/\D/g, "")}`} className="text-blue-600 hover:underline">
                    {SUPPORT_PHONE}
                  </a>
                </p>
              </div>
            </section>

          </div>
        </div>

        {/* Footer links */}
        <div className="mt-8 flex items-center justify-between text-xs text-gray-400">
          <span>&copy; {new Date().getFullYear()} HustleRunner. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-gray-600 hover:underline">Terms</Link>
            <Link href="/privacy" className="text-blue-500 hover:underline">Privacy</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
