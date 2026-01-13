import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import DashboardManager from "../../../shared/dashboardManager";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import {
  Box,
  Button,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import { ChevronLeft, ChevronRight, TrendingFlat } from "@mui/icons-material";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
import CreateAccountDialog from "./createFinAccount";
import { MdOutlineAccountBalance } from "react-icons/md";

interface AccountRecord {
  debit: string;
  credit: string;
  balance: string;
  description: string;
  createdBy: string;
  createdAt: string;
  creator: { name: string };
}

interface FetchAccountResponse {
  message: string;
  scope: string;
  result: {
    pagination: { hasNextPage: boolean; nextCursor: string; nextPage: string | null };
    results: AccountRecord[];
  };
}

interface Department {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface TabData {
  records: AccountRecord[];
  loading: boolean;
  error: string | null;
  pagination: { hasNextPage: boolean; nextPage: string | null; nextCursor: string };
  currentPage: number;
  nextPageUrl: string | null;
  hasFetched?: boolean;
}

interface AppState {
  currentTab: "church" | "branch" | "department";
  isModalOpen: boolean;
  selectedDepartmentId: string | null;
  selectedBranchId: string | null;
  departments: Department[];
  branches: Branch[];
  departmentsLoading: boolean;
  branchesLoading: boolean;
  churchData: TabData;
  branchData: TabData;
  departmentData: TabData;
}
const initialTabData: TabData = {
  records: [],
  loading: false,
  error: null,
  pagination: { hasNextPage: false, nextPage: null, nextCursor: "" },
  currentPage: 1,
  nextPageUrl: null,
  hasFetched: false,
};

const initialState: AppState = {
  currentTab: "branch",
  isModalOpen: false,
  selectedDepartmentId: null,
  selectedBranchId: null,
  departments: [],
  branches: [],
  departmentsLoading: false,
  branchesLoading: false,
  churchData: initialTabData,
  branchData: initialTabData,
  departmentData: initialTabData,
};

const columnWidths = {
  snumber: { xs: "8%", sm: "5%", md: "3%" },
  date: { xs: "18%", sm: "15%", md: "12%" },
  description: { xs: "30%", sm: "35%", md: "30%" },
  credit: { xs: "12%", sm: "13%", md: "15%" },
  debit: { xs: "12%", sm: "13%", md: "15%" },
  balance: { xs: "10%", sm: "12%", md: "15%" },
  creator: { xs: "10%", sm: "7%", md: "10%" },
};

const CustomPagination: React.FC<{
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (direction: "next" | "prev") => void;
  currentPage: number;
  isLoading: boolean;
}> = ({ hasNextPage, hasPrevPage, onPageChange, currentPage, isLoading }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: { xs: "space-between", sm: "flex-end" },
      py: 2,
      px: { xs: 2, sm: 3 },
      color: "#777280",
      gap: { xs: 1, sm: 2 },
      flexWrap: "wrap",
    }}
  >
    <Typography sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, color: "#777280", order: { xs: 2, sm: 0 } }}>
      Page {currentPage}
    </Typography>
    <Box sx={{ display: "flex", gap: 1, order: { xs: 1, sm: 0 } }}>
      <Button
        onClick={() => onPageChange("prev")}
        disabled={!hasPrevPage || isLoading}
        sx={{
          minWidth: { xs: "36px", sm: "40px" },
          height: { xs: "36px", sm: "40px" },
          borderRadius: "8px",
          backgroundColor: !hasPrevPage || isLoading ? "#4d4d4e8e" : "var(--color-text-primary)",
          color: !hasPrevPage || isLoading ? "#777280" : "#160F38",
          "&:hover": { backgroundColor: "var(--color-text-primary)", opacity: 0.9 },
          "&:disabled": { backgroundColor: "#4d4d4e8e", color: "#777280" },
        }}
      >
        <ChevronLeft />
      </Button>
      <Button
        onClick={() => onPageChange("next")}
        disabled={!hasNextPage || isLoading}
        sx={{
          minWidth: { xs: "36px", sm: "40px" },
          height: { xs: "36px", sm: "40px" },
          borderRadius: "8px",
          backgroundColor: !hasNextPage || isLoading ? "#4d4d4e8e" : "var(--color-text-primary)",
          color: !hasNextPage || isLoading ? "#777280" : "#160F38",
          "&:hover": { backgroundColor: "var(--color-text-primary)", opacity: 0.9 },
          "&:disabled": { backgroundColor: "#4d4d4e8e", color: "#777280" },
        }}
      >
        <ChevronRight />
      </Button>
    </Box>
  </Box>
);

const AccountRow: React.FC<{ record: AccountRecord; index: number }> = React.memo(({ record, index }) => (
  <TableRow
    sx={{
      "& td": { border: "none" },
      backgroundColor: "var(--color-surface-glass)",
      borderRadius: "8px",
      "&:hover": { backgroundColor: "var(--color-surface-glass)", transform: "translateY(-2px)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
      transition: "all 0.2s ease",
      mb: { xs: 1.5, sm: 2 },
    }}
  >
    <TableCell sx={{ width: columnWidths.snumber.md, fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" }, color: "var(--color-text-primary)", fontWeight: 600, px: { xs: 1.5, sm: 2 } }}>
      {(index + 1).toString().padStart(2, "0")}
    </TableCell>
    <TableCell sx={{ width: columnWidths.date.md, fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" }, color: "var(--color-text-primary)", py: { xs: 1.5, sm: 2 }, px: { xs: 1.5, sm: 2 } }}>
      {new Date(record.createdAt).toLocaleDateString()}
    </TableCell>
    <TableCell
      sx={{
        width: columnWidths.description.md,
        fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" },
        color: "var(--color-text-primary)",
        py: { xs: 1.5, sm: 2 },
        px: { xs: 1.5, sm: 2 },
        maxWidth: 0,
        overflow: "hidden",
        whiteSpace: "normal",
        wordWrap: "break-word",
        overflowWrap: "break-word",
      }}
    >
      <Box component="span" sx={{ display: "-webkit-box", WebkitLineClamp: { xs: 2, sm: 3 }, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {record.description || "N/A"}
      </Box>
    </TableCell>
    <TableCell
      sx={{
        width: columnWidths.credit.md,
        fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" },
        color: record.credit !== "0.00" ? "#10B981" : "var(--color-text-muted)",
        textAlign: "right",
        fontWeight: record.credit !== "0.00" ? 600 : "inherit",
        px: { xs: 1.5, sm: 2 },
      }}
    >
      ₦{parseFloat(record.credit).toLocaleString()}
    </TableCell>
    <TableCell
      sx={{
        width: columnWidths.debit.md,
        fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" },
        color: record.debit !== "0.00" ? "#EF4444" : "var(--color-text-muted)",
        textAlign: "right",
        fontWeight: record.debit !== "0.00" ? 600 : "inherit",
        px: { xs: 1.5, sm: 2 },
      }}
    >
      ₦{parseFloat(record.debit).toLocaleString()}
    </TableCell>
    <TableCell sx={{ width: columnWidths.balance.md, fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.875rem" }, color: "var(--color-text-primary)", textAlign: "right", fontWeight: 700, px: { xs: 1.5, sm: 2 } }}>
      ₦{parseFloat(record.balance).toLocaleString()}
    </TableCell>
    <TableCell sx={{ width: columnWidths.creator.md, fontSize: { sm: "0.8rem", md: "0.875rem" }, color: "var(--color-text-primary)", px: { sm: 1.5, md: 2 } }}>
      {record.creator.name}
    </TableCell>
  </TableRow>
));

const AccountRecordsTable: React.FC<{
  records: AccountRecord[];
  loading: boolean;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (direction: "next" | "prev") => void;
  currentPage: number;
}> = ({ records, loading, hasNextPage, hasPrevPage, onPageChange, currentPage }) => {
  return (
    <>
      <TableContainer
        sx={{
          boxShadow: { xs: 1, sm: 2 },
          borderRadius: { xs: 1.5, sm: 2 },
          overflowX: "auto",
          mb: 4,
          maxHeight: { xs: "400px", sm: "450px", md: "500px" },
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: "6px", height: "6px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#777280", borderRadius: "3px", minHeight: "20px" },
          "&::-webkit-scrollbar-track": { backgroundColor: "#4d4d4e8e" },
        }}
      >
        <Table sx={{ minWidth: { xs: "600px", sm: 750, md: 900 } }}>
          <TableHead>
            <TableRow sx={{ "& th": { border: "none", backgroundColor: "transparent" } }}>
              <TableCell sx={{ fontWeight: 600, width: columnWidths.snumber.md, color: "#777280", fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" }, px: { xs: 1.5, sm: 2 } }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600, width: columnWidths.date.md, color: "#777280", fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" }, px: { xs: 1.5, sm: 2 } }}>
                Date
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: columnWidths.description.md, color: "#777280", fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" }, px: { xs: 1.5, sm: 2 } }}>
                Description
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: columnWidths.credit.md, color: "#777280", textAlign: "right", fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" }, px: { xs: 1.5, sm: 2 } }}>
                Credit
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: columnWidths.debit.md, color: "#777280", textAlign: "right", fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" }, px: { xs: 1.5, sm: 2 } }}>
                Debit
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: columnWidths.balance.md, color: "#777280", textAlign: "right", fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" }, px: { xs: 1.5, sm: 2 } }}>
                Balance
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: columnWidths.creator.md, color: "#777280", fontSize: { sm: "0.8rem", md: "0.875rem" }, px: { sm: 1.5, md: 2 } }}>Creator</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: "center", py: { xs: 6, sm: 8 }, border: "none" }}>
                  <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-[var(--color-text-primary)] mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: "center", py: { xs: 6, sm: 8 }, border: "none", color: "#777280" }}>
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              records.map((record, index) => <AccountRow key={index} record={record} index={index} />)
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <CustomPagination hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} onPageChange={onPageChange} currentPage={currentPage} isLoading={loading} />
    </>
  );
};

const ViewFinAccount: React.FC = () => {
  usePageToast("view-fin-account");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const authData = useSelector((state: RootState) => state?.auth?.authData);

  const hasInitialized = useRef(false);
  const isFetchingRef = useRef(false); // Track ongoing fetches to prevent overlaps
  const [state, setState] = useState<AppState>({
    ...initialState,
    selectedBranchId: authData?.branchId || null,
  });
  
  const handleStateChange = useCallback(<K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const defaultTab = useMemo((): AppState["currentTab"] => {
    if (authData?.role === "department") {
      handleStateChange("selectedBranchId", authData.branchId || null);
      handleStateChange("selectedDepartmentId", authData.department || null);
      return "department";
    }
    if (authData?.role === "branch") return "branch";
    return "church";
  }, [authData]);

  const getCurrentTabData = useCallback((): TabData => {
    switch (state.currentTab) {
      case "church":
        return state.churchData;
      case "branch":
        return state.branchData;
      case "department":
        return state.departmentData;
      default:
        return state.branchData;
    }
  }, [state.currentTab, state.churchData, state.branchData, state.departmentData]);

  const updateTabData = useCallback((tab: AppState["currentTab"], updater: (current: TabData) => TabData) => {
    setState((prev) => {
      switch (tab) {
        case "church":
          return { ...prev, churchData: updater(prev.churchData) };
        case "branch":
          return { ...prev, branchData: updater(prev.branchData) };
        case "department":
          return { ...prev, departmentData: updater(prev.departmentData) };
        default:
          return prev;
      }
    });
  }, []);

  const fetchBranches = useCallback(async () => {
    handleStateChange("branchesLoading", true);
    try {
      const response = await Api.get<{ branches: Branch[] }>("/church/get-branches");
      handleStateChange("branches", response.data.branches || []);
      if (authData?.branchId && response.data.branches.some((b) => b.id === authData.branchId)) {
        handleStateChange("selectedBranchId", authData.branchId);
      }
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      showPageToast("Failed to load branches", "error");
    } finally {
      handleStateChange("branchesLoading", false);
    }
  }, [authData?.branchId, handleStateChange]);

  const fetchDepartments = useCallback(async () => {
    if (!state.selectedBranchId) return;
    handleStateChange("departmentsLoading", true);
    try {
      const response = await Api.get<{ departments: Department[] }>("/church/get-departments", {
        params: { branchId: state.selectedBranchId },
      });
      const departments = response.data.departments || [];
      handleStateChange("departments", departments);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      showPageToast("Failed to load departments", "error");
    } finally {
      handleStateChange("departmentsLoading", false);
    }
  }, [state.selectedBranchId, handleStateChange]);

  const getEndpoint = useCallback(
    (tab: AppState["currentTab"]): string | null => {
      const base = "/wallet/get-account-record";
      const params = new URLSearchParams();

      if (tab === "church") return base;

      if (tab === "branch") {
        if (state.selectedBranchId) {
          params.append("branchId", state.selectedBranchId);
          if (state.selectedDepartmentId) {
            params.append("departmentId", state.selectedDepartmentId);
          }
          return `${base}?${params.toString()}`;
        }
        return null;
      }

      if (tab === "department") {
        // ✅ Department role should only use its own IDs automatically
        const branch = state.selectedBranchId || authData?.branchId;
        const dept = state.selectedDepartmentId || authData?.department;
        if (branch && dept) {
          params.append("branchId", branch);
          params.append("departmentId", dept);
          return `${base}?${params.toString()}`;
        }
        return null;
      }
      return null;
    },
    [state.selectedBranchId, state.selectedDepartmentId, authData]
  );

  const fetchRecordsForTab = useCallback(
    async (tab: AppState["currentTab"], nextPageUrl?: string | null) => {
      if (isFetchingRef.current) {
        console.log(`🚫 Skipping fetch for ${tab}: Fetch already in progress`);
        return;
      }
      if (tab === "department" && (!state.selectedDepartmentId || !state.selectedBranchId)) {
        updateTabData(tab, (current) => ({
          ...current,
          loading: false,
          error: "Please select a department",
        }));
        return;
      }
      if (tab === "branch" && !state.selectedBranchId) {
        updateTabData(tab, (current) => ({
          ...current,
          loading: false,
          error: "Please select a branch",
        }));
        return;
      }

      isFetchingRef.current = true;
      updateTabData(tab, (current) => ({ ...current, loading: true, error: null }));

      try {
        const url = nextPageUrl || getEndpoint(tab);
        if (!url) {
          throw new Error("No valid endpoint URL available");
        }

        const response = await Api.get<FetchAccountResponse>(url);
        const data = response.data;

        updateTabData(tab, (current) => ({
          ...current,
          records: data.result?.results || [],
          loading: false,
          error: null,
          pagination: data.result?.pagination || { hasNextPage: false, nextPage: null, nextCursor: "" },
          currentPage: nextPageUrl ? current.currentPage + 1 : 1,
          nextPageUrl: data.result?.pagination?.nextPage || null,
        }));
      } catch (error: any) {
        console.error(`❌ ${tab} fetch failed:`, error);
        updateTabData(tab, (current) => ({
          ...current,
          loading: false,
          error: `Failed to load ${tab} records. Please try again.`,
        }));
        showPageToast(`Failed to load ${tab} records`, "error");
      } finally {
        isFetchingRef.current = false;
      }
    },
    [getEndpoint, updateTabData, state.selectedDepartmentId, state.selectedBranchId]
  );

  // Initialize component
  useEffect(() => {
    if (hasInitialized.current) return;

    console.log("🏠 Initial setup - defaultTab:", defaultTab);
    handleStateChange("currentTab", defaultTab);

    if (authData?.role === "branch" || authData?.role === "department") {
      fetchBranches();
    }

    if (authData?.branchId) {
      handleStateChange("selectedBranchId", authData.branchId);
      fetchDepartments();
    }

    hasInitialized.current = true;
  }, [authData?.branchId, authData?.role, defaultTab, fetchBranches, fetchDepartments, handleStateChange]);

  // Auto-select first department when departments are loaded
  useEffect(() => {
    if (
      state.currentTab === "department" &&
      state.departments.length > 0 &&
      !state.selectedDepartmentId &&
      !state.departmentsLoading &&
      !isFetchingRef.current
    ) {
      console.log("🛠️ Auto-selecting first department:", state.departments[0].id);
      handleStateChange("selectedDepartmentId", state.departments[0].id);
    }
  }, [state.currentTab, state.departments, state.selectedDepartmentId, state.departmentsLoading, handleStateChange]);

  // Fetch records when tab or selections change
  useEffect(() => {
    const tab = state.currentTab;
    const tabData = getCurrentTabData();

    // ✅ Only fetch when:
    // - First time on this tab
    // - OR user manually switches tab
    // - OR user changes branch/department
    const canFetch =
      !tabData.hasFetched && // hasn't fetched before
      ((tab === "church") ||
      (tab === "branch" && state.selectedBranchId) ||
      (tab === "department" && state.selectedBranchId && state.selectedDepartmentId));

    if (canFetch) {
      fetchRecordsForTab(tab);
      updateTabData(tab, (cur) => ({ ...cur, hasFetched: true })); // mark fetched ✅
    }
  }, [state.currentTab, state.selectedBranchId, state.selectedDepartmentId]);


  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newTab: AppState["currentTab"]) => {
      console.log("🔄 Tab changed to:", newTab);
      setState((prev) => ({
        ...prev,
        currentTab: newTab,
        selectedDepartmentId: newTab !== "department" ? null : prev.selectedDepartmentId,
        selectedBranchId: newTab === "branch" ? authData?.branchId || prev.selectedBranchId : prev.selectedBranchId,
        departmentData: newTab === "department" ? initialTabData : prev.departmentData, // Reset department data
      }));

      if (newTab === "department" && state.departments.length === 0 && state.selectedBranchId) {
        fetchDepartments();
      } else if (newTab === "branch" && state.branches.length === 0) {
        fetchBranches();
      }
    },
    [authData?.branchId, fetchBranches, fetchDepartments, state.departments.length, state.branches.length, state.selectedBranchId]
  );

  const handleBranchChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const branchId = event.target.value;
      console.log("🔄 Branch changed to:", branchId);

      setState((prev) => ({
        ...prev,
        selectedBranchId: branchId || null,
        selectedDepartmentId: null,
        departments: [],
        departmentData: initialTabData, // Reset department data
      }));
    },
    []
  );

  // ✅ Trigger fetch AFTER state is updated
  useEffect(() => {
    if (state.selectedBranchId) {
      fetchDepartments(); // this can now use selectedBranchId internally
      fetchRecordsForTab("branch");
    }
  }, [state.selectedBranchId, fetchDepartments, fetchRecordsForTab]);


  const handleDepartmentChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const departmentId = event.target.value;
      console.log("🔄 Department changed to:", departmentId);
      setState((prev) => ({
        ...prev,
        selectedDepartmentId: departmentId || null,
        departmentData: { ...prev.departmentData, hasFetched: false }, // Reset fetch flag
      }));
    },
    []
  );

  const handlePageChange = useCallback(
    (direction: "next" | "prev") => {
      console.log(`📄 ${state.currentTab} page change: ${direction}`);
      const currentData = getCurrentTabData();
      if (direction === "next" && currentData.nextPageUrl) {
        fetchRecordsForTab(state.currentTab, currentData.nextPageUrl);
      } else if (direction === "prev" && currentData.currentPage > 1) {
        fetchRecordsForTab(state.currentTab);
      }
    },
    [fetchRecordsForTab, state.currentTab, getCurrentTabData]
  );

  const availableTabs = useMemo((): AppState["currentTab"][] => {
    const isHQ = authData?.isHeadQuarter;
    const branchCount = authData?.branches?.length ?? 0;
    const role = authData?.role;
    const isSuperAdmin = authData?.isSuperAdmin;

    // ✅ CASE 1: HQ SuperAdmin with branch role → show everything
    if (isHQ && role === "branch" && isSuperAdmin) {
      return ["church", "branch", "department"];
    }

    // 🟢 CASE 2: HQ user with 1 branch OR branch SuperAdmin → show branch & department
    if ((isHQ && branchCount === 1 && role === "branch") || (!isHQ && branchCount === 1 && role === "branch")) {
      return ["branch", "department"];
    }

    // 🟠 CASE 3: Department role → only department tab
    if (role === "department") {
      return ["department"];
    }

    // ⚫ Default → church
    return ["church"];
  }, [
    authData?.role,
    authData?.isHeadQuarter,
    authData?.branches,
    authData?.isSuperAdmin,
  ]);

  const currentTabData = getCurrentTabData();

  const EmptyState = () => (
    <Box
      sx={{
        textAlign: "center",
        py: { xs: 6, sm: 8 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <MdOutlineAccountBalance style={{ fontSize: isMobile ? 48 : 60, color: "var(--color-text-muted)", marginBottom: 2 }} />
      <Typography variant="h6" color="rgba(255, 255, 255, 0.6)" gutterBottom sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" }, fontWeight: 500 }}>
        {currentTabData.error || "No Account Records"}
      </Typography>
      {state.currentTab === "department" && (
        <Typography sx={{ mb: 2, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
          {currentTabData.error
            ? currentTabData.error
            : `No records found for ${state.departments.find((d) => d.id === state.selectedDepartmentId)?.name || "selected department"}`}
        </Typography>
      )}
      <Button
        variant="contained"
        onClick={() => handleStateChange("isModalOpen", true)}
        size={isMobile ? "small" : "medium"}
        sx={{
          backgroundColor: "var(--color-text-primary)",
          px: { xs: 2, sm: 3 },
          py: 1.2,
          borderRadius: 50,
          fontWeight: 500,
          textTransform: "none",
          color: "var(--color-primary)",
          fontSize: { xs: "0.875rem", sm: "1rem" },
          "&:hover": { backgroundColor: "var(--color-text-primary)", opacity: 0.9 },
          width: { xs: "100%", sm: "auto", md: "200px" },
        }}
      >
        Record Transaction
      </Button>
    </Box>
  );

  return (
    <DashboardManager>
      <Box sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3, md: 4 }, minHeight: "100vh" }}>
        <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              component="h4"
              fontWeight={600}
              gutterBottom
              sx={{
                color: theme.palette.text.primary,
                fontSize: { xs: "1.2rem", sm: "1.4rem", md: "1.5rem", lg: "1.5rem" },
                display: "flex",
                alignItems: "center",
                gap: 1,
                lineHeight: 1.3,
              }}
            >
              <span className="text-[var(--color-text-muted)]">Finance</span> <LiaLongArrowAltRightSolid className="text-[var(--color-text-primary)]" /> <span className="text-[var(--color-text-primary)]">Account Records</span>
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: "flex", justifyContent: { xs: "end", md: "flex-end" }, alignItems: "center", gap: { xs: 1, sm: 2 }, mt: { xs: 1, md: 0 } }}>
            <Button
              variant="contained"
              onClick={() => handleStateChange("isModalOpen", true)}
              size={isMobile ? "small" : "medium"}
              sx={{
                backgroundColor: "var(--color-text-primary)",
                px: { xs: 2, sm: 3 },
                py: { xs: 0.8, sm: 1 },
                borderRadius: 50,
                fontWeight: 500,
                textTransform: "none",
                color: "var(--color-primary)",
                fontSize: { xs: "0.875rem", sm: "1rem" },
                minWidth: { xs: "140px", sm: "180px" },
                height: { xs: "38px", sm: "44px" },
                "&:hover": { backgroundColor: "var(--color-text-primary)", opacity: 0.9 },
              }}
            >
              Record Transaction
            </Button>
          </Grid>
        </Grid>

        {availableTabs.length > 1 && (
          <Box sx={{ mb: { xs: 2.5, sm: 3 }, borderBottom: 1, borderColor: "#4d4d4e8e", display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "flex-end" }, gap: { xs: 2, sm: 3 } }}>
            <Tabs
              value={state.currentTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons={isMobile ? "auto" : false}
              aria-label="account scope tabs"
              sx={{
                minHeight: { xs: "44px", sm: "48px" },
                "& .MuiTab-root": {
                  color: "#777280",
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: { xs: "0.85rem", sm: "0.95rem", md: "1rem" },
                  py: { xs: 1.2, sm: 2 },
                  minHeight: "auto",
                  transition: "all 0.3s ease",
                  px: { xs: 1.5, sm: 2.5 },
                },
                "& .MuiTab-root.Mui-selected": { color: "var(--color-text-primary)", fontWeight: 600 },
                "& .MuiTabs-indicator": { backgroundColor: "var(--color-text-primary)", height: 3 },
                flex: 1,
              }}
            >
              {availableTabs.map((tab) => {
                const shouldChangeToChurch =
                  authData?.isHeadQuarter === false && (authData?.branches?.length ?? 0) === 1 && tab === "branch";

                const label = shouldChangeToChurch
                  ? "Church"
                  : tab.charAt(0).toUpperCase() + tab.slice(1);

                return <Tab key={tab} value={tab} label={label} />;
              })}
            </Tabs>

            {!authData?.isHeadQuarter === false && (authData?.branches?.length ?? 0) === 1 && state.currentTab === "branch" && (
              <Box sx={{ ml: { sm: "auto" }, display: "flex", alignItems: "center", gap: 1, flexDirection: { xs: "column", sm: "row" } }}>
                <TrendingFlat fontSize="large" sx={{ fontSize: 30, color: "var(--color-text-primary)", display: { xs: "none", sm: "block" } }} />
                <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 200 }, maxWidth: { sm: 250 } }}>
                  <InputLabel sx={{ color: "var(--color-text-primary)", fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>Select Branch</InputLabel>
                  <Select
                    value={state.selectedBranchId || ""}
                    onChange={handleBranchChange}
                    label="Select Branch"
                    disabled={state.branchesLoading || state.branches.length === 0}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) return <em style={{ color: "#777280", fontStyle: "normal" }}>Select a branch</em>;
                      const branch = state.branches.find((b) => b.id === selected);
                      return branch?.name || selected;
                    }}
                    sx={{
                      color: "var(--color-text-primary)",
                      fontSize: { xs: "0.8rem", sm: "0.875rem" },
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#4d4d4e8e", borderRadius: 1 },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)", borderWidth: 2 },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                      "& .MuiSvgIcon-root": { color: "#777280" },
                      height: { xs: "40px", sm: "44px" },
                    }}
                  >
                    {state.branchesLoading ? (
                      <MenuItem disabled>Loading branches...</MenuItem>
                    ) : state.branches.length === 0 ? (
                      <MenuItem disabled>No branches available</MenuItem>
                    ) : (
                      state.branches.map((branch) => (
                        <MenuItem key={branch.id} value={branch.id} sx={{ fontSize: "0.875rem" }}>
                          {branch.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Box>
            )}

            {state.currentTab === "department" && (
              <Box sx={{ ml: { sm: "auto" }, display: "flex", alignItems: "center", gap: 1, flexDirection: { xs: "column", sm: "row" } }}>
                <TrendingFlat fontSize="large" sx={{ fontSize: 30, color: "var(--color-text-primary)", display: { xs: "none", sm: "block" } }} />
                <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 200 }, maxWidth: { sm: 250 } }}>
                  <InputLabel sx={{ color: "var(--color-text-primary)", fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>Select Department</InputLabel>
                  <Select
                    value={state.selectedDepartmentId || ""}
                    onChange={handleDepartmentChange}
                    label="Select Department"
                    disabled={state.departmentsLoading || state.departments.length === 0}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) return <em style={{ color: "#777280", fontStyle: "normal" }}>Select a department</em>;
                      const dept = state.departments.find((d) => d.id === selected);
                      return dept?.name || selected;
                    }}
                    sx={{
                      color: "var(--color-text-primary)",
                      fontSize: { xs: "0.8rem", sm: "0.875rem" },
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#4d4d4e8e", borderRadius: 1 },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)", borderWidth: 2 },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                      "& .MuiSvgIcon-root": { color: "#777280" },
                      height: { xs: "40px", sm: "44px" },
                    }}
                  >
                    {state.departmentsLoading ? (
                      <MenuItem disabled>Loading departments...</MenuItem>
                    ) : state.departments.length === 0 ? (
                      <MenuItem disabled>No departments available</MenuItem>
                    ) : (
                      state.departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id} sx={{ fontSize: "0.875rem" }}>
                          {dept.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Box>
            )}
          </Box>
        )}

        {currentTabData.loading && currentTabData.records.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: { xs: 8, sm: 10 }, minHeight: { xs: "300px", sm: "400px" } }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
          </Box>
        )}

        {(currentTabData.error || currentTabData.records.length === 0) && !currentTabData.loading && <EmptyState />}

        {currentTabData.records.length > 0 && !currentTabData.loading && (
          <AccountRecordsTable
            records={currentTabData.records}
            loading={currentTabData.loading}
            hasNextPage={currentTabData.pagination.hasNextPage}
            hasPrevPage={currentTabData.currentPage > 1}
            onPageChange={handlePageChange}
            currentPage={currentTabData.currentPage}
          />
        )}

        <CreateAccountDialog
          open={state.isModalOpen}
          onClose={() => handleStateChange("isModalOpen", false)}
          onSuccess={() => {
            handleStateChange("isModalOpen", false);
            fetchRecordsForTab(state.currentTab);
          }}
        />
      </Box>
    </DashboardManager>
  );
};

export default ViewFinAccount;