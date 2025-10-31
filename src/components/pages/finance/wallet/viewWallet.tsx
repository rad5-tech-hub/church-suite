import React, { useState, useEffect, useCallback } from "react";
import DashboardManager from "../../../shared/dashboardManager";
import {
  Box,
  Button,
  CardContent,
  Card,
  Typography,
  useTheme,
  useMediaQuery,
  Grid,
  IconButton,
} from "@mui/material";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import { 
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
import CreateAndFundWallet from "./wallet";
import { CiWallet } from "react-icons/ci";

interface Wallet {
  id: string;
  userId: string | null;
  balance: string;
  branchWallet: { name: string } | null;
  deptWallet: { name: string } | null;
}

interface Pagination {
  hasNextPage: boolean;
  nextCursor: string | null;
  nextPage: string | null;
}

interface FetchWalletsResponse {
  success: boolean;
  pagination: Pagination;
  wallets: Wallet[];
}

interface CustomPaginationProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (direction: "next" | "prev") => void;
  currentPage: number;
  isLargeScreen: boolean;
  isLoading?: boolean;
}

interface State {
  collections: Wallet[];
  fillteredCollection: Wallet[];
  pagination: Pagination;
  currentPage: number;
  pageHistory: string[];
  loading: boolean;
  isModalOpen: boolean;
}

const initialState: State = {
  fillteredCollection: [],
  collections: [],
  pagination: {
    hasNextPage: false,
    nextCursor: null,
    nextPage: null,
  },
  currentPage: 1,
  pageHistory: [],
  loading: false,
  isModalOpen: false,
};

const CustomPagination: React.FC<CustomPaginationProps> = ({
  hasNextPage,
  hasPrevPage,
  onPageChange,
  currentPage,
  isLargeScreen,
  isLoading = false,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        py: 2,
        px: { xs: 2, sm: 3 },
        color: "#777280",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          sx={{
            fontSize: isLargeScreen ? "0.75rem" : "0.875rem",
            color: "#777280",
          }}
        >
          Page {currentPage}
        </Typography>
      </Box>
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
            "&:hover": {
              backgroundColor: "#F6F4FE",
              opacity: 0.9,
            },
            "&:disabled": {
              backgroundColor: "#4d4d4e8e",
              color: "#777280",
            },
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
            color: !hasPrevPage || isLoading ? "#777280" : "#160F38",
            "&:hover": {
              backgroundColor: "#F6F4FE",
              opacity: 0.9,
            },
            "&:disabled": {
              backgroundColor: "#4d4d4e8e",
              color: "#777280",
            },
          }}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </Box>
    </Box>
  );
};

const ViewCollections: React.FC = () => {
  usePageToast('view-branch');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  const [state, setState] = useState<State>(initialState);

  const handleStateChange = useCallback(
    <K extends keyof State>(key: K, value: State[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

const fetchCollections = useCallback(
  async (url: string | null = "/wallet/my-wallet") => {
    handleStateChange("loading", true);
    try {
      let response;
      
      if (url) {
        response = await Api.get<FetchWalletsResponse>(url);
      } else {
        response = await Api.get<FetchWalletsResponse>("/wallet/my-wallet");
      }
      
      const data = response.data;
      
      if (!data?.wallets) {
        throw new Error("Invalid response structure");
      }
      return data;
    } catch (error) {
      console.error("Failed to fetch wallets:", error);
      handleStateChange("loading", false);
      throw error;
    }
  },
  [handleStateChange]
);

  const refreshCollections = useCallback(async () => {
    try {
      const response = await fetchCollections();
      const data = response as unknown as FetchWalletsResponse;
      setState((prev) => ({
        ...prev,
        fillteredCollection: data.wallets || [],
        collections: data.wallets || [],     
        pagination: {
          hasNextPage: data.pagination?.hasNextPage || false,
          nextCursor: data.pagination?.nextCursor || null,
          nextPage: data.pagination?.nextPage || null,
        },
        currentPage: 1,
        pageHistory: [],
        loading: false,
      }));
    } catch (error) {
      handleStateChange("loading", false);
    }
  }, [fetchCollections, handleStateChange]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      handleStateChange("loading", true);
      try {
        const response = await fetchCollections();
        const data = response as unknown as FetchWalletsResponse;
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            collections: data.wallets || [],
            fillteredCollection: data.wallets || [],         
            pagination: {
              hasNextPage: data.pagination?.hasNextPage || false,
              nextCursor: data.pagination?.nextCursor || null,
              nextPage: data.pagination?.nextPage || null,
            },
            currentPage: 1,
            pageHistory: [],
            loading: false,
          }));
        }
      } catch (error) {
        if (isMounted) {
          handleStateChange("loading", false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [fetchCollections, handleStateChange]);

  const handlePageChange = useCallback(
    async (direction: "next" | "prev") => {
      handleStateChange("loading", true);
      try {
        if (direction === "next") {
          const url = state.pagination.nextPage;
          if (!url) throw new Error("No next page available");
          const response =  await fetchCollections(url);

          const data = response as FetchWalletsResponse;
          setState((prev) => ({
            ...prev,
            fillteredCollection: data.wallets || [],
            pagination: {
              hasNextPage: data.pagination?.hasNextPage || false,
              nextCursor: data.pagination?.nextCursor || null,
              nextPage: data.pagination?.nextPage || null,
            },
            pageHistory: [...prev.pageHistory, url],
            currentPage: prev.currentPage + 1,
            loading: false,
          }));
        } else if (direction === "prev") {
          if (state.pageHistory.length === 0) throw new Error("No previous page available");
          const prevIndex = state.pageHistory.length - 2;
          const url = prevIndex >= 0 ? state.pageHistory[prevIndex] : "/wallet/my-wallet";
          const response = await fetchCollections(url);

          const data = response as FetchWalletsResponse;
          setState((prev) => ({
            ...prev,
            fillteredCollection: data.wallets || [],
            pagination: {
              hasNextPage: data.pagination?.hasNextPage || false,
              nextCursor: data.pagination?.nextCursor || null,
              nextPage: data.pagination?.nextPage || null,
            },
            pageHistory: prev.pageHistory.slice(0, -1),
            currentPage: prev.currentPage - 1,
            loading: false,
          }));
        }
      } catch (error) {
        console.error(`Error fetching ${direction} page:`, error);
        handleStateChange("loading", false);
      }
    },
    [state.pagination.nextPage, state.pageHistory,  fetchCollections, handleStateChange]
  );

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
      <CiWallet style={{ fontSize: 60, color: "rgba(255, 255, 255, 0.1)", marginBottom: 16 }} />
      <Typography
        variant="h6"
        color="rgba(255, 255, 255, 0.1)"
        gutterBottom
        sx={{
          fontSize: isLargeScreen ? "1.25rem" : undefined,
        }}
      >
        No wallets found
      </Typography>
      <Button
        variant="contained"
        onClick={() => handleStateChange("isModalOpen", true)}
        sx={{
          backgroundColor: "#363740",
          px: { xs: 2, sm: 2 },
          mt: 2,
          fontSize: isLargeScreen ? "0.875rem" : undefined,
          color: "var(--color-text-on-primary)",
          "&:hover": {
            backgroundColor: "#363740",
            opacity: 0.9,
          },
        }}
        aria-label="Create new wallet"
      >
        Create & Fund Wallet
      </Button>
    </Box>
  );

  return (
    <DashboardManager> 
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography
              variant={isMobile ? "h5" : isLargeScreen ? "h5" : "h5"}
              component="h4"
              fontWeight={600}
              gutterBottom
              sx={{
                color: theme.palette.text.primary,
                fontSize: isLargeScreen ? "1.4rem" : undefined,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <span className="text-[#777280]">Finance</span>{" "}
              <LiaLongArrowAltRightSolid className="text-[#F6F4FE]" />{" "}
              <span className="text-[#F6F4FE]"> Wallets</span>
            </Typography>
          </Grid>
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-end", md: "flex-end" },
              alignItems: "center",
            }}
          >
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
                "&:hover": {
                  backgroundColor: "#363740",
                  opacity: 0.9,
                },
              }}
              aria-label="Create new wallet"
            >
              Create & Fund Wallet
            </Button>
          </Grid>
        </Grid>

        {state.loading && state.fillteredCollection.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
          </Box>
        )}

        {!state.loading && state.fillteredCollection.length === 0 && <EmptyState />}

        {state.fillteredCollection.length > 0 && (
          <>
            <Grid container spacing={2}>
              {state.fillteredCollection.map((collection) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={collection.id}>
                  <Card
                    sx={{
                      borderRadius: "10.267px",
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      boxShadow: "0 1.272px 15.267px 0 rgba(0, 0, 0, 0.05)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",                    
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ marginBottom: 3, display: "flex", justifyContent: "space-between" }}>
                        <Box>
                          <IconButton
                            sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              color: "#777280",
                              display: "flex",
                              flexDirection: "column",
                              padding: "15px",
                              borderRadius: 1,
                              textAlign: "center",
                            }}
                            aria-label={`Wallet icon for ${collection.branchWallet?.name || collection.deptWallet?.name || "Personal"}`}
                          >
                            <span className="border-2 rounded-md border-[#777280] p-1">
                              <CiWallet size={30} />
                            </span>
                          </IconButton>
                        </Box>
                      </Box>
                      <Box display="flex" flexDirection="column" justifyContent="space-between" alignItems="flex-start">
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          sx={{
                            color: "#E1E1E1",
                          }}                          
                        >
                          {collection.branchWallet?.name || collection.deptWallet?.name || "Personal"}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{                             
                            color:  "#777280",
                          }}
                        >
                          Balance: ₦{parseFloat(collection.balance).toLocaleString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <CustomPagination
              hasNextPage={state.pagination.hasNextPage}
              hasPrevPage={state.currentPage > 1}
              onPageChange={handlePageChange}
              currentPage={state.currentPage}
              isLargeScreen={isLargeScreen}
              isLoading={state.loading}
            />
          </>
        )}

        <CreateAndFundWallet 
          open={state.isModalOpen}
          onClose={() => handleStateChange("isModalOpen", false)}
          onSuccess={refreshCollections}
        />
      </Box>
    </DashboardManager>
  );
};

export default ViewCollections;