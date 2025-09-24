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
      status: string;
    }[];
  }[];
}

export interface WorkerAttendanceDialogueProps {
  eventId: string;
  open: boolean;
  onClose: () => void;
  assignedDepartments: Dept[];
}

const WorkerAttendanceDialogue: React.FC<WorkerAttendanceDialogueProps> = ({
  eventId,
  open,
  onClose,
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
          console.log('Attendance Stats Response:', response.data);
          setAttendanceStats(response.data);
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
    if (selectedDeptId && open) {
      handleFetchWorkers(selectedDeptId);
    }
  }, [selectedDeptId, open]);

  const handleFetchWorkers = async (deptId: string) => {
    try {
      setDepLoading(true);

      // Always put branchId first, then departmentId
      const params = new URLSearchParams();
      if (authData?.branchId) {
        params.append("branchId", authData.branchId);
      }
      params.append("departmentId", deptId);

      const res = await Api.get(`/member/members-event/${eventId}?${params.toString()}`);
      const fetchedWorkers: Worker[] = Array.isArray(res.data.data) ? res.data.data : [];
      console.log(`Workers for department ${deptId}:`, fetchedWorkers);

      setWorkers(fetchedWorkers);

      const newAttendance: Record<string, boolean> = {};
      const newStatus: Record<string, string> = {};

      fetchedWorkers.forEach((worker) => {
        const deptStats = attendanceStats?.departments?.find(
          (d) => d.departmentId === deptId
        );
        const member = deptStats?.members?.find((m) => m.memberId === worker.id);

        newAttendance[worker.id] = member
          ? ["present", "late"].includes(member.status)
          : false;
        newStatus[worker.id] = member ? member.status : "absent";
      });

      setAttendance(newAttendance);
      setAttendanceStatus(newStatus);

      // Update checkAll based on whether all workers are checked
      setCheckAll(fetchedWorkers.every((worker) => newAttendance[worker.id]));
    } catch (err) {
      console.error(`Error fetching workers for department ${deptId}:`, err);
      showPageToast("Fetching Workers failed", "error");
    } finally {
      setDepLoading(false);
    }
  };


  const handleToggle = (workerId: string) => {
    setAttendance((prev) => {
      const newAttendance = { ...prev, [workerId]: !prev[workerId] };
      // Update checkAll based on whether all workers are checked
      setCheckAll(Object.values(newAttendance).every((checked) => checked));
      return newAttendance;
    });
    setAttendanceStatus((prev) => ({
      ...prev,
      [workerId]: prev[workerId] === 'present' || prev[workerId] === 'late' ? 'absent' : 'present',
    }));
  };

  const handleCheckAll = () => {
    const newCheckAll = !checkAll;
    setCheckAll(newCheckAll);
    setAttendance(() => {
      const newAttendance: Record<string, boolean> = {};
      workers.forEach((worker) => {
        newAttendance[worker.id] = newCheckAll;
      });
      return newAttendance;
    });
    setAttendanceStatus(() => {
      const newStatus: Record<string, string> = {};
      workers.forEach((worker) => {
        newStatus[worker.id] = newCheckAll ? 'present' : 'absent';
      });
      return newStatus;
    });
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
          <Typography fontWeight="bold">Loading Worker Attendance...</Typography>
          <IconButton onClick={onClose} sx={{ color: '#F6F4FE' }} aria-label="Close dialog">
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
          minHeight: '400px', // Ensure dialog has enough height
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
      <DialogContent sx={{overflowY: 'auto' }}>
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
                    color: "#F6F4FE",
                    "&.Mui-focused": {
                      color: "#F6F4FE", // label stays visible
                    },
                  },
                }}
                sx={{
                  my:3,              
                  "& .MuiInputBase-root": { color: "#F6F4FE" },
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                  "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#F6F4FE",
                  },
                  '& .MuiInputLabel-root': { color: '#F6F4FE' },
                  "& .MuiAutocomplete-popupIndicator": { color: "#F6F4FE" }, // dropdown arrow
                  "& .MuiAutocomplete-clearIndicator": { color: "#F6F4FE" }, // ❌ clear/close icon
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
                      workers.map((worker) => (
                        <ListItem
                          key={worker.id}
                          sx={{ display: 'flex', borderBottom: '0.5px solid #777280' , color: '#F6F4FE', justifyContent: 'space-between' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CheckCircle
                              sx={{
                                color: attendance[worker.id] ? '#4CAF50' : '#777280',
                                mr: 1,
                                fontSize: '1.2rem',
                              }}
                            />
                            <ListItemText primary={worker.name} />
                          </Box>
                          <Checkbox
                            checked={attendance[worker.id] || false}
                            onChange={() => handleToggle(worker.id)}
                            sx={{
                              color: '#F6F4FE',
                              '&.Mui-checked': {
                                color: attendanceStatus[worker.id] === 'late' ? '#FFC107' : '#4CAF50',
                              },
                            }}
                          />
                        </ListItem>
                      ))
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