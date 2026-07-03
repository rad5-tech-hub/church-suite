import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Gift, CreditCard, CalendarDays, Check, Loader2, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { fetchAllPlans, subscribeToPlan, PlanData } from '../api';
import { setAccessToken, setTenantId, decodeJwtClaims } from '../apiClient';
import { openFlutterwaveCheckout } from '../utils/flutterwave';
import { extractSubscriptionCheckoutParams } from '../utils/walletFunding';
import { useChurch } from '../context/ChurchContext';

function fmt(amount: number | string | null | undefined, symbol = '₦') {
  if (amount == null) return '';
  const n = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
  if (isNaN(n)) return '';
  return `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const PLAN_ICONS = [
  <Gift className="w-8 h-8 text-white" />,
  <CreditCard className="w-8 h-8 text-white" />,
  <CalendarDays className="w-8 h-8 text-white" />,
];
const ICON_COLORS = ['bg-green-500', 'bg-blue-500', 'bg-purple-600'];
const CHECK_COLORS = ['text-green-500', 'text-blue-500', 'text-purple-600'];
const BTN_COLORS = [
  'bg-green-500 hover:bg-green-600 text-white',
  'bg-blue-500 hover:bg-blue-600 text-white',
  'bg-purple-600 hover:bg-purple-700 text-white',
];

interface PaidCardState {
  billingCycle: 'monthly' | 'annual';
  branchCount: number;
}

export function ChoosePlan() {
  const navigate = useNavigate();
  const { church, loadChurchFromServer } = useChurch();

  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [paidStates, setPaidStates] = useState<Record<string, PaidCardState>>({});
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [subError, setSubError] = useState('');

  useEffect(() => {
    fetchAllPlans()
      .then(data => {
        // Deduplicate: one trial + unique paid plans by pricingConfig.id
        const seen = new Set<string>();
        const trialPlan = data.find(p => p.isTrial);
        const paidPlans = data
          .filter(p => !p.isTrial)
          .filter(p => {
            if (seen.has(p.pricingConfig.id)) return false;
            seen.add(p.pricingConfig.id);
            return true;
          });

        const ordered = [
          ...(trialPlan ? [trialPlan] : []),
          ...paidPlans,
        ];
        setPlans(ordered);

        // Init billing cycle state for paid plans
        const init: Record<string, PaidCardState> = {};
        paidPlans.forEach(p => { init[p.id] = { billingCycle: 'monthly', branchCount: 1 }; });
        setPaidStates(init);
      })
      .catch(() => setLoadError('Failed to load plans. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  const isMulti = church.type === 'multi';

  const handleSelect = async (plan: PlanData) => {
    setSubscribing(plan.id);
    setSubError('');
    try {
      if (plan.isTrial) {
        // ── Free trial ──────────────────────────────────────────────
        const res = await subscribeToPlan({ planId: plan.id });
        if (res.accessToken) {
          setAccessToken(res.accessToken);
          const claims = decodeJwtClaims(res.accessToken);
          if (claims?.tenantId) setTenantId(claims.tenantId);
        }
        try { await loadChurchFromServer(); } catch { /* non-fatal */ }
        navigate('/dashboard');
      } else {
        // ── Paid plan ───────────────────────────────────────────────
        const state = paidStates[plan.id];
        const res = await subscribeToPlan({
          planId: plan.id,
          billingCycle: state.billingCycle,
          branchCount: isMulti ? state.branchCount : 1,
        });

        if (res.accessToken) {
          // Immediate access granted (shouldn't happen for paid, but handle it)
          setAccessToken(res.accessToken);
          const claims = decodeJwtClaims(res.accessToken);
          if (claims?.tenantId) setTenantId(claims.tenantId);
          try { await loadChurchFromServer(); } catch { /* non-fatal */ }
          navigate('/dashboard');
          return;
        }

        const checkout = extractSubscriptionCheckoutParams(res);
        if (!checkout) throw new Error('Payment gateway not configured or no payment details returned. Please contact support.');

        await openFlutterwaveCheckout({
          publicKey: checkout.publicKey,
          txRef: checkout.tx_ref,
          amount: checkout.amount,
          currency: checkout.currency,
          customer: {
            email: checkout.customer?.email ?? '',
            name: checkout.customer?.name ?? '',
          },
          title: 'Churchset Subscription',
          description: `${plan.name} — ${state.billingCycle} plan`,
          onComplete: async () => {
            try { await loadChurchFromServer(); } catch { /* non-fatal */ }
            navigate('/dashboard');
          },
          onClose: () => {
            setSubscribing(null);
          },
        });
      }
    } catch (err: any) {
      const msg =
        err?.body?.message ||
        err?.message ||
        'Something went wrong. Please try again.';
      setSubError(msg);
    } finally {
      setSubscribing(null);
    }
  };

  const setPaidState = (planId: string, patch: Partial<PaidCardState>) => {
    setPaidStates(prev => ({ ...prev, [planId]: { ...prev[planId], ...patch } }));
  };

  // ─── Loading / Error states ───────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b px-6 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">C</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-none">Churchset</p>
          <p className="text-xs text-gray-500 leading-none mt-0.5">
            Choose your plan for {church.name || 'your church'}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Pill */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          One more step to empower your ministry
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-3">
          Choose Your Plan
        </h1>
        <p className="text-gray-500 text-center max-w-lg mb-10">
          Start with a free 30-day trial to experience everything Churchset has to offer, or
          choose a paid plan to get started right away with continuous access.
        </p>

        {subError && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm max-w-lg w-full text-center">
            {subError}
          </div>
        )}

        {/* Plan cards */}
        <div className={`grid gap-6 w-full max-w-5xl ${plans.length === 1 ? 'max-w-sm' : plans.length === 2 ? 'md:grid-cols-2 max-w-2xl' : 'md:grid-cols-3'}`}>
          {plans.map((plan, idx) => {
            const colorIdx = idx % ICON_COLORS.length;
            const isTrial = plan.isTrial;
            const state = paidStates[plan.id];
            const basePrice = parseFloat(plan.pricingConfig.basePlanPrice);
            const annualTotal = basePrice * 10; // 10 months = 2 months free
            const isBestValue = !isTrial && idx === plans.length - 1 && plans.length > 2;
            const isProcessing = subscribing === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border-2 flex flex-col overflow-hidden transition-all ${
                  isBestValue ? 'border-purple-500 shadow-lg' : 'border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Best value badge */}
                {isBestValue && (
                  <div className="absolute top-0 left-0 right-0 bg-purple-600 text-white text-xs font-semibold text-center py-1.5 tracking-wide">
                    Best Value — Save ₦{annualTotal > 0 ? ((basePrice * 12 - annualTotal)).toLocaleString() : '60,000'}
                  </div>
                )}

                <div className={`p-6 flex flex-col flex-1 ${isBestValue ? 'pt-10' : ''}`}>
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl ${ICON_COLORS[colorIdx]} flex items-center justify-center mb-4`}>
                    {PLAN_ICONS[colorIdx]}
                  </div>

                  {/* Name & price */}
                  <h2 className="text-lg font-bold text-gray-900 mb-1">
                    {isTrial ? 'Free Trial' : plan.name}
                  </h2>

                  {isTrial ? (
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-gray-900">Free</span>
                      <span className="text-gray-500 text-sm ml-1">for {plan.trialDurationDays} days</span>
                    </div>
                  ) : (
                    <div className="mb-2">
                      {state?.billingCycle === 'annual' ? (
                        <>
                          <span className="text-4xl font-bold text-gray-900">{fmt(annualTotal)}</span>
                          <span className="text-gray-500 text-sm">/year</span>
                          <p className="text-xs text-green-600 font-medium mt-0.5">
                            {fmt(Math.round(annualTotal / 12))}/month — save 2 months!
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="text-4xl font-bold text-gray-900">{fmt(basePrice)}</span>
                          <span className="text-gray-500 text-sm">/month</span>
                        </>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                  {/* Billing cycle toggle for paid plans */}
                  {!isTrial && state && (
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-4 text-sm font-medium">
                      <button
                        onClick={() => setPaidState(plan.id, { billingCycle: 'monthly' })}
                        className={`flex-1 py-1.5 transition-colors ${
                          state.billingCycle === 'monthly'
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setPaidState(plan.id, { billingCycle: 'annual' })}
                        className={`flex-1 py-1.5 transition-colors ${
                          state.billingCycle === 'annual'
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Annual
                      </button>
                    </div>
                  )}

                  {/* Branch count for multi-branch + paid */}
                  {!isTrial && isMulti && state && (
                    <div className="flex items-center justify-between mb-4 text-sm">
                      <span className="text-gray-600">Branches</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPaidState(plan.id, { branchCount: Math.max(1, state.branchCount - 1) })}
                          className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-medium">{state.branchCount}</span>
                        <button
                          onClick={() => setPaidState(plan.id, { branchCount: state.branchCount + 1 })}
                          className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <ul className="space-y-2 flex-1 mb-6">
                    {isTrial ? (
                      <>
                        {[
                          'Full access to all features',
                          'Unlimited members & departments',
                          'SMS communication tools',
                          'Finance & collection management',
                          'Analytics & reporting',
                          'Follow-up & newcomer tracking',
                          'Workforce management',
                          `${plan.trialDurationDays} days to explore everything`,
                        ].map(f => (
                          <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${CHECK_COLORS[colorIdx]}`} />
                            {f}
                          </li>
                        ))}
                      </>
                    ) : (
                      <>
                        {[
                          'Everything in Free Trial',
                          'Continuous uninterrupted access',
                          'Priority email support',
                          'Regular feature updates',
                          'Data backup & security',
                          ...(isMulti ? ['Multi-branch support'] : []),
                          'Cancel anytime',
                        ].map(f => (
                          <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${CHECK_COLORS[colorIdx]}`} />
                            {f}
                          </li>
                        ))}
                      </>
                    )}
                  </ul>

                  {/* Note for trial */}
                  {isTrial && (
                    <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-xs text-green-700 mb-4">
                      No payment required. Automatically expires after {plan.trialDurationDays} days.
                    </div>
                  )}

                  {/* Annual savings note */}
                  {!isTrial && state?.billingCycle === 'annual' && (
                    <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-xs text-purple-700 mb-4">
                      Equivalent to {fmt(Math.round(annualTotal / 12))}/month — save 2 months!
                    </div>
                  )}

                  {/* CTA */}
                  <Button
                    className={`w-full ${BTN_COLORS[colorIdx]}`}
                    disabled={isProcessing || (subscribing !== null && subscribing !== plan.id)}
                    onClick={() => handleSelect(plan)}
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</>
                    ) : isTrial ? (
                      'Start Free Trial'
                    ) : (
                      `Subscribe — ${state?.billingCycle === 'annual' ? fmt(annualTotal) + '/yr' : fmt(basePrice) + '/mo'}`
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-xs text-gray-400 text-center">
          By continuing, you agree to our{' '}
          <span className="underline cursor-pointer">Terms of Service</span> and{' '}
          <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
