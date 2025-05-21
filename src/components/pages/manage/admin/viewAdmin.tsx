import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api"; // Import Axios instance
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
} from "@mui/material";

interface Admin {
  id: number;
  name: string;
  email: string;
  phone: string;
  isSuperAdmin: boolean;
}

const ViewAdmins: React.FC = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<Admin[]>([]); // State to store admins
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state

  // Fetch admins from the API
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await Api.get("/church/view-admins");
        setAdmins(response.data); // Update state with fetched data
      } catch (error: any) {
        console.error("Error fetching admins:", error.response?.data || error.message);
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchAdmins();
  }, []);

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, bgcolor: "#f5f5f5", minHeight: "100%" }}>
        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", lg: "center" },
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
              All Admins
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mt: 1,
                color: "#4b5563",
                fontSize: { xs: "1rem", sm: "1rem" },
              }}
            >
              View and manage all Admins.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate("/manage/admin")}
            sx={{
              bgcolor: "#1f2937",
              px: { xs: 2, sm: 2 },
              py: 1,
              borderRadius: 1,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: { xs: "1rem", sm: "1rem" },
            }}
          >
            Create Admin
          </Button>
        </Box>

        {/* Admins Table */}
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>            
              <div className="text-center text-white">
                <div className="flex justify-center mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#111827]"></div>
                </div>                
              </div>          
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              boxShadow: 2,
              borderRadius: 1,
              overflowX: "auto", // Enable horizontal scrolling on small screens
              bgcolor: "#f5f5f5",
            }}
          >
            <Table
              sx={{
                minWidth: { xs: "auto", sm: 650 }, // Remove minWidth constraint on mobile
                width: "100%",
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: { xs: "0.75rem", sm: "1rem" },
                      px: { xs: 2, sm: 4 },
                      py: 2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: { xs: "0.75rem", sm: "1rem" },
                      px: { xs: 2, sm: 4 },
                      py: 2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Email
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: { xs: "0.75rem", sm: "1rem" },
                      px: { xs: 2, sm: 4 },
                      py: 2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Phone
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: { xs: "0.75rem", sm: "1rem" },
                      px: { xs: 2, sm: 4 },
                      py: 2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Super Admin
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow
                    key={admin.id}
                    sx={{
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <TableCell
                      sx={{
                        fontSize: { xs: "0.75rem", sm: "1rem" },
                        px: { xs: 2, sm: 4 },
                        py: 2,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      {admin.name}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: { xs: "0.75rem", sm: "1rem" },
                        px: { xs: 2, sm: 4 },
                        py: 2,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      {admin.email}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: { xs: "0.75rem", sm: "1rem" },
                        px: { xs: 2, sm: 4 },
                        py: 2,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      {admin.phone}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: { xs: "0.75rem", sm: "1rem" },
                        px: { xs: 2, sm: 4 },
                        py: 2,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      {admin.isSuperAdmin ? "Yes" : "No"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </DashboardManager>
  );
};

export default ViewAdmins;