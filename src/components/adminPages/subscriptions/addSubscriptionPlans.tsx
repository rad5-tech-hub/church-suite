// components/Plan/CreateSubPlanModal.tsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Stack,
  Divider,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Api from '../shared/api/api';

// ────────────────────────────────────────────────
// Types (now matches real API response)
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

interface CreatePlanPayload {
  name: string;
  description?: string;
  isTrial: boolean;
  trialDurationDays?: number;
  isActive?: boolean;
}

interface PriceConfigPayload {
  planId: string;
  basePlanPrice: number;
  extraBranchPercent?: number;
  annualDiscount?: number;
}

interface CreateSubPlanModalProps {
  open: boolean;
  onClose: () => void;
  parentPlanId?: string;
  onSuccess?: (newPlan: any) => void;
  onError?: (error: string) => void;
  editingPlan?: Plan | null;
}

// ────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────

export default function CreateSubPlanModal({
  open,
  onClose,
  parentPlanId,
  onSuccess,
  onError,
  editingPlan,
}: CreateSubPlanModalProps) {
  const [formData, setFormData] = useState<CreatePlanPayload>({
    name: '',
    description: '',
    isTrial: false,
    trialDurationDays: undefined,
    isActive: true,
  });

  const [priceConfig, setPriceConfig] = useState({
    basePlanPrice: '',
    extraBranchPercent: '',
    annualDiscount: '',
    currency: 'NGN',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreatePlanPayload, string>>>({});
  const [priceErrors, setPriceErrors] = useState<{
    basePlanPrice?: string;
    extraBranchPercent?: string;
    annualDiscount?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const isEditMode = !!editingPlan;

  // ────────────────────────────────────────────────
  // Load data when editing
  // ────────────────────────────────────────────────

  useEffect(() => {
    if (editingPlan) {
      setFormData({
        name: editingPlan.name,
        description: editingPlan.description || '',
        isTrial: editingPlan.isTrial,
        trialDurationDays: editingPlan.trialDurationDays || undefined,
        isActive: true,
      });

      setPriceConfig({
        basePlanPrice: editingPlan.pricingConfig.basePlanPrice || '',
        extraBranchPercent: editingPlan.pricingConfig.extraBranchPercent || '',
        annualDiscount: editingPlan.pricingConfig.annualDiscount || '',
        currency: editingPlan.pricingConfig.currency || 'NGN',
      });

      setActiveTab(0);
    } else {
      // Reset for create mode
      setFormData({
        name: '',
        description: '',
        isTrial: false,
        trialDurationDays: undefined,
        isActive: true,
      });
      setPriceConfig({
        basePlanPrice: '',
        extraBranchPercent: '',
        annualDiscount: '',
        currency: 'NGN',
      });
    }

    setErrors({});
    setPriceErrors({});
  }, [editingPlan, open]);

  // ────────────────────────────────────────────────
  // Validation
  // ────────────────────────────────────────────────

  const validatePlanDetails = (): boolean => {
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) newErrors.name = 'Plan name is required';
    else if (formData.name.length > 100) newErrors.name = 'Max 100 characters';

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Max 500 characters';
    }

    if (formData.isTrial) {
      const days = formData.trialDurationDays;
      if (!days || days < 1 || !Number.isInteger(days)) {
        newErrors.trialDurationDays = 'Must be integer ≥ 1';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePriceConfig = (): boolean => {
    const newErrors: typeof priceErrors = {};

    if (!priceConfig.basePlanPrice.trim()) {
      newErrors.basePlanPrice = 'Base price is required';
    } else {
      const val = parseFloat(priceConfig.basePlanPrice);
      if (isNaN(val) || val <= 0) newErrors.basePlanPrice = 'Must be greater than ₦0';
    }

    // extraBranchPercent – optional but must be valid if provided
    if (priceConfig.extraBranchPercent.trim()) {
      const val = parseFloat(priceConfig.extraBranchPercent);
      if (isNaN(val) || val < 0 || val > 1) {
        newErrors.extraBranchPercent = 'Must be between 0 and 1 (e.g. 0.25 = 25%)';
      }
    }

    // annualDiscount – optional but must be valid
    if (priceConfig.annualDiscount.trim()) {
      const val = parseFloat(priceConfig.annualDiscount);
      if (isNaN(val) || val < 0 || val > 1) {
        newErrors.annualDiscount = 'Must be between 0 and 1 (e.g. 0.15 = 15%)';
      }
    }

    setPriceErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ────────────────────────────────────────────────
  // Save Handlers
  // ────────────────────────────────────────────────

  const handleSavePlanDetails = async () => {
    if (!validatePlanDetails()) return;
    setIsSubmitting(true);

    try {
      const payload: CreatePlanPayload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        isTrial: formData.isTrial,
        isActive: formData.isActive,
      };

      if (formData.isTrial) {
        payload.trialDurationDays = formData.trialDurationDays;
      }

      if (editingPlan) {
        await Api.patch(`/plan/edit-plan/${editingPlan.id}`, payload);
        onSuccess?.({ ...payload, id: editingPlan.id });
      } else {
        const res = await Api.post('/plan/create-plan', payload);
        onSuccess?.(res.data);
      }

      if (!editingPlan) onClose();
    } catch (err: any) {
      onError?.(err.response?.data?.message || 'Failed to save plan details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePrice = async () => {
    if (!editingPlan || !validatePriceConfig()) return;
    setIsSubmitting(true);

    try {
      const payload: PriceConfigPayload = {
        planId: editingPlan.id,
        basePlanPrice: parseFloat(priceConfig.basePlanPrice),
      };

      if (priceConfig.extraBranchPercent.trim()) {
        payload.extraBranchPercent = parseFloat(priceConfig.extraBranchPercent);
      }

      if (priceConfig.annualDiscount.trim()) {
        payload.annualDiscount = parseFloat(priceConfig.annualDiscount);
      }

      await Api.post('/plan/upsert-plan-config', payload);
      onSuccess?.({ ...editingPlan, pricingConfig: { ...editingPlan.pricingConfig, ...payload } });
    } catch (err: any) {
      onError?.(err.response?.data?.message || 'Failed to save pricing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setErrors({});
    setPriceErrors({});
    onClose();
  };


  // ────────────────────────────────────────────────
  // Real-time Calculations
  // ────────────────────────────────────────────────

  const basePrice = parseFloat(priceConfig.basePlanPrice) || 0;
  const extraPercent = parseFloat(priceConfig.extraBranchPercent) || 0;
  const discountPercent = parseFloat(priceConfig.annualDiscount) || 0;

  const extraBranchCost = basePrice * extraPercent;
  const yearlyBeforeDiscount = basePrice * 12;
  const yearlyAfterDiscount = yearlyBeforeDiscount * (1 - discountPercent);
  const yearlySavings = yearlyBeforeDiscount - yearlyAfterDiscount;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              {isEditMode ? 'Edit Plan' : 'Add Sub-Plan'}
              {parentPlanId && !isEditMode && ` (under #${parentPlanId})`}
            </Typography>
            <IconButton onClick={onClose} disabled={isSubmitting}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Tabs – only in edit mode */}
          {isEditMode && (
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} centered>
                <Tab label="Plan Details" />
                <Tab label="Pricing Config" />
              </Tabs>
            </Box>
          )}

          {/* Plan Details Tab */}
          {(!isEditMode || activeTab === 0) && (
            <Stack spacing={3}>
              <TextField
                label="Plan Name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                error={!!errors.name}
                helperText={errors.name}
                fullWidth
                required
                autoFocus={!isEditMode}
              />

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                error={!!errors.description}
                helperText={errors.description || 'Optional'}
                multiline
                rows={3}
                fullWidth
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isTrial}
                    onChange={(e) => setFormData((p) => ({ ...p, isTrial: e.target.checked }))}
                  />
                }
                label="This is a Trial Plan"
              />

              {formData.isTrial && (
                <Box>
                  <TextField
                    label="Trial Duration (days)"
                    type="number"
                    value={formData.trialDurationDays ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : Number(e.target.value);
                      if (val !== undefined && val > 90) return;
                      setFormData((p) => ({ ...p, trialDurationDays: val }));
                    }}
                    error={!!errors.trialDurationDays}
                    helperText={errors.trialDurationDays || 'Max 90 days'}
                    fullWidth
                    inputProps={{ min: 1, max: 90, step: 1 }}
                  />
                </Box>
              )}

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isActive}
                    onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                  />
                }
                label="Active Immediately"
              />
            </Stack>
          )}

          {/* Pricing Tab */}
          {isEditMode && activeTab === 1 && (
            <Stack spacing={3}>
              <TextField
                label="Base Price (₦)"
                type="number"
                value={priceConfig.basePlanPrice}
                onChange={(e) => setPriceConfig((p) => ({ ...p, basePlanPrice: e.target.value }))}
                error={!!priceErrors.basePlanPrice}
                helperText={priceErrors.basePlanPrice || 'Monthly base price'}
                fullWidth
                required
                inputProps={{ min: 0, step: 100 }}
              />

              <TextField
                label="Extra Branch Percent (e.g. 0.25 = 25%)"
                type="number"
                value={priceConfig.extraBranchPercent}
                onChange={(e) => setPriceConfig((p) => ({ ...p, extraBranchPercent: e.target.value }))}
                error={!!priceErrors.extraBranchPercent}
                helperText={
                  priceErrors.extraBranchPercent ||
                  (extraBranchCost > 0
                    ? `+₦${extraBranchCost.toFixed(2)} per extra branch`
                    : 'Optional – leave 0 if no extra charge')
                }
                fullWidth
                inputProps={{ min: 0, max: 1, step: 0.01 }}
              />

              <TextField
                label="Annual Discount (e.g. 0.15 = 15%)"
                type="number"
                value={priceConfig.annualDiscount}
                onChange={(e) => setPriceConfig((p) => ({ ...p, annualDiscount: e.target.value }))}
                error={!!priceErrors.annualDiscount}
                helperText={
                  priceErrors.annualDiscount ||
                  (yearlySavings > 0
                    ? `Save ₦${yearlySavings.toFixed(2)}/year → ₦${yearlyAfterDiscount.toFixed(2)}/year`
                    : 'Optional – yearly discount %')
                }
                fullWidth
                inputProps={{ min: 0, max: 1, step: 0.01 }}
              />
            </Stack>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 5 }}>
            <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>

            {!isEditMode && (
              <Button
                variant="contained"
                onClick={handleSavePlanDetails}
                disabled={isSubmitting}
                sx={{ minWidth: 160 }}
              >
                {isSubmitting ? 'Creating...' : 'Create Plan'}
              </Button>
            )}

            {isEditMode && activeTab === 0 && (
              <Button
                variant="contained"
                onClick={handleSavePlanDetails}
                disabled={isSubmitting}
                color="primary"
              >
                {isSubmitting ? 'Saving...' : 'Save Plan Details'}
              </Button>
            )}

            {isEditMode && activeTab === 1 && (
              <Button
                variant="contained"
                onClick={handleSavePrice}
                disabled={isSubmitting}
                color="success"
              >
                {isSubmitting ? 'Saving...' : 'Save Pricing Config'}
              </Button>
            )}
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}