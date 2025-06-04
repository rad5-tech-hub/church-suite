import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardManager from "../../shared/dashboardManager";
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
  Modal,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  FormControlLabel,
  Checkbox,
  TextField,
} from "@mui/material";
import { 
  IoEllipsisVertical, 
  IoTrashOutline,
  IoEyeOutline,
  IoPersonAddOutline,
  IoCloseOutline 
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

interface Branch {
  id: string;
  name: string;
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

const staticBranches: Branch[] = [
  { id: "1", name: "Main Branch" },
  { id: "2", name: "North Branch" },
  { id: "3", name: "South Branch" },
  { id: "4", name: "East Branch" },
];

const ViewMembers: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);

  useEffect(() => {
    // Use static data instead of API call
    setMembers(staticMembers);
    setBranches(staticBranches);
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

  const handleEditClick = () => {
    if (selectedMember) {
      const memberToEdit = members.find(member => member.id === selectedMember);
      if (memberToEdit) {
        setCurrentMember(memberToEdit);
        setEditModalOpen(true);
      }
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
      setMembers(members.filter(member => member.id !== selectedMember));
      toast.success("Member deleted successfully");
    } catch (error) {
      toast.error("Failed to delete member");
      console.error("Error deleting member:", error);
    } finally {
      handleMenuClose();
    }
  };

  const handleEditSubmit = () => {
    // Here you would typically make an API call to update the member
    toast.success("Member updated successfully");
    setEditModalOpen(false);
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
        {/* ... (previous JSX remains the same until the Modal section) ... */}

        {/* Edit Member Modal */}
        <Modal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          aria-labelledby="edit-member-modal"
          aria-describedby="modal-to-edit-member-details"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: '80%', md: '60%' },
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 1,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              <Typography variant="h6" component="h2">
                Edit Member Details
              </Typography>
              <IconButton onClick={() => setEditModalOpen(false)}>
                <IoCloseOutline />
              </IconButton>
            </Box>

            {currentMember && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Editing: {currentMember.firstname} {currentMember.lastname} ({currentMember.phone})
                </Typography>

                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel id="branch-select-label">Branch</InputLabel>
                    <Select
                      labelId="branch-select-label"
                      id="branch-select"
                      value={selectedBranch}
                      label="Branch"
                      onChange={(e) => setSelectedBranch(e.target.value)}
                    >
                      {branches.map((branch) => (
                        <SelectMenuItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectMenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isSuperAdmin}
                        onChange={(e) => setIsSuperAdmin(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Is Super Admin"
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setEditModalOpen(false)}
                      sx={{ textTransform: 'none' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleEditSubmit}
                      sx={{ textTransform: 'none', bgcolor: '#1f2937' }}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </Modal>

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
          <MenuItem onClick={handleEditClick}>
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