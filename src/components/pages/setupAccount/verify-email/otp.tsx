import React, { useState, useEffect } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { persistor } from '../../../reduxstore/redux';
import { setAuthData } from '../../../reduxstore/authstore';
import { jwtDecode } from "jwt-decode";
import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Input,
  Typography,
  // useMediaQuery,
  // useTheme
} from '@mui/material';
import { showPageToast } from '../../../util/pageToast';
import { usePageToast } from '../../../hooks/usePageToast';

// Types
interface VerificationRequest {
  email: string;
  otp: string;
}

type SelectedPlan = {
  planId?: string;
  billingCycle?: "monthly" | "annual";
  branchCount?: number;
};

interface AuthPayload {
  backgroundImg: string;
  branchId: string;
  branches: string[];
  churchId: string;
  church_name: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
  id: string;
  isHeadQuarter: boolean;
  isSuperAdmin: boolean;
  logo: string;
  name: string;
  tenantId: string;
  token: string;
  department: string;
}

const EmailVerification: React.FC = () => {
  usePageToast("email-verification");
  const [scriptLoaded, setScriptLoaded] = useState(false);  
  // const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const subscribeToPlan = async (token: string): Promise<void> => {
    const storedPlan = localStorage.getItem("selectedPlan");
    if (!storedPlan) {navigate("/pricing"); return;};

    const parsed: SelectedPlan = JSON.parse(storedPlan);
    if (!parsed.planId) return;

    const payload: Record<string, any> = {
      planId: parsed.planId,
    };

    if (parsed.billingCycle) {
      payload.billingCycle = parsed.billingCycle;
    }

    if (typeof parsed.branchCount === "number") {
      payload.branchCount = parsed.branchCount;
    }

    const url = `${import.meta.env.VITE_API_BASE_URL}/plan/subscribe`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error?.message || "Plan subscription failed");
    }

    /**
     * ✅ PAYMENT HANDLING - FIXED
     */
    const paymentData = data?.paymentUrl?.payment;
    const customerData = data?.paymentUrl?.customer;
    const metaData = data?.paymentUrl?.meta;

    console.log("Payment data received:", { paymentData, customerData, metaData }); // Debug log

    // ✅ Fixed: Check if payment data exists and amount is greater than 0
    if (paymentData && paymentData.amount && Number(paymentData.amount) > 0) {
      console.log("Opening Flutterwave checkout..."); // Debug log
      
      const paymentSuccessful = await openFlutterwave({
        public_key: data?.paymentUrl?.public_key || "FLWPUBK_TEST-03a84b4942d4732853fa6e1ccef980d3-X",
        tx_ref: paymentData.tx_ref,
        amount: Number(paymentData.amount),
        currency: paymentData.currency || "NGN",
        customer: customerData,
        meta: metaData,
      });

      if (!paymentSuccessful) {
        throw new Error("Payment was cancelled or failed");
      }
      
      console.log("Payment completed successfully"); // Debug log
    } else {
      console.log("No payment required or invalid payment data"); // Debug log
    }

    // ✅ Cleanup after success
    localStorage.removeItem("selectedPlan");
  };

  const openFlutterwave = (data: {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency?: string;
  customer: {
    email: string;
    name?: string;
    phone_number?: string;
  };
  meta?: Record<string, any>;
}): Promise<boolean> => {
  if (!scriptLoaded) {
    console.error("Flutterwave script not loaded"); // Debug log
    showPageToast("Payment service not ready", "error");
    return Promise.resolve(false);
  }

  console.log("Opening Flutterwave modal with data:", data); // Debug log
  setPaymentInProgress(true);

  return new Promise((resolve) => {
    let settled = false;

    try {
      const modal = window.FlutterwaveCheckout({
        public_key: data.public_key,
        tx_ref: data.tx_ref,
        amount: data.amount,
        currency: data.currency || "NGN",
        payment_options: "card,banktransfer,ussd,mobilemoney",
        customer: data.customer,
        meta: data.meta,
        customizations: {
          title: "Churchset Subscription",
          description: "Complete your plan subscription",
        },

        callback: (response: any) => {
          console.log("Payment callback received:", response); // Debug log
          if (settled) return;
          settled = true;
          setPaymentInProgress(false);
          modal.close();
          resolve(response.status === "successful");
        },

        onclose: () => {
          console.log("Payment modal closed"); // Debug log
          if (settled) return;
          settled = true;
          setPaymentInProgress(false);
          resolve(false);
        },
      });
      
      console.log("Flutterwave modal created successfully"); // Debug log
    } catch (err) {
      console.error("Error creating Flutterwave modal:", err); // Debug log
      if (!settled) {
        settled = true;
        setPaymentInProgress(false);
        resolve(false);
      }
    }
  });
};

  /* ---------- LOAD FLUTTERWAVE SCRIPT ---------- */
  useEffect(() => {
    if (window.FlutterwaveCheckout) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () =>
      showPageToast("Failed to load payment service", "error");
    document.body.appendChild(script);

    return () => {
      const el = document.querySelector(
        'script[src="https://checkout.flutterwave.com/v3.js"]'
      );
      el?.parentNode?.removeChild(el);
    };
  }, []);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('email');
    if (storedEmail) setEmail(storedEmail);
  }, [navigate]);

  // ✅ Allow only letters and numbers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    if (value.length <= 6) setCode(value);
  };

  const verifyCode = async (email: string, verificationCode: string): Promise<void> => {
    try {
      // ✅ Step 1: Check email validity before proceeding
      if (!email) {
        showPageToast("Email is missing. Please restart the verification process.", "error");
        return; // Stop execution if email is missing
      }

      // ✅ Step 2: Prepare request
      const url = `${import.meta.env.VITE_API_BASE_URL}/church/verify-admin`;
      const requestBody: VerificationRequest = { email, otp: verificationCode };

      // ✅ Step 3: Send request
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      // ✅ Step 4: Handle errors from server
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message =
          errorData?.error?.message ||
          `Verification failed with status ${response.status}`;
        throw new Error(message);
      }

      // ✅ Step 5: Decode response and token
      const responseData = await response.json();
      const decodedToken = jwtDecode(responseData.accessToken) as any;

      const authPayload: AuthPayload = {
        backgroundImg: decodedToken.backgroundImg || "",
        role: decodedToken.role || "",
        branchId: Array.isArray(decodedToken.branchIds)
          ? decodedToken.branchIds[0] || ""
          : decodedToken.branchIds || "",
        branches: Array.isArray(decodedToken.branchIds)
          ? decodedToken.branchIds
          : [decodedToken.branchIds || ""],
        churchId: decodedToken.churchId || "",
        church_name: decodedToken.church_name || "",
        email: decodedToken.email || "",
        exp: decodedToken.exp || 0,
        iat: decodedToken.iat || 0,
        id: decodedToken.id || "",
        isHeadQuarter: decodedToken.isHeadQuarter || false,
        isSuperAdmin: decodedToken.isSuperAdmin || false,
        logo: decodedToken.logo || "",
        name: decodedToken.name || "",
        tenantId: decodedToken.tenantId || "",
        token: responseData.accessToken || "",
        department: decodedToken.department || "",
      };

      // ✅ Step 6: Update app state
      dispatch(setAuthData(authPayload));
      await new Promise((resolve) => setTimeout(resolve, 100));
      sessionStorage.clear();
      
      // ✅ Step 7: Handle plan subscription and payment
      try {
        await subscribeToPlan(responseData.accessToken);
        showPageToast("Email verified successfully!", "success");
        await persistor.flush();
        navigate("/dashboard");
      } catch (planError: any) {
        console.error("Plan subscription error:", planError); // Debug log
        showPageToast(planError.message, "error");
        // Still navigate even if payment fails
        navigate("/dashboard");
      }

    } catch (error: any) {
      // ✅ Step 8: Handle any unexpected errors
      console.error("Verification error:", error); // Debug log
      showPageToast(error.message || "An unexpected error occurred.", "error");
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      await verifyCode(email, code);
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        "An error occurred during verification. Please try again.";
      setError(message);
      showPageToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/church/resend-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) throw new Error('Failed to resend code');

      showPageToast(`Verification code resent to ${email}`, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred while resending the code.';
      setError(message);
      showPageToast(message, "error");
    } finally {
      setResendLoading(false);
    }
  };

  const allFilled = code.length === 6;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.paper',
        p: 2
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          textAlign: 'center'
        }}
      >
        {/* Envelope Icon */}
        <Box
          sx={{
            width: 64,
            height: 64,
            backgroundColor: '#BCBFC5',
            borderRadius: '50%',
            mx: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FaEnvelope style={{ width: 28, height: 28, color: '#111827' }} />
        </Box>

        <Typography variant="h5" sx={{ mt: 2, fontWeight: 600 }}>
          Verify Email To Set Up Church!
        </Typography>

        {/* ✅ Removed brackets */}
        <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
          We sent a verification code to <span style={{ fontWeight: 500 }}>{email || '_'}</span>
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {/* ✅ Single alphanumeric input */}
        <Input
          type="text"
          placeholder="Enter 6-character code"
          value={code}
          onChange={handleChange}
          inputProps={{
            maxLength: 6,
            style: {
              textAlign: 'center',
              fontSize: '1.25rem',
              letterSpacing: '4px',
              textTransform: 'uppercase'
            }
          }}
          sx={{
            width: '100%',
            mb: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:before, &:after': { display: 'none' },
            '&:focus-within': {
              boxShadow: '0 0 8px rgba(214, 187, 251, 1)'
            }
          }}
        />

        <Button
          variant="contained"
          fullWidth
          onClick={handleVerify}
          disabled={!allFilled || loading || paymentInProgress}
          sx={{
            py: 1.5,
            borderRadius: '25px',
            backgroundColor: allFilled ? '#111827' : 'action.disabledBackground',
            '&:hover': {
              backgroundColor: allFilled ? '#111827' : 'action.disabledBackground',
              opacity: allFilled ? 0.9 : 1
            }
          }}
        >
          {loading ? 'Verifying...' : paymentInProgress ? 'Processing payment...' : 'Verify email'}
        </Button>

        <Typography variant="body2" sx={{ mt: 2 }}>
          Didn't receive the email?{' '}
          <Button
            variant="text"
            onClick={handleResend}
            sx={{
              color: '#111827',
              fontWeight: 600,
              textTransform: 'none',
              p: 0,
              minWidth: 'auto'
            }}
          >
            {resendLoading ? 'Sending...' : 'Click to resend'}
          </Button>
        </Typography>
      </Box>
    </Box>
  );
};

export default EmailVerification;