import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Church,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  PlusCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { createChurch } from '../api';

type Step = 'church-type' | 'church-details' | 'complete';

function extractApiError(err: any, fallback: string): string {
  const stringify = (v: any): string => {
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) return v.map(stringify).filter(Boolean).join('; ');
    if (v && typeof v === 'object') {
      if (v.constraints && typeof v.constraints === 'object')
        return Object.values(v.constraints).map(stringify).filter(Boolean).join('; ');
      if (typeof v.message === 'string') return v.message;
      return Object.values(v).map(stringify).filter(Boolean).join('; ');
    }
    return '';
  };
  const body = err?.body;
  const rawMessage: string =
    (typeof body?.message === 'string' ? body.message : '') ||
    (typeof err?.message === 'string' ? err.message : '') ||
    fallback;
  const rawDetails = body?.errors ?? body?.details ?? body?.error?.details ?? [];
  const detailStr = Array.isArray(rawDetails) && rawDetails.length > 0 ? stringify(rawDetails) : '';
  if (detailStr && !rawMessage.includes(detailStr)) {
    return `${rawMessage.replace(/[:\s]+$/, '')}: ${detailStr}`;
  }
  return rawMessage || fallback;
}

export function OnboardNewChurch() {
  const navigate = useNavigate();
  const { currentAdmin, signOut } = useAuth();

  const [step, setStep] = useState<Step>('church-type');
  const [churchType, setChurchType] = useState<'single' | 'multi'>('single');
  const [churchName, setChurchName] = useState('');
  const [churchAddress, setChurchAddress] = useState('');
  const [churchPhone, setChurchPhone] = useState('');
  const [branchName, setBranchName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const stepOrder: Step[] = ['church-type', 'church-details'];
  const currentStepIndex = stepOrder.indexOf(step === 'complete' ? 'church-details' : step);

  const handleBack = () => {
    if (step === 'church-details') setStep('church-type');
    else navigate(-1);
  };

  const handleCreateChurch = async () => {
    if (!churchName.trim()) {
      setError('Please enter a church name.');
      return;
    }
    if (churchType === 'multi' && !branchName.trim()) {
      setError('Please enter the headquarters branch name.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const isHQ = churchType === 'multi';
      // Re-use the same createChurch endpoint — the admin email comes from
      // the currently authenticated admin so we don't ask for credentials again.
      const adminEmail = currentAdmin?.email ?? '';
      const adminName = currentAdmin?.name ?? '';

      const res: any = await createChurch({
        churchName: churchName.trim(),
        address: churchAddress.trim(),
        phone: churchPhone.trim(),
        isHeadQuarter: isHQ,
        name: adminName,
        adminEmail,
        // The backend should recognise this admin already exists and not require
        // a new password. Pass empty strings as graceful fallback.
        adminPassword: '',
        confirmPassword: '',
      });

      setStep('complete');
    } catch (err: any) {
      setError(extractApiError(err, 'Failed to create church. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToDashboard = async () => {
    // Sign out of the current church so the user can log in to the new one
    await signOut({ confirmed: true });
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <PlusCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Another Church</h1>
          <p className="text-gray-600">Register a new church organisation under your account</p>
        </div>

        {/* Progress Indicator */}
        {step !== 'complete' && (
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              {stepOrder.map((s, index) => {
                const isCompleted = currentStepIndex > index;
                const isActive = currentStepIndex === index;
                return (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isActive || isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                    </div>
                    {index < stepOrder.length - 1 && (
                      <div className={`w-16 h-1 ${isCompleted ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1 — Church Type */}
        {step === 'church-type' && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Church Structure</CardTitle>
              <CardDescription>
                Select whether this church has a single location or multiple branches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={churchType}
                onValueChange={(v) => setChurchType(v as 'single' | 'multi')}
                className="space-y-3"
              >
                <div
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    churchType === 'single' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setChurchType('single')}
                >
                  <RadioGroupItem value="single" id="single" className="mt-1" />
                  <div>
                    <Label htmlFor="single" className="text-base font-semibold cursor-pointer">
                      <Church className="w-4 h-4 inline mr-2" />
                      Single Branch Church
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Your church operates from one main location. You can still create departments,
                      outreaches, and units.
                    </p>
                  </div>
                </div>

                <div
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    churchType === 'multi' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setChurchType('multi')}
                >
                  <RadioGroupItem value="multi" id="multi" className="mt-1" />
                  <div>
                    <Label htmlFor="multi" className="text-base font-semibold cursor-pointer">
                      <Building2 className="w-4 h-4 inline mr-2" />
                      Multi-Branch Church
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Your church has a headquarters and additional branches. You can manage all
                      branches from one place.
                    </p>
                  </div>
                </div>
              </RadioGroup>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => setStep('church-details')} className="flex-1">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2 — Church Details */}
        {step === 'church-details' && (
          <Card>
            <CardHeader>
              <CardTitle>Church Information</CardTitle>
              <CardDescription>Tell us about this church so we can set it up correctly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="churchName">
                  Church Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="churchName"
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  placeholder="e.g., Grace Chapel"
                />
                <p className="text-xs text-gray-500">This is the official name of your church</p>
              </div>

              {churchType === 'multi' && (
                <div className="space-y-2">
                  <Label htmlFor="branchName">
                    Headquarters Branch Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="branchName"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g., Headquarters or Main Campus"
                  />
                  <p className="text-xs text-gray-500">You can add more branches later</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="churchAddress">Address</Label>
                <Input
                  id="churchAddress"
                  value={churchAddress}
                  onChange={(e) => setChurchAddress(e.target.value)}
                  placeholder="Church address (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="churchPhone">Phone Number</Label>
                <Input
                  id="churchPhone"
                  value={churchPhone}
                  onChange={(e) => setChurchPhone(e.target.value)}
                  placeholder="Church phone number (optional)"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleBack} className="flex-1" disabled={isSubmitting}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleCreateChurch} className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Church...
                    </>
                  ) : (
                    <>
                      Create Church
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete */}
        {step === 'complete' && (
          <Card>
            <CardContent className="pt-10 pb-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Church Created!</h2>
                <p className="text-gray-600 mt-2">
                  <span className="font-medium">{churchName}</span> has been registered successfully.
                  Log in to access this church and choose a subscription plan.
                </p>
              </div>
              <Button onClick={handleGoToDashboard} size="lg" className="w-full max-w-xs mx-auto">
                Log In to New Church
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
