import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Box,
  Autocomplete,
  TextField,
  Checkbox,
  FormControlLabel,
  DialogActions,
} from '@mui/material';
import { Close, CheckCircle } from '@mui/icons-material';
import Api from '../../../shared/api/api';
import { showPageToast } from '../../../util/pageToast';
import { RootState } from '../../../reduxstore/redux';
import { useSelector } from 'react-redux';

export interface Dept {
  id: string;
  name: string;
}

export interface Worker {
  id: string;
  name: string;
}

// Updated interface to match the actual API response structure
export interface WorkerAttendanceStats {
  eventOccurrenceId: string;
  eventId: string;
  overall: {
    totalMembers: number;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
  };
  departments: {
    departmentId: string;
    departmentName: string;
    totalMembers: number;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
    members: {
      memberId: string;
      memberName: string;
      status: string; // 'present', 'late', 'absent'
    }[];
  }[];
}

// Interface for the API response from /member/members-event/${eventId}
interface MembersResponse {
  message: string;
  members: { member: Worker }[];
}

export interface WorkerAttendanceDialogueProps {
  eventId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assignedDepartments: Dept[];
}

const WorkerAttendanceDialogue: React.FC<WorkerAttendanceDialogueProps> = ({
  eventId,
  open,
  onClose,
  onSuccess,
  assignedDepartments,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [deploading, setDepLoading] = useState<boolean>(false);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, string>>({});
  const [depsubmitting, setDepSubmitting] = useState<boolean>(false);
  const [attendanceStats, setAttendanceStats] = useState<WorkerAttendanceStats | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkAll, setCheckAll] = useState<boolean>(false);
  const authData = useSelector((state: RootState) => state?.auth?.authData);

  useEffect(() => {
    if (open && eventId) {
      // Reset state when dialog opens
      setWorkers([]);
      setAttendance({});
      setAttendanceStatus({});
      setCheckAll(false);
      setSelectedDeptId(null);

      // Set default department
      if (authData?.department && assignedDepartments.some((dept) => dept.id === authData.department)) {
        setSelectedDeptId(authData.department);
      } else if (assignedDepartments.length > 0) {
        setSelectedDeptId(assignedDepartments[0].id);
      }

      // Fetch attendance stats
      const fetchAttendanceStats = async () => {
        try {
          setLoading(true);
          setFetchError(null);

          const response = await Api.get<WorkerAttendanceStats>(`/church/worker-attendace-stats/${eventId}`);
          console.log('Attendance stats response:', response.data);
          setAttendanceStats(response.data || { eventOccurrenceId: '', eventId: '', overall: { totalMembers: 0, presentCount: 0, absentCount: 0, attendanceRate: 0 }, departments: [] });
        } catch (err: any) {
          const errorMessage = err.message || 'Error fetching attendance stats';
          console.error('Fetch error:', err);
          setFetchError(errorMessage);
          showPageToast(errorMessage, 'error');
        } finally {
          setLoading(false);
        }
      };

      fetchAttendanceStats();
    }
  }, [eventId, open, authData?.department, assignedDepartments]);

  useEffect(() => {
    if (selectedDeptId && open && attendanceStats) {
      handleFetchWorkers(selectedDeptId);
    }
  }, [selectedDeptId, open, attendanceStats]);

  const handleFetchWorkers = async (deptId: string) => {
    try {
      setDepLoading(true);

      // Always put branchId first, then departmentId
      const params = new URLSearchParams();
      if (authData?.branchId) {
        params.append("branchId", authData.branchId);
      }
      params.append("departmentId", deptId);

      const res = await Api.get<MembersResponse>(`/member/members-event/${eventId}?${params.toString()}`);
      const fetchedWorkers: Worker[] = Array.isArray(res.data.members)
        ? res.data.members.map((item) => item.member)
        : [];
      console.log(`Workers for department ${deptId}:`, fetchedWorkers);

      setWorkers(fetchedWorkers);

      // Get department stats for the selected department
      const deptStats = attendanceStats?.departments?.find((dept) => dept.departmentId === deptId);
      const newAttendance: Record<string, boolean> = {};
      const newStatus: Record<string, string> = {};

      fetchedWorkers.forEach((worker) => {
        // Find the member's status in the department stats
        const member = deptStats?.members?.find((m) => m.memberId === worker.id);
        
        // Set attendance to true if status is 'present' or 'late', false if 'absent'
        const isPresent = member ? ['present', 'late'].includes(member.status) : false;
        newAttendance[worker.id] = isPresent;
        newStatus[worker.id] = member ? member.status : 'absent';
      });

      setAttendance(newAttendance);
      setAttendanceStatus(newStatus);

      // Update checkAll based on whether all workers are present (checked)
      const allPresent = fetchedWorkers.length > 0 && fetchedWorkers.every((worker) => newAttendance[worker.id]);
      setCheckAll(allPresent);
      console.log(`Department ${deptId} attendance initialized:`, { allPresent, workerCount: fetchedWorkers.length });

    } catch (err) {
      console.error(`Error fetching workers for department ${deptId}:`, err);
      showPageToast('Fetching Workers failed', 'error');
      setWorkers([]);
      setAttendance({});
      setAttendanceStatus({});
      setCheckAll(false);
    } finally {
      setDepLoading(false);
    }
  };

  const handleToggle = (workerId: string) => {
    setAttendance((prev) => {
      const newAttendance = { ...prev, [workerId]: !prev[workerId] };
      // Update checkAll based on whether all workers are checked
      const allChecked = workers.length > 0 && Object.values(newAttendance).every((checked) => checked);
      setCheckAll(allChecked);
      return newAttendance;
    });
    
    // Update status: if was present/late and now unchecked -> absent, if was absent and now checked -> present
    setAttendanceStatus((prev) => {      
      const newStatus = !attendance[workerId] ? 'present' : 'absent';
      return { ...prev, [workerId]: newStatus };
    });
  };

  const handleCheckAll = () => {
    const newCheckAll = !checkAll;
    setCheckAll(newCheckAll);
    
    const newAttendance: Record<string, boolean> = {};
    const newStatus: Record<string, string> = {};
    
    workers.forEach((worker) => {
      newAttendance[worker.id] = newCheckAll;
      newStatus[worker.id] = newCheckAll ? 'present' : 'absent';
    });
    
    setAttendance(newAttendance);
    setAttendanceStatus(newStatus);
  };

  const handleSubmit = async () => {
    if (!selectedDeptId) return;

    const payload = Object.entries(attendance).map(([workerId, present]) => ({
      workerId,
      status: present ? 'present' : 'absent',
    }));

    try {
      setDepSubmitting(true);
      await Api.post(
        `/church/worker-attendance/occurance/${eventId}/department/${selectedDeptId}`,
        payload
      );
      showPageToast(
        `Attendance for ${
          assignedDepartments.find((d) => d.id === selectedDeptId)?.name
        } submitted successfully!`,
        'success'
      );     
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Error submitting attendance';
      showPageToast(errorMessage, 'error');
    } finally {
      setDepSubmitting(false);
    }
  };

  const filteredDepartments =
    authData?.role === 'department' && authData?.department
      ? assignedDepartments.filter((dept) => dept.id === authData.department)
      : assignedDepartments;

  if (loading) {
    return (
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (reason !== "backdropClick") {
          onClose();
          onSuccess();
          }
        }}
        fullWidth
        maxWidth="md"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            bgcolor: '#2C2C2C',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#F6F4FE',
          }}
        >
          <Typography fontWeight="bold">Loading Worker Attendance...</Typography>
          <IconButton onClick={()=>{onClose(), onSuccess()}} sx={{ color: '#F6F4FE' }} aria-label="Close dialog">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 3,
            mt: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
          }}
        >
          <CircularProgress sx={{ color: '#777280' }} />
        </DialogContent>
      </Dialog>
    );
  }

  if (fetchError) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            bgcolor: '#2C2C2C',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#F6F4FE',
          }}
        >
          <Typography variant="h5" component="h2" fontWeight="bold">
            Error
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#F6F4FE' }} aria-label="Close dialog">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Typography variant="body1" sx={{ color: '#F6F4FE', textAlign: 'center' }}>
            {fetchError}
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (filteredDepartments.length === 0) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            bgcolor: '#2C2C2C',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#F6F4FE',
          }}
        >
          <Typography variant="h5" component="h2" fontWeight="bold">
            Worker Attendance
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#F6F4FE' }} aria-label="Close dialog">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Typography variant="body1" sx={{ color: '#F6F4FE', textAlign: 'center' }}>
            No assigned department found for your role.
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          bgcolor: '#2C2C2C',
          minHeight: '400px',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#F6F4FE',
        }}
      >
        <Typography variant="h5" component="h2" fontWeight="bold">
          Worker Attendance
        </Typography>
        <IconButton onClick={onClose} sx={{ color: '#F6F4FE' }} aria-label="Close dialog">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ overflowY: 'auto' }}>
        <Box>
          <Autocomplete
            options={filteredDepartments}
            getOptionLabel={(option) => option.name}
            value={filteredDepartments.find((d) => d.id === selectedDeptId) || null}
            onChange={(_, newValue) => setSelectedDeptId(newValue ? newValue.id : null)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Department"
                variant="outlined"
                InputLabelProps={{
                  sx: {
                    color: '#F6F4FE',
                    '&.Mui-focused': {
                      color: '#F6F4FE',
                    },
                  },
                }}
                sx={{
                  my: 3,
                  '& .MuiInputBase-root': { color: '#F6F4FE' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#777280' },
                  '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#F6F4FE',
                  },
                  '& .MuiInputLabel-root': { color: '#F6F4FE' },
                  '& .MuiAutocomplete-popupIndicator': { color: '#F6F4FE' },
                  '& .MuiAutocomplete-clearIndicator': { color: '#F6F4FE' },
                }}
              />
            )}
          />

          {selectedDeptId && (
            <>
              {deploading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                  <CircularProgress size={24} sx={{ color: '#777280' }} />
                  <Typography color="#F6F4FE">Loading workers...</Typography>
                </Box>
              ) : (
                <>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkAll}
                        onChange={handleCheckAll}
                        sx={{
                          color: '#F6F4FE',
                          '&.Mui-checked': { color: '#4CAF50' },
                        }}
                      />
                    }
                    label="Check All"
                    sx={{ color: '#F6F4FE', mt: 2, display: 'block', textAlign: 'right' }}
                  />
                  <List dense sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {workers.length > 0 ? (
                      workers.map((worker) => {
                        const currentStatus = attendanceStatus[worker.id] || 'absent';
                        const isChecked = attendance[worker.id] || false;
                        
                        return (
                          <ListItem
                            key={worker.id}
                            sx={{ 
                              display: 'flex', 
                              borderBottom: '0.5px solid #777280', 
                              color: '#F6F4FE', 
                              justifyContent: 'space-between',
                              bgcolor: currentStatus === 'present' ? 'rgba(76, 175, 80, 0.1)' : 
                                     currentStatus === 'late' ? 'rgba(255, 193, 7, 0.1)' : 'transparent'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CheckCircle
                                sx={{
                                  color: isChecked ? 
                                    (currentStatus === 'late' ? '#FFC107' : '#4CAF50') : 
                                    '#777280',
                                  mr: 1,
                                  fontSize: '1.2rem',
                                }}
                              />
                              <ListItemText 
                                primary={worker.name}
                                secondary={currentStatus}
                                sx={{ 
                                  '& .MuiListItemText-secondary': {
                                    color: currentStatus === 'present' ? '#4CAF50' :
                                           currentStatus === 'late' ? '#FFC107' : '#777280'
                                  }
                                }}
                              />
                            </Box>
                            <Checkbox
                              checked={isChecked}
                              onChange={() => handleToggle(worker.id)}
                              sx={{
                                color: '#F6F4FE',
                                '&.Mui-checked': {
                                  color: currentStatus === 'late' ? '#FFC107' : '#4CAF50',
                                },
                              }}
                            />
                          </ListItem>
                        );
                      })
                    ) : (
                      <Typography variant="body2" color="#F6F4FE" sx={{ textAlign: 'center' }}>
                        No workers found
                      </Typography>
                    )}
                  </List>
                </>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          bgcolor: '#2C2C2C',
          justifyContent: 'end',
        }}
      >
        <Button
          variant="contained"
          size="large"
          disabled={depsubmitting || !selectedDeptId || deploading}
          onClick={handleSubmit}
          sx={{
            backgroundColor: '#F6F4FE',
            color: '#2C2C2C',
            borderRadius: 50,
            px: 4,
            fontWeight: 'semibold',
            textTransform: 'none',
            '&:hover': { backgroundColor: '#F6F4FE', opacity: 0.9 },
            minWidth: '200px',
          }}
        >
          {depsubmitting ? (
            <>
              <CircularProgress size={18} sx={{ color: '#2C2C2C', mr: 1 }} />
              Submitting...
            </>
          ) : (
            'Save Attendance'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkerAttendanceDialogue;