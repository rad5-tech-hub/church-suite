import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Check, Building2, Zap, Crown, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useChurch } from '../context/ChurchContext';

export function Subscription() {
  const navigate = useNavigate();
  const { church, setChurchType } = useChurch();

  const handleUpgrade = (plan: string) => {
    if (plan === 'Multi-Branch') {
      // Simulate payment success — in real app, integrate with Stripe/PayPal
      setChurchType('multi');
      alert('Upgraded to Multi-Branch plan! You now have access to branch management features.');
      navigate('/branches');
    } else {
      alert(`Switching to ${plan} plan.`);
    }
  };

  const plans = [
    {
      name: 'Single Church',
      price: 'Free',
      period: '',
      description: 'Perfect for churches operating from one location',
      features: [
        'Unlimited departments & units',
        'Member management',
        'Workforce tracking',
        'Programs & collections',
        'Follow-up system',
        'Custom newcomer forms',
        'SMS messaging',
        'Reports & analytics',
        'Role-based access control'
      ],
      limitations: [
        'No multi-branch support',
        'Limited to one location'
      ],
      current: church.type === 'single',
      icon: <Building2 className="w-8 h-8" />,
      color: 'blue'
    },
    {
      name: 'Multi-Branch',
      price: '$49',
      period: '/month',
      description: 'For churches with multiple branches or locations',
      features: [
        'Everything in Single Church, plus:',
        'Unlimited branches',
        'Branch-level management',
        'Cross-branch reporting',
        'Branch-specific permissions',
        'Centralized oversight',
        'Branch performance analytics',
        'Multi-location programs',
        'Priority support'
      ],
      limitations: [],
      current: church.type === 'multi',
      icon: <Crown className="w-8 h-8" />,
      color: 'purple',
      popular: true
    }
  ];

  return (
    <Layout>
      <PageHeader
        title="Subscription & Pricing"
        description="Choose the plan that best fits your church's needs. Upgrade or downgrade anytime."
      />

      <div className="p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          {/* Current Plan Banner */}
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Current Plan: {church.type === 'single' ? 'Single Church' : 'Multi-Branch'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {church.type === 'single' 
                      ? 'You are currently on the free single church plan. Upgrade to manage multiple branches.'
                      : 'You have access to all multi-branch features.'}
                  </p>
                </div>
                {church.type === 'single' && (
                  <Zap className="w-12 h-12 text-yellow-500" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.current
                    ? 'border-2 border-blue-600 shadow-lg'
                    : plan.popular
                    ? 'border-2 border-purple-600 shadow-lg'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && !plan.current && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white px-4 py-1">
                      Recommended for Growth
                    </Badge>
                  </div>
                )}

                {plan.current && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${plan.color}-100 text-${plan.color}-600 mx-auto mb-4`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="mb-3">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                  <CardDescription className="text-sm">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features */}
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    <div className="pt-4 border-t space-y-2">
                      {plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-5 h-5 flex-shrink-0 mt-0.5 flex items-center justify-center">
                            <div className="w-3 h-0.5 bg-gray-400 rounded" />
                          </div>
                          <span className="text-sm text-gray-500">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-4">
                    {plan.current ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className={`w-full ${
                          plan.popular
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        onClick={() => handleUpgrade(plan.name)}
                      >
                        {church.type === 'single' && plan.name === 'Multi-Branch'
                          ? 'Upgrade Now'
                          : 'Select Plan'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Can I upgrade from Single Church to Multi-Branch later?
                </h4>
                <p className="text-sm text-gray-600">
                  Yes! You can upgrade anytime. All your existing data (departments, units, members, etc.) will be preserved and automatically organized under your new branch structure.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  What happens to my data when I upgrade?
                </h4>
                <p className="text-sm text-gray-600">
                  Your existing church becomes the headquarters branch, and all current departments, units, and members remain intact. You can then add additional branches as needed.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Is there a contract or can I cancel anytime?
                </h4>
                <p className="text-sm text-gray-600">
                  No contracts required. You can downgrade or cancel your Multi-Branch subscription anytime. If you downgrade, you'll need to consolidate to a single branch.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Back to Dashboard */}
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}