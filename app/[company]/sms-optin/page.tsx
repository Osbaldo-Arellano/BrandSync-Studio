import { notFound } from "next/navigation";
import { getCompany } from "@/lib/sms-optin-companies";
import { SmsOptinForm } from "./SmsOptinForm";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ company: string }>;
}): Promise<Metadata> {
  const { company: slug } = await params;
  const company = getCompany(slug);
  if (!company) return { title: "Not Found" };
  return {
    title: `Join the Job Pool — ${company.name}`,
    description: `Sign up to receive SMS job alerts from ${company.name}.`,
  };
}

export default async function SmsOptinPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company: slug } = await params;
  const company = getCompany(slug);
  if (!company) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compliance notice — visible to carriers reviewing this URL */}
      <div className="bg-blue-600 text-white text-center py-2 px-4">
        <p className="text-xs font-medium">
          SMS opt-in form &mdash; powered by{" "}
          <span className="font-semibold">HustleRunner SMS Service</span>
          {" · "}
          <a href="/terms#sms" className="underline hover:no-underline">SMS Terms</a>
          {" · "}
          <a href="/privacy#sms-data" className="underline hover:no-underline">Privacy Policy</a>
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-10">
        {/* Company header */}
        <div className="mb-6 text-center">
          {company.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logoUrl}
              alt={company.name}
              className="mx-auto mb-4 max-h-16 max-w-[200px] object-contain"
            />
          )}
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
            {company.name} &middot; {company.location}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Join Our Job Pool</h1>
          <p className="mt-2 text-sm text-gray-500">{company.tagline}</p>
        </div>

        <SmsOptinForm company={company} />

        {/* Compliance footer */}
        <div className="mt-6 rounded border border-gray-200 bg-white px-5 py-4 text-xs text-gray-500 space-y-1.5">
          <p className="font-semibold text-gray-700 text-[11px] uppercase tracking-wide">SMS Disclosure</p>
          <p>
            <span className="font-medium text-gray-700">Program:</span>{" "}
            HustleRunner SMS Service &mdash; job availability alerts, scheduling updates, and account
            notifications sent on behalf of {company.name}.
          </p>
          <p>
            <span className="font-medium text-gray-700">Frequency:</span> Message frequency varies.
          </p>
          <p>
            <span className="font-medium text-gray-700">Rates:</span> Message and data rates may apply.
          </p>
          <p>
            <span className="font-medium text-gray-700">Opt-out:</span> Reply <strong className="text-gray-700">STOP</strong> to
            unsubscribe. Reply <strong className="text-gray-700">HELP</strong> for support.
          </p>
          <p>
            Carriers are not liable for delayed or undelivered messages.
          </p>
          <p>
            <a href="/terms#sms" className="text-blue-600 hover:underline">SMS Terms</a>
            {" · "}
            <a href="/privacy#sms-data" className="text-blue-600 hover:underline">Privacy Policy</a>
            {" · "}
            <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline">{company.email}</a>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} {company.name} &mdash; powered by HustleRunner
        </p>
      </div>
    </div>
  );
}
