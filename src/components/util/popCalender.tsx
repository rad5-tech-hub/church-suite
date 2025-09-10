import React from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { Dayjs } from "dayjs";
import { ServiceFormData } from "../pages/attendance/programs/services";

interface CustomCalendarDialogProps {
  formData: ServiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  open: boolean;
  onClose: () => void;
}

const CustomCalendarDialog: React.FC<CustomCalendarDialogProps> = ({
  formData,
  setFormData,
  open,
  onClose,
}) => {
  const handleDateChange = (newDate: Dayjs | null) => {
    if (newDate) {
      const formattedDate = newDate.format("YYYY-MM-DD");
      setFormData((prev) => ({
        ...prev,
        customRecurrenceDates: prev.customRecurrenceDates?.some(
          (d) => d.date === formattedDate
        )
          ? prev.customRecurrenceDates
          : [
              ...(prev.customRecurrenceDates || []),
              { date: formattedDate, startTime: "", endTime: "" },
            ],
      }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Select Custom Dates</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <DateCalendar
            value={null}
            onChange={handleDateChange}
            sx={{ bgcolor: "#F6F4FE", borderRadius: "8px", p: 1 }}
            // disable already selected dates
            shouldDisableDate={(date) =>
              formData.customRecurrenceDates?.some(
                (d) => d.date === date.format("YYYY-MM-DD")
              ) || false
            }
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomCalendarDialog;
