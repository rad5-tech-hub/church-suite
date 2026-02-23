import React, { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setAuthData, setUserRoles, RolePermission } from "../../reduxstore/authstore";
import DashboardManager from "../../shared/dashboardManager";
import { RootState } from "../../reduxstore/redux";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  IconButton,
  Popover,
  CircularProgress,
  Tab,
  Tabs,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  CalendarToday as CalendarIcon,
  EventNote as ProgramIcon,
  People,
  DateRange as DateRangeIcon,
  Close as CloseIcon,
  PeopleAlt,
  CurrencyExchange,
  HowToReg,
} from "@mui/icons-material";
import { LocalizationProvider, DateCalendar } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import moment from "moment";
import Api from "../../shared/api/api";
import { TbArrowFork, TbArrowBearRight2 } from "react-icons/tb";
import { MdOutlineHub } from "react-icons/md";
import { FaPeopleCarry } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import { CiMoneyBill } from "react-icons/ci";
import { IoCalendarOutline, IoPersonAddOutline } from "react-icons/io5";

// === Types ===
interface ApiResponse {
  followUps?: {
    weekly: { thisWeek: number; lastWeek: number; change: number };
    monthly: { thisMonth: number; lastMonth: number; change: number };
  };
  collections?: {
    weekly: number;
    lastWeek: number;
    weeklyChange: number;
    monthly: number;
    lastMonth: number;
    monthlyChange: number;
  };
  structure: {
    totalBranches?: number;
    totalDepartments: number;
    totalUnits: number;
    totalWorkers: number;
  };
  upcomingPrograms: Array<{
    date: string;
    startTime: string;
    endTime: string;
    event: { id: string; title: string; branchId: string };
  }>;
  scope: string;
}

interface DashboardData {
  followUps?: ApiResponse["followUps"];
  collections: {
    weekly: { thisWeek: number; lastWeek: number; change: number };
    monthly: { thisMonth: number; lastMonth: number; change: number };
  };
  structure: ApiResponse["structure"];
  upcomingPrograms: ApiResponse["upcomingPrograms"];
  scope: string;
}

interface MetricSummaryData {
  totalValue: number;
  averagePerDay: number;
  daysWithData: number;
}

interface MetricEntry {
  metricType: string;
  data: Array<{ date: string; value: number }>;
  summary: MetricSummaryData;
}

interface BranchMetrics {
  followUp: MetricEntry;
  attendance: MetricEntry;
  collection: MetricEntry;
}

interface Department {
  id: string;
  name: string;
  isActive: boolean;
  isDeleted?: boolean;
}

// ─── Tab config ───────────────────────────────────────────────────────────────
const CHART_TABS = [
  {
    key: "followUp" as keyof BranchMetrics,
    label: "Newcomers",
    color: "#00BCD4",
    icon: <PeopleAlt sx={{ fontSize: 16 }} />,
    isFinance: false,
  },
  {
    key: "attendance" as keyof BranchMetrics,
    label: "Attendance",
    color: "#4CAF50",
    icon: <HowToReg sx={{ fontSize: 16 }} />,
    isFinance: false,
  },
  {
    key: "collection" as keyof BranchMetrics,
    label: "Finance",
    color: "#795548",
    icon: <CurrencyExchange sx={{ fontSize: 16 }} />,
    isFinance: true,
  },
];

// ─── DateRangePicker ──────────────────────────────────────────────────────────
interface DateRangePickerProps {
  label: string;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  onStartChange: (date: Dayjs | null) => void;
  onEndChange: (date: Dayjs | null) => void;
  onApply: () => void;
  onClear: () => void;
  loading?: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  label, startDate, endDate,
  onStartChange, onEndChange, onApply, onClear, loading,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [step, setStep] = useState<"start" | "end">("start");
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => { setAnchorEl(e.currentTarget); setStep("start"); };
  const handleClose = () => { setAnchorEl(null); setStep("start"); };
  const handleStartSelect = (date: Dayjs | null) => { onStartChange(date); setStep("end"); };
  const handleEndSelect = (date: Dayjs | null) => {
    if (startDate && date && date.isBefore(startDate)) onEndChange(startDate);
    else onEndChange(date);
  };
  const handleApply = () => { onApply(); handleClose(); };
  const handleClear = () => { onClear(); handleClose(); };

  const hasRange = startDate && endDate;
  const displayLabel = hasRange
    ? `${startDate.format("MMM D")} – ${endDate.format("MMM D, YYYY")}`
    : label;

  return (
    <>
      <Button
        size="small"
        onClick={handleOpen}
        startIcon={
          loading
            ? <CircularProgress size={12} sx={{ color: "inherit" }} />
            : <DateRangeIcon sx={{ fontSize: 14 }} />
        }
        endIcon={
          hasRange
            ? <CloseIcon sx={{ fontSize: 12 }} onClick={(e) => { e.stopPropagation(); handleClear(); }} />
            : undefined
        }
        sx={{
          fontSize: "0.7rem", py: 0.5, px: 1.5, borderRadius: "20px", textTransform: "none",
          color: hasRange ? "var(--color-primary)" : "var(--color-text-muted)",
          backgroundColor: hasRange ? "var(--color-text-primary)" : "transparent",
          border: "1px solid",
          borderColor: hasRange ? "var(--color-text-primary)" : "var(--color-border-glass)",
          whiteSpace: "nowrap", minWidth: 0,
          "&:hover": { backgroundColor: hasRange ? "var(--color-text-primary)" : "var(--color-surface-glass)", opacity: 0.9 },
        }}
      >
        {displayLabel}
      </Button>

      <Popover
        open={open} anchorEl={anchorEl} onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            bgcolor: "var(--color-primary)", border: "1px solid var(--color-border-glass)",
            borderRadius: "16px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", overflow: "hidden", mt: 1,
          },
        }}
      >
        <Box sx={{ p: 2, minWidth: 320 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography variant="body2" sx={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
              {label}
            </Typography>
            <IconButton size="small" onClick={handleClose} sx={{ color: "var(--color-text-muted)" }}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          {/* Step pills */}
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            {(["start", "end"] as const).map((s) => (
              <Box
                key={s} onClick={() => setStep(s)}
                sx={{
                  flex: 1, py: 1, px: 1.5, borderRadius: "10px", border: "1px solid",
                  borderColor: step === s ? "var(--color-text-primary)" : "var(--color-border-glass)",
                  cursor: "pointer",
                  bgcolor: step === s ? "var(--color-surface-glass)" : "transparent",
                  transition: "all 0.2s",
                }}
              >
                <Typography variant="caption" sx={{ color: "var(--color-text-muted)", display: "block" }}>
                  {s === "start" ? "Start Date" : "End Date"}
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--color-text-primary)", fontWeight: 500, fontSize: "0.75rem" }}>
                  {s === "start"
                    ? (startDate ? startDate.format("MMM D, YYYY") : "Select start")
                    : (endDate ? endDate.format("MMM D, YYYY") : "Select end")}
                </Typography>
              </Box>
            ))}
          </Box>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={step === "start" ? startDate : endDate}
              onChange={step === "start" ? handleStartSelect : handleEndSelect}
              minDate={step === "end" && startDate ? startDate : undefined}
              sx={{
                width: "100%",
                "& .MuiPickersCalendarHeader-root": { color: "var(--color-text-primary)" },
                "& .MuiDayCalendar-weekDayLabel": { color: "var(--color-text-muted)" },
                "& .MuiPickersDay-root": {
                  color: "var(--color-text-primary)",
                  "&:hover": { bgcolor: "var(--color-surface-glass)" },
                  "&.Mui-selected": { bgcolor: "var(--color-text-primary) !important", color: "var(--color-primary) !important" },
                },
                "& .MuiPickersArrowSwitcher-button": { color: "var(--color-text-primary)" },
                "& .MuiPickersCalendarHeader-switchViewButton": { color: "var(--color-text-primary)" },
              }}
            />
          </LocalizationProvider>

          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Button fullWidth size="small" onClick={handleClear}
              sx={{ borderRadius: "10px", textTransform: "none", color: "var(--color-text-muted)", border: "1px solid var(--color-border-glass)", "&:hover": { bgcolor: "var(--color-surface-glass)" } }}>
              Clear
            </Button>
            <Button fullWidth size="small" variant="contained" onClick={handleApply} disabled={!startDate || !endDate}
              sx={{ borderRadius: "10px", textTransform: "none", bgcolor: "var(--color-text-primary)", color: "var(--color-primary)", "&:hover": { bgcolor: "var(--color-text-primary)", opacity: 0.9 }, "&:disabled": { opacity: 0.4 } }}>
              Apply
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

// ─── MetricStatCard ───────────────────────────────────────────────────────────
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  metricType: "followUp" | "collection";
  branchId: string | undefined;
}

const MetricStatCard: React.FC<MetricCardProps> = ({
  title, value: defaultValue, change: defaultChange,
  icon, color, metricType, branchId,
}) => {
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [metricData, setMetricData] = useState<MetricSummaryData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMetric = useCallback(async (start?: Dayjs, end?: Dayjs) => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ branchId, metricType });
      if (start) params.append("startDate", start.format("YYYY-MM-DD"));
      if (end) params.append("endDate", end.format("YYYY-MM-DD"));
      const res = await Api.get(`/growth/event-metrics?${params.toString()}`);
      setMetricData(res.data?.data?.summary || null);
    } catch (err) {
      console.error(`Failed to fetch ${metricType} metrics:`, err);
      setMetricData(null);
    } finally {
      setLoading(false);
    }
  }, [branchId, metricType]);

  // Load default on mount (no dates)
  useEffect(() => { fetchMetric(); }, [fetchMetric]);

  const handleApply = () => { if (startDate && endDate) fetchMetric(startDate, endDate); };
  const handleClear = () => { setStartDate(null); setEndDate(null); fetchMetric(); };

  const displayValue = metricData !== null
    ? (metricType === "collection" ? `₦${metricData.totalValue.toLocaleString()}` : metricData.totalValue)
    : defaultValue;

  const isPositive = (defaultChange ?? 0) >= 0;

  return (
    <Card
      sx={{
        background: "var(--color-surface-glass)", backdropFilter: "blur(10px)",
        border: "1px solid var(--color-border-glass)", borderRadius: "16px",
        p: 3, height: "100%", transition: "all 0.3s ease",
        "&:hover": { transform: "translateY(-4px)", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.08)" },
      }}
    >
      <CardContent sx={{ pb: "0 !important" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
          <Box
            sx={{
              width: 48, height: 48, borderRadius: "12px",
              background: `linear-gradient(135deg, ${color}88 0%, ${color}44 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--color-text-on-primary)", flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <DateRangePicker
            label="Date Range"
            startDate={startDate} endDate={endDate}
            onStartChange={setStartDate} onEndChange={setEndDate}
            onApply={handleApply} onClear={handleClear} loading={loading}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          {loading
            ? <CircularProgress size={20} sx={{ color: "var(--color-text-muted)" }} />
            : <Typography variant="h6" sx={{ color: "var(--color-text-primary)", fontWeight: "bold" }}>{displayValue}</Typography>
          }
          {!metricData && defaultChange !== undefined && !loading && (
            <Chip
              icon={isPositive ? <TrendingUp /> : <TrendingDown />}
              label={`${Math.abs(defaultChange)}%`}
              size="small" color={isPositive ? "success" : "error"} sx={{ fontWeight: "bold" }}
            />
          )}
          {metricData && !loading && (
            <Chip
              label={`${metricData.daysWithData}d`} size="small"
              sx={{ bgcolor: `${color}22`, color, fontWeight: "bold", fontSize: "0.65rem" }}
            />
          )}
        </Box>

        <Typography variant="body2" sx={{ color: "var(--color-text-muted)" }}>{title}</Typography>

        {metricData && !loading && (
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid var(--color-border-glass)" }}>
            <Typography variant="caption" sx={{ color: "var(--color-text-muted)", display: "block" }}>
              Avg/day:{" "}
              {metricType === "collection"
                ? `₦${metricData.averagePerDay.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : metricData.averagePerDay.toFixed(1)}
            </Typography>
            {startDate && endDate && (
              <Typography variant="caption" sx={{ color: "var(--color-text-muted)" }}>
                {startDate.format("MMM D")} – {endDate.format("MMM D, YYYY")}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// ─── MetricsLineChart ─────────────────────────────────────────────────────────
const MetricsLineChart: React.FC<{ branchId: string | undefined }> = ({ branchId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [metrics, setMetrics] = useState<BranchMetrics | null>(null);

  const cfg = CHART_TABS[activeTab];

  const fetchMetrics = useCallback(async (start?: Dayjs, end?: Dayjs) => {
    if (!branchId) return;
    setChartLoading(true);
    try {
      const params = new URLSearchParams({ branchId });
      if (start) params.append("startDate", start.format("YYYY-MM-DD"));
      if (end) params.append("endDate", end.format("YYYY-MM-DD"));
      const res = await Api.get(`/growth/branch-metrics-comparison?${params.toString()}`);
      setMetrics(res.data?.data?.metrics || null);
    } catch (err) {
      console.error("Failed to fetch branch metrics:", err);
      setMetrics(null);
    } finally {
      setChartLoading(false);
    }
  }, [branchId]);

  // Load default on mount (no dates = default endpoint)
  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const handleApply = () => { if (startDate && endDate) fetchMetrics(startDate, endDate); };
  const handleClear = () => { setStartDate(null); setEndDate(null); fetchMetrics(); };

  const activeMetric = metrics?.[cfg.key];
  const chartData = (activeMetric?.data ?? []).map((item) => ({
    date: moment(item.date).format("MMM D"),
    value: item.value,
  }));
  const summary = activeMetric?.summary;
  const isEmpty = !chartLoading && chartData.length === 0;

  const formatValue = (v: number) =>
    cfg.isFinance ? `₦${v.toLocaleString()}` : v.toLocaleString();

  const formatYAxis = (v: number) => {
    if (cfg.isFinance) {
      if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000) return `₦${(v / 1_000).toFixed(0)}k`;
      return `₦${v}`;
    }
    return v.toLocaleString();
  };

  return (
    <Paper
      sx={{
        p: 3, background: "var(--color-surface-glass)",
        borderRadius: "16px", border: "1px solid var(--color-border-glass)",
      }}
    >
      {/* Header row */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h6" sx={{ color: "var(--color-text-primary)", fontWeight: "bold" }}>
          Metrics Overview
        </Typography>
        <DateRangePicker
          label="Filter by date"
          startDate={startDate} endDate={endDate}
          onStartChange={setStartDate} onEndChange={setEndDate}
          onApply={handleApply} onClear={handleClear} loading={chartLoading}
        />
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          mb: 2, minHeight: 38,
          "& .MuiTabs-indicator": {
            backgroundColor: cfg.color, height: 3,
            borderRadius: "3px 3px 0 0",
          },
          "& .MuiTab-root": {
            color: "var(--color-text-muted)", textTransform: "none",
            fontSize: "0.85rem", fontWeight: 500, minHeight: 38, py: 0.5,
            "&.Mui-selected": { color: cfg.color, fontWeight: 700 },
          },
        }}
      >
        {CHART_TABS.map((tab) => (
          <Tab key={tab.key} label={tab.label} icon={tab.icon} iconPosition="start" />
        ))}
      </Tabs>

      {/* Summary chips */}
      {summary && !chartLoading && (
        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
          <Chip
            size="small"
            label={`Total: ${formatValue(summary.totalValue)}`}
            sx={{ bgcolor: `${cfg.color}22`, color: cfg.color, fontWeight: 600, fontSize: "0.72rem" }}
          />
          <Chip
            size="small"
            label={`Avg/day: ${formatValue(Math.round(summary.averagePerDay))}`}
            sx={{ bgcolor: `${cfg.color}11`, color: "var(--color-text-muted)", fontSize: "0.72rem" }}
          />
          <Chip
            size="small"
            label={`${summary.daysWithData} days with data`}
            sx={{ bgcolor: `${cfg.color}11`, color: "var(--color-text-muted)", fontSize: "0.72rem" }}
          />
        </Box>
      )}

      {/* Chart body */}
      {chartLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 280 }}>
          <CircularProgress sx={{ color: cfg.color }} />
        </Box>
      ) : isEmpty ? (
        <Box
          sx={{
            height: 280, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 56, height: 56, borderRadius: "16px",
              background: `${cfg.color}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: cfg.color, opacity: 0.6,
            }}
          >
            {cfg.icon}
          </Box>
          <Typography variant="body2" sx={{ color: "var(--color-text-muted)" }}>
            No {cfg.label.toLowerCase()} data for this period
          </Typography>
          {(startDate || endDate) && (
            <Typography variant="caption" sx={{ color: "var(--color-text-muted)" }}>
              Try adjusting the date range
            </Typography>
          )}
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
            <XAxis
              dataKey="date" stroke="var(--color-text-muted)"
              tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
            />
            <YAxis
              stroke="var(--color-text-muted)" tick={{ fontSize: 11 }}
              tickLine={false} axisLine={false} tickFormatter={formatYAxis}
              width={cfg.isFinance ? 60 : 35}
            />
            <Tooltip
              formatter={(value: number | undefined) => [
                formatValue(value ?? 0), // Use 0 or a fallback if undefined
                cfg.label
              ]}
                contentStyle={{
                background: "var(--color-primary)",
                border: `1px solid ${cfg.color}55`,
                borderRadius: "10px",
                color: "var(--color-text-primary)",
                fontSize: "0.8rem",
              }}
              labelStyle={{ color: "var(--color-text-muted)", marginBottom: 4 }}
              cursor={{ stroke: cfg.color, strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Line
              type="monotone" dataKey="value"
              stroke={cfg.color} strokeWidth={2.5}
              dot={{ fill: cfg.color, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: cfg.color, strokeWidth: 2, stroke: "var(--color-primary)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  title: string; value: string | number; change?: number;
  icon: React.ReactNode; color: string;
}> = ({ title, value, change, icon, color }) => {
  const isPositive = change === undefined || change >= 0;
  return (
    <Card
      sx={{
        background: "var(--color-surface-glass)", backdropFilter: "blur(10px)",
        border: "1px solid var(--color-border-glass)", borderRadius: "16px",
        p: 3, height: "100%", transition: "all 0.3s ease",
        "&:hover": { transform: "translateY(-4px)", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.08)" },
      }}
    >
      <CardContent sx={{ pb: "0 !important" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box
            sx={{
              width: 48, height: 48, borderRadius: "12px",
              background: `linear-gradient(135deg, ${color}88 0%, ${color}44 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--color-text-on-primary)",
            }}
          >
            {icon}
          </Box>
          {change !== undefined && (
            <Chip
              icon={isPositive ? <TrendingUp /> : <TrendingDown />}
              label={`${Math.abs(change)}%`}
              size="small" color={isPositive ? "success" : "error"} sx={{ fontWeight: "bold" }}
            />
          )}
        </Box>
        <Typography variant="h6" sx={{ color: "var(--color-text-primary)", fontWeight: "bold", mb: 1 }}>{value}</Typography>
        <Typography variant="body2" sx={{ color: "var(--color-text-muted)" }}>{title}</Typography>
      </CardContent>
    </Card>
  );
};

const QuickActionButton: React.FC<{ title: string; icon: React.ReactNode; onClick: () => void }> = ({ title, icon, onClick }) => (
  <Button fullWidth startIcon={icon} onClick={onClick}
    sx={{
      background: "var(--color-surface-glass)", border: "1px solid var(--color-border-glass)",
      borderRadius: "12px", py: 2, color: "var(--color-text-primary)",
      textTransform: "none", fontWeight: "medium",
      "&:hover": { background: "var(--color-surface)", transform: "translateY(-2px)" },
      transition: "all 0.3s ease",
    }}
  >
    <Typography variant="body2">{title}</Typography>
  </Button>
);

const EventItem: React.FC<{ activity: string; time: string; icon: React.ReactNode }> = ({ activity, time, icon }) => (
  <ListItem sx={{ py: 1.5, borderBottom: "1px solid var(--color-border-subtle)" }}>
    <ListItemAvatar>
      <Avatar sx={{ background: "var(--color-surface-glass)", color: "var(--color-text-primary)", width: 40, height: 40 }}>
        {icon}
      </Avatar>
    </ListItemAvatar>
    <ListItemText
      primary={<Typography variant="body2" sx={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{activity}</Typography>}
      secondary={<Typography variant="caption" sx={{ color: "var(--color-text-muted)" }}>{time}</Typography>}
    />
  </ListItem>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authData = useSelector((state: RootState) => state?.auth?.authData);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesFetched, setRolesFetched] = useState(false);

  const authId = authData?.id;
  const branchId = authData?.branchId;
  const role = authData?.role;
  const department = authData?.department;
  const hasRoles = authData?.roles && authData.roles.length > 0;

  useEffect(() => {
    if (!authId || rolesFetched || hasRoles) return;
    const fetchAndDispatchRoles = async () => {
      try {
        setRolesFetched(true);
        const response = await Api.get(`/church/admin-role/${authId}`);
        const rolesData = response.data.data.roles;
        const transformed: RolePermission[] = [];
        rolesData.forEach((role: any) => {
          const groupMap = new Map<string, { groupName: string; permissions: string[] }>();
          role.permissionGroups.forEach((g: any) => { groupMap.set(g.id, { groupName: g.name, permissions: [] }); });
          role.permissions.forEach((p: any) => {
            const groupId = p.permissionGroupId;
            if (!groupMap.has(groupId)) groupMap.set(groupId, { groupName: "Unknown", permissions: [p.name] });
            else groupMap.get(groupId)!.permissions.push(p.name);
          });
          groupMap.forEach((value) => { transformed.push({ permissionGroupName: value.groupName, permissionNames: value.permissions }); });
        });
        dispatch(setUserRoles(transformed));
        dispatch(setAuthData({ ...authData, permission: transformed.map((e) => e.permissionGroupName) }));
      } catch (error) {
        console.error("Failed to fetch roles:", error);
        setRolesFetched(false);
      }
    };
    fetchAndDispatchRoles();
  }, [authId, hasRoles, rolesFetched, dispatch, authData]);

  const fetchDepartments = useCallback(async (): Promise<Department[] | undefined> => {
    if (!branchId) return undefined;
    try {
      const res = await Api.get(`/church/get-departments?branchId=${branchId}`);
      return res.data.departments;
    } catch { return undefined; }
  }, [branchId]);

  const fetchDashboardData = useCallback(async () => {
    if (!branchId) { setLoading(false); return; }
    try {
      setLoading(true);
      const params = new URLSearchParams({ branchId });
      let deptId = department;
      if (role === "department" && !deptId) {
        const depts = await fetchDepartments();
        const activeDept = depts?.find((d) => d.isActive && !d.isDeleted);
        if (activeDept) { deptId = activeDept.id; dispatch(setAuthData({ ...authData, department: deptId })); }
      }
      if (deptId) params.append("departmentId", deptId);
      const res = await Api.get<ApiResponse>(`/member/get-dashboard?${params.toString()}`);
      const c = res.data.collections || { weekly: 0, lastWeek: 0, weeklyChange: 0, monthly: 0, lastMonth: 0, monthlyChange: 0 };
      setData({
        followUps: res.data.followUps,
        collections: {
          weekly: { thisWeek: Number(c.weekly) || 0, lastWeek: Number(c.lastWeek) || 0, change: Number(c.weeklyChange) || 0 },
          monthly: { thisMonth: Number(c.monthly) || 0, lastMonth: Number(c.lastMonth) || 0, change: Number(c.monthlyChange) || 0 },
        },
        structure: res.data.structure || { totalDepartments: 0, totalUnits: 0, totalWorkers: 0 },
        upcomingPrograms: res.data.upcomingPrograms || [],
        scope: res.data.scope || role || "branch",
      });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setData(null);
    } finally { setLoading(false); }
  }, [branchId, department, role, fetchDepartments, dispatch, authData]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const handleQuickAction = (path: string) => navigate(path);

  const defaultData: DashboardData = {
    collections: { weekly: { thisWeek: 0, lastWeek: 0, change: 0 }, monthly: { thisMonth: 0, lastMonth: 0, change: 0 } },
    structure: { totalDepartments: 0, totalUnits: 0, totalWorkers: 0 },
    upcomingPrograms: [],
    scope: role || "branch",
  };

  const dashboardData = data || defaultData;
  const isBranch = role === "branch";
  const isHOD = role === "department";
  const isUnit = role === "unit";
  const collectionsTitle = isHOD ? "Department Collections" : isUnit ? "Unit Collections" : "Church Collections";

  const defaultFollowUpsValue = dashboardData.followUps?.monthly.thisMonth ?? 0;
  const defaultFollowUpsChange = dashboardData.followUps?.monthly.change;
  const defaultCollectionsValue = `₦${dashboardData.collections.monthly.thisMonth.toLocaleString()}`;
  const defaultCollectionsChange = dashboardData.collections.monthly.change;

  if (loading || !authData) {
    return (
      <DashboardManager>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]" />
        </Box>
      </DashboardManager>
    );
  }

  return (
    <DashboardManager>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ color: "var(--color-text-primary)", fontWeight: "bold", mb: 1 }}>
            Welcome back, {authData.name || "Admin"}
          </Typography>
          <Typography variant="body1" sx={{ color: "var(--color-text-secondary)" }}>
            Here's what's happening in your{" "}
            {authData?.isSuperAdmin && !authData?.isHeadQuarter ? "Church" : authData?.isHeadQuarter ? "HQ" : "Branch"}{" "}
            dashboard today.
          </Typography>
        </Box>

        {/* Structure Cards */}
        {isBranch && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {dashboardData.structure.totalBranches !== undefined && (
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard title="Total Branches" value={dashboardData.structure.totalBranches} icon={<TbArrowFork className="text-[24px]" />} color="#2196F3" />
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Total Departments" value={dashboardData.structure.totalDepartments} icon={<TbArrowBearRight2 className="text-[24px]" />} color="#FF9800" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Total Units" value={dashboardData.structure.totalUnits} icon={<MdOutlineHub className="text-[24px]" />} color="#607D8B" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Total Workers" value={dashboardData.structure.totalWorkers} icon={<FaPeopleCarry className="text-[24px]" />} color="#9C27B0" />
            </Grid>
          </Grid>
        )}
        {isHOD && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}><StatCard title="Total Departments" value={dashboardData.structure.totalDepartments} icon={<TbArrowBearRight2 className="text-[24px]" />} color="#FF9800" /></Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}><StatCard title="Total Units" value={dashboardData.structure.totalUnits} icon={<MdOutlineHub className="text-[24px]" />} color="#607D8B" /></Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}><StatCard title="Total Workers" value={dashboardData.structure.totalWorkers} icon={<FaPeopleCarry className="text-[24px]" />} color="#9C27B0" /></Grid>
          </Grid>
        )}
        {isUnit && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6 }}><StatCard title="Total Units" value={dashboardData.structure.totalUnits} icon={<MdOutlineHub className="text-[24px]" />} color="#607D8B" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><StatCard title="Total Workers" value={dashboardData.structure.totalWorkers} icon={<FaPeopleCarry className="text-[24px]" />} color="#9C27B0" /></Grid>
          </Grid>
        )}

        {/* Metric Cards */}
        <Grid container spacing={3} sx={{ mb: 4, p: 3, background: "var(--color-surface-glass)", borderRadius: "16px", border: "1px solid var(--color-border-glass)" }}>
          {isBranch && dashboardData.followUps && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <MetricStatCard
                title="Newcomers" value={defaultFollowUpsValue} change={defaultFollowUpsChange}
                icon={<FaPeopleGroup className="text-[24px]" />} color="#00BCD4"
                metricType="followUp" branchId={branchId}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: isBranch && dashboardData.followUps ? 6 : 12 }}>
            <MetricStatCard
              title={collectionsTitle} value={defaultCollectionsValue} change={defaultCollectionsChange}
              icon={<CiMoneyBill className="text-[30px]" />} color="#795548"
              metricType="collection" branchId={branchId}
            />
          </Grid>
        </Grid>

        {/* Line Chart with Tabs */}
        <Box sx={{ mb: 4 }}>
          <MetricsLineChart branchId={branchId} />
        </Box>

        {/* Quick Actions & Events */}
        <Grid container spacing={3}>
          {isBranch && (
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper sx={{ p: 3, background: "var(--color-surface-glass)", borderRadius: "16px", border: "1px solid var(--color-border-glass)", height: 400, overflow: "auto" }}>
                <Typography variant="h6" sx={{ color: "var(--color-text-primary)", mb: 3, fontWeight: "bold" }}>Quick Actions</Typography>
                <Grid container spacing={2}>
                  {[
                    { title: "Admins", icon: <People />, path: "/manage/view-admins" },
                    { title: "Manage Programs", icon: <IoCalendarOutline />, path: "/programs" },
                    { title: "Workers", icon: <FaPeopleCarry />, path: "/members/view-workers" },
                    { title: "Newcomers", icon: <IoPersonAddOutline />, path: "/members/view-followup" },
                  ].map((a) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={a.title}>
                      <QuickActionButton title={a.title} icon={a.icon} onClick={() => handleQuickAction(a.path)} />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          )}
          <Grid size={{ xs: 12, md: isBranch ? 4 : 12 }}>
            <Paper sx={{ p: 3, background: "var(--color-surface-glass)", borderRadius: "16px", border: "1px solid var(--color-border-glass)", height: 400 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <CalendarIcon sx={{ color: "var(--color-text-primary)", mr: 1 }} />
                <Typography variant="h6" sx={{ color: "var(--color-text-primary)", fontWeight: "bold" }}>Upcoming Events</Typography>
              </Box>
              <List sx={{ maxHeight: 300, overflow: "auto" }}>
                {dashboardData.upcomingPrograms.length > 0
                  ? dashboardData.upcomingPrograms.slice(0, 5).map((p) => (
                    <EventItem
                      key={p.event.id}
                      activity={p.event.title}
                      time={`${moment(p.date).format("MMM DD, YYYY")} | ${p.startTime} - ${p.endTime}`}
                      icon={<ProgramIcon />}
                    />
                  ))
                  : <Typography sx={{ color: "var(--color-text-muted)", textAlign: "center", py: 4 }}>No upcoming events</Typography>
                }
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </DashboardManager>
  );
};

export default Dashboard;