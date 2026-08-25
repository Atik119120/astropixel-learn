import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

import { SUPABASE_PROJECT_ID as PROJECT_REF } from "@/lib/env";
const FN_BASE = `https://${PROJECT_REF}.functions.supabase.co`;

interface Info {
  payment: {
    invoice_id: string;
    amount: number;
    currency: string;
    customer_name: string;
    customer_email: string;
    status: string;
    redirect_url: string;
    paid_at: string | null;
  };
  client: {
    name: string;
    website_url: string | null;
    logo_url: string | null;
    brand_color: string | null;
    checkout_title: string | null;
    checkout_description: string | null;
  } | null;
}

export default function CustomCheckoutPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    document.title = 'Secure Checkout — Astropixel Pay';
    if (!invoiceId) return;
    fetch(`${FN_BASE}/api-checkout-info?invoice_id=${encodeURIComponent(invoiceId)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setErr(d.error);
        else setInfo(d);
      })
      .catch(e => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  const pay = async () => {
    if (!invoiceId) return;
    setPaying(true);
    try {
      const r = await fetch(`${FN_BASE}/api-checkout-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });
      const d = await r.json();
      if (d.payment_url) {
        try {
          if (window.top && window.top !== window.self) {
            window.top.location.href = d.payment_url;
          } else {
            window.location.href = d.payment_url;
          }
        } catch {
          window.open(d.payment_url, '_blank', 'noopener,noreferrer');
        }
      } else {
        setErr(d.error || 'Failed to start payment');
        setPaying(false);
      }
    } catch (e) {
      setErr(String(e));
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (err || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-md text-center space-y-3">
          <XCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-xl font-semibold">Checkout Error</h1>
          <p className="text-sm text-slate-400">{err || 'Invoice not found'}</p>
        </div>
      </div>
    );
  }

  const { payment, client } = info;
  const brand = client?.brand_color || '#3B82F6';
  const isPaid = payment.status === 'paid';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md">
        <div
          className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900/80 backdrop-blur"
          style={{ boxShadow: `0 25px 80px -20px ${brand}40` }}
        >
          {/* Header */}
          <div className="p-6 text-center border-b border-white/5" style={{ background: `linear-gradient(135deg, ${brand}22, transparent)` }}>
            {client?.logo_url ? (
              <img src={client.logo_url} alt={client.name} className="h-12 mx-auto mb-3 object-contain" />
            ) : (
              <div
                className="h-12 w-12 mx-auto mb-3 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ background: brand }}
              >
                {(client?.name || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-lg font-semibold text-white">
              {client?.checkout_title || `Pay ${client?.name || 'Merchant'}`}
            </h1>
            {client?.checkout_description && (
              <p className="text-sm text-slate-400 mt-1">{client.checkout_description}</p>
            )}
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {isPaid ? (
              <div className="text-center py-4 space-y-2">
                <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
                <h2 className="text-lg font-semibold text-white">Payment Complete</h2>
                <p className="text-sm text-slate-400">This invoice has already been paid.</p>
                {payment.redirect_url && (
                  <a
                    href={`${payment.redirect_url}${payment.redirect_url.includes('?') ? '&' : '?'}invoice_id=${payment.invoice_id}&status=paid`}
                    className="inline-block mt-2 text-sm underline text-slate-300"
                  >
                    Return to {client?.name || 'site'}
                  </a>
                )}
              </div>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Amount Due</p>
                  <p className="text-4xl font-bold text-white mt-1">
                    ৳{payment.amount.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2 text-sm bg-white/5 rounded-lg p-3 border border-white/5">
                  <Row label="Customer" value={payment.customer_name} />
                  <Row label="Email" value={payment.customer_email} />
                  <Row label="Invoice" value={payment.invoice_id} mono />
                </div>

                <button
                  onClick={pay}
                  disabled={paying}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-60 hover:opacity-90 active:scale-[0.98]"
                  style={{ background: brand }}
                >
                  {paying ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Redirecting…
                    </span>
                  ) : (
                    `Pay ৳${payment.amount.toFixed(2)}`
                  )}
                </button>

                <p className="text-xs text-center text-slate-500 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Secured by UddoktaPay · bKash · Nagad · Cards
                </p>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-500">
              Powered by <span className="text-slate-300 font-semibold">Astropixel Pay</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className={`text-slate-200 truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
