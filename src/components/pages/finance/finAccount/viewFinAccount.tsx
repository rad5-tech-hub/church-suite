import React, { useState, useEffect, useCallback } from "react";
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
} from "@mui/material";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
import CreateAccountDialog from "./createFinAccount";
import { MdOutlineAccountBalance} from "react-icons/md";

interface AccountRecord {
  debit: string;
  credit: string;
  balance: string;
  description: string;
  createdBy: string;
  createdAt: string;
  creator: {
    name: string;
  };
}

interface FetchAccountResponse {
  message: string;
  scope: string;
  result: {
    pagination: {
      hasNextPage: boolean;
      nextCursor: string;
      nextPage: string | null;
    };
    results: AccountRecord[];
  };
}

interface State {
  records: AccountRecord[];
  loading: boolean;
  error: string | null;
  isModalOpen: boolean;
  currentTab: "church" | "branch" | "department";
  pagination: {
    hasNextPage: boolean;
    nextPage: string | null;
    nextCursor: string;
  };
  currentPage: number;
}

const initialState: State = {
  records: [],
  loading: false,
  error: null,
  isModalOpen: false,
  currentTab: "branch",
  pagination: { hasNextPage: false, nextPage: null, nextCursor: "" },
  currentPage: 1,
};

// Column Widths - EXACTLY like ViewMembers
const columnWidths = {
  snumber: "3%",
  date: "12%",
  description: "30%",
  credit: "15%",
  debit: "15%",
  balance: "15%",
  creator: "10%",
};

// Custom Pagination - EXACTLY like ViewMembers
const CustomPagination: React.FC<{
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (direction: "next" | "prev") => void;
  currentPage: number;
  isLargeScreen: boolean;
  isLoading: boolean;
}> = ({ hasNextPage, hasPrevPage, onPageChange, currentPage, isLargeScreen, isLoading }) => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", py: 2, px: { xs: 2, sm: 3 }, color: "#777280", gap: 2, flexWrap: "wrap" }}>
    <Typography sx={{ fontSize: isLargeScreen ? "0.75rem" : "0.875rem", color: "#777280" }}>
      Page {currentPage}
    </Typography>
    <Box sx={{ display: "flex", gap: 1 }}>
      <Button
        onClick={() => onPageChange("prev")}
        disabled={!hasPrevPage || isLoading}
        sx={{
          minWidth: "40px",
          height: "40px",
          borderRadius: "8px",
          backgroundColor: !hasPrevPage || isLoading ? "#4d4d4e8e" : "#F6F4FE",
          color: !hasPrevPage || isLoading ? "#777280" : "#160F38",
          "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
          "&:disabled": { backgroundColor: "#4d4d4e8e", color: "#777280" },
        }}
        aria-label="Previous page"
      >
        <ChevronLeft />
      </Button>
      <Button
        onClick={() => onPageChange("next")}
        disabled={!hasNextPage || isLoading}
        sx={{
          minWidth: "40px",
          height: "40px",
          borderRadius: "8px",
          backgroundColor: !hasNextPage || isLoading ? "#4d4d4e8e" : "#F6F4FE",
          color: !hasNextPage || isLoading ? "#777280" : "#160F38",
          "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
          "&:disabled": { backgroundColor: "#4d4d4e8e", color: "#777280" },
        }}
        aria-label="Next page"
      >
        <ChevronRight />
      </Button>
    </Box>
  </Box>
);

// Account Row - EXACTLY same design as MemberRow
const AccountRow: React.FC<{ record: AccountRecord; index: number; isLargeScreen: boolean; loading: boolean }> = React.memo(({ record, index, isLargeScreen }) => (
  <TableRow
    sx={{
      "& td": { border: "none" },
      backgroundColor: "#4d4d4e8e",
      borderRadius: "4px",
      "&:hover": { backgroundColor: "#4d4d4e8e", transform: "translateY(-2px)", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" },
      transition: "all 0.2s ease",
      mb: 2,
    }}
  >
    <TableCell sx={{ width: columnWidths.snumber, fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#F6F4FE" }}>
      {(index + 1).toString().padStart(2, "0")}
    </TableCell>
    <TableCell sx={{ width: columnWidths.date, fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#F6F4FE", py: 2 }}>
      {new Date(record.createdAt).toLocaleDateString()}
    </TableCell>
    <TableCell sx={{ width: columnWidths.description, fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#E1E1E1", py: 2, maxWidth: 0, overflow: "hidden", whiteSpace: "normal", wordWrap: "break-word", overflowWrap: "break-word" }}>
      <Box component="span" sx={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {record.description || "N/A"}
      </Box>
    </TableCell>
    <TableCell sx={{ width: columnWidths.credit, fontSize: isLargeScreen ? "0.875rem" : undefined, color: record.credit !== "0.00" ? "#10B981" : "#777280", textAlign: "right", fontWeight: record.credit !== "0.00" ? 600 : "inherit" }}>
      ₦{parseFloat(record.credit).toLocaleString()}
    </TableCell>
    <TableCell sx={{ width: columnWidths.debit, fontSize: isLargeScreen ? "0.875rem" : undefined, color: record.debit !== "0.00" ? "#EF4444" : "#777280", textAlign: "right", fontWeight: record.debit !== "0.00" ? 600 : "inherit" }}>
      ₦{parseFloat(record.debit).toLocaleString()}
    </TableCell>
    <TableCell sx={{ width: columnWidths.balance, fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#F6F4FE", textAlign: "right", fontWeight: 600 }}>
      ₦{parseFloat(record.balance).toLocaleString()}
    </TableCell>
    <TableCell sx={{ width: columnWidths.creator, fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#E1E1E1" }}>
      {record.creator.name}
    </TableCell>
  </TableRow>
));

// NEW AccountRecordsTable - EXACTLY like ViewMembers
const AccountRecordsTable: React.FC<{ 
  records: AccountRecord[]; 
  loading: boolean; 
  isLargeScreen: boolean;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (direction: "next" | "prev") => void;
  currentPage: number;
}> = ({ records, loading, isLargeScreen, hasNextPage, hasPrevPage, onPageChange, currentPage }) => {
  return (
    <>
      <TableContainer sx={{
        boxShadow: 2,
        borderRadius: 1,
        overflowX: "auto",
        mb: 4,
        maxHeight: "500px",
        overflowY: "auto",
        "&::-webkit-scrollbar": { width: "8px" },
        "&::-webkit-scrollbar-thumb": { backgroundColor: "#777280", borderRadius: "4px" },
        "&::-webkit-scrollbar-track": { backgroundColor: "#4d4d4e8e" },
      }}>
        <Table sx={{ minWidth: { xs: "auto", sm: 650 } }}>
          <TableHead>
            <TableRow sx={{ "& th": { border: "none", backgroundColor: "transparent" } }}>
              <TableCell sx={{ fontWeight: 600, width: columnWidths.snumber, color: "#777280", fontSize: isLargeScreen ? "0.875rem" : undefined }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600, width: columnWidths.date, color: "#777280", fontSize: isLargeScreen ? "0.875rem" : undefined }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, width: columnWidths.description, color: "#777280", fontSize: isLargeScreen ? "0.875rem" : undefined }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600, width: columnWidths.credit, color: "#777280", textAlign: "right", fontSize: isLargeScreen ? "0.875rem" : undefined }}>Credit</TableCell>
              <TableCell sx={{ fontWeight: 600, width: columnWidths.debit, color: "#777280", textAlign: "right", fontSize: isLargeScreen ? "0.875rem" : undefined }}>Debit</TableCell>
              <TableCell sx={{ fontWeight: 600, width: columnWidths.balance, color: "#777280", textAlign: "right", fontSize: isLargeScreen ? "0.875rem" : undefined }}>Balance</TableCell>
              <TableCell sx={{ fontWeight: 600, width: columnWidths.creator, color: "#777280", fontSize: isLargeScreen ? "0.875rem" : undefined }}>Creator</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: "center", py: 4, border: "none" }}>
                  <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-[#F6F4FE] mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: "center", py: 8, border: "none", color: "#777280" }}>
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              records.map((record, index) => (
                <AccountRow
                  key={index}
                  record={record}
                  index={index}
                  isLargeScreen={isLargeScreen}
                  loading={loading}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <CustomPagination
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        onPageChange={onPageChange}
        currentPage={currentPage}
        isLargeScreen={isLargeScreen}
        isLoading={loading}
      />
    </>
  );
};

const ViewFinAccount: React.FC = () => {
  usePageToast('view-fin-account');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const authData = useSelector((state: RootState) => state?.auth?.authData);

  const [state, setState] = useState<State>(initialState);

  // Determine default tab based on role
  const getDefaultTab = useCallback(() => {
    if (authData?.role === "branch") return "branch" as const;
    if (authData?.role === "department") return "department" as const;
    return "church" as const;
  }, [authData?.role]);

  useEffect(() => {
    const defaultTab = getDefaultTab();
    setState(prev => ({ ...prev, currentTab: defaultTab }));
  }, [getDefaultTab]);

  const handleStateChange = useCallback(
    <K extends keyof State>(key: K, value: State[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const getEndpoint = useCallback((tab: State["currentTab"]) => {
    switch (tab) {
      case "church":
        return "/wallet/get-account-record";
      case "branch":
        return `/wallet/get-account-record?branchId=${authData?.branchId}`;
      case "department":
        return `/wallet/get-account-record?branchId=${authData?.branchId}&departmentId=${authData?.department}`;
      default:
        return "/wallet/get-account-record";
    }
  }, [authData?.branchId, authData?.department]);

  const fetchRecords = useCallback(async () => {
    handleStateChange("loading", true);
    handleStateChange("error", null);
    try {
      const endpoint = getEndpoint(state.currentTab);
      const response = await Api.get<FetchAccountResponse>(endpoint);
      const data = response.data;
      setState(prev => ({
        ...prev,
        records: data.result?.results || [],
        pagination: data.result?.pagination || { hasNextPage: false, nextPage: null, nextCursor: "" },
        loading: false,
      }));
    } catch (error: any) {
      console.error("Failed to fetch records:", error);
      handleStateChange("error", "Failed to load account records. Please try again.");
      handleStateChange("loading", false);
      showPageToast("Failed to load account records", 'error');
    }
  }, [getEndpoint, handleStateChange, state.currentTab]);

  const handleTabChange = useCallback((_: React.SyntheticEvent, newTab: State["currentTab"]) => {
    handleStateChange("currentTab", newTab);
    handleStateChange("currentPage", 1);
    fetchRecords();
  }, [fetchRecords, handleStateChange]);

  const handlePageChange = useCallback((direction: "next" | "prev") => {
    // Pagination logic can be implemented here
    console.log(`Page change: ${direction}`);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const EmptyState = () => (
    <Box
      sx={{
        textAlign: "center",
        py: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MdOutlineAccountBalance style={{ fontSize: 60, color: "rgba(255, 255, 255, 0.1)", marginBottom: 16 }} />
      <Typography
        variant="h6"
        color="rgba(255, 255, 255, 0.6)"
        gutterBottom
        sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}
      >
        No Account Records
      </Typography>
      {state.error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {state.error}
        </Typography>
      )}
      <Button
        variant="contained"
        onClick={() => handleStateChange("isModalOpen", true)}
        sx={{
          backgroundColor: "#363740",
          px: { xs: 2, sm: 2 },
          mt: 2,
          fontSize: isLargeScreen ? "0.875rem" : undefined,
          color: "var(--color-text-on-primary)",
          "&:hover": { backgroundColor: "#363740", opacity: 0.9 },
        }}
      >
        Add Transaction
      </Button>
    </Box>
  );

  const availableTabs = useCallback(() => {
    const tabs: State["currentTab"][] = [];
    if (authData?.role === "branch") {
      tabs.push("church", "branch");
    } else if (authData?.role === "department") {
      tabs.push("branch", "department");
    } else {
      tabs.push("church");
    }
    return tabs;
  }, [authData?.role]);

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography
              variant={isMobile ? "h5" : isLargeScreen ? "h5" : "h5"}
              component="h4"
              fontWeight={600}
              gutterBottom
              sx={{
                color: theme.palette.text.primary,
                fontSize: isLargeScreen ? "1.3rem" : undefined,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <span className="text-[#777280]">Finance</span>{" "}
              <LiaLongArrowAltRightSolid className="text-[#F6F4FE]" />{" "}
              <span className="text-[#F6F4FE]"> Account Records</span>
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => handleStateChange("isModalOpen", true)}
              size="medium"
              sx={{
                backgroundColor: "#363740",
                px: { xs: 2, sm: 2 },
                py: 1,
                borderRadius: 50,
                fontWeight: 500,
                textTransform: "none",
                color: "var(--color-text-on-primary)",
                fontSize: isLargeScreen ? "1rem" : undefined,
                "&:hover": { backgroundColor: "#363740", opacity: 0.9 },
              }}
            >
              Add Transaction
            </Button>
          </Grid>
        </Grid>

        {availableTabs().length > 1 && (
          <Box sx={{ mb: 3 }}>
            <Tabs
              value={state.currentTab}
              onChange={handleTabChange}
              sx={{
                "& .MuiTab-root": {
                  color: "#777280", // Inactive tab color
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "1rem",
                  py: 2,
                  minHeight: "auto",
                  transition: "all 0.3s ease",
                },
                "& .MuiTab-root.Mui-selected": {
                  color: "#F6F4FE", // ✅ Active tab color
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#F6F4FE", // ✅ Active underline
                },
              }}
            >
              {availableTabs().map((tab) => (
                <Tab
                  key={tab}
                  value={tab}
                  label={tab.charAt(0).toUpperCase() + tab.slice(1)}
                />
              ))}
            </Tabs>
          </Box>
        )}

        {state.loading && state.records.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
          </Box>
        )}

        {state.error && !state.loading && state.records.length === 0 && <EmptyState />}

        {!state.loading && !state.error && state.records.length === 0 && <EmptyState />}

        {state.records.length > 0 && (
          <AccountRecordsTable 
            records={state.records} 
            loading={state.loading}
            isLargeScreen={isLargeScreen}
            hasNextPage={state.pagination.hasNextPage}
            hasPrevPage={state.currentPage > 1}
            onPageChange={handlePageChange}
            currentPage={state.currentPage}
          />          
        )}

        <CreateAccountDialog
          open={state.isModalOpen}
          onClose={() => handleStateChange("isModalOpen", false)}
          onSuccess={() => {
            handleStateChange("isModalOpen", false);
            fetchRecords();
          }}
        />
      </Box>
    </DashboardManager>
  );
};

export default ViewFinAccount;