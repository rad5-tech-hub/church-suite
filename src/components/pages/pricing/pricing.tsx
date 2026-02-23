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
import {
  Check as CheckIcon,
  AutoAwesome as SparkleIcon,
  TrendingUp as TrendingIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
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
  const [branches, setBranches] = useState<number>(2);
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
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/plan/all-plans`);
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

  // Calculations
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
        logo: '',
      },
      callback: (response: any) => {
        console.log('Flutterwave response:', response);
        if (response.status === 'successful') {
          setErrorMsg(null);
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

      localStorage.setItem('selectedPlan', JSON.stringify(payload));
      const token = localStorage.getItem('pendingSubscriptionToken') || authData?.token;

      if (!token) {
        localStorage.setItem('pendingSubscriptionToken', 'true');
        navigate('/login');
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/plan/subscribe`,
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

      if (data?.paymentUrl && data.paymentUrl?.payment?.amount > 0) {
        openFlutterwavePayment(data.paymentUrl);
      } else {
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
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'var(--color-surface)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle at 20% 50%, rgba(124, 58, 237, 0.15) 0%, transparent 50%)',
            animation: 'rotate 30s linear infinite',
          },
          '@keyframes rotate': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
        }}
      >
        <Box sx={{ textAlign: 'center', zIndex: 1 }}>
          <CircularProgress
            size={60}
            thickness={3}
            sx={{
              color: 'var(--color-accent)',
              filter: 'drop-shadow(0 0 20px rgba(18, 2, 46, 0.6))',
            }}
          />
          <Typography
            sx={{
              mt: 3,
              color: 'var(--color-text-primary)',
              fontSize: '1.1rem',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Loading Plans...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      component="section"
      id="pricing"
      sx={{
        minHeight: '100vh',
        py: { xs: 8, md: 12 },
        px: { xs: 2, sm: 3, lg: 6 },
        bgcolor: 'var(--color-surface)',
        position: 'relative',
        overflow: 'hidden',
        // Animated gradient overlay
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(20, 9, 39, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(32, 24, 45, 0.08) 0%, transparent 50%)',
          animation: 'pulse 8s ease-in-out infinite',
          pointerEvents: 'none',
        },
        '@keyframes pulse': {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 1 },
        },
        // Floating orbs
        '&::after': {
          content: '""',
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(26, 15, 45, 0.08) 0%, transparent 70%)',
          top: '-300px',
          right: '-200px',
          filter: 'blur(60px)',
          animation: 'float 20s ease-in-out infinite',
        },
        '@keyframes float': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-100px, 50px)' },
        },
      }}
    >
      <Box sx={{ maxWidth: '1400px', mx: 'auto', position: 'relative', zIndex: 1 }}>
        {/* Header Section */}
        <Box
          sx={{
            textAlign: 'center',
            mb: { xs: 6, md: 10 },
            animation: 'fadeInDown 1s ease-out',
            '@keyframes fadeInDown': {
              '0%': { opacity: 0, transform: 'translateY(-30px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              mb: 3,
              px: 3,
              py: 1.2,
              borderRadius: '50px',
              background: 'var(--color-surface-glass)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--color-border-glass)',
              boxShadow: '0 8px 32px rgba(31, 15, 59, 0.15)',
            }}
          >
            <SparkleIcon sx={{ fontSize: 18, color: 'var(--color-accent)' }} />
            <Typography
              sx={{
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-accent) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ChurchSet Pricing
            </Typography>
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2rem', sm: '2.75rem', md: '3.5rem' },
              mb: 2.5,
              background: 'linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Choose Your Ministry Plan
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: 'var(--color-text-secondary)',
              maxWidth: '700px',
              mx: 'auto',
              fontSize: { xs: '1rem', md: '1.15rem' },
              lineHeight: 1.7,
              fontWeight: 400,
            }}
          >
            Empower your ministry with tools designed for growth. Transparent pricing, no hidden fees.
          </Typography>
        </Box>

        {/* Alerts */}
        {!scriptReady && !scriptError && (
          <Box
            sx={{
              mb: 4,
              maxWidth: 600,
              mx: 'auto',
              animation: 'fadeIn 0.5s ease-out',
              '@keyframes fadeIn': {
                '0%': { opacity: 0 },
                '100%': { opacity: 1 },
              },
            }}
          >
            <Alert
              severity="info"
              icon={<CircularProgress size={18} sx={{ color: 'var(--color-accent)' }} />}
              sx={{
                borderRadius: '16px',
                backdropFilter: 'blur(20px)',
                background: 'var(--color-surface-glass)',
                border: '1px solid var(--color-border-glass)',
                color: 'var(--color-text-secondary)',
                '& .MuiAlert-icon': { color: 'var(--color-accent)' },
              }}
            >
              Initializing secure payment system...
            </Alert>
          </Box>
        )}

        {errorMsg && (
          <Box
            sx={{
              mb: 4,
              maxWidth: 600,
              mx: 'auto',
              animation: 'shake 0.5s ease-out',
              '@keyframes shake': {
                '0%, 100%': { transform: 'translateX(0)' },
                '25%': { transform: 'translateX(-10px)' },
                '75%': { transform: 'translateX(10px)' },
              },
            }}
          >
            <Alert
              severity="error"
              onClose={() => setErrorMsg(null)}
              sx={{
                borderRadius: '16px',
                backdropFilter: 'blur(20px)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                '& .MuiAlert-icon': { color: '#f87171' },
              }}
            >
              {errorMsg}
            </Alert>
          </Box>
        )}

        {/* Pricing Cards */}
        <Grid
          container
          spacing={{ xs: 3, md: 4 }}
          justifyContent="center"
          sx={{
            animation: 'fadeInUp 1s ease-out 0.3s both',
            '@keyframes fadeInUp': {
              '0%': { opacity: 0, transform: 'translateY(40px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          {/* Free Plan */}
          {trialPlan && (
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  background: 'var(--color-surface-glass)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--color-border-glass)',
                  borderRadius: '24px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, var(--color-accent), rgba(44, 31, 66, 0.5))',
                  },
                  '&:hover': {
                    transform: 'translateY(-12px)',
                    boxShadow: '0 20px 60px rgba(24, 5, 56, 0.25)',
                    border: '1px solid var(--color-border-glass)',
                    '&::after': {
                      opacity: 1,
                    },
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 50% 0%, rgba(124, 58, 237, 0.05) 0%, transparent 70%)',
                    opacity: 0,
                    transition: 'opacity 0.4s ease',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                        mb: 1,
                        fontSize: { xs: '1.5rem', md: '1.75rem' },
                      }}
                    >
                      {trialPlan.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'var(--color-text-muted)',
                        lineHeight: 1.6,
                      }}
                    >
                      Perfect for getting started
                    </Typography>
                  </Box>

                  <Box sx={{ my: 4, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5 }}>
                      <Typography
                        sx={{
                          fontSize: { xs: '1.5rem', md: '2.5rem' },
                          fontWeight: 800,
                          background: 'linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-accent) 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          lineHeight: 1,
                        }}
                      >
                        ₦0
                      </Typography>
                    </Box>
                    <Typography sx={{ color: 'var(--color-text-muted)', mt: 1, fontSize: '0.9rem' }}>
                      per month
                    </Typography>
                  </Box>

                  <Box component="ul" sx={{ mb: 4, pl: 0, listStyle: 'none', '& > li': { mb: 1.5 } }}>
                    {[
                      'All core features included',
                      '24/7 customer support',
                      `${trialPlan.trialDurationDays || 30}-day free trial`,
                    ].map((f, i) => (
                      <Box
                        component="li"
                        key={f}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          animation: `slideIn 0.5s ease-out ${i * 0.1}s both`,
                          '@keyframes slideIn': {
                            '0%': { opacity: 0, transform: 'translateX(-10px)' },
                            '100%': { opacity: 1, transform: 'translateX(0)' },
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: 'var(--color-surface-glass)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 14, color: 'var(--color-accent)' }} />
                        </Box>
                        <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                          {f}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    disabled={submitting}
                    onClick={() => handleSelectPlan(trialPlan, false)}
                    sx={{
                      py: 1.8,
                      borderRadius: '12px',
                      background: 'var(--color-text-primary)',
                      color: 'var(--color-accent-contrast)',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      letterSpacing: '0.02em',
                      boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'var(--color-text-primary)',
                        opacity: 0.9,
                        boxShadow: '0 12px 32px rgba(124, 58, 237, 0.5)',
                        transform: 'translateY(-2px)',
                      },
                      '&:disabled': {
                        background: 'var(--color-surface-glass)',
                        color: 'var(--color-text-muted)',
                      },
                    }}
                  >
                    {submitting ? 'Processing...' : 'Start Free Trial'}
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
                  height: '100%',
                  background: 'var(--color-surface-glass)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid var(--color-text-primary)',
                  borderTop: '0px',
                  borderRadius: '24px',
                  boxShadow: '0 12px 40px rgba(30, 8, 67, 0.4)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, var(--color-accent), rgba(0, 0, 0, 0.5))',
                  },
                  '&:hover': {
                    transform: 'translateY(-12px) scale(1.02)',
                    boxShadow: '0 24px 60px rgba(25, 5, 61, 0.6)',
                    border: '2px solid var(--color-accent)',
                  },
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    zIndex: 2,
                  }}
                >
                  <Chip
                    icon={<TrendingIcon sx={{ fontSize: 16 }} />}
                    label="Most Popular"
                    size="small"
                    sx={{
                      background: 'var(--color-accent)',
                      color: 'var(--color-accent-contrast)',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      px: 1.5,
                      boxShadow: '0 4px 12px rgba(30, 8, 67, 0.4)',
                      '& .MuiChip-icon': { color: 'var(--color-accent-contrast)' },
                    }}
                  />
                </Box>

                <CardContent sx={{ p: { xs: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                        mb: 1,
                        fontSize: { xs: '1.5rem', md: '1.75rem' },
                      }}
                    >
                      {standardPlan.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                      For growing ministries
                    </Typography>
                  </Box>

                  <Box sx={{ my: 4, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5 }}>
                      <Typography
                        sx={{
                          fontSize: { xs: '1.5rem', md: '2.5rem' },
                          fontWeight: 800,
                          background: 'linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-accent) 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          lineHeight: 1,
                        }}
                      >
                        {yearlyStandard ? formatPrice(stdYearly) : formatPrice(stdBase)}
                      </Typography>
                    </Box>
                    <Typography sx={{ color: 'var(--color-text-muted)', mt: 1, fontSize: '0.9rem' }}>
                      per {yearlyStandard ? 'year' : 'month'}
                    </Typography>

                    {stdDiscount > 0 && (
                      <Box
                        sx={{
                          mt: 3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 2,
                          px: 2,
                          py: 1.5,
                          borderRadius: '12px',
                          background: 'var(--color-surface-glass)',
                          border: '1px solid var(--color-border-glass)',
                        }}
                      >
                        <Typography sx={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          Monthly
                        </Typography>
                        <Switch
                          checked={yearlyStandard}
                          onChange={() => setYearlyStandard(!yearlyStandard)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: 'var(--color-accent)',
                              '& + .MuiSwitch-track': {
                                backgroundColor: 'var(--color-accent)',
                              },
                            },
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography
                            sx={{
                              color: yearlyStandard ? 'var(--color-accent)' : 'var(--color-text-muted)',
                              fontSize: '0.85rem',
                              fontWeight: yearlyStandard ? 600 : 400,
                            }}
                          >
                            Yearly
                          </Typography>
                          <Chip
                            label={`Save ${Math.round(stdDiscount * 100)}%`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: yearlyStandard ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'rgba(34, 197, 94, 0.2)',
                              color: yearlyStandard ? '#fff' : '#4ade80',
                              border: 'none',
                            }}
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>

                  <Box component="ul" sx={{ mb: 4, pl: 0, listStyle: 'none', '& > li': { mb: 1.5 } }}>
                    {[
                      'Unlimited workforce',
                      'Complete people management',
                      'Worship service planning',
                      'Attendance tracking',
                      'Priority support 24/7',
                      'Advanced analytics dashboard',
                      'SMS & Email messaging',
                      'Custom branding',
                    ].map((f, i) => (
                      <Box
                        component="li"
                        key={f}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          animation: `slideIn 0.5s ease-out ${i * 0.1}s both`,
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: 'var(--color-surface-glass)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 14, color: 'var(--color-accent)' }} />
                        </Box>
                        <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                          {f}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    disabled={submitting}
                    onClick={() => handleSelectPlan(standardPlan, yearlyStandard, 1)}
                    sx={{
                      py: 1.8,
                      borderRadius: '12px',
                      background: 'var(--color-text-primary)',
                      color: 'var(--color-accent-contrast)',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      letterSpacing: '0.02em',
                      boxShadow: '0 8px 24px rgba(34, 9, 78, 0.4)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'var(--color-text-primary)',
                        opacity: 0.9,
                        boxShadow: '0 12px 32px rgba(24, 7, 54, 0.6)',
                        transform: 'translateY(-2px)',
                      },
                      '&:disabled': {
                        background: 'var(--color-surface-glass)',
                        color: 'var(--color-text-muted)',
                      },
                    }}
                  >
                    {submitting ? 'Processing...' : 'Get Started'}
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
                  height: '100%',
                  background: 'var(--color-surface-glass)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--color-border-glass)',
                  borderRadius: '24px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, var(--color-accent), rgba(0, 0, 0, 0.5))',
                  },
                  '&:hover': {
                    transform: 'translateY(-12px)',
                    boxShadow: '0 20px 60px rgba(34, 10, 74, 0.35)',
                    border: '1px solid var(--color-border-glass)',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: 'var(--color-text-primary)',
                          fontSize: { xs: '1.5rem', md: '1.75rem' },
                        }}
                      >
                        {proPlan.name}
                      </Typography>
                      <VerifiedIcon sx={{ fontSize: 22, color: 'var(--color-accent)' }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                      For multi-branch ministries
                    </Typography>
                  </Box>

                  <Box sx={{ my: 4 }}>
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: '16px',
                        background: 'var(--color-surface-glass)',
                        border: '1px solid var(--color-border-glass)',
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography sx={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
                          Branches: {branches}
                        </Typography>
                        <Typography sx={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          Max 50
                        </Typography>
                      </Box>
                      <MuiSlider
                        value={branches}
                        onChange={(_, v) => setBranches(v as number)}
                        min={2}
                        max={50}
                        step={1}
                        valueLabelDisplay="auto"
                        sx={{
                          color: 'var(--color-text-primary)',
                          '& .MuiSlider-thumb': {
                            width: 20,
                            height: 20,
                            background: 'var(--color-text-primary)',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
                            '&:hover, &.Mui-focusVisible': {
                              boxShadow: '0 0 0 8px rgba(124, 58, 237, 0.16)',
                            },
                          },
                          '& .MuiSlider-track': {
                            background: 'var(--color-text-primary)',
                            border: 'none',
                          },
                          '& .MuiSlider-rail': {
                            background: 'var(--color-border-glass)',
                          },
                        }}
                      />
                      {branches < 2 && (
                        <Typography
                          variant="caption"
                          sx={{ color: '#f87171', mt: 1, display: 'block', fontSize: '0.75rem' }}
                        >
                          Pro plan requires at least 2 branches
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5 }}>
                        <Typography
                          sx={{
                            fontSize: { xs: '1.5rem', md: '2.5rem' },
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-accent) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1,
                          }}
                        >
                          {yearlyPro ? formatPrice(proYearly) : formatPrice(proMonthly)}
                        </Typography>
                      </Box>
                      <Typography sx={{ color: 'var(--color-text-muted)', mt: 1, fontSize: '0.9rem' }}>
                        per {yearlyPro ? 'year' : 'month'}
                      </Typography>

                      <Box
                        sx={{
                          mt: 3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 2,
                          px: 2,
                          py: 1.5,
                          borderRadius: '12px',
                          background: 'var(--color-surface-glass)',
                          border: '1px solid var(--color-border-glass)',
                        }}
                      >
                        <Typography sx={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          Monthly
                        </Typography>
                        <Switch
                          checked={yearlyPro}
                          onChange={() => setYearlyPro(!yearlyPro)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: 'var(--color-accent)',
                              '& + .MuiSwitch-track': {
                                backgroundColor: 'var(--color-accent)',
                              },
                            },
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography
                            sx={{
                              color: yearlyPro ? 'var(--color-accent)' : 'var(--color-text-muted)',
                              fontSize: '0.85rem',
                              fontWeight: yearlyPro ? 600 : 400,
                            }}
                          >
                            Yearly
                          </Typography>
                          {proDiscount > 0 && (
                            <Chip
                              label={`Save ${Math.round(proDiscount * 100)}%`}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: yearlyPro ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'rgba(34, 197, 94, 0.2)',
                                color: yearlyPro ? '#fff' : '#4ade80',
                                border: 'none',
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Box component="ul" sx={{ mb: 4, pl: 0, listStyle: 'none', '& > li': { mb: 1.5 } }}>
                    {[
                      'Unlimited workforce',
                      'Complete people management',
                      'Worship service planning',
                      'Attendance tracking',
                      'Priority support 24/7',
                      'Advanced analytics dashboard',
                      'SMS & Email messaging',
                      'Multi-branch management',
                      'Custom branding',
                    ].map((f, i) => (
                      <Box
                        component="li"
                        key={f}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          animation: `slideIn 0.5s ease-out ${i * 0.1}s both`,
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: 'var(--color-surface-glass)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 14, color: 'var(--color-accent)' }} />
                        </Box>
                        <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                          {f}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    disabled={submitting || branches < 2}
                    onClick={() => handleSelectPlan(proPlan, yearlyPro, branches)}
                    sx={{
                      py: 1.8,
                      borderRadius: '12px',
                      background: 'var(--color-text-primary)',
                      color: 'var(--color-accent-contrast)',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      letterSpacing: '0.02em',
                      boxShadow: '0 8px 24px rgba(40, 25, 64, 0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'var(--color-text-primary)',
                        opacity: 0.9,
                        boxShadow: '0 12px 32px rgba(27, 0, 67, 0.5)',
                        transform: 'translateY(-2px)',
                      },
                      '&:disabled': {
                        background: 'var(--color-surface-glass)',
                        color: 'var(--color-text-muted)',
                      },
                    }}
                  >
                    {submitting ? 'Processing...' : 'Get Started'}
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