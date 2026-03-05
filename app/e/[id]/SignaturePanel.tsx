"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import type { TenantProfile } from "@/types/tenant";

interface Props {
  estimateId: string;
  tenant: TenantProfile;
}

export function SignaturePanel({ estimateId, tenant }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDecline, setShowDecline] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      if (!canvas) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      padRef.current?.clear();
    }

    padRef.current = new SignaturePad(canvas, { backgroundColor: "rgb(255,255,255)" });
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      padRef.current?.off();
    };
  }, []);

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) { setError("Please type your full name"); return; }
    if (padRef.current?.isEmpty()) { setError("Please draw your signature above"); return; }

    setSubmitting(true);
    try {
      const dataUrl = padRef.current!.toDataURL("image/png");
      const res = await fetch(`/api/estimates/${estimateId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureDataUrl: dataUrl, signedByName: name }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    setDeclining(true);
    try {
      const res = await fetch(`/api/estimates/${estimateId}/decline`, { method: "POST" });
      if (res.ok) setDeclined(true);
      else {
        const body = await res.json();
        setError(body.error ?? "Could not decline. Please try again.");
      }
    } finally {
      setDeclining(false);
    }
  }

  if (done) {
    return (
      <div className="rounded border border-emerald-200 bg-emerald-50 p-8 text-center">
        <svg className="mx-auto h-10 w-10 text-emerald-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">Estimate Accepted</h3>
        <p className="mt-2 text-sm text-gray-500">
          Thank you, <strong className="text-gray-700">{name}</strong>. Your signature has been recorded and a copy has been sent to {tenant.name}.
        </p>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-8 text-center">
        <h3 className="text-base font-semibold text-red-700">Estimate Declined</h3>
        <p className="mt-2 text-sm text-gray-500">
          Your response has been recorded. {tenant.name} will be in touch.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border border-gray-200 bg-white p-6 space-y-5 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Sign &amp; Accept this Estimate</h3>
        <p className="mt-1 text-sm text-gray-500">Draw your signature and type your full name to accept.</p>
      </div>

      {/* Signature canvas */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Signature</label>
          <button
            type="button"
            onClick={() => padRef.current?.clear()}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        </div>
        <canvas
          ref={canvasRef}
          className="w-full rounded border border-gray-200 bg-white touch-none"
          style={{ height: 140 }}
        />
      </div>

      {/* Name field */}
      <div>
        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
          Full name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your full name to confirm"
          className="w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? "Submitting…" : "Sign & Accept Estimate"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        By signing you agree to the terms of this estimate. Your IP address and timestamp will be recorded.
      </p>

      {/* Decline option */}
      <div className="border-t border-gray-100 pt-4">
        {!showDecline ? (
          <button
            type="button"
            onClick={() => setShowDecline(true)}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            I need to decline this estimate
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Are you sure you want to decline this estimate?</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowDecline(false); setError(null); }}
                className="flex-1 rounded border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDecline}
                disabled={declining}
                className="flex-1 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                {declining ? "Declining…" : "Yes, decline"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
