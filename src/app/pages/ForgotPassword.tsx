import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { ArrowRight, CheckCircle, Church, Loader2, Mail } from 'lucide-react';
import { forgotPassword } from '../api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

type ForgotPasswordLocationState = {
  email?: string;
};

function extractErrorMessage(err: any, fallback: string) {
  return err?.body?.message || err?.message || fallback;
}

export function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const locationState = (location.state as ForgotPasswordLocationState | null) ?? null;
  const [email, setEmail] = useState(
    (locationState?.email || searchParams.get('email') || '').trim().toLowerCase()
  );
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const returnToLogin = () => {
    navigate(`/login?email=${encodeURIComponent(email.trim().toLowerCase())}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Please enter the email address tied to your account.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await forgotPassword({ email: normalizedEmail });
      setEmail(normalizedEmail);
      setSuccessMessage(
        response.message || 'A reset password link that will expire in an hour has been sent to your email.'
      );
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to send password reset instructions.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Church className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h1>
          <p className="text-gray-600">We&apos;ll send you a reset link so you can choose a new password</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Password Reset</CardTitle>
            <CardDescription>Enter your login email to receive a secure reset link</CardDescription>
          </CardHeader>
          <CardContent>
            {successMessage ? (
              <div className="text-center space-y-6 py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Check Your Email</h3>
                  <p className="text-sm text-gray-500">{successMessage}</p>
                </div>
                <Button className="w-full" size="lg" onClick={returnToLogin}>
                  Return to Login
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@church.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">The reset link sent to your inbox will expire in one hour.</p>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            )}

            {!successMessage && (
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
