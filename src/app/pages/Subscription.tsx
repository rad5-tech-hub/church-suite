import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { Gift, CreditCard, CalendarDays, Check, Loader2, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { fetchAllPlans, subscribeToPlan, PlanData } from '../api';
import { setAccessToken, setTenantId, decodeJwtClaims } from '../apiClient';
import { openFlutterwaveCheckout } from '../utils/flutterwave';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';

const FLW_PUBLIC_KEY = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '';

function fmt(amount: number | string | null | undefined) {
  if (amount == null) return '';
  const n = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
  if (isNaN(n)) return '';
  return `₦${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const PLAN_ICONS = [
  <Gift className="w-7 h-7 text-white" />,
  <CreditCard className="w-7 h-7 text-white" />,
  <CalendarDays className="w-7 h-7 text-white" />,
];
const ICON_BG = ['bg-green-500', 'bg-blue-500', 'bg-purple-600'];
const CHECK_COLOR = ['text-green-500', 'text-blue-500', 'text-purple-600'];
const BORDER_ACTIVE = ['border-green-500', 'border-blue-500', 'border-purple-600'];
const BTN_COLOR = [
  'bg-green-500 hover:bg-green-600 text-white',
  'bg-blue-500 hover:bg-blue-600 text-white',
  'bg-purple-600 hover:bg-purple-700 text-white',
];

interface PaidState {
  billingCycle: 'monthly' | 'annual';
  branchCount: number;
}

export function Subscription() {
  const navigate = useNavigate();
  const { church, loadChurchFromServer } = useChurch();
  const { showToast } = useToast();

  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [paidStates, setPaidStates] = useState<Record<string, PaidState>>({});
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const isMulti = church.type === 'multi';

  useEffect(() => {
    fetchAllPlans()
      .then(data => {
        const seen = new Set<string>();
        const trialPlan = data.find(p => p.isTrial);
        const paidPlans = data
          .filter(p => !p.isTrial)
          .filter(p => { if (seen.has(p.pricingConfig.id)) return false; seen.add(p.pricingConfig.id); return true; });
        const ordered = [...(trialPlan ? [trialPlan] : []), ...paidPlans];
        setPlans(ordered);
        const init: Record<string, PaidState> = {};
        paidPlans.forEach(p => { init[p.id] = { billingCycle: 'monthly', branchCount: 1 }; });
        setPaidStates(init);
      })
      .catch(() => setLoadError('Failed to load plans. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  const setPaidState = (planId: string, patch: Partial<PaidState>) =>
    setPaidStates(prev => ({ ...prev, [planId]: { ...prev[planId], ...patch } }));

  const handleSelect = async (plan: PlanData) => {
    setSubscribing(plan.id);
    try {
      if (plan.isTrial) {
        const res = await subscribeToPlan({ planId: plan.id });
        if (res.accessToken) {
          setAccessToken(res.accessToken);
          const claims = decodeJwtClaims(res.accessToken);
          if (claims?.tenantId) setTenantId(claims.tenantId);
        }
        try { await loadChurchFromServer(); } catch { /* non-fatal */ }
        showToast('Free trial activated!');
        navigate('/dashboard');
      } else {
        const state = paidStates[plan.id];
        const res = await subscribeToPlan({
          planId: plan.id,
          billingCycle: state.billingCycle,
          branchCount: isMulti ? state.branchCount : 1,
        });

        if (res.accessToken) {
          setAccessToken(res.accessToken);
          const claims = decodeJwtClaims(res.accessToken);
          if (claims?.tenantId) setTenantId(claims.tenantId);
          try { await loadChurchFromServer(); } catch { /* non-fatal */ }
          showToast('Subscription activated!');
          navigate('/dashboard');
          return;
        }

        const pUrl = res.paymentUrl;
        if (!pUrl) throw new Error('No payment details returned.');

        const publicKey = pUrl.publicKey || FLW_PUBLIC_KEY;
        if (!publicKey) throw new Error('Payment gateway not configured. Please contact support.');

        await openFlutterwaveCheckout({
          publicKey,
          txRef: pUrl.payment.tx_ref,
          amount: Number(pUrl.payment.amount),
          currency: pUrl.payment.currency || 'NGN',
          customer: { email: pUrl.customer.email, name: pUrl.customer.name },
          title: 'Churchset Subscription',
          description: `${plan.name} — ${state.billingCycle}`,
          onComplete: async () => {
            try { await loadChurchFromServer(); } catch { /* non-fatal */ }
            showToast('Subscription activated!');
            navigate('/dashboard');
          },
          onClose: () => setSubscribing(null),
        });
      }
    } catch (err: any) {
      showToast(err?.body?.message || err?.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Subscription & Pricing"
        description="Choose the plan that best fits your church's needs."
      />

      <div className="p-4 md:p-6">
        <div className="max-w-5xl mx-auto">

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          )}

          {/* Error */}
          {!loading && loadError && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {loadError}
            </div>
          )}

          {/* Plan cards */}
          {!loading && !loadError && (
            <div className={`grid gap-6 ${plans.length === 1 ? 'max-w-sm' : plans.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
              {plans.map((plan, idx) => {
                const ci = idx % ICON_BG.length;
                const isTrial = plan.isTrial;
                const state = paidStates[plan.id];
                const basePrice = parseFloat(plan.pricingConfig.basePlanPrice);
                const annualTotal = basePrice * 10;
                const isBestValue = !isTrial && idx === plans.length - 1 && plans.length > 2;
                const isProcessing = subscribing === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-2xl border-2 flex flex-col overflow-hidden shadow-sm transition-all hover:shadow-md ${
                      isBestValue ? `${BORDER_ACTIVE[ci]} shadow-md` : 'border-gray-200'
                    }`}
                  >
                    {isBestValue && (
                      <div className={`absolute top-0 inset-x-0 py-1.5 text-center text-xs font-semibold text-white ${ICON_BG[ci]}`}>
                        Best Value — Save ₦{((basePrice * 12) - annualTotal).toLocaleString()}
                      </div>
                    )}

                    <div className={`p-6 flex flex-col flex-1 ${isBestValue ? 'pt-10' : ''}`}>
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl ${ICON_BG[ci]} flex items-center justify-center mb-4`}>
                        {PLAN_ICONS[ci]}
                      </div>

                      {/* Name */}
                      <h2 className="text-lg font-bold text-gray-900 mb-1">
                        {isTrial ? 'Free Trial' : plan.name}
                      </h2>

                      {/* Price */}
                      {isTrial ? (
                        <div className="mb-1">
                          <span className="text-3xl font-bold text-gray-900">Free</span>
                          <span className="text-gray-500 text-sm ml-1">for {plan.trialDurationDays} days</span>
                        </div>
                      ) : (
                        <div className="mb-1">
                          {state?.billingCycle === 'annual' ? (
                            <>
                              <span className="text-3xl font-bold text-gray-900">{fmt(annualTotal)}</span>
                              <span className="text-gray-500 text-sm">/year</span>
                              <p className="text-xs text-green-600 font-medium mt-0.5">
                                {fmt(Math.round(annualTotal / 12))}/mo — save 2 months!
                              </p>
                            </>
                          ) : (
                            <>
                              <span className="text-3xl font-bold text-gray-900">{fmt(basePrice)}</span>
                              <span className="text-gray-500 text-sm">/month</span>
                            </>
                          )}
                        </div>
                      )}

                      <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                      {/* Billing cycle toggle */}
                      {!isTrial && state && (
                        <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-4 text-sm font-medium">
                          <button
                            onClick={() => setPaidState(plan.id, { billingCycle: 'monthly' })}
                            className={`flex-1 py-1.5 transition-colors ${state.billingCycle === 'monthly' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                          >
                            Monthly
                          </button>
                          <button
                            onClick={() => setPaidState(plan.id, { billingCycle: 'annual' })}
                            className={`flex-1 py-1.5 transition-colors ${state.billingCycle === 'annual' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                          >
                            Annual
                          </button>
                        </div>
                      )}

                      {/* Branch count (multi-branch only) */}
                      {!isTrial && isMulti && state && (
                        <div className="flex items-center justify-between mb-4 text-sm">
                          <span className="text-gray-600">Branches</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setPaidState(plan.id, { branchCount: Math.max(1, state.branchCount - 1) })}
                              className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center font-medium">{state.branchCount}</span>
                            <button onClick={() => setPaidState(plan.id, { branchCount: state.branchCount + 1 })}
                              className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                              <ChevronUp className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Features */}
                      <ul className="space-y-2 flex-1 mb-5">
                        {(isTrial ? [
                          'Full access to all features',
                          'Unlimited members & departments',
                          'SMS communication tools',
                          'Finance & collection management',
                          'Analytics & reporting',
                          'Follow-up & newcomer tracking',
                          `${plan.trialDurationDays} days to explore everything`,
                        ] : [
                          'Everything in Free Trial',
                          'Continuous uninterrupted access',
                          'Priority email support',
                          'Regular feature updates',
                          'Data backup & security',
                          ...(isMulti ? ['Multi-branch support'] : []),
                          'Cancel anytime',
                        ]).map(f => (
                          <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${CHECK_COLOR[ci]}`} />
                            {f}
                          </li>
                        ))}
                      </ul>

                      {isTrial && (
                        <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-xs text-green-700 mb-4">
                          No payment required. Automatically expires after {plan.trialDurationDays} days.
                        </div>
                      )}

                      {!isTrial && state?.billingCycle === 'annual' && (
                        <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-xs text-purple-700 mb-4">
                          Equivalent to {fmt(Math.round(annualTotal / 12))}/month — save 2 months!
                        </div>
                      )}

                      <Button
                        className={`w-full ${BTN_COLOR[ci]}`}
                        disabled={isProcessing || (subscribing !== null && subscribing !== plan.id)}
                        onClick={() => handleSelect(plan)}
                      >
                        {isProcessing
                          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</>
                          : isTrial
                            ? 'Start Free Trial'
                            : `Subscribe — ${state?.billingCycle === 'annual' ? fmt(annualTotal) + '/yr' : fmt(basePrice) + '/mo'}`
                        }
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
