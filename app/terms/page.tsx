import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — HustleRunner",
  description: "HustleRunner terms of service, acceptable use policy, and SMS messaging terms.",
};

const EFFECTIVE_DATE = "April 16, 2026";
const SUPPORT_EMAIL = "support@hustlerunner.com";
const SUPPORT_PHONE = "(503) 555-0100";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors">
            HustleRunner
          </Link>
          <nav className="flex items-center gap-5 text-sm text-gray-500">
            <Link href="/terms" className="font-medium text-blue-600">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">
              Privacy
            </Link>
          </nav>
        </div>
      </header>

      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">Legal</p>
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-gray-500">Effective date: {EFFECTIVE_DATE}</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white border border-gray-200 rounded shadow-sm">

          {/* TOC sidebar-style index */}
          <div className="border-b border-gray-100 px-8 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Contents</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {[
                ["#acceptance", "Acceptance"],
                ["#services", "Services"],
                ["#accounts", "Accounts"],
                ["#sms", "SMS Messaging"],
                ["#payments", "Payments"],
                ["#ip", "Intellectual Property"],
                ["#disclaimer", "Disclaimer"],
                ["#limitation", "Limitation of Liability"],
                ["#termination", "Termination"],
                ["#governing", "Governing Law"],
                ["#contact", "Contact"],
              ].map(([href, label]) => (
                <a key={href} href={href!} className="text-blue-600 hover:text-blue-700 hover:underline">
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div className="px-8 py-10 space-y-10 text-sm text-gray-700 leading-relaxed">

            {/* 1. Acceptance */}
            <section id="acceptance">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">01</span>
                Acceptance of Terms
              </h2>
              <p>
                By accessing or using HustleRunner (&ldquo;the Service,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you agree to
                be bound by these Terms of Service. If you do not agree, do not use the Service. These terms apply
                to all visitors, users, and others who access the Service.
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* 2. Services */}
            <section id="services">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">02</span>
                Description of Services
              </h2>
              <p>
                HustleRunner is a business management platform for contractors and service businesses. The Service
                includes tools for creating and sending estimates and invoices, managing customers and jobs,
                generating branded print assets, and communicating with customers via SMS and email.
              </p>
              <p className="mt-3">
                We reserve the right to modify, suspend, or discontinue the Service (or any feature) at any time
                with or without notice. We will not be liable to you or any third party for any modification,
                suspension, or discontinuation of the Service.
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* 3. Accounts */}
            <section id="accounts">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">03</span>
                Accounts and Registration
              </h2>
              <p>
                To access certain features, you must create an account. You agree to provide accurate, current, and
                complete information and to keep your account credentials confidential. You are responsible for all
                activity that occurs under your account.
              </p>
              <p className="mt-3">
                You must be at least 18 years old to use the Service. By creating an account, you represent that
                you meet this requirement.
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* 4. SMS — highlighted section */}
            <section id="sms">
              <div className="border-l-4 border-blue-600 pl-5">
                <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <span className="text-blue-600 font-mono text-xs">04</span>
                  SMS Messaging Terms
                </h2>
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-4">
                  Required disclosure — please read carefully
                </p>
              </div>

              <div className="space-y-5 pl-5 border-l-4 border-blue-100">

                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Program Name</h3>
                  <p>HustleRunner SMS Service</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Program Description</h3>
                  <p>
                    When you or your customers opt in to SMS communications through HustleRunner, you may receive
                    transactional and operational text messages including:
                  </p>
                  <ul className="mt-2 ml-4 list-disc space-y-1 text-gray-700">
                    <li>Estimate delivery and approval notifications</li>
                    <li>Invoice reminders and payment confirmations</li>
                    <li>Job scheduling alerts and status updates for customers</li>
                    <li>Job availability alerts for workers who have signed up for a business&apos;s job-dispatch pool</li>
                    <li>Account and security notifications</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Message Frequency</h3>
                  <p>Message frequency varies based on your account activity and customer interactions.</p>
                </div>

                <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="font-semibold text-amber-900">Message and data rates may apply.</p>
                  <p className="text-amber-800 mt-1">
                    Standard carrier messaging rates may apply to each SMS message sent or received.
                    Check with your wireless carrier for details about your plan.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">How to Opt Out or Get Help</h3>
                  <div className="rounded border border-gray-200 bg-gray-50 divide-y divide-gray-200">
                    <div className="px-4 py-3 flex items-start gap-3">
                      <span className="inline-flex items-center justify-center rounded bg-gray-200 px-2 py-0.5 text-xs font-mono font-bold text-gray-700 shrink-0 mt-0.5">
                        STOP
                      </span>
                      <p>
                        Reply <strong>STOP</strong> to any message to unsubscribe from all HustleRunner SMS messages.
                        You will receive a one-time confirmation message. No further messages will be sent.
                      </p>
                    </div>
                    <div className="px-4 py-3 flex items-start gap-3">
                      <span className="inline-flex items-center justify-center rounded bg-blue-100 px-2 py-0.5 text-xs font-mono font-bold text-blue-700 shrink-0 mt-0.5">
                        HELP
                      </span>
                      <p>
                        Reply <strong>HELP</strong> to any message for assistance. You may also contact us directly
                        at <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 hover:underline">{SUPPORT_EMAIL}</a> or{" "}
                        <a href={`tel:${SUPPORT_PHONE.replace(/\D/g, "")}`} className="text-blue-600 hover:underline">{SUPPORT_PHONE}</a>.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Support Contact</h3>
                  <p>
                    For questions about SMS messaging, contact our support team:
                  </p>
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>
                      Email:{" "}
                      <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 hover:underline">
                        {SUPPORT_EMAIL}
                      </a>
                    </li>
                    <li>
                      Phone:{" "}
                      <a href={`tel:${SUPPORT_PHONE.replace(/\D/g, "")}`} className="text-blue-600 hover:underline">
                        {SUPPORT_PHONE}
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="rounded border border-gray-200 bg-white px-4 py-3">
                  <p className="font-semibold text-gray-900 mb-1">Consent is Not a Condition of Purchase</p>
                  <p>
                    You are not required to consent to receive SMS messages as a condition of purchasing any goods
                    or services. Consent to SMS messaging is entirely optional.
                  </p>
                </div>

                <div className="rounded border border-gray-200 bg-white px-4 py-3">
                  <p className="font-semibold text-gray-900 mb-1">Carrier Disclaimer</p>
                  <p>
                    Carriers are not liable for delayed or undelivered messages. Message delivery depends on
                    network availability and other factors outside our control.
                  </p>
                </div>

              </div>
            </section>

            <hr className="border-gray-100" />

            {/* 5. Payments */}
            <section id="payments">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">05</span>
                Payments and Billing
              </h2>
              <p>
                Certain features of the Service require a paid subscription. By subscribing, you authorize us to
                charge your payment method on a recurring basis. All fees are non-refundable except as required
                by law or as explicitly stated in our refund policy.
              </p>
              <p className="mt-3">
                We may change our pricing at any time. We will notify you in advance of any price changes. If you
                do not agree to the new pricing, you may cancel your subscription before the change takes effect.
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* 6. IP */}
            <section id="ip">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">06</span>
                Intellectual Property
              </h2>
              <p>
                The Service and its original content, features, and functionality are and will remain the exclusive
                property of HustleRunner and its licensors. Our trademarks and trade dress may not be used in
                connection with any product or service without our prior written consent.
              </p>
              <p className="mt-3">
                You retain ownership of the content you upload or create using the Service (your brand assets,
                logos, documents, and customer data). By using the Service, you grant us a limited license to
                store and process that content solely to provide the Service to you.
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* 7. Disclaimer */}
            <section id="disclaimer">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">07</span>
                Disclaimer of Warranties
              </h2>
              <p>
                THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER
                EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
                UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* 8. Limitation */}
            <section id="limitation">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">08</span>
                Limitation of Liability
              </h2>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY LAW, HUSTLERUNNER SHALL NOT BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES,
                WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE
                LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
              </p>
              <p className="mt-3">
                Our total liability to you for any claim arising out of or relating to these terms or the Service
                shall not exceed the amount you paid us in the twelve months preceding the claim.
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* 9. Termination */}
            <section id="termination">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">09</span>
                Termination
              </h2>
              <p>
                We may terminate or suspend your account at our sole discretion, without notice, for conduct that
                we believe violates these terms or is harmful to other users, us, or third parties. You may cancel
                your account at any time by contacting us.
              </p>
              <p className="mt-3">
                Upon termination, your right to use the Service will immediately cease. Provisions of these terms
                that by their nature should survive termination will survive, including ownership provisions,
                warranty disclaimers, indemnity, and limitations of liability.
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* 10. Governing Law */}
            <section id="governing">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">10</span>
                Governing Law
              </h2>
              <p>
                These terms shall be governed by and construed in accordance with the laws of the State of Oregon,
                without regard to its conflict of law provisions. Any dispute arising from these terms shall be
                resolved exclusively in the state or federal courts located in Multnomah County, Oregon.
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* 11. Contact */}
            <section id="contact">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600 font-mono text-xs">11</span>
                Contact Us
              </h2>
              <p>If you have questions about these Terms of Service, please contact us:</p>
              <div className="mt-3 rounded border border-gray-200 bg-gray-50 px-5 py-4 space-y-1">
                <p className="font-semibold text-gray-900">HustleRunner Support</p>
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
            <Link href="/terms" className="text-blue-500 hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-600 hover:underline">Privacy</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
