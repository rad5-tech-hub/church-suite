import React, { useCallback, useEffect, useState } from "react";
import DashboardManager from "../../shared/dashboardManager";
import { useSelector } from 'react-redux';
import { RootState } from '../../reduxstore/redux';
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
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
  useTheme,
  Paper,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  SelectChangeEvent,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,  
  CalendarToday as CalendarIcon,
  EventNote as ProgramIcon,
  People,
} from "@mui/icons-material";
import moment from "moment";
import Api from "../../shared/api/api";
import { TbArrowBearRight2, TbArrowFork } from "react-icons/tb";
import { MdOutlineHub } from "react-icons/md";
import { FaPeopleCarry } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import { CiMoneyBill } from "react-icons/ci";
import { IoCalendarOutline, IoPersonAddOutline } from "react-icons/io5";

interface DashboardData {
  followUps: {
    weekly: {
      thisWeek: number;
      lastWeek: number;
      change: number;
    };
    monthly: {
      thisMonth: number;
      lastMonth: number;
      change: number;
    };
  };
  collections: {
    weekly: {
      thisWeek: number;
      lastWeek: number;
      change: number;
    };
    monthly: {
      thisMonth: number;
      lastMonth: number;
      change: number;
    };
  };
  structure: {
    totalBranches: number;
    totalDepartments: number;
    totalUnits: number;
    totalWorkers: number;
  };
  upcomingPrograms: Array<{
    date: string;
    startTime: string;
    endTime: string;
    event: {
      id: string;
      title: string;
      branchId: string;
    };
  }>;
  scope: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color = "#F6F4FE" }) => {
  const theme = useTheme();
  const isPositive = change === undefined || change >= 0;
  
  return (
    <Card
      sx={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "16px",
        p: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <CardContent sx={{ pb: "0 !important" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              background: `linear-gradient(135deg, ${color} 0%, ${theme.palette.primary.main} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
          {change !== undefined && (
            <Chip
              icon={isPositive ? <TrendingUp /> : <TrendingDown />}
              label={`${Math.abs(change)}%`}
              size="small"
              color={isPositive ? "success" : "error"}
              sx={{ fontWeight: "bold" }}
            />
          )}
        </Box>
        <Typography variant="h6" sx={{ color: "#F6F4FE", fontWeight: "bold", mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
};

const QuickActionButton: React.FC<{ title: string; icon: React.ReactNode; onClick: () => void }> = ({
  title,
  icon,
  onClick,
}) => (
  <Button
    fullWidth
    startIcon={icon}
    onClick={onClick}
    sx={{
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px",
      py: 2,
      color: "#F6F4FE",      
      textTransform: "none",
      fontWeight: "medium",
      justifyContent: "flex-center",
      "&:hover": {
        background: "rgba(255,255,255,0.1)",
        transform: "translateY(-2px)",
      },
      transition: "all 0.3s ease",
    }}
  >
    <Typography variant="body2">{title}</Typography>
  </Button>
);

const EventItem: React.FC<{ activity: string; time: string; icon: React.ReactNode }> = ({
  activity,
  time,
  icon,
}) => (
  <ListItem sx={{ py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
    <ListItemAvatar>
      <Avatar
        sx={{
          background: "rgba(255,255,255,0.1)",
          color: "#F6F4FE",
          width: 40,
          height: 40,
        }}
      >
        {icon}
      </Avatar>
    </ListItemAvatar>
    <ListItemText
      primary={
        <Typography variant="body2" sx={{ color: "#F6F4FE", fontWeight: 500 }}>
          {activity}
        </Typography>
      }
      secondary={
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
          {time}
        </Typography>
      }
    />
  </ListItem>
);

const Dashboard: React.FC = () => {
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"weekly" | "monthly">("monthly");
  const navigate = useNavigate();
  const fetchDashboardData = useCallback(async () => {
    if (!authData?.branchId) return;
    
    try {
      setLoading(true);
      let params = new URLSearchParams();
      
      // Branch always comes first
      params.append("branchId", authData.branchId);
      
      // Add departmentId if role = department
      if (authData?.role === "department") {
        if (!authData.department) throw new Error("No department found");
        params.append("departmentId", authData.department);
      }

      const url = `/member/get-dashboard?${params.toString()}`;
      const response = await Api.get<DashboardData>(url);
      setData(response.data);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [authData?.branchId, authData?.department, authData?.role]);

  useEffect(() => {
    if (authData?.branchId) {
      fetchDashboardData();
    }
  }, [fetchDashboardData]);

  const handleViewChange = (event: SelectChangeEvent) => {
    setView(event.target.value as "weekly" | "monthly");
  };

  const handleQuickAction = (action: string) => {
    navigate(action);
    // Implement navigation logic here
  };

  if (loading) {
    return (
      <DashboardManager>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
         <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
          </Box>
        </Box>
      </DashboardManager>
    );
  }

  const dashboardData = data || {
    followUps: { weekly: { thisWeek: 0, lastWeek: 0, change: 0 }, monthly: { thisMonth: 0, lastMonth: 0, change: 0 } },
    collections: { weekly: { thisWeek: 0, lastWeek: 0, change: 0 }, monthly: { thisMonth: 0, lastMonth: 0, change: 0 } },
    structure: { totalBranches: 0, totalDepartments: 0, totalUnits: 0, totalWorkers: 0 },
    upcomingPrograms: [],
    scope: "branch",
  };

  const isHOD = authData?.role === "department";
  const collectionsTitle = isHOD ? "Department Collections" : "Church Collections";

  // Determine data based on view
  const followUpsTitle = view === "monthly" ? "This Month Newcomers" : "This Week Newcomers";
  const followUpsValue = view === "monthly" ? dashboardData.followUps.monthly.thisMonth : dashboardData.followUps.weekly.thisWeek;
  const followUpsChange = view === "monthly" ? dashboardData.followUps.monthly.change : dashboardData.followUps.weekly.change;
  const collectionsData = view === "monthly" ? 
    [{ period: "This Month", amount: dashboardData.collections.monthly.thisMonth }, { period: "Last Month", amount: dashboardData.collections.monthly.lastMonth }] :
    [{ period: "This Week", amount: dashboardData.collections.weekly.thisWeek }, { period: "Last Week", amount: dashboardData.collections.weekly.lastWeek }];
  const collectionsValue = view === "monthly" ? dashboardData.collections.monthly.thisMonth : dashboardData.collections.weekly.thisWeek;
  const collectionsChange = view === "monthly" ? dashboardData.collections.monthly.change : dashboardData.collections.weekly.change;

  return (
    <DashboardManager>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header with View Toggle */}
        <Box sx={{ mb: 4, gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ color: "#F6F4FE", fontWeight: "bold", mb: 1 }}>
              Welcome back, {authData?.name || "Admin"}
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
              Here's what's happening in your {dashboardData.scope}
            </Typography>
          </Box>
        </Box>

        {/* KPI Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Branches"
              value={dashboardData.structure.totalBranches}
              icon={<TbArrowFork className="text-[24px] font-black text-[#F6F4FE]"/>}
              color="#2196F3"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Departments"
              value={dashboardData.structure.totalDepartments}
              icon={<TbArrowBearRight2 className="text-[24px] font-black text-[#F6F4FE]"/>}
              color="#FF9800"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Units"
              value={dashboardData.structure.totalUnits}
              icon={<MdOutlineHub className="text-[24px] font-black text-[#F6F4FE]" />}
              color="#607D8B"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Workers"
              value={dashboardData.structure.totalWorkers}
              icon={<FaPeopleCarry className="text-[24px] font-black text-[#F6F4FE]" />}
              color="#9C27B0"
            />
          </Grid>
        </Grid>

        {/* Secondary Metrics */}
        <Grid container spacing={3} sx={{ mb: 4,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          p: 3,
        }}>
          {/* View Selector - Full Row */}
          <Grid size={{xs: 12}} >
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: "#F6F4FE" }}>View</InputLabel>
                <Select
                  value={view}
                  onChange={handleViewChange}
                  label="View"
                  sx={{
                    color: "#F6F4FE",
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: "8px",
                    ".MuiSvgIcon-root": { color: "#F6F4FE" },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.1)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.3)",
                    },
                  }}
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Grid>

          {/* Stat Cards */}
          <Grid size={{ xs:12, sm:6, md:6}}>
            <StatCard
              title={followUpsTitle}
              value={followUpsValue}
              change={followUpsChange}
              icon={<FaPeopleGroup className="text-[24px] font-black text-[#F6F4FE]" />}
              color="#00BCD4"
            />
          </Grid>

          <Grid size={{ xs:12, sm:6, md:6}}>
            <StatCard
              title={collectionsTitle}
              value={`₦${collectionsValue.toLocaleString()}`}
              change={collectionsChange}
              icon={<CiMoneyBill className="text-[30px] font-black text-[#F6F4FE]" />}
              color="#795548"
            />
          </Grid>
        </Grid>

        {/* Collections Progression */}
        <Grid size={{ xs: 12 }}>
          <Paper
            sx={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              p: 3,
            }}
          >
            <Typography variant="h6" sx={{ color: "#F6F4FE", mb: 2, fontWeight: "bold" }}>
              {collectionsTitle} ({view === "monthly" ? "Monthly" : "Weekly"} Progression)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={collectionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="period" stroke="#F6F4FE" />
                <YAxis stroke="#F6F4FE" />
                <Tooltip 
                  formatter={(value: number) => [`₦${value.toLocaleString()}`, "Amount"]}
                  contentStyle={{ 
                    background: "rgba(0,0,0,0.8)", 
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#F6F4FE"
                  }}
                />
                <Bar dataKey="amount" fill="#795548" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Quick Actions & Upcoming Events */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper
              sx={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                p: 3,
                height: 400,
                overflow: "auto",
              }}
            >
              <Typography variant="h6" sx={{ color: "#F6F4FE", mb: 3, fontWeight: "bold" }}>
                Quick Actions
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }} sx={{textAlign: 'center'}}>
                  <QuickActionButton
                    title="Admins"
                    icon={<People/>}
                    onClick={() => handleQuickAction("/manage/view-admins")}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <QuickActionButton
                    title="Manage Programs"
                    icon={<IoCalendarOutline />}
                    onClick={() => handleQuickAction('/programs')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <QuickActionButton
                    title="Workers"
                    icon={<FaPeopleCarry/>}
                    onClick={() => handleQuickAction('/members/view-workers')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <QuickActionButton
                    title="Newcomers"
                    icon={<IoPersonAddOutline />}
                    onClick={() => handleQuickAction('/members/view-followup')}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              sx={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                p: 3,
                height: 400,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <CalendarIcon sx={{ color: "#F6F4FE", mr: 1 }} />
                <Typography variant="h6" sx={{ color: "#F6F4FE", fontWeight: "bold" }}>
                  Upcoming Events
                </Typography>
              </Box>
              
              <List sx={{ maxHeight: 300, overflow: "auto" }}>
                {dashboardData.upcomingPrograms.length > 0 ? (
                  dashboardData.upcomingPrograms.slice(0, 5).map((program) => (
                    <EventItem
                      key={program.event.id}
                      activity={program.event.title}
                      time={`${moment(program.date).format("MMM DD, YYYY")} | ${program.startTime} - ${program.endTime}`}
                      icon={<ProgramIcon />}
                    />
                  ))
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
                      No upcoming events
                    </Typography>
                  </Box>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </DashboardManager>
  );
};

export default Dashboard;