import React, { useState } from "react";
import { DateCalendar, PickersDay } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";
import IconButton from "@mui/material/IconButton";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

interface MultiDatePickerProps {
  value: string[];
  onChange: (dates: string[]) => void;
}

const MultiDatePicker: React.FC<MultiDatePickerProps> = ({ value, onChange }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleDateSelect = (date: Dayjs | null) => {
    if (!date) return;
    const iso = date.startOf("day").toISOString();
    const exists = value.includes(iso);
    if (exists) {
      onChange(value.filter((d) => d !== iso));
    } else {
      onChange([...value, iso]);
    }
  };

  const handleRemove = (iso: string) => {
    onChange(value.filter((d) => d !== iso));
  };

  return (
    <>
      {/* Input-like box */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          minHeight: 56,
          px: 1.5,
          borderRadius: "8px",
          border: "1px solid #F6F4FE",
          color: "#F6F4FE",
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", flex: 1, flexWrap: "wrap", gap: 1, cursor: "pointer" }}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          {value.length === 0 && (
            <span style={{ color: "#F6F4FE99" }}>Select dates...</span>
          )}
          {value.map((iso, idx) => (
            <Chip
              key={idx}
              label={dayjs(iso).format("MMM D, YYYY")}
              onDelete={() => handleRemove(iso)}
              sx={{
                bgcolor: "#4d4d4e8e",
                color: "#F6F4FE",
                "& .MuiChip-deleteIcon": { color: "#F6F4FE" },
              }}
            />
          ))}
        </Box>

        {/* Calendar icon button */}
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ color: "#F6F4FE" }}
        >
          <CalendarTodayIcon />
        </IconButton>
      </Box>

      {/* Calendar popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <DateCalendar
          value={null}
          onChange={handleDateSelect}
          slots={{
            day: (props) => {
              const isSelected = value.some((d) =>
                dayjs(d).isSame(props.day, "day")
              );
              return (
                <PickersDay
                  {...props}
                  sx={{
                    bgcolor: isSelected ? "#4B8DF8 !important" : undefined,
                    color: isSelected ? "#fff !important" : undefined,
                    borderRadius: "50%",
                  }}
                />
              );
            },
          }}
        />
      </Popover>
    </>
  );
};

export default MultiDatePicker;
