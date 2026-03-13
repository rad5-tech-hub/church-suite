import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { ArrowRight, CheckCircle, Church, Loader2, Mail } from 'lucide-react';
import { resendVerificationEmail, verifyAdmin } from '../api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';

type VerifyEmailLocationState = {
  email?: string;
  password?: string;
  autoResend?: boolean;
};

function extractErrorMessage(err: any, fallback: string) {
  return err?.body?.message || err?.message || fallback;
}

export function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  const { loadChurchFromServer } = useChurch();
  const locationState = (location.state as VerifyEmailLocationState | null) ?? null;
  const email = (locationState?.email || searchParams.get('email') || '').trim().toLowerCase();
  const password = locationState?.password || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const autoResendTriggeredRef = useRef(false);

  useEffect(() => {
    if (!email) {
      setError('No email address was provided for verification. Please sign in again.');
    }
  }, [email]);

  useEffect(() => {
    if (!email || !locationState?.autoResend || autoResendTriggeredRef.current) return;

    autoResendTriggeredRef.current = true;
    let isActive = true;

    const triggerVerificationEmail = async () => {
      setIsResending(true);
      setError('');
      try {
        const response = await resendVerificationEmail(email);
        if (isActive) {
          setMessage(response.message || 'A fresh verification code has been sent to your email.');
        }
      } catch (err: any) {
        if (isActive) {
          setMessage('');
          setError(extractErrorMessage(err, 'Failed to send a verification code.'));
        }
      } finally {
        if (isActive) {
          setIsResending(false);
        }
      }
    };

    void triggerVerificationEmail();

    return () => {
      isActive = false;
    };
  }, [email, locationState?.autoResend]);

  const returnToLogin = () => {
    navigate(`/login?email=${encodeURIComponent(email)}`);
  };

  const handleResendOtp = async () => {
    if (!email) return;

    setIsResending(true);
    setError('');
    try {
      const response = await resendVerificationEmail(email);
      setMessage(response.message || 'A fresh verification code has been sent to your email.');
    } catch (err: any) {
      setMessage('');
      setError(extractErrorMessage(err, 'Failed to resend the verification code.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      await verifyAdmin({ email, otp: otp.trim().toUpperCase() });

      if (password) {
        const signInResult = await signIn(email, password);
        if (signInResult.error) {
          setError(signInResult.error);
          return;
        }

        try {
          await loadChurchFromServer();
        } catch (err) {
          console.error('Failed to load church data after email verification:', err);
        }

        navigate('/dashboard');
        return;
      }

      setIsVerified(true);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Verification failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Church className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-600">Enter the code sent to your inbox to continue</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-center">Email Verification</CardTitle>
            <CardDescription className="text-center">
              {email ? (
                <>
                  We sent a 6-character verification code to{' '}
                  <span className="font-medium text-gray-800">{email}</span>
                </>
              ) : (
                'Open this page from the login form so we know which email to verify.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isVerified ? (
              <div className="text-center space-y-6 py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Email Verified</h3>
                  <p className="text-sm text-gray-500">
                    Your email has been verified successfully. You can now sign in to your Churchset account.
                  </p>
                </div>
                <Button className="w-full" size="lg" onClick={returnToLogin}>
                  Continue to Login
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleVerify} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                    {message}
                  </div>
                )}

                <div className="flex flex-col items-center space-y-4">
                  <Label className="text-sm text-gray-600">Enter the verification code</Label>
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => {
                      setOtp(value);
                      setError('');
                    }}
                    inputMode="text"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <p className="text-xs text-gray-500 text-center">
                    Didn&apos;t receive a code?{' '}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResending || !email}
                      className="text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {isResending ? 'Sending...' : 'Resend code'}
                    </button>
                  </p>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={otp.length < 6 || isSubmitting || !email}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Email
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {!isVerified && (
              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <button
                  type="button"
                  onClick={returnToLogin}
                  className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Return to login
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
