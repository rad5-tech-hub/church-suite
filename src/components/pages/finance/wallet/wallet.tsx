import React, { useState, useCallback, useEffect } from "react";
import { BsPerson, BsWallet2 } from "react-icons/bs";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import { showPageToast } from "../../../util/pageToast";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { TbArrowBearRight2, TbArrowFork } from "react-icons/tb";

declare global {
  interface Window {
    FlutterwaveCheckout?: any;
  }
}

interface Wallet {
  id: string;
  userId: string | null;
  balance: string;
  branchWallet: { name: string } | null;
  deptWallet: { name: string } | null;
}

interface FormDataCreate {
  walletType: string;
  departmentId?: string;
}

interface FormDataFund {
  walletId: string;
  amount: number;
}

interface ErrorsCreate {
  walletType: string;
  departmentId: string;
}

interface ErrorsFund {
  walletId: string;
  amount: string;
}

interface Branch {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  branchId: string;
}

interface FlutterwaveResponse {
  success: boolean;
  message: string;
  tx_ref: string;
  amount: number;
  currency: string;
  publicKey: string;
  customer: { email: string; name: string };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateAndFundWallet: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  usePageToast("wallet");

  // Create Form
  const initialFormDataCreate: FormDataCreate = {
    walletType: "branch",
    departmentId: "",
  };
  const [formDataCreate, setFormDataCreate] = useState<FormDataCreate>(initialFormDataCreate);

  const initialErrorsCreate: ErrorsCreate = {
    walletType: "",
    departmentId: "",
  };
  const [errorsCreate, setErrorsCreate] = useState<ErrorsCreate>(initialErrorsCreate);

  // Fund Form
  const initialFormDataFund: FormDataFund = {
    walletId: "",
    amount: 0,
  };
  const [formDataFund, setFormDataFund] = useState<FormDataFund>(initialFormDataFund);

  const initialErrorsFund: ErrorsFund = {
    walletId: "",
    amount: "",
  };
  const [errorsFund, setErrorsFund] = useState<ErrorsFund>(initialErrorsFund);

  // Load Flutterwave Script
  useEffect(() => {
    // Check if script is already loaded
    if (window.FlutterwaveCheckout) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
      console.log("✅ Flutterwave script loaded successfully");
    };
    script.onerror = () => {
      console.error("❌ Failed to load Flutterwave script");
      showPageToast("Failed to load payment service", "error");
    };

    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://checkout.flutterwave.com/v3.js"]');
      if (existingScript && document.body.contains(existingScript)) {
        try {
          document.body.removeChild(existingScript);
        } catch (e) {
          console.error("Error removing script:", e);
        }
      }
    };
  }, []);

  const fetchBranches = useCallback(async () => {
    if (branches.length > 0) return;
    setIsFetching(true);
    try {
      const response = await Api.get("/church/get-branches");
      setBranches(response.data.branches || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setIsFetching(false);
    }
  }, [branches.length]);

  const fetchDepartments = useCallback(async (branchId: string) => {
    setIsFetching(true);
    try {
      const response = await Api.get(`/church/get-departments?branchId=${branchId}`);
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setIsFetching(false);
    }
  }, []);

  const fetchWallets = useCallback(async () => {
    if (activeTab !== 1 || wallets.length > 0) return;
    setIsFetching(true);
    try {
      const response = await Api.get("/wallet/my-wallet");
      setWallets(response.data.wallets || []);
    } catch (error) {
      console.error("Error fetching wallets:", error);
    } finally {
      setIsFetching(false);
    }
  }, [activeTab, wallets.length]);

  useEffect(() => {
    if (open) {
      if (activeTab === 0) {
        fetchBranches();
      } else {
        fetchWallets();
      }
    }
  }, [open, activeTab, fetchBranches, fetchWallets]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setFormDataCreate(initialFormDataCreate);
    setErrorsCreate(initialErrorsCreate);
    setFormDataFund(initialFormDataFund);
    setErrorsFund(initialErrorsFund);
    setSelectedBranchId("");
    setWallets([]);
    setDepartments([]);
  };

  // CREATE HANDLERS
  const handleCreateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | SelectChangeEvent<string>) => {
      const { name, value } = e.target;
      setFormDataCreate((prev) => ({ ...prev, [name]: value }));
      setErrorsCreate((prev) => ({ ...prev, [name]: "" }));
    },
    []
  );

  const handleCreateBranchChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement> | SelectChangeEvent<string>) => {
      const branchId = e.target.value;
      setSelectedBranchId(branchId);
      setFormDataCreate((prev) => ({ ...prev, departmentId: "" }));
      if (branchId) {
        fetchDepartments(branchId);
      } else {
        setDepartments([]);
      }
    },
    [fetchDepartments]
  );

  const validateCreateForm = useCallback((): boolean => {
    const newErrors: ErrorsCreate = { walletType: "", departmentId: "" };

    if (!formDataCreate.walletType) {
      newErrors.walletType = "Wallet type is required";
    }

    if (formDataCreate.walletType === "department" && !formDataCreate.departmentId) {
      newErrors.departmentId = "Department is required";
    }

    setErrorsCreate(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  }, [formDataCreate]);

  const handleCreateSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateCreateForm()) return;

      setLoading(true);
      try {
        const payload = {
          action: "create",
          walletType: formDataCreate.walletType,
          ...(formDataCreate.walletType === "department" && { departmentId: formDataCreate.departmentId }),
        };

        await Api.post(`/wallet/fund-wallet/${selectedBranchId ? selectedBranchId : authData?.branchId}`, payload);
        showPageToast("Wallet created successfully!", "success");

        setFormDataCreate(initialFormDataCreate);
        setErrorsCreate(initialErrorsCreate);
        setSelectedBranchId("");
        setDepartments([]);
        onSuccess?.();

        setTimeout(() => onClose(), 2000);
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Failed to create wallet";
        showPageToast(errorMessage, "error");
      } finally {
        setLoading(false);
      }
    },
    [formDataCreate, validateCreateForm, authData?.branchId, onSuccess, onClose]
  );

  const handleFundChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
      const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement;

      setFormDataFund((prev) => ({
        ...prev,
        [name]: name === "amount" ? parseFloat(value.replace(/[^\d]/g, '')) || '' : value,
      }));

      setErrorsFund((prev) => ({ ...prev, [name]: "" }));
    },
    []
  );

  const validateFundForm = useCallback((): boolean => {
    const newErrors: ErrorsFund = { walletId: "", amount: "" };

    if (!formDataFund.walletId) {
      newErrors.walletId = "Please select a wallet";
    }

    if (formDataFund.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    setErrorsFund(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  }, [formDataFund]);

  const handleFlutterwavePayment = useCallback(
    async (flutterwaveData: FlutterwaveResponse) => {
      if (!scriptLoaded || !window.FlutterwaveCheckout) {
        showPageToast("Payment service is still loading. Please try again.", "error");
        return;
      }

      try {
        const modal = window.FlutterwaveCheckout({
          public_key: flutterwaveData.publicKey,
          tx_ref: flutterwaveData.tx_ref,
          amount: flutterwaveData.amount,
          currency: flutterwaveData.currency || "NGN",
          payment_options: "card,mobilemoney,ussd,banktransfer",
          customer: {
            email: flutterwaveData.customer.email,
            name: flutterwaveData.customer.name,
          },
          customizations: {
            title: "Wallet Funding",
            description: "Fund your wallet",
            logo: "", // Add your logo URL
          },
          meta: {
            walletId: formDataFund.walletId,
          },
          callback: async (response: any) => {
            console.log("✅ Payment Response:", response);
            
            if (response.status === "successful") {
              setLoading(true);
              try {
                // Extract transaction details
                const transactionId = response.transaction_id || response.tx?.id;
                const txRef = response.tx_ref || response.tx?.txRef;
                const flwRef = response.flw_ref || response.tx?.flwRef;
                const orderRef = response.tx?.orderRef;

                const payload = {
                  event: "charge.completed",
                  data: {
                    ...response,
                    id: transactionId,
                    tx_ref: txRef,
                    flw_ref: flwRef,
                    order_ref: orderRef,
                  },
                };

                console.log("📤 Sending payload to backend:", payload);

                await Api.post("/wallet/flwPayment-hook", payload);
                showPageToast("Wallet funded successfully!", "success");

                setFormDataFund(initialFormDataFund);
                setErrorsFund(initialErrorsFund);
                setWallets([]);
                onSuccess?.();

                setTimeout(() => {
                  modal.close();
                  onClose();
                }, 2000);
              } catch (error: any) {
                console.error("❌ Payment verification error:", error);
                const errorMessage = error.response?.data?.message || "Failed to verify payment";
                showPageToast(errorMessage, "error");
                modal.close();
              } finally {
                setLoading(false);
              }
            } else {
              showPageToast("Payment was not successful", "error");
              modal.close();
            }
          },
          onclose: () => {
            console.log("Payment modal closed");
            showPageToast("Payment cancelled", "warning");
            setLoading(false);
          },
        });
      } catch (error: any) {
        console.error("❌ Flutterwave Error:", error);
        showPageToast("Failed to initialize payment", "error");
        setLoading(false);
      }
    },
    [scriptLoaded, formDataFund.walletId, onSuccess, onClose]
  );

  const handleFundSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateFundForm()) return;

      if (!scriptLoaded) {
        showPageToast("Payment service is still loading. Please wait.", "error");
        return;
      }

      setLoading(true);
      try {
        const payload = {
          action: "fund",
          walletId: formDataFund.walletId,
          amount: formDataFund.amount,
        };

        const response = await Api.post<FlutterwaveResponse>(
          `/wallet/fund-wallet/${authData?.branchId}`,
          payload
        );

        // Open Flutterwave modal
        await handleFlutterwavePayment(response.data);
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Failed to initiate funding";
        showPageToast(errorMessage, "error");
        setLoading(false);
      }
    },
    [formDataFund, validateFundForm, authData?.branchId, scriptLoaded, handleFlutterwavePayment]
  );

  const handleCancel = useCallback(() => {
    setActiveTab(0);
    setFormDataCreate(initialFormDataCreate);
    setErrorsCreate(initialErrorsCreate);
    setFormDataFund(initialFormDataFund);
    setErrorsFund(initialErrorsFund);
    setSelectedBranchId("");
    setDepartments([]);
    setWallets([]);
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      fullWidth
      maxWidth="md"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 2,
          bgcolor: "#2C2C2C",
          color: "#F6F4FE",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="center" alignItems="center">
            <Box
                sx={{
                    backgroundColor: "#2C2C2C", // same as active bg to blend
                    borderRadius: "9999px",
                    border: "0.5px solid #777280",
                    p: "0.5px",
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    mb: 3,
                }}
            >
            <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                minHeight: "40px",
                width: isLargeScreen ? "400px" : "auto",
                "& .MuiTabs-flexContainer": {
                    gap: "0.5px",
                    justifyContent: "center",
                },
                "& .MuiTabs-indicator": {
                    display: "none", // remove the line indicator
                },
                "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: isLargeScreen ? "1rem" : "0.85rem",
                    color: "gray", // softer text for inactive
                    borderRadius: "9999px",
                    backgroundColor: "#2C2C2C", // inactive matches bg
                    transition: "all 0.3s ease",
                    minHeight: "40px",
                    padding: "12px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    "&:hover": {
                    backgroundColor: "#3A3A3A",
                    color: "#F6F4FE",
                    },
                },
                "& .Mui-selected": {
                    backgroundColor: "#F6F4FE", // dark active bg
                    color: "#2C2C2C", // light text for contrast
                },
                }}
            >
                <Tab label="Create Wallet" />
                <Tab label="Fund Wallet" />
            </Tabs>
            </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>

        <Box sx={{ py: 3 }}>
          {activeTab === 0 ? (
            <Box component="form" onSubmit={handleCreateSubmit}>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12}}>
                    <FormLabel
                        id="wallet-type-label"
                        sx={{ fontSize: "1rem", color: "#F6F4FE" }}
                    >
                        Wallet Type *
                    </FormLabel>
                    <RadioGroup
                        row
                        sx={{
                        display: "flex",
                        justifyContent: "space-around",
                        mt: 1,
                        color: "#F6F4FE",
                        }}
                        aria-labelledby="wallet-type-label"
                        name="walletType"
                        value={formDataCreate.walletType}
                        onChange={handleCreateChange}
                    >
                        {[
                        {
                            value: "branch",
                            label: "Branch",
                            icon: <TbArrowFork fontSize="22" color="#F6F4FE" />, // you can use FaBuilding too
                        },
                        {
                            value: "department",
                            label: "Department",
                            icon: <TbArrowBearRight2 fontSize="22" color="#F6F4FE" />,
                        },
                        {
                            value: "personal",
                            label: "Personal",
                            icon: <BsPerson fontSize="22" color="#F6F4FE" />,
                        },
                        ]
                        .filter((item) => authData?.role === "branch" || item.value !== "branch")
                        .map(({ value, label, icon }) => (
                        <FormControlLabel
                            key={value}
                            value={value}
                            disabled={loading}
                            control={
                            <Radio
                                sx={{
                                ml: 1,
                                color: "#F6F4FE",
                                "&.Mui-checked": { color: "#F6F4FE" },
                                }}
                            />
                            }
                            label={
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                {icon}
                                <Typography sx={{ ml: 1, color: "#F6F4FE" }}>{label}</Typography>
                            </Box>
                            }
                            labelPlacement="start"
                            sx={{
                            border: "0.5px solid gray",
                            flexDirection: "row-reverse",
                            gap: 1,
                            padding: "4px 10px",
                            mb: 2,
                            backgroundColor:
                                formDataCreate.walletType === value
                                ? "rgba(255, 255, 255, 0.15)"
                                : "transparent",
                            borderRadius: 1,
                            transition: "all 0.3s ease",
                            "&:hover": {
                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                            },
                            }}
                        />
                        ))}
                    </RadioGroup>
                </Grid>

                {(formDataCreate.walletType === "branch" || formDataCreate.walletType === "department") && <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                    <InputLabel sx={{ color: "#F6F4FE" }}>Select Branch</InputLabel>
                    <Select
                        value={selectedBranchId}
                        onChange={handleCreateBranchChange}
                        disabled={loading}
                        sx={{
                        color: "#F6F4FE",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                        "& .MuiSelect-select": { paddingRight: "24px !important" },
                        "& .MuiSelect-icon": { color: "#F6F4FE" },
                        fontSize: "0.875rem",
                        }}
                    >
                        {isFetching && <MenuItem disabled><CircularProgress size={20} sx={{color: '#F6F4FE'}} /> Loading...</MenuItem>}
                        {!isFetching && branches.length === 0 && <MenuItem disabled>No branches available</MenuItem>}
                        {!isFetching && branches.length > 0 && <MenuItem value="">Select Branch</MenuItem>}
                        {branches.map((branch) => (
                        <MenuItem key={branch.id} value={branch.id}>
                            {branch.name}
                        </MenuItem>
                        ))}
                    </Select>
                    </FormControl>
                </Grid>}
                {(formDataCreate.walletType === "department") && (
                  <>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth error={!!errorsCreate.departmentId}>
                        <InputLabel sx={{ color: "#F6F4FE" }}>Select Department *</InputLabel>
                        <Select
                          name="departmentId"
                          value={formDataCreate.departmentId}
                          onChange={handleCreateChange}
                          disabled={loading}
                            sx={{
                            color: "#F6F4FE",
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                            "& .MuiSelect-select": { paddingRight: "24px !important" },
                            "& .MuiSelect-icon": { color: "#F6F4FE" },
                            fontSize: "0.875rem",
                            }}
                        >
                          {isFetching && <MenuItem disabled><CircularProgress size={20} sx={{color: '#F6F4FE'}} /> Loading...</MenuItem>}
                          {!isFetching && departments.length === 0 && <MenuItem disabled>No departments available</MenuItem>}
                          {!isFetching && departments.length > 0 && <MenuItem value="">Select Department</MenuItem>}
                          {!selectedBranchId  && <MenuItem value="">Select Branch First</MenuItem>}
                          {departments.map((dept) => (
                            <MenuItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleFundSubmit}>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth error={!!errorsFund.walletId}>
                    <InputLabel sx={{ color: "#F6F4FE" }}>Select Wallet *</InputLabel>
                    <Select
                      name="walletId"
                      value={formDataFund.walletId}
                      onChange={handleFundChange}
                      disabled={loading}
                        sx={{
                        color: "#F6F4FE",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                        "& .MuiSelect-select": { paddingRight: "24px !important" },
                        "& .MuiSelect-icon": { color: "#F6F4FE" },
                        fontSize: "0.875rem",
                        }}
                    >
                      {isFetching && <MenuItem disabled><CircularProgress size={20} sx={{color: '#F6F4FE'}} /> Loading...</MenuItem>}
                      {!isFetching && wallets.length === 0 && <MenuItem disabled>No wallets available</MenuItem>}
                      {!isFetching && wallets.length > 0 && <MenuItem value="">None</MenuItem>}
                      {wallets.map((wallet) => (
                        <MenuItem key={wallet.id} value={wallet.id}>
                          {wallet.branchWallet?.name || wallet.deptWallet?.name || "Personal"} - Balance: ₦
                          {parseFloat(wallet.balance).toLocaleString()}
                        </MenuItem>
                      ))}
                    </Select>
                    {errorsFund.walletId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errorsFund.walletId}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Amount (NGN) *"
                    name="amount"
                    value={formDataFund.amount.toLocaleString()}
                    onChange={handleFundChange}
                    disabled={loading}
                    error={!!errorsFund.amount}
                    helperText={errorsFund.amount}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BsWallet2 style={{ color: "#F6F4FE" }} />
                        </InputAdornment>
                      ),
                      sx: {
                        color: "#F6F4FE",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                      },
                    }}
                    InputLabelProps={{ sx: { color: "#F6F4FE" } }}
                  />
                </Grid>
              </Grid>

              {!scriptLoaded && (
                <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: "#F6F4FE" }} />
                  <Typography variant="caption" sx={{ color: "#777280" }}>
                    Loading payment service...
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={handleCancel}
          disabled={loading}
          sx={{
            color: "#F6F4FE",
            "&:hover": { backgroundColor: "rgba(246, 244, 254, 0.08)" },
          }}
        >
          Close
        </Button>
        <Button
          type="submit"
          variant="contained"
          onClick={activeTab === 0 ? handleCreateSubmit : handleFundSubmit}
          disabled={loading || (activeTab === 1 && !scriptLoaded)}
          sx={{
            py: 1,
            backgroundColor: "#F6F4FE",
            px: { xs: 6, sm: 4 },
            borderRadius: 50,
            color: "#2C2C2C",
            fontWeight: "semibold",
            textTransform: "none",
            fontSize: { xs: "1rem", sm: "1rem" },
            "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
            "&:disabled": { backgroundColor: "#777280", color: "#4d4d4e8e" },
          }}
        >
          {loading ? (
            <Box display="flex" alignItems="center" color="gray">
              <CircularProgress size={18} sx={{ color: "gray", mr: 1 }} />
              Processing...
            </Box>
          ) : activeTab === 0 ? (
            "Create Wallet"
          ) : (
            `Fund Wallet`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAndFundWallet;