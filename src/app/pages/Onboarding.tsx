import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Church, Building2, User, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { useChurch } from '../context/ChurchContext';
import { useAuth } from '../context/AuthContext';
import { createChurch, verifyAdmin, resendVerificationEmail } from '../api';

type OnboardingStep = 'welcome' | 'church-type' | 'church-details' | 'admin-account' | 'verify-otp' | 'complete';

/**
 * Extract a human-readable error message from any API error shape.
 * Handles nested objects, arrays, class-validator constraint maps, etc.
 */
function extractApiError(err: any, fallback: string): string {
  // String — use directly
  const stringify = (v: any): string => {
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) return v.map(stringify).filter(Boolean).join('; ');
    if (v && typeof v === 'object') {
      // class-validator style: { constraints: { isUnique: 'email must be unique' } }
      if (v.constraints && typeof v.constraints === 'object')
        return Object.values(v.constraints).map(stringify).filter(Boolean).join('; ');
      if (typeof v.message === 'string') return v.message;
      // property:value maps e.g. { adminEmail: 'must be unique' }
      return Object.values(v).map(stringify).filter(Boolean).join('; ');
    }
    return '';
  };

  const body = err?.body;
  const rawMessage: string =
    (typeof body?.message === 'string' ? body.message : '') ||
    (typeof err?.message === 'string' ? err.message : '') ||
    fallback;

  // Try to pull detail items from common error shapes
  const rawDetails =
    body?.errors ??
    body?.details ??
    body?.error?.details ??
    [];

  const detailStr = Array.isArray(rawDetails) && rawDetails.length > 0
    ? stringify(rawDetails)
    : '';

  // Avoid duplicate text that's already inside rawMessage
  if (detailStr && !rawMessage.includes(detailStr)) {
    // Strip a trailing colon/space from the base message before joining
    return `${rawMessage.replace(/[:\s]+$/, '')}: ${detailStr}`;
  }
  return rawMessage || fallback;
}

export function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding, loadChurchFromServer } = useChurch();
  const { signIn } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [churchType, setChurchType] = useState<'single' | 'multi'>('single');
  const [churchName, setChurchName] = useState('');
  const [churchAddress, setChurchAddress] = useState('');
  const [churchPhone, setChurchPhone] = useState('');
  const [branchName, setBranchName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (step === 'welcome') setStep('church-type');
    else if (step === 'church-type') setStep('church-details');
    else if (step === 'church-details') setStep('admin-account');
    else if (step === 'admin-account') handleCreateAccount();
    else if (step === 'verify-otp') handleVerifyOtp();
  };

  const handleBack = () => {
    if (step === 'church-type') setStep('welcome');
    else if (step === 'church-details') setStep('church-type');
    else if (step === 'admin-account') setStep('church-details');
  };

  const handleCreateAccount = async () => {
    setIsSubmitting(true);
    setError('');

    const trimmedEmail = adminEmail.trim().toLowerCase();
    const trimmedName = adminName.trim();
    const trimmedPassword = adminPassword;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      setIsSubmitting(false);
      return;
    }

    // Password validation
    if (trimmedPassword !== adminConfirmPassword) {
      setError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Create church + admin via the real API (backend sends OTP email)
      const isHQ = churchType === 'multi';
      await createChurch({
        churchName: churchName || 'My Church',
        address: churchAddress,
        phone: churchPhone,
        isHeadQuarter: isHQ,
        name: trimmedName,
        adminEmail: trimmedEmail,
        adminPassword: trimmedPassword,
        confirmPassword: trimmedPassword,
      });

      // 2. Move to OTP verification step
      setStep('verify-otp');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(extractApiError(err, 'Failed to create account. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsSubmitting(true);
    setError('');
    const trimmedEmail = adminEmail.trim().toLowerCase();
    const trimmedName = adminName.trim();
    try {
      // 1. Verify the OTP (confirms email with the backend)
      await verifyAdmin({ email: trimmedEmail, otp: otp.trim().toUpperCase() });

      // 2. Sign in via AuthContext — this sets the access token, writes churchset_is_hq
      //    to sessionStorage, and sets currentAdmin all in one place.
      const { error: signInError } = await signIn(trimmedEmail, adminPassword);
      if (signInError) {
        setError(signInError);
        return;
      }

      // 3. Hydrate church context from server (real branchId, churchId, etc.)
      //    isHeadQuarter is now correctly available via sessionStorage set above
      try { await loadChurchFromServer(); } catch { /* non-fatal */ }

      // 4. Complete onboarding in local context
      completeOnboarding({
        churchName: churchName || 'My Church',
        churchType,
        headquartersBranchName: churchType === 'multi' ? branchName : undefined,
        adminName: trimmedName,
        adminEmail: trimmedEmail,
      });

      // currentAdmin is already set by signIn() above

      setStep('complete');
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError(extractApiError(err, 'Verification failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setResendMessage('');
    setError('');
    try {
      await resendVerificationEmail(adminEmail.trim().toLowerCase());
      setResendMessage('A new code has been sent to your email.');
    } catch (err: any) {
      setError(err?.body?.message || err?.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleComplete = () => {
    // Mark that user just finished onboarding — triggers the product tour on first dashboard visit
    localStorage.removeItem('churchset_first_dashboard');
    localStorage.removeItem('churchset_tour_completed');
    localStorage.removeItem('churchset_tour_later');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Church className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Churchset</h1>
          <p className="text-gray-600">Let's get your church management system set up in just a few steps</p>
        </div>

        {/* Progress Indicator */}
        {step !== 'welcome' && step !== 'complete' && (
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              {['church-type', 'church-details', 'admin-account'].map((s, index) => {
                const stepsOrder = ['church-type', 'church-details', 'admin-account', 'verify-otp'];
                const currentIndex = stepsOrder.indexOf(step);
                const isCompleted = currentIndex > index;
                const isActive = currentIndex === index;
                return (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isActive || isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                    </div>
                    {index < 2 && (
                      <div className={`w-16 h-1 ${isCompleted ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Welcome Step */}
        {step === 'welcome' && (
          <Card>
            <CardHeader>
              <CardTitle>Simple Church Management</CardTitle>
              <CardDescription>
                Churchset helps you manage your church, departments, outreaches, members, programs, and more - all in one place.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Easy to use</h3>
                    <p className="text-sm text-gray-600">Designed for church administrators with no technical background</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Complete features</h3>
                    <p className="text-sm text-gray-600">Manage members, programs, collections, follow-ups, and communications</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Flexible structure</h3>
                    <p className="text-sm text-gray-600">Support for single or multi-branch churches with departments, outreaches, and units</p>
                  </div>
                </div>
              </div>
              <Button onClick={handleNext} className="w-full" size="lg">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <div className="pt-2 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500">
                  Already set up?{' '}
                  <a href="/login" className="text-blue-600 hover:underline font-medium">
                    Sign in to your account
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Church Type Step */}
        {step === 'church-type' && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Church Structure</CardTitle>
              <CardDescription>
                Select whether your church has a single location or multiple branches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={churchType} onValueChange={(value) => setChurchType(value as 'single' | 'multi')}>
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    churchType === 'single' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setChurchType('single')}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="single" id="single" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="single" className="text-base font-medium cursor-pointer">
                        Single Branch Church
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Your church operates from one main location. You can still create departments, outreaches, and units.
                      </p>
                    </div>
                  </div>
                </div>
                {/*
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    churchType === 'multi' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setChurchType('multi')}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="multi" id="multi" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="multi" className="text-base font-medium cursor-pointer">
                        Multi-Branch Church
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Your church has a headquarters and additional branches. You can manage all branches from one place.
                      </p>
                    </div>
                  </div>
                </div>
                */}
              </RadioGroup>
              <div className="flex gap-3">
                <Button onClick={handleBack} variant="outline" className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Church Details Step */}
        {step === 'church-details' && (
          <Card>
            <CardHeader>
              <CardTitle>Church Information</CardTitle>
              <CardDescription>
                Tell us about your church so we can personalize your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="church-name">Church Name *</Label>
                  <Input
                    id="church-name"
                    placeholder="e.g., Grace Community Church"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">This is the official name of your church</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="church-address">Church Address *</Label>
                  <Input
                    id="church-address"
                    placeholder="e.g., 123 Main St, New York"
                    value={churchAddress}
                    onChange={(e) => setChurchAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="church-phone">Church Phone *</Label>
                  <Input
                    id="church-phone"
                    type="tel"
                    placeholder="e.g., +1234567890"
                    value={churchPhone}
                    onChange={(e) => setChurchPhone(e.target.value)}
                  />
                </div>
                {churchType === 'multi' && (
                  <div className="space-y-2">
                    <Label htmlFor="branch-name">Headquarters Branch Name *</Label>
                    <Input
                      id="branch-name"
                      placeholder="e.g., Headquarters or Main Campus"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">You can add more branches later</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button onClick={handleBack} variant="outline" className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1" disabled={!churchName || !churchAddress || !churchPhone || (churchType === 'multi' && !branchName)}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* OTP Verification Step */}
        {step === 'verify-otp' && (
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-center">Check Your Email</CardTitle>
              <CardDescription className="text-center">
                We sent a 6-character verification code to{' '}
                <span className="font-medium text-gray-800">{adminEmail}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {error}
                </div>
              )}
              {resendMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                  {resendMessage}
                </div>
              )}
              <div className="flex flex-col items-center space-y-4">
                <Label className="text-sm text-gray-600">Enter the verification code</Label>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(val) => { setOtp(val); setError(''); }}
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
                  Didn't receive a code?{' '}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResending}
                    className="text-blue-600 hover:underline disabled:opacity-50"
                  >
                    {isResending ? 'Sending...' : 'Resend code'}
                  </button>
                </p>
              </div>
              <Button
                onClick={handleVerifyOtp}
                className="w-full"
                disabled={otp.length < 6 || isSubmitting}
              >
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
            </CardContent>
          </Card>
        )}

        {/* Admin Account Step */}
        {step === 'admin-account' && (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Administrator Account</CardTitle>
              <CardDescription>
                This will be your Super Admin account with full access to all features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-name">Full Name *</Label>
                  <Input
                    id="admin-name"
                    placeholder="e.g., Pastor John Smith"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email Address *</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="your.email@church.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">You'll use this to log in</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password *</Label>
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">At least 8 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-confirm-password">Confirm Password *</Label>
                  <Input
                    id="admin-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    className={adminConfirmPassword && adminPassword !== adminConfirmPassword ? 'border-red-400' : adminConfirmPassword && adminPassword === adminConfirmPassword ? 'border-green-400' : ''}
                  />
                  {adminConfirmPassword && adminPassword !== adminConfirmPassword && (
                    <p className="text-sm text-red-500">Passwords do not match</p>
                  )}
                  {adminConfirmPassword && adminPassword === adminConfirmPassword && (
                    <p className="text-sm text-green-600">Passwords match</p>
                  )}
                </div>
                <div className="flex items-center">
                  <Button
                    onClick={() => setShowPassword(!showPassword)}
                    variant="outline"
                    size="sm"
                    className="mr-2"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Show
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleBack} variant="outline" className="flex-1" disabled={isSubmitting}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1"
                  disabled={!adminName || !adminEmail || !adminPassword || adminPassword.length < 8 || adminPassword !== adminConfirmPassword || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">All Set!</h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Your church management system is ready. You can now start adding departments, outreaches, members, and managing your church activities.
                  </p>
                </div>
                <Button onClick={handleComplete} size="lg">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
