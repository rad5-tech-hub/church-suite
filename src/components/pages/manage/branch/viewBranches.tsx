import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardManager from "../../../shared/dashboardManager";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  Snackbar
} from "@mui/material";
import Api from "../../../shared/api/api";

interface Branch {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isHeadQuarter: boolean;
}

const ViewBranches: React.FC = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        const response = await Api.get(`/church/get-branches`);
        setBranches(response.data.branches);
      } catch (err) {
        console.error("Failed to fetch branches:", err);
        setError("Failed to load branches. Please try again later.");
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 2 }, bgcolor: "#f5f5f5", minHeight: "100%" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            mb: { xs: 4, sm: 6 },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                color: "#1f2937",
                fontSize: { xs: "1.8rem", sm: "2rem" },
              }}
            >
              All Branches
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mt: 1,
                color: "#4b5563",
                fontSize: { xs: "1rem", sm: "1rem" },
              }}
            >
              View and manage all branches
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate("/manage/branch")}
            sx={{
              bgcolor: "#1f2937",              
              px: { xs: 2, sm: 2 },
              py: 1,
              borderRadius: 1,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: { xs: "1rem", sm: "1rem" },
              "&:hover": {
                bgcolor: "#374151",
              }
            }}
          >
            Create Branch
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>            
              <div className="text-center text-white">
                <div className="flex justify-center mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#111827]"></div>
                </div>                
              </div>          
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              boxShadow: 2,
              borderRadius: 1,
              overflowX: "auto",
              bgcolor: "background.paper",
            }}
          >
            <Table sx={{ minWidth: { xs: "auto", sm: 650 } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f3f4f6" }}>
                  <TableCell sx={{ fontWeight: "bold", fontSize: { xs: "0.75rem", sm: "1rem" }, px: { xs: 2, sm: 4 }, py: 2 }}>
                    Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: { xs: "0.75rem", sm: "1rem" }, px: { xs: 2, sm: 4 }, py: 2 }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: { xs: "0.75rem", sm: "1rem" }, px: { xs: 2, sm: 4 }, py: 2 }}>
                    Phone
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: { xs: "0.75rem", sm: "1rem" }, px: { xs: 2, sm: 4 }, py: 2 }}>
                    Address
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {branches.length > 0 ? (
                  branches.map((branch) => (
                    <TableRow
                      key={branch.id}
                      hover
                      sx={{
                        borderBottom: "1px solid #e5e7eb",
                        bgcolor: "#f3f4f6" 
                      }}
                    >
                      <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "1rem" }, px: { xs: 2, sm: 4 }, py: 2 }}>
                        {branch.name}
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "1rem" }, px: { xs: 2, sm: 4 }, py: 2 }}>
                        {branch.email || "-"}
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "1rem" }, px: { xs: 2, sm: 4 }, py: 2 }}>
                        {branch.phone || "-"}
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "1rem" }, px: { xs: 2, sm: 4 }, py: 2 }}>
                        {branch.address || "-"}
                      </TableCell>                     
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: "center", py: 4 }}>
                      No branches found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </DashboardManager>
  );
};

export default ViewBranches;