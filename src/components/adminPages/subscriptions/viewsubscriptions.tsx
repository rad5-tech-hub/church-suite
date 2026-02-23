// components/Plan/PlanListView.tsx
import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CreateSubPlanModal from './addSubscriptionPlans';
import AdminDashboardManager from '../shared/dashboardManager';
import Api from '../shared/api/api';

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

export default function PlanListView() {
  const [modalOpen, setModalOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Track yearly toggle per plan (using plan id as key)
  const [yearlyToggles, setYearlyToggles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await Api.get('/plan/all-plans');
      setPlans(response.data.data || []);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to fetch plans');
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleYearly = (planId: string) => {
    setYearlyToggles((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  const calculateYearlyPrice = (basePrice: number, annualDiscount: number) => {
    return basePrice * 12 * (1 - annualDiscount);
  };

  const formatPrice = (amount: number, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleOpenModal = () => setModalOpen(true);

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPlan(null);
  };

  const handleSuccess = (newPlan: any) => {
    setSuccessMessage(`Plan "${newPlan.name}" created successfully!`);
    fetchPlans();
  };

  const handleError = (error: string) => {
    setErrorMessage(error);
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, planId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedPlanId(planId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPlanId(null);
  };

  const handleEdit = () => {
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (plan) {
      setEditingPlan(plan);
      setModalOpen(true);
    }
    handleMenuClose();
  };

  return (
    <AdminDashboardManager>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="600">
            Plans Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
            sx={{
              background: 'linear-gradient(to bottom right, #7c3aed, #4f46e5)',
              '&:hover': { background: 'linear-gradient(to bottom right, #6d28d9, #4338ca)' },
            }}
          >
            Add Sub-Plan
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        ) : plans.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 3, bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No plans found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Get started by creating your first plan
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenModal}
              sx={{
                background: 'linear-gradient(to bottom right, #7c3aed, #4f46e5)',
                '&:hover': { background: 'linear-gradient(to bottom right, #6d28d9, #4338ca)' },
              }}
            >
              Add Sub-Plan
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {plans.map((plan) => {
              const isYearly = yearlyToggles[plan.id] || false;
              const basePrice = parseFloat(plan.pricingConfig.basePlanPrice);
              const extraPercent = parseFloat(plan.pricingConfig.extraBranchPercent);
              const annualDisc = parseFloat(plan.pricingConfig.annualDiscount);
              const currency = plan.pricingConfig.currency || 'NGN';

              const displayPrice = isYearly
                ? calculateYearlyPrice(basePrice, annualDisc)
                : basePrice;

              const savings = isYearly ? basePrice * 12 - displayPrice : 0;

              return (
                <Grid  size={{xs: 12, sm: 6, md: 4}} key={plan.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      borderRadius: 3,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 24px rgba(102, 126, 234, 0.4)',
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #9393fb 0%, #57b8f5 100%)',
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, pb: 2, position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" fontWeight="700">
                          {plan.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, plan.id)}
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        {plan.isTrial ? (
                          <Chip
                            label={`🎁 Trial - ${plan.trialDurationDays} days`}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              bgcolor: 'rgba(255,255,255,0.95)',
                              color: '#667eea',
                              boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)',
                              border: '1px solid rgba(255,255,255,0.3)',
                            }}
                          />
                        ) : (
                          <Chip
                            label="⭐ Standard Plan"
                            size="small"
                            sx={{
                              fontWeight: 600,
                              bgcolor: 'rgba(255,255,255,0.95)',
                              color: '#10b981',
                              boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)',
                              border: '1px solid rgba(255,255,255,0.3)',
                            }}
                          />
                        )}
                      </Box>

                      <Typography variant="body2" sx={{ mb: 3, minHeight: 60 }}>
                        {plan.description || 'No description provided'}
                      </Typography>

                      {/* Pricing Info */}
                      <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                        <Typography variant="h4" fontWeight="800" sx={{ color: plan.isTrial ? '#667eea' : '#10b981', mb: 0.5 }}>
                          {formatPrice(displayPrice, currency)}
                        </Typography>

                        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                          {isYearly ? 'per year' : 'per month'}
                        </Typography>

                        {/* Yearly toggle – only for non-trial plans with discount > 0 */}
                        {!plan.isTrial && annualDisc > 0 && (
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={isYearly}
                                onChange={() => handleToggleYearly(plan.id)}
                              />
                            }
                            label={isYearly ? 'Yearly' : 'Monthly'}
                            labelPlacement="start"
                            sx={{ ml: 0, mb: 1 }}
                          />
                        )}
                        <br />
                        {isYearly && savings > 0 && (
                          <Chip
                            label={`Save ${formatPrice(savings, currency)}`}
                            size="small"
                            color="success"
                            sx={{ fontWeight: 600 }}
                          />
                        )}

                        {/* Extra info */}
                        <Box sx={{ mt: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
                          <div>Extra branch: {(extraPercent * 100).toFixed(1)}%</div>
                          <div>Annual discount: {(annualDisc * 100).toFixed(0)}%</div>
                          <div>Currency: {currency}</div>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleEdit}>Edit</MenuItem>
        </Menu>

        <CreateSubPlanModal
          open={modalOpen}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          onError={handleError}
          editingPlan={editingPlan}
        />

        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="success" onClose={handleCloseSnackbar} sx={{ width: '100%' }}>
            {successMessage}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!errorMessage}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="error" onClose={handleCloseSnackbar} sx={{ width: '100%' }}>
            {errorMessage}
          </Alert>
        </Snackbar>
      </Box>
    </AdminDashboardManager>
  );
}