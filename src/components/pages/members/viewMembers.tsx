import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardManager from "../../shared/dashboardManager";
// import Api from "../../shared/api/api";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
} from "@mui/material";
import { 
  IoEllipsisVertical, 
  IoTrashOutline,
  IoEyeOutline,
  IoPersonAddOutline  
} from "react-icons/io5";
import { FiEdit } from "react-icons/fi";

interface Member {
  id: string;
  memberId: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  category: "first-timer" | "second-timer" | "member";
  dateOfBirth: string;
  address: string;
}

const staticMembers: Member[] = [
  {
    id: "1",
    memberId: "MEM001",
    firstname: "John",
    lastname: "Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    category: "member",
    dateOfBirth: "1990-05-15",
    address: "123 Main St, City"
  },
  {
    id: "2",
    memberId: "MEM002",
    firstname: "Jane",
    lastname: "Smith",
    email: "jane.smith@example.com",
    phone: "+1234567891",
    category: "first-timer",
    dateOfBirth: "1995-08-22",
    address: "456 Oak Ave, Town"
  },
  {
    id: "3",
    memberId: "MEM003",
    firstname: "Michael",
    lastname: "Brown",
    email: "michael.brown@example.com",
    phone: "+1234567892",
    category: "second-timer",
    dateOfBirth: "1988-03-10",
    address: "789 Pine Rd, Village"
  },
  {
    id: "4",
    memberId: "MEM004",
    firstname: "Emily",
    lastname: "Davis",
    email: "emily.davis@example.com",
    phone: "+1234567893",
    category: "member",
    dateOfBirth: "1992-11-30",
    address: "101 Maple Dr, County"
  }
];

const ViewMembers: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  useEffect(() => {
    // Use static data instead of API call
    setMembers(staticMembers);
    setLoading(false);
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, memberId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(memberId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handleEdit = () => {
    if (selectedMember) {
      navigate(`/members/edit/${selectedMember}`);
    }
    handleMenuClose();
  };

  const handleView = () => {
    if (selectedMember) {
      navigate(`/members/view/${selectedMember}`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedMember) return;
    
    try {
      // Comment out API call for static data
      // await Api.delete(`/members/${selectedMember}`);
      setMembers(members.filter(member => member.id !== selectedMember));
      toast.success("Member deleted successfully");
    } catch (error) {
      toast.error("Failed to delete member");
      console.error("Error deleting member:", error);
    } finally {
      handleMenuClose();
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "first-timer":
        return "warning";
      case "second-timer":
        return "primary";
      case "member":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row", md: 'row', sm: 'column' },
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
              All Members
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mt: 1,
                color: "#4b5563",
                fontSize: { xs: "1rem", sm: "1rem" },
              }}
            >
              View and manage all church members.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate("/members/member")}
            startIcon={<IoPersonAddOutline />}
            sx={{
              bgcolor: "#1f2937",              
              px: { xs: 2, sm: 2 },
              py: 1,
              borderRadius: 1,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: { xs: "1rem", sm: "1rem" },
              '&:hover': {
                bgcolor: "#111827"
              }
            }}
          >
            Add Member
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <div className="text-center text-white">
                <div className="flex justify-center mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#111827]"></div>
                </div>                
              </div> 
          </Box>
        ) : (
          <TableContainer            
            sx={{
              boxShadow: 1,
              borderRadius: 1,
              overflowX: "auto",              
            }}
          >
            <Table sx={{ minWidth: { xs: "auto", sm: 650 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", px: { xs: 2, sm: 4 }, py: 2 }}>
                    Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", px: { xs: 2, sm: 4 }, py: 2 }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", px: { xs: 2, sm: 4 }, py: 2 }}>
                    Phone No.
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", px: { xs: 2, sm: 4 }, py: 2 }}>
                    Category
                  </TableCell>                  
                </TableRow>
              </TableHead>
              <TableBody>
                {members.length > 0 ? (
                  members.map((member) => (
                    <TableRow key={member.id} hover>              
                      <TableCell sx={{ px: { xs: 2, sm: 4 }, py: 2 }}>
                        {member.firstname} {member.lastname}
                      </TableCell>
                      <TableCell sx={{ px: { xs: 2, sm: 4 }, py: 2 }}>                        
                          <Typography variant="body2">{member.email}</Typography>                                              
                      </TableCell>
                      <TableCell sx={{ px: { xs: 2, sm: 4 }, py: 2 }}>                                                  
                          <Typography variant="body2">{member.phone}</Typography>                        
                      </TableCell>
                      <TableCell
                        sx={{                        
                          px: { xs: 2, sm: 4 },
                          py: 2,
                          display: "flex",
                          flexDirection: {sm: "row" }, // Stack on small devices, row on larger devices
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: { xs: 1, sm: 1 }, // Add spacing between elements on small devices
                          
                        }}                       
                      >                       
                        
                        <Box
                          sx={{
                            display: "inline-block",
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            textTransform: "capitalize",
                          }}                      
                        >
                          <Chip                          
                            color={getCategoryColor(member.category)}
                            size="small"
                            sx={{ mr: 1 , borderRadius: 0, height: 17}}
                          />
                          {member.category}
                        </Box>

                        <IconButton
                          onClick={(e) => handleMenuOpen(e, member.id)}
                          aria-label="actions"
                        >
                          <IoEllipsisVertical size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1">No members found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={handleView}>
            <IoEyeOutline style={{ marginRight: 8 }} />
            View Details
          </MenuItem>
          <MenuItem onClick={handleEdit}>
            <FiEdit style={{ marginRight: 8 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleDelete}>
            <IoTrashOutline style={{ marginRight: 8 }} />
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </DashboardManager>
  );
};

export default ViewMembers;