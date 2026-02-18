'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Switch,
  Box,
  Grid,
  Slider as MuiSlider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../reduxstore/redux';
import { showPageToast } from '../../util/pageToast';
import { usePageToast } from '../../hooks/usePageToast';

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
interface PricingConfig {
  id: string;
  basePlanPrice: string;
  extraBranchPercent: string;
  annualDiscount: string;
  currency: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  isTrial: boolean;
  trialDurationDays: number;
  pricingConfig: PricingConfig;
}

export default function PricingSection() {
  const navigate = useNavigate();
  const authData = useSelector((state: RootState) => state.auth?.authData);
  usePageToast('Pricing-page');

  // State
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [branches, setBranches] = useState<number>(2); // Start at 2 for Pro plan
  const [yearlyStandard, setYearlyStandard] = useState(false);
  const [yearlyPro, setYearlyPro] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Flutterwave script status
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  // Load Flutterwave script once
  useEffect(() => {
    if (window.FlutterwaveCheckout) {
      setScriptReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => {
      setScriptError("Failed to load payment service");
    };
    document.body.appendChild(script);

    return () => {
      const el = document.querySelector(
        'script[src="https://checkout.flutterwave.com/v3.js"]'
      );
      el?.parentNode?.removeChild(el);
    };
  }, []);

  // Fetch plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('https://testchurch.bookbank.com.ng/plan/all-plans');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setPlans(data.data || []);
      } catch (err) {
        console.error('Failed to load plans:', err);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  // ────────────────────────────────────────────────
  // Classify plans
  // ────────────────────────────────────────────────
  const trialPlans = plans.filter(p => p.isTrial);
  const nonTrialPlans = plans.filter(p => !p.isTrial);

  const trialPlan = trialPlans.length > 0
  ? trialPlans.reduce((prev, curr) =>
      (curr.trialDurationDays || 0) > (prev.trialDurationDays || 0) ? curr : prev
    )
  : null;
  const standardPlan = nonTrialPlans.find((p) => parseFloat(p.pricingConfig.extraBranchPercent) === 0);
  const proPlan = nonTrialPlans.find((p) => parseFloat(p.pricingConfig.extraBranchPercent) > 0);

  // Calculations (display only)
  const stdBase = standardPlan ? parseFloat(standardPlan.pricingConfig.basePlanPrice) : 0;
  const stdDiscount = standardPlan ? parseFloat(standardPlan.pricingConfig.annualDiscount) : 0;
  const stdYearly = stdBase * 12 * (1 - stdDiscount);
  const proBase = proPlan ? parseFloat(proPlan.pricingConfig.basePlanPrice) : 0;
  const proExtra = proPlan ? parseFloat(proPlan.pricingConfig.extraBranchPercent) : 0;
  const proDiscount = proPlan ? parseFloat(proPlan.pricingConfig.annualDiscount) : 0;

  const proExtraCost = proBase * proExtra;
  const proMonthly = proBase + (branches - 1) * proExtraCost;
  const proYearly = proMonthly * 12 * (1 - proDiscount);

  const formatPrice = (amount: number, currency = 'NGN') =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const openFlutterwavePayment = (paymentUrlData: any) => {
    const flutterwave = (window as any).FlutterwaveCheckout;

    if (!flutterwave) {
      setErrorMsg('Payment service is not available at the moment.');
      return;
    }

    flutterwave({
      public_key: paymentUrlData.payment.publicKey,
      tx_ref: paymentUrlData.payment?.tx_ref,
      amount: paymentUrlData.payment?.amount,
      currency: paymentUrlData.payment?.currency || 'NGN',
      payment_options: 'card,banktransfer,ussd,mobilemoney',
      customer: paymentUrlData.customer || {},
      meta: paymentUrlData.meta || {},
      customizations: {
        title: 'ChurchSet Subscription',
        description: 'Complete your plan subscription',
        logo: '', // Add your logo URL here if available
      },
      callback: (response: any) => {
        console.log('Flutterwave response:', response);
        if (response.status === 'successful') {
          setErrorMsg(null);
          // Clear stored plan data
          localStorage.removeItem('selectedPlan');
          localStorage.removeItem('pendingSubscriptionToken');
          showPageToast('Payment completed successfully! Redirecting...');
          navigate('/dashboard');
        } else {
          setErrorMsg('Payment was not successful. Please try again.');
        }
      },
      onclose: () => {
        console.log('Payment modal closed by user');
        setSubmitting(false);
      },
    });
  };

  const handleSelectPlan = async (plan: Plan | undefined, isYearly: boolean, selectedBranches: number = 1) => {
    if (!plan) return;

    setErrorMsg(null);
    setSubmitting(true);

    try {
      // Pro plan validation
      if (plan.id === proPlan?.id && selectedBranches < 2) {
        setErrorMsg('Pro plan requires at least 2 branches.');
        setSubmitting(false);
        return;
      }

      const payload = {
        planId: plan.id,
        billingCycle: isYearly ? 'annual' : 'monthly',
        branchCount: selectedBranches,
      };

      // Store plan selection for recovery if needed
      localStorage.setItem('selectedPlan', JSON.stringify(payload));

      const token = localStorage.getItem('pendingSubscriptionToken') || authData?.token;

      if (!token) {
        localStorage.setItem('pendingSubscriptionToken', 'true'); // Flag for redirect back
        navigate('/login');
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'https://testchurch.bookbank.com.ng'}/plan/subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || errData?.error?.message || 'Subscription failed');
      }

      const data = await res.json();

      // Check if payment is required
      if (
        data?.paymentUrl &&
        data.paymentUrl?.payment?.amount > 0
      ) {
        openFlutterwavePayment(data.paymentUrl);
      } else {
        // Free plan or trial - no payment needed
        localStorage.removeItem('selectedPlan');
        localStorage.removeItem('pendingSubscriptionToken');
        showPageToast('Plan activated successfully!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      setErrorMsg(err.message || 'An error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  if (loadingPlans) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading plans...</Typography>
      </Box>
    );
  }

  return (
    <Box
      component="section"
      id="pricing"
      sx={{
        py: { xs: 9, md: 10 },
        px: { xs: 3, lg: 8 },
        bgcolor: 'grey.50',
        background: 'linear-gradient(to bottom, #f9fafb, #ffffff)',
      }}
    >
      <Box sx={{ maxWidth: '7xl', mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 12 }}>
          <Chip
            label="ChurchSet"
            sx={{
              mb: 2,
              bgcolor: 'purple.50',
              color: 'purple.main',
              fontWeight: 600,
            }}
          />
          <Typography variant="h3" fontWeight="bold" sx={{ mb: 2 }}>
            Start Managing Your Church Today
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '2xl', mx: 'auto' }}>
            Choose the plan that fits your ministry. No hidden fees.
          </Typography>
        </Box>

        {!scriptReady && !scriptError && (
          <Alert severity="info" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            Initializing secure payment system...
          </Alert>
        )}

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }} onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        <Grid container spacing={4} justifyContent="center">
          {/* Free Plan */}
          {trialPlan && (
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
              <Card
                sx={{
                  position: 'relative',
                  height: '100%',
                  border: '2px solid',
                  borderColor: 'gray.100',
                  boxShadow: 6,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-8px)', boxShadow: 12 },
                }}
              >

                <CardContent sx={{ p: 6 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {trialPlan.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Perfect for getting started
                  </Typography>

                  <Box sx={{ my: 4, textAlign: 'center' }}>      
                    <Typography variant="body2" color="text.secondary">
                      <span className="text-5xl font-bold text-gray-900">₦0</span>
                      <span className="text-gray-600">/month</span>                    
                    </Typography>
                  </Box>

                  <Box component="ul" sx={{ mb: 6, pl: 0, listStyle: 'none' }}>
                    {[
                      'All features',
                      '24/7 customer support',
                      `${trialPlan.trialDurationDays || 30}-day trial`,
                    ].map((f) => (
                      <Box component="li" key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <CheckIcon sx={{ color: 'purple.900' }} />
                        <Typography variant="body2">{f}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    disabled={submitting}
                    onClick={() => handleSelectPlan(trialPlan, false)}
                    sx={{
                      py: 1.5,
                      background: 'linear-gradient(to right, #1e293b, #6b21a8)',
                      '&:hover': { background: 'linear-gradient(to right, #111827, #5b21b6)' },
                      '&:disabled': {
                        background: 'linear-gradient(to right, #94a3b8, #c084fc)',
                        color: 'rgba(255, 255, 255, 0.5)',
                      },
                    }}
                  >
                    {submitting ? 'Processing...' : 'Get Started Now'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Standard Plan */}
          {standardPlan && (
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
              <Card
                sx={{
                  position: 'relative',
                  height: '100%',
                  border: '2px solid',
                  borderColor: 'purple.900',
                  boxShadow: 6,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-8px)', boxShadow: 12 },
                }}
              >
                <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
                  <Chip label="Popular" color="primary" size="small" />
                </Box>

                <CardContent sx={{ p: 6 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {standardPlan.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    For growing ministries
                  </Typography>

                  <Box sx={{ my: 4, textAlign: 'center' }}>
                    <Typography
                      variant="h3"
                      fontWeight="bold"
                      sx={{
                        background: 'linear-gradient(to right, #1a1a1a, #6b21a8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {yearlyStandard ? formatPrice(stdYearly) : formatPrice(stdBase)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      /{yearlyStandard ? 'year' : 'month'}
                    </Typography>

                    {stdDiscount > 0 && (
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        <Typography>Monthly</Typography>
                        <Switch checked={yearlyStandard} onChange={() => setYearlyStandard(!yearlyStandard)} />
                        <Typography color={yearlyStandard ? 'purple.700' : 'text.secondary'}>
                          Yearly – Save {Math.round(stdDiscount * 100)}%
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box component="ul" sx={{ mb: 6, pl: 0, listStyle: 'none' }}>
                    {[
                      'Unlimited workforce',
                      'People management',
                      'Plan worship services',
                      'Manage attendance',
                      'Priority support 24/7',
                      'Advanced analytics',
                      'SMS & Email messaging',
                      'Custom branding',
                    ].map((f) => (
                      <Box component="li" key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <CheckIcon sx={{ color: 'purple.900' }} />
                        <Typography variant="body2">{f}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    disabled={submitting}
                    onClick={() => handleSelectPlan(standardPlan, yearlyStandard, 1)}
                    sx={{
                      py: 1.5,
                      background: 'linear-gradient(to right, #1e293b, #6b21a8)',
                      '&:hover': { background: 'linear-gradient(to right, #111827, #5b21b6)' },
                      '&:disabled': {
                        background: 'linear-gradient(to right, #94a3b8, #c084fc)',
                        color: 'rgba(255, 255, 255, 0.5)',
                      },
                    }}
                  >
                    {submitting ? 'Processing...' : 'Get Started Now'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Pro Plan */}
          {proPlan && (
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
              <Card
                sx={{
                  position: 'relative',
                  height: '100%',
                  border: '2px solid',
                  borderColor: 'indigo.900',
                  boxShadow: 6,
                  borderRadius: 4,
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-8px)', boxShadow: 12 },
                }}
              >
                <CardContent sx={{ p: 6 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {proPlan.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    For ministries with multiple branches
                  </Typography>

                  <Box sx={{ my: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography fontWeight="bold">Branches: {branches}</Typography>
                      <Typography color="text.secondary">Max 50</Typography>
                    </Box>
                    <MuiSlider
                      value={branches}
                      onChange={(_, v) => setBranches(v as number)}
                      min={2}
                      max={50}
                      step={1}
                      valueLabelDisplay="auto"
                      sx={{ color: 'indigo.700' }}
                    />
                    {branches < 2 && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                        Pro plan requires at least 2 branches
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ mb: 6, textAlign: 'center' }}>
                    <Typography
                      variant="h3"
                      fontWeight="bold"
                      sx={{
                        background: 'linear-gradient(to right, #1e293b, #4338ca)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {yearlyPro ? formatPrice(proYearly) : formatPrice(proMonthly)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      /{yearlyPro ? 'year' : 'month'}
                    </Typography>

                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <Typography>Monthly</Typography>
                      <Switch checked={yearlyPro} onChange={() => setYearlyPro(!yearlyPro)} />
                      <Typography color={yearlyPro ? 'indigo.700' : 'text.secondary'}>
                        Yearly {proDiscount > 0 && `– Save ${Math.round(proDiscount * 100)}%`}
                      </Typography>
                    </Box>
                  </Box>

                  <Box component="ul" sx={{ mb: 6, pl: 0, listStyle: 'none' }}>
                    {[
                      'Unlimited workforce',
                      'People management',
                      'Plan worship services',
                      'Manage attendance',
                      'Priority support 24/7',
                      'Advanced analytics',
                      'SMS & Email messaging',
                      'Branch management',
                      'Custom branding',
                    ].map((f) => (
                      <Box component="li" key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <CheckIcon sx={{ color: 'indigo.900' }} />
                        <Typography variant="body2">{f}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    disabled={submitting || branches < 2}
                    onClick={() => handleSelectPlan(proPlan, yearlyPro, branches)}
                    sx={{
                      py: 1.5,
                      background: 'linear-gradient(to right, #1e293b, #4338ca)',
                      '&:hover': { background: 'linear-gradient(to right, #111827, #3730a3)' },
                      '&:disabled': {
                        background: 'linear-gradient(to right, #94a3b8, #818cf8)',
                        color: 'rgba(255, 255, 255, 0.5)',
                      },
                    }}
                  >
                    {submitting ? 'Processing...' :  'Get Started Now'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
}