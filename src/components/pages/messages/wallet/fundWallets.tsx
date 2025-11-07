import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  CircularProgress,
  Typography,
  InputAdornment,
//   useTheme,
//   useMediaQuery,
} from "@mui/material";
import { BsWallet2 } from "react-icons/bs";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import { showPageToast } from "../../../util/pageToast";
import { FlutterwaveResponse } from "./walletTypes";

declare global {
  interface Window {
    FlutterwaveCheckout?: any;
  }
}

/* ---------- PROPS ---------- */
interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** The wallet that will be funded */
  walletId: string;
  /** Human-readable name – e.g. "Main Branch", "Youth Dept", "Personal" */
  walletName: string;
}

/* ---------- FORM STATE ---------- */
interface FormData {
  amount: number;
}
interface Errors {
  amount: string;
}

/* ---------- COMPONENT ---------- */
const FundWalletDialog: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  walletId,
  walletName,
}) => {
  const authData = useSelector((state: RootState) => state.auth?.authData);
//   const theme = useTheme();
//   const isLarge = useMediaQuery(theme.breakpoints.up("lg"));

  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  usePageToast("wallet");

  const initialForm: FormData = { amount: 0 };
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Errors>({ amount: "" });
  const [installmentFeedback, setInstallmentFeedback] = useState<string>("");

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

  /* ---------- HANDLERS ---------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = Number(value.replace(/,/g, ""));

    setForm({ ...form, [name]: numericValue }); // <-- Value sent to backend

    if (name === "amount") {
      const divided = numericValue / 6;
      setInstallmentFeedback(
        numericValue
          ? `SMS Messages Unit Price (Amount ÷ 6): ₦${divided.toLocaleString()}`
          : ""
      );
    }
  };

  const validate = (): boolean => {
    const e: Errors = { amount: "" };
    if (form.amount <= 0) e.amount = "Amount must be greater than 0";
    setErrors(e);
    return !Object.values(e).some((v) => v);
  };

  /* ---------- FLUTTERWAVE PAYMENT ---------- */
  const openFlutterwave = async (data: FlutterwaveResponse) => {
    if (!scriptLoaded || !window.FlutterwaveCheckout) {
      showPageToast("Payment service still loading", "error");
      return;
    }

    const modal = window.FlutterwaveCheckout({
      public_key: data.publicKey,
      tx_ref: data.tx_ref,
      amount: data.amount,
      currency: data.currency || "NGN",
      payment_options: "card,mobilemoney,ussd,banktransfer",
      customer: data.customer,
      customizations: {
        title: "Wallet Funding",
        description: "Fund your wallet",
      },
      meta: { walletId },
      callback: async (resp: any) => {
        if (resp.status !== "successful") {
          showPageToast("Payment not successful", "error");
          modal.close();
          return;
        }

        setLoading(true);
        try {
          const payload = {
            event: "charge.completed",
            data: {
              id: resp.transaction_id ?? resp.tx?.id,
              tx_ref: resp.tx_ref ?? resp.tx?.txRef,
              flw_ref: resp.flw_ref ?? resp.tx?.flwRef,
              order_ref: resp.tx?.orderRef,
              ...resp,
            },
          };
          await Api.post("/wallet/flwPayment-hook", payload);
          showPageToast("Wallet funded successfully!", "success");
          reset();
          onSuccess?.();
          setTimeout(() => {
            modal.close();
            onClose();
          }, 1500);
        } catch (err: any) {
          showPageToast(
            err.response?.data?.message ?? "Payment verification failed",
            "error"
          );
          modal.close();
        } finally {
          setLoading(false);
        }
      },
      onclose: () => {
        showPageToast("Payment cancelled", "warning");
        setLoading(false);
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!scriptLoaded) {
      showPageToast("Payment service loading...", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        action: "fund",
        walletId,
        amount: form.amount,
      };
      const { data } = await Api.post<FlutterwaveResponse>(
        `/wallet/fund-wallet/${authData?.branchId}`,
        payload
      );
      await openFlutterwave(data);
    } catch (err: any) {
      showPageToast(
        err.response?.data?.message ?? "Failed to start funding",
        "error"
      );
      setLoading(false);
    }
  };

  const reset = () => {
    setForm(initialForm);
    setErrors({ amount: "" });
    setInstallmentFeedback(""); 
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason !== "backdropClick") {         
          handleCancel();
        }
      }}
      fullWidth
      maxWidth="sm"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 2,
          bgcolor: "#2C2C2C",
          color: "#F6F4FE",
        },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", fontWeight: 600 }}>
        Fund SMS Wallet
        {/* Wallet name displayed under the title */}
        <Typography
          variant="body2"
          sx={{
            mt: 1,
            fontWeight: 400,
            color: "#B0B0B0",
          }}
        >
          {walletName}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit} sx={{ py: 2 }}     id="fund-wallet-form">
          <Grid container spacing={3}>
            {/* ----- Amount ----- */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Amount (NGN) *"
                name="amount"
                value={form.amount ? form.amount.toLocaleString() : ""}
                onChange={handleChange}
                disabled={loading}
                error={!!errors.amount}
                helperText={errors.amount || installmentFeedback}
                FormHelperTextProps={{
                  sx: {
                    color: errors.amount ? "#ff6b6b" : "#F6F4FE", // ✅ visible and bright text
                    fontWeight: 500,
                  },
                }}
                InputProps={{
                    startAdornment: (
                    <InputAdornment position="start">
                        <BsWallet2 style={{ color: "#F6F4FE" }} />
                    </InputAdornment>
                    ),
                    sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    },
                }}
                InputLabelProps={{ sx: { color: "#F6F4FE" } }}
              />
            </Grid>
          </Grid>

          {/* ----- Script loading hint ----- */}
          {!scriptLoaded && (
            <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} sx={{ color: "#F6F4FE" }} />
              <Typography variant="caption" sx={{ color: "#777280" }}>
                Loading payment service...
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleCancel} disabled={loading} sx={{color:'#F6F4FE' }}>
          Cancel
        </Button>

        {/* ←←←  FIXED BUTTON  ←←← */}
        <Button
            type="submit"
            variant="contained"
            form="fund-wallet-form"
            disabled={loading || !scriptLoaded}
            sx={{
            backgroundColor: "#F6F4FE",
            color: "#2C2C2C",
            borderRadius: 50,
            px: 4,
            "&:disabled": { backgroundColor: "#777280" },
            }}
        >
            {loading ? (
            <>
                <CircularProgress size={18} sx={{ mr: 1, color: "gray" }} />
                Processing...
            </>
            ) : (
            "Fund Wallet"
            )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FundWalletDialog;