import React, { useState, useRef, useEffect } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { persistor } from '../../../reduxstore/redux';
import { setAuthData } from '../../../reduxstore/authstore';
import { jwtDecode } from "jwt-decode";
import { useDispatch } from 'react-redux';
import { 
  Box,
  Button,
  Grid,
  Input,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { showPageToast } from '../../../util/pageToast';
import { usePageToast } from '../../../hooks/usePageToast';

// Types
interface VerificationRequest {
  email: string;
  otp: string;
}

interface AuthPayload {
  backgroundImg: string;
  branchId: string;
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
}

// Constants
const CODE_LENGTH = 6;
const PERSIST_DELAY = 100;

const EmailVerification: React.FC = () => {
  // Hooks
  usePageToast("email-verification"); // 👈 scope toasts to this page
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // State
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  // Refs
  const inputsRef = useRef<(HTMLInputElement | null)[]>(Array(CODE_LENGTH).fill(null));

  // Effects
  useEffect(() => {
    const storedEmail = sessionStorage.getItem('email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, [navigate]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  // API Functions
  const verifyCode = async (email: string, verificationCode: string): Promise<void> => {
    const requestBody: VerificationRequest = { email, otp: verificationCode };
    const url = `${import.meta.env.VITE_API_BASE_URL}church/verify-admin`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Verification failed with status ${response.status}`);
      }

      const responseData = await response.json();
      const decodedToken = jwtDecode(responseData.accessToken) as any;

      const authPayload: AuthPayload = {
        backgroundImg: decodedToken.backgroundImg || "",
        role: decodedToken.role || '',
        branchId: Array.isArray(decodedToken.branchId)
        ? decodedToken.branchId[0] || "" // take only the first branchId
        : decodedToken.branchId || "", 
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
      };

      dispatch(setAuthData(authPayload));
      await new Promise(resolve => setTimeout(resolve, PERSIST_DELAY));
      sessionStorage.clear();
      showPageToast("Email verified successfully!", "success"); // ✅ success toast
      persistor.flush().then(() => navigate("/dashboard"));
    } catch (error) {
      console.error('Verification error:', error);
      throw error instanceof Error ? error : new Error('Verification failed');
    }
  };

  const resendCode = async (): Promise<void> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}church/resend-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to resend code');
      }
    } catch (err) {
      console.error('Resend error:', err);
      throw err;
    }
  };

  const handleVerify = async () => {
    if (!code.every(digit => digit !== '')) return;

    setLoading(true);
    setError('');

    try {
      await verifyCode(email, code.join(''));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during verification. Please try again.';
      setError(message);
      showPageToast(message, "error"); // ✅ error toast
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');

    try {
      await resendCode();
      showPageToast(`Verification code resent to ${email}`, "success"); // ✅ success toast
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred while resending the code. Please try again.';
      setError(message);
      showPageToast(message, "error"); // ✅ error toast
    } finally {
      setResendLoading(false);
    }
  };

  // Derived values
  const allFilled = code.every(digit => digit !== '');
  const isLoading = loading || resendLoading;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.paper',
        p: 2,
        position: 'relative'
      }}
    >
      {/* Loading Overlay */}
      {(loading || resendLoading) && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              border: '4px solid #111827',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          />
        </Box>
      )}

      <Box
        sx={{
          width: '100%',
          maxWidth: 'md',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          position: 'relative',
          zIndex: 2,
          opacity: isLoading ? 0.5 : 1,
          transition: 'opacity 0.3s ease'
        }}
      >
        {/* Email Icon */}
        <Box
          sx={{
            width: 64,
            height: 64,
            background: 'linear-gradient(to right, #f5f5f5, #f5f5f5)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              backgroundColor: '#BCBFC5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                backgroundColor: '#BCBFC5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaEnvelope style={{ width: 24, height: 24, color: '#111827' }} />
            </Box>
          </Box>
        </Box>

        {/* Heading */}
        <Typography
          variant={isMobile ? "h5" : "h4"}
          component="h1"
          align="center"
          sx={{ fontWeight: '600', pb: 1, pt: 2 }}
          color="text.primary"
        >
          Verify Email To Set Up Church!
        </Typography>

        {/* Message */}
        <Typography variant="body1" align="center" color="text.secondary">
          We sent a verification code to <span style={{ fontWeight: 500 }}>{`[${email || '_'}]`}</span>
        </Typography>
        
        {error && (
          <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        )}

        {/* Verification Code Inputs */}
        <Box sx={{ display: 'flex', justifyContent: "center", alignItems: 'center' }}>
          <Grid container spacing={{ xs: 1, md: 0 }} sx={{ pt: 3 }}>            
            {code.map((digit, index) => (
              <Grid size={{xs:4, sm: 2}} key={index} sx={{ display: 'flex', justifyContent: "center", alignItems: 'center' }}>
                <Input
                  inputRef={el => (inputsRef.current[index] = el)}
                  type="text"
                  placeholder="*"
                  inputProps={{ maxLength: 1 }}
                  value={digit}
                  onChange={(e: any) => handleChange(e, index)}
                  onKeyDown={(e: any) => handleKeyDown(e, index)}
                  sx={{
                    width: isMobile ? 55 : 70,
                    height: isMobile ? 55 : 70,
                    fontSize: '1.5rem',
                    textAlign: 'center',
                    '& input': {
                      textAlign: 'center'
                    },
                    '&:before, &:after': {
                      display: 'none'
                    },
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    '&:focus-within': {
                      boxShadow: '0 0 8px rgba(214, 187, 251, 1)'
                    }
                  }}
                />
              </Grid>
            ))}
            {/* Verify Email Button */}       
            <Grid size={{xs:12}} sx={{ mt: 2 }}>            
              <Button
                variant="contained"
                fullWidth
                onClick={handleVerify}
                disabled={!allFilled}
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
                {loading ? 'Verifying...' : 'Verify email'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Resend Link */}
        <Typography variant="body2" align="center" color="text.secondary" sx={{ pt: 2 }}>
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
