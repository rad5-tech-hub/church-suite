import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography,
  DialogTitle,
} from "@mui/material";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import { showPageToast } from "../../../util/pageToast";
import { Branch, Department } from "./walletTypes";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/* ---------- COMPONENT ---------- */
const CreateWalletDialog: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const authData = useSelector((state: RootState) => state.auth?.authData);

  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  usePageToast("wallet");

  // Auto-determine wallet type
  const walletType: "branch" | "department" | "personal" =
    authData?.role === "branch"
      ? "branch"
      : authData?.role === "department"
      ? "department"
      : authData?.role === "unit"
      ? "personal"
      : "personal";

  /* ---------- FETCH BRANCHES & DEPARTMENTS ---------- */
  const fetchBranches = useCallback(async () => {
    if (branches.length > 0) return;
    setIsFetching(true);
    try {
      const { data } = await Api.get("/church/get-branches");
      setBranches(data.branches ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetching(false);
    }
  }, [branches.length]);

  const fetchDepartments = useCallback(async (branchId: string) => {
    setIsFetching(true);
    try {
      const { data } = await Api.get(`/church/get-departments?branchId=${branchId}`);
      setDepartments(data.departments ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (open && authData?.branchId) {
      fetchBranches();
      if (authData.role === "department") {
        fetchDepartments(authData.branchId);
      }
    }
  }, [open, authData?.branchId, authData?.role, fetchBranches, fetchDepartments]);

  /* ---------- GET DISPLAY NAMES ---------- */
  const getBranchName = () => {
    const branch = branches.find((b) => b.id === authData?.branchId);
    return branch?.name || "Unknown Branch";
  };

  const getDepartmentName = () => {
    const dept = departments.find((d) => d.id === authData?.department);
    return dept?.name || "Unknown Department";
  };

  const getEntityPrefix = () => {
    if (!authData?.isHeadQuarter || branches.length <= 1) {
      return "Church";
    }
    return "Branch";
  };

  /* ---------- CONFIRMATION MESSAGE (informational only) ---------- */
  const getInfoMessage = () => {
    if (authData?.role === "branch") {
      const prefix = getEntityPrefix();
      const name = getBranchName();
      return (
        <>
          Create a new SMS wallet for this {prefix}:{" "}
          <span className="text-xl font-semibold">{name}</span>
        </>
      );
    }

    if (authData?.role === "department") {
      const branchName = getBranchName();
      const deptName = getDepartmentName();
      return (
        <>
          Create a new SMS wallet for this department:{" "}
          <span className="text-xl font-semibold">{deptName}</span> <br />
          under <span className="text-xl font-semibold">{branchName}</span>
        </>
      );
    }

    if (authData?.role === "unit") {
      return <>Create a new SMS Unit wallet.</>;
    }

    return <>Are you sure you want to create a wallet?</>;
  };

  /* ---------- HANDLE SUBMIT ---------- */
  const handleCreate = async () => {
    setLoading(true);
    try {
      const payload: any = {
        action: "create",
        walletType,
      };

      if (walletType === "department") {
        payload.departmentId = authData?.department;
      }

      const endpoint = `/wallet/fund-wallet/${authData?.branchId}`;
      await Api.post(endpoint, payload);

      showPageToast("Wallet created successfully!", "success");
      onSuccess?.();
      setTimeout(onClose, 1500);
    } catch (err: any) {
      showPageToast(
        err.response?.data?.message ?? "Failed to create wallet",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      fullWidth
      maxWidth="sm"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 2,
          bgcolor: "var(--color-primary)",
          color: "var(--color-text-primary)",
        },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", fontWeight: 600 }}>
        Create New Wallet
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ py: 3 }}>
          {isFetching ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
              <CircularProgress size={28} sx={{ color: "var(--color-text-primary)" }} />
            </Box>
          ) : (
            <Typography
              variant="body1"
              sx={{
                color: "var(--color-text-primary)",
                textAlign: "center",
                fontWeight: 500,
                fontSize: 17,
                lineHeight: 1.6,
              }}
            >
              {getInfoMessage()}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
        <Button
          onClick={handleCancel}
          disabled={loading}
          sx={{ color: "var(--color-text-primary)", backgroundColor: "var(--color-surface-glass)", }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={loading || isFetching}
          sx={{
            backgroundColor: "var(--color-text-primary)",
            color: "var(--color-primary)",
            borderRadius: 50,
            px: 5,
            fontWeight: 600,
            "&:disabled": { backgroundColor: "#777280" },
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={18} sx={{ mr: 1, color: "gray" }} />
              Creating...
            </>
          ) : (
            "Create"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateWalletDialog;