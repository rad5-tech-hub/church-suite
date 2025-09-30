import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Autocomplete,
  TextField,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import Api from '../../../shared/api/api';
import { showPageToast } from '../../../util/pageToast';
import { RootState } from '../../../reduxstore/redux';
import { useSelector } from 'react-redux';

interface Branch {
  id: string;
  name: string;
}

interface UploadNewcomersDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId?: string;
}

const UploadNewcomersDialog: React.FC<UploadNewcomersDialogProps> = ({
  open,
  onClose,
  onSuccess,
  eventId,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [uploadBranchId, setUploadBranchId] = useState<string | null>(null);
  const [isBranchLoading, setIsBranchLoading] = useState<boolean>(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authData = useSelector((state: RootState) => state?.auth?.authData);

  const fetchBranches = async () => {
    setIsBranchLoading(true);
    setBranchError(null); // Clear any existing error before fetching
    try {
      const response = await Api.get(`/church/get-branches`);
      setBranches(response.data.branches);
      setBranchError(null); // Ensure error is cleared on successful fetch
      // Set default branch to authData.branchId if available
      if (authData?.branchId) {
        const defaultBranch = response.data.branches.find((b: Branch) => b.id === authData.branchId);
        if (defaultBranch) {
          setUploadBranchId(defaultBranch.id);
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranchError('Failed to fetch branches. Please try again.');
    } finally {
      setIsBranchLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBranches();
    }
  }, [open]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (
      file &&
      (file.type === 'application/vnd.ms-excel' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    ) {
      setSelectedFile(file);
    } else {
      showPageToast('Please select a valid Excel file (.xlsx or .xls)', 'error');
      setSelectedFile(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (
      file &&
      (file.type === 'application/vnd.ms-excel' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    ) {
      setSelectedFile(file);
    } else {
      showPageToast('Please drop a valid Excel file (.xlsx or .xls)', 'error');
      setSelectedFile(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!selectedFile || !eventId) {
      showPageToast('Please select an Excel file to upload', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      if (eventId) {
        uploadFormData.append('eventOccurrenceId', eventId || '');
      }
      const branchId = uploadBranchId || authData?.branchId;
      const branchIdParam = branchId ? `&branchId=${branchId}` : '';

      await Api.post(
        `/member/import-followup?churchId=${authData?.churchId}${branchIdParam}`,
        uploadFormData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      showPageToast('Excel file uploaded successfully!', 'success');
      setSelectedFile(null);
      setUploadBranchId(authData?.branchId || null); // Reset to default branch
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to upload Excel file. Please try again.';
      showPageToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setIsDragging(false);
    setUploadBranchId(authData?.branchId || null); // Reset to default branch
    setBranchError(null); // Clear error on close
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: '#2C2C2C',
          color: '#F6F4FE',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3>Import Newcomers Data</h3>
        <IconButton onClick={handleClose} disabled={isLoading} sx={{ color: '#F6F4FE' }}>
          <Close sx={{ mr: 1 }} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ my: 3 }}>
          <Autocomplete
            options={branches}
            getOptionLabel={(option) => option.name}
            value={branches.find((b) => b.id === uploadBranchId) || null}
            onChange={(_, newValue) => setUploadBranchId(newValue && newValue.id ? newValue.id : null)}
            onOpen={fetchBranches}
            clearIcon={
              uploadBranchId ? (
                <Close
                  sx={{ color: '#F6F4FE', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadBranchId(authData?.branchId || null); // Reset to default branch
                  }}
                />
              ) : null
            }
            loading={isBranchLoading}
            loadingText="Loading branches..."
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Branch (optional)"
                variant="outlined"
                error={!!branchError} // Highlight input as error when branchError exists
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isBranchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={{
                  '& .MuiInputBase-root': { color: '#F6F4FE' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#777280' },
                  '& .MuiInputLabel-root': { color: '#F6F4FE' },
                  "& .MuiAutocomplete-popupIndicator": { color: "#F6F4FE" } ,
                  '& .Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: '#F44336' }, // Red border for error
                }}
              />
            )}
          />
          {branchError && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {branchError}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            border: `2px dashed ${isDragging ? '#F6F4FE' : '#777280'}`,
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            bgcolor: isDragging ? 'rgba(246, 244, 254, 0.1)' : 'transparent',
            transition: 'all 0.2s',
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Typography variant="body1" color="#F6F4FE" gutterBottom>
            Drag and drop your Excel file here or
          </Typography>
          <Button
            variant="contained"
            component="label"
            sx={{
              mt: 2,
              backgroundColor: '#F6F4FE',
              color: '#2C2C2C',
              '&:hover': { backgroundColor: '#F6F4FE', opacity: 0.9 },
            }}
          >
            Select File
            <input
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </Button>
          {selectedFile && (
            <Typography variant="body2" sx={{ mt: 2, color: '#F6F4FE' }}>
              Selected file: {selectedFile.name}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={isLoading || !selectedFile}
          sx={{
            backgroundColor: '#777280',
            color: '#F6F4FE',
            '&:hover': { backgroundColor: '#777280', opacity: 0.9 },
          }}
        >
          {isLoading ? (
            <>
              <CircularProgress size={18} sx={{ color: 'white', mr: 1 }} />
              Uploading...
            </>
          ) : (
            'Upload'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadNewcomersDialog;