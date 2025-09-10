import React from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { DateCalendar, PickersDay, PickersDayProps } from "@mui/x-date-pickers";
import { Dayjs } from "dayjs";
import CheckIcon from "@mui/icons-material/Check";
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
  const selectedDates =
    formData.customRecurrenceDates?.map((d) => d.date) || [];

  const handleDateChange = (newDate: Dayjs | null) => {
    if (!newDate) return;
    const formattedDate = newDate.format("YYYY-MM-DD");

    setFormData((prev) => {
      const exists = prev.customRecurrenceDates?.some(
        (d) => d.date === formattedDate
      );
      return {
        ...prev,
        customRecurrenceDates: exists
          ? prev.customRecurrenceDates?.filter((d) => d.date !== formattedDate)
          : [
              ...(prev.customRecurrenceDates || []),
              { date: formattedDate, startTime: "", endTime: "" },
            ],
      };
    });
  };

  // ✅ Custom Day Renderer with check icon
  const CustomDay = (props: PickersDayProps): React.ReactElement => {
    const { day, outsideCurrentMonth, ...other } = props;
    const formatted = day.format("YYYY-MM-DD");
    const isSelected = selectedDates.includes(formatted);

    return (
      <PickersDay
        {...other}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        sx={{
          position: "relative",
          bgcolor: isSelected ? "#4B8DF8 !important" : "transparent",
          color: isSelected ? "#fff" : "#000",
          borderRadius: "50%",
          "&:hover": {
            bgcolor: isSelected ? "#4B8DF8" : "#e0e0e0",
          },
        }}
      >
        {isSelected ? <CheckIcon sx={{ fontSize: 16 }} /> : day.date()}
      </PickersDay>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 2,
          bgcolor: "#F6F4FE",
          color: "#2C2C2C",
        },
      }}
    >
      <DialogTitle>Select Custom Dates</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center"}}>
          <DateCalendar
            value={null}
            onChange={handleDateChange}
            slots={{ day: CustomDay }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ textTransform: "none", bgcolor: "#2C2C2C" }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomCalendarDialog;
