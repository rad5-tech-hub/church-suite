import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import {
  Gift, CreditCard, CalendarDays, Check, Loader2, ChevronUp, ChevronDown,
  RefreshCw, Download, CreditCard as BillingIcon, HelpCircle, AlertTriangle,
  Bell, Clock, Shield, Database, Mail, ExternalLink, X, CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { fetchAllPlans, fetchMySubscription, subscribeToPlan, PlanData } from '../api';
import { setAccessToken, setTenantId, decodeJwtClaims } from '../apiClient';
import { openFlutterwaveCheckout } from '../utils/flutterwave';
import { extractSubscriptionCheckoutParams } from '../utils/walletFunding';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';

function fmt(amount: number | string | null | undefined) {
  if (amount == null) return '';
  const n = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
  if (isNaN(n)) return '';
  return `₦${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface PaidState { billingCycle: 'monthly' | 'annual'; branchCount: number; }

const PLAN_ICONS = [
  <Gift className="w-5 h-5" />,
  <CreditCard className="w-5 h-5" />,
  <CalendarDays className="w-5 h-5" />,
];
const PLAN_COLORS = ['text-green-600 bg-green-100', 'text-blue-600 bg-blue-100', 'text-purple-600 bg-purple-100'];
const PLAN_BORDER = ['border-green-500', 'border-gray-200', 'border-purple-500'];

export function Subscription() {
  const navigate = useNavigate();
  const { church, loadChurchFromServer } = useChurch();
  const { showToast } = useToast();
  const planSectionRef = useRef<HTMLDivElement>(null);

  const [plans, setPlans] = useState<PlanData[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [paidStates, setPaidStates] = useState<Record<string, PaidState>>({});
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const isMulti = church.type === 'multi';

  useEffect(() => {
    Promise.all([
      fetchAllPlans(),
      fetchMySubscription(),
    ]).then(([plansData, subData]) => {
      const seen = new Set<string>();
      const trial = plansData.find(p => p.isTrial);
      const paid = plansData.filter(p => !p.isTrial).filter(p => {
        if (seen.has(p.pricingConfig.id)) return false;
        seen.add(p.pricingConfig.id); return true;
      });
      const ordered = [...(trial ? [trial] : []), ...paid];
      setPlans(ordered);

      const init: Record<string, PaidState> = {};
      paid.forEach(p => { init[p.id] = { billingCycle: 'monthly', branchCount: 1 }; });
      setPaidStates(init);

      const sub = subData?.data ?? subData;
      setSubscription(sub);
    }).finally(() => setLoadingPlans(false));
  }, []);

  const setPaidState = (id: string, patch: Partial<PaidState>) =>
    setPaidStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const handleUpgrade = async (plan: PlanData) => {
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
        return;
      }
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
      const checkout = extractSubscriptionCheckoutParams(res);
      if (!checkout) throw new Error('Payment gateway not configured. Please contact support.');
      await openFlutterwaveCheckout({
        publicKey: checkout.publicKey,
        txRef: checkout.tx_ref,
        amount: checkout.amount,
        currency: checkout.currency,
        customer: { email: checkout.customer?.email ?? '', name: checkout.customer?.name ?? '' },
        title: 'Churchset Subscription',
        description: `${plan.name} — ${state.billingCycle}`,
        onComplete: async () => {
          try { await loadChurchFromServer(); } catch { /* non-fatal */ }
          showToast('Subscription activated!');
          navigate('/dashboard');
        },
        onClose: () => setSubscribing(null),
      });
    } catch (err: any) {
      showToast(err?.body?.message || err?.message || 'Something went wrong.', 'error');
    } finally {
      setSubscribing(null);
    }
  };

  // ── Derive subscription display values ─────────────────────────────────────
  const subPlanName: string = subscription?.planName ?? subscription?.plan?.name ?? 'Free Trial';
  const subStatus: string = subscription?.status ?? 'active';
  const subStartDate: string | null = subscription?.startDate ?? subscription?.createdAt ?? null;
  const subEndDate: string | null = subscription?.endDate ?? subscription?.expiresAt ?? null;
  const subIsTrial: boolean = subscription?.isTrial ?? true;

  const daysLeft: number = (() => {
    if (subEndDate) {
      const diff = new Date(subEndDate).getTime() - Date.now();
      return Math.max(0, Math.ceil(diff / 86400000));
    }
    // Fallback: find trial duration from plan list
    const trial = plans.find(p => p.isTrial);
    return trial?.trialDurationDays ?? 30;
  })();

  const totalDays: number = (() => {
    if (subStartDate && subEndDate) {
      return Math.ceil((new Date(subEndDate).getTime() - new Date(subStartDate).getTime()) / 86400000);
    }
    const trial = plans.find(p => p.isTrial);
    return trial?.trialDurationDays ?? 30;
  })();

  const progressPct = totalDays > 0 ? Math.max(2, Math.round((daysLeft / totalDays) * 100)) : 100;
  const isActive = subStatus === 'active';

  // Determine which plan card is "current"
  const currentPlanId = subscription?.planId ?? subscription?.plan?.id ?? null;
  const isCurrent = (plan: PlanData) =>
    currentPlanId ? plan.id === currentPlanId : plan.isTrial;

  const notifications = [
    { timing: '7 days before', icon: <Clock className="w-5 h-5 text-gray-400" />, desc: 'Friendly reminder that your subscription is ending soon. Includes a direct link to renew.' },
    { timing: '3 days before', icon: <AlertTriangle className="w-5 h-5 text-orange-400" />, desc: 'Urgent warning. Explains that read-only mode activates on expiry.' },
    { timing: '1 day before', icon: <Bell className="w-5 h-5 text-red-400" />, desc: 'Final warning. Same-day expiry notice.' },
  ];

  return (
    <Layout>
      <PageHeader
        title="My Subscription"
        description="Manage your Churchset subscription, billing information, and get help when you need it."
      />

      <div className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Current Plan */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-gray-900">Current Plan</h2>
                <Badge variant="outline" className="text-gray-600 border-gray-300">{subPlanName}</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                {/* Plan mini card */}
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">Plan</p>
                    <p className="font-semibold text-gray-900">{subPlanName}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{subIsTrial ? 'Free' : fmt(plans.find(p => !p.isTrial)?.pricingConfig.basePlanPrice)}</p>
                  </div>
                </div>

                {/* Next payment mini card */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Next Payment</p>
                    <p className="font-semibold text-gray-900">{subIsTrial ? 'After trial ends' : 'On renewal date'}</p>
                    {subStartDate && <p className="text-xs text-gray-400 mt-1">Started: {fmtDate(subStartDate)}</p>}
                    {subEndDate && <p className="text-xs text-gray-400">Expires: {fmtDate(subEndDate)}</p>}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Time Remaining</span>
                  <span className="font-semibold text-gray-900">{daysLeft} days left</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${daysLeft <= 3 ? 'bg-red-500' : daysLeft <= 7 ? 'bg-orange-500' : 'bg-green-500'}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white gap-2"
                  onClick={() => planSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <RefreshCw className="w-4 h-4" /> Upgrade to Paid Plan
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Download className="w-4 h-4" /> Export Data
                </Button>
              </div>
            </div>

            {/* Plan Options & Pricing */}
            <div ref={planSectionRef} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Plan Options & Pricing</h2>

              {loadingPlans ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : (
                <div className={`grid gap-4 ${plans.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                  {plans.map((plan, idx) => {
                    const ci = idx % PLAN_COLORS.length;
                    const base = parseFloat(plan.pricingConfig.basePlanPrice);
                    const annualTotal = base * 10;
                    const current = isCurrent(plan);
                    const state = paidStates[plan.id];
                    const isBest = !plan.isTrial && idx === plans.length - 1 && plans.length > 2;
                    const isProcessing = subscribing === plan.id;

                    return (
                      <div
                        key={plan.id}
                        className={`relative border-2 rounded-xl p-4 flex flex-col transition-all ${current ? PLAN_BORDER[0] + ' bg-green-50/30' : isBest ? PLAN_BORDER[2] : 'border-gray-200'}`}
                      >
                        {isBest && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                            Best Value
                          </span>
                        )}

                        <div className={`w-8 h-8 rounded-lg ${PLAN_COLORS[ci]} flex items-center justify-center mb-2`}>
                          {PLAN_ICONS[ci]}
                        </div>

                        <p className="font-semibold text-gray-900 text-sm">{plan.isTrial ? 'Free Trial' : plan.name}</p>

                        {plan.isTrial ? (
                          <>
                            <p className="text-2xl font-bold text-gray-900 mt-1">Free</p>
                            <p className="text-xs text-gray-500">{plan.trialDurationDays} days, full access</p>
                          </>
                        ) : (
                          <>
                            {state?.billingCycle === 'annual' ? (
                              <>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(annualTotal)}</p>
                                <p className="text-xs text-gray-500">per year</p>
                                <p className="text-xs text-purple-600 font-medium">Save {fmt(base * 12 - annualTotal)}</p>
                              </>
                            ) : (
                              <>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(base)}</p>
                                <p className="text-xs text-gray-500">per month</p>
                              </>
                            )}

                            {/* Billing toggle */}
                            <div className="flex rounded-md border border-gray-200 overflow-hidden mt-2 mb-2 text-xs font-medium">
                              <button onClick={() => setPaidState(plan.id, { billingCycle: 'monthly' })}
                                className={`flex-1 py-1 transition-colors ${state?.billingCycle === 'monthly' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                                Monthly
                              </button>
                              <button onClick={() => setPaidState(plan.id, { billingCycle: 'annual' })}
                                className={`flex-1 py-1 transition-colors ${state?.billingCycle === 'annual' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                                Annual
                              </button>
                            </div>

                            {isMulti && state && (
                              <div className="flex items-center justify-between mb-2 text-xs">
                                <span className="text-gray-500">Branches</span>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => setPaidState(plan.id, { branchCount: Math.max(1, state.branchCount - 1) })}
                                    className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                  <span className="w-4 text-center font-medium">{state.branchCount}</span>
                                  <button onClick={() => setPaidState(plan.id, { branchCount: state.branchCount + 1 })}
                                    className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        <div className="mt-auto pt-3">
                          {current ? (
                            <span className="inline-block text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Current</span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full font-semibold"
                              disabled={isProcessing || subscribing !== null}
                              onClick={() => handleUpgrade(plan)}
                            >
                              {isProcessing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                              Upgrade
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* What happens on expiry */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                What Happens When Your Subscription Expires?
              </h2>
              <p className="text-sm text-gray-600 mb-5">
                When your subscription expires, your account enters <strong>read-only mode</strong>. Your data is never deleted — it remains safely stored and is immediately restored once you renew.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                {/* CAN */}
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4" /> What you CAN still do
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'View all your members and their details',
                      'View departments, units, and branch structure',
                      'View workforce assignments and progress',
                      'View all programs and attendance history',
                      'View finance records, collections, and ledger',
                      'View reports, analytics, and charts',
                      'View newcomers and follow-up history',
                      'View SMS history and message logs',
                      'Download a full export of all your data',
                      'Renew or change your subscription plan',
                      'Contact support via the help desk',
                    ].map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs text-green-800">
                        <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-600" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CANNOT */}
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2 text-sm">
                    <X className="w-4 h-4" /> What you CANNOT do
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'Add, edit, or remove members',
                      'Create or modify departments or units',
                      'Add or manage branches',
                      'Update workforce assignments or roadmaps',
                      'Create, edit, or manage programs',
                      'Record attendance or collections',
                      'Send SMS messages or manage lists',
                      'Create or submit reports',
                      'Add newcomers or record follow-ups',
                      'Modify church settings or admin roles',
                      'Add or edit finance ledger entries',
                    ].map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs text-red-800">
                        <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-red-500" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Data safety note */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 text-sm">
                  <Database className="w-4 h-4" /> Your data is always safe
                </h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                  We never delete your church data, even after expiry. All your members, finances, programs, attendance records, and historical data remain securely stored. The moment you renew your subscription, everything is instantly restored to full working state — exactly as you left it.
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  You can also download a full backup of your data at any time, even in read-only mode, using the "Export Data" button above.
                </p>
              </div>
            </div>

            {/* Email Notifications */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-700" /> Email Notifications
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                Churchset automatically sends email reminders at 7 days, 3 days, and 1 day before your subscription expires, plus a final notification when it expires. These help ensure you never lose access unexpectedly.
              </p>
              <div className="space-y-3">
                {notifications.map(n => (
                  <div key={n.timing} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      {n.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-gray-900">{n.timing}</p>
                        <span className="text-xs text-gray-500 border border-gray-200 rounded-full px-2 py-0.5">Pending</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white justify-start gap-3"
                  onClick={() => planSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <RefreshCw className="w-4 h-4" /> Renew / Upgrade
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 text-gray-700">
                  <Download className="w-4 h-4" /> Download All Data
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 text-gray-700">
                  <BillingIcon className="w-4 h-4" /> Update Billing Info
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 text-gray-700">
                  <HelpCircle className="w-4 h-4" /> Get Help
                </Button>
              </div>
            </div>

            {/* Account Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">Account Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Church</span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">{church.name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-medium text-gray-900">{subPlanName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status</span>
                  <Badge className={isActive ? 'bg-gray-900 text-white' : 'bg-red-100 text-red-700'}>
                    {isActive ? 'Active' : subStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Days Left</span>
                  <span className={`font-bold ${daysLeft <= 3 ? 'text-red-600' : daysLeft <= 7 ? 'text-orange-500' : 'text-gray-900'}`}>{daysLeft}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Access</span>
                  <span className="font-medium text-green-600">Full Access</span>
                </div>
              </div>
            </div>

            {/* Need Help */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-500" /> Need Help?
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Our support team is here to help your ministry thrive. Reach out via our help desk or email us directly.
              </p>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 mb-3">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Support Email</p>
                  <p className="text-xs font-medium text-blue-600">support@churchset.com</p>
                </div>
              </div>
              <Button variant="outline" className="w-full gap-2 text-sm">
                <ExternalLink className="w-4 h-4" /> Open Help Desk
              </Button>
            </div>

            {/* Security note */}
            <div className="flex items-start gap-3 px-1">
              <Shield className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400 leading-relaxed">
                Your data is secure. Churchset uses industry-standard encryption. Payments are processed through certified gateways. Your data is never deleted, even after subscription expiry.
              </p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
