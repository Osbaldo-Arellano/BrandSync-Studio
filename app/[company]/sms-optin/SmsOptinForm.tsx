"use client";

import { useState } from "react";
import Link from "next/link";
import type { SmsOptinCompany } from "@/lib/sms-optin-companies";

export function SmsOptinForm({ company }: { company: SmsOptinCompany }) {
  const [termsChecked, setTermsChecked] = useState(false);
  const [smsChecked, setSmsChecked] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = termsChecked && smsChecked;

  if (submitted) {
    return (
      <div className="bg-white border border-gray-200 rounded shadow-sm p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
          <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">You&apos;re on the list</h2>
        <p className="text-sm text-gray-500 mb-1">
          {company.name} will text you when jobs are available in your area.
        </p>
        <p className="text-xs text-gray-400">
          Reply <strong>STOP</strong> at any time to unsubscribe.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm p-6 sm:p-8">
      <form
        onSubmit={(e) => { e.preventDefault(); if (canSubmit) setSubmitted(true); }}
        noValidate
      >
        <div className="space-y-4">

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Maria Garcia"
              className="w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="maria@example.com"
              className="w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
            />
          </div>

          {/* Phone — OPTIONAL per CTIA §5.2.1 */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Mobile phone number{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="(503) 555-0100"
              className="w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
            />
            <p className="mt-1 text-xs text-gray-400">
              Only required if you want to receive SMS job alerts.
            </p>
          </div>

          {/* Role — hidden if no options configured */}
          {company.roles.length > 0 && (
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Primary role
              </label>
              <select
                id="role"
                className="w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
              >
                <option value="">Select a role…</option>
                {company.roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          <hr className="border-gray-100" />

          {/* Checkbox 1 — Terms & Privacy (separate from SMS consent) */}
          <div className="flex items-start gap-3">
            <div className="pt-0.5 shrink-0">
              <input
                id="agree-terms"
                type="checkbox"
                checked={termsChecked}
                onChange={(e) => setTermsChecked(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
              />
            </div>
            <label htmlFor="agree-terms" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
              I have read and agree to the{" "}
              <Link href="/terms" target="_blank" className="text-blue-600 hover:underline font-medium">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline font-medium">
                Privacy Policy
              </Link>
              . <span className="text-red-500">*</span>
            </label>
          </div>

          {/* Checkbox 2 — SMS consent (must be separate from ToS checkbox) */}
          <div className="rounded border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <div className="pt-0.5 shrink-0">
                <input
                  id="agree-sms"
                  type="checkbox"
                  checked={smsChecked}
                  onChange={(e) => setSmsChecked(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
              </div>
              <label htmlFor="agree-sms" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                <span className="font-semibold text-gray-900 block mb-1">
                  Yes, I consent to receive SMS messages from {company.name}. <span className="text-red-500">*</span>
                </span>
                By checking this box, I agree that {company.name} (powered by{" "}
                <span className="font-medium">HustleRunner SMS Service</span>) may send me text messages
                including job availability alerts, scheduling updates, and account notifications.
                {" "}Message frequency varies.{" "}
                <strong>Message and data rates may apply.</strong>{" "}
                Reply <strong>STOP</strong> to opt out at any time. Reply <strong>HELP</strong> for support
                or contact{" "}
                <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline">
                  {company.email}
                </a>
                {" "}or{" "}
                <a href={`tel:${company.phone.replace(/\D/g, "")}`} className="text-blue-600 hover:underline">
                  {company.phone}
                </a>
                . See{" "}
                <Link href="/terms#sms" target="_blank" className="text-blue-600 hover:underline">
                  SMS Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy#sms-data" target="_blank" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>{" "}
                for full details.
                <span className="block mt-1.5 text-gray-500">
                  Consent is not a condition of employment or service. You may sign up without providing a phone number.
                </span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Sign up for job alerts
          </button>

          {!canSubmit && (
            <p className="text-center text-xs text-gray-400">
              Please check both boxes above to continue.
            </p>
          )}

        </div>
      </form>
    </div>
  );
}
