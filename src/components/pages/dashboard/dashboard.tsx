import React, { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setAuthData, setUserRoles, RolePermission } from "../../reduxstore/authstore";
import DashboardManager from "../../shared/dashboardManager";
import { RootState } from "../../reduxstore/redux";
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

interface Department {
  id: string;
  name: string;
  isActive: boolean;
  isDeleted?: boolean;
}

// === Components ===
const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, change, icon, color = "#F6F4FE" }) => {
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
      <Avatar sx={{ background: "rgba(255,255,255,0.1)", color: "#F6F4FE", width: 40, height: 40 }}>
        {icon}
      </Avatar>
    </ListItemAvatar>
    <ListItemText
      primary={<Typography variant="body2" sx={{ color: "#F6F4FE", fontWeight: 500 }}>{activity}</Typography>}
      secondary={<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>{time}</Typography>}
    />
  </ListItem>
);

// === Main Component ===
const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authData = useSelector((state: RootState) => state.auth?.authData);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"weekly" | "monthly">("monthly");
  const [rolesFetched, setRolesFetched] = useState(false);

  // === Stable auth values ===
  const authId = authData?.id;
  const branchId = authData?.branchId;
  const role = authData?.role;
  const department = authData?.department;
  const hasRoles = authData?.roles && authData.roles.length > 0;

// === 1. Fetch & Dispatch User Roles (Once) ===
useEffect(() => {
  if (!authId || rolesFetched || hasRoles) return;

  const fetchAndDispatchRoles = async () => {
    try {
      setRolesFetched(true);

      // Fetch roles from API
      const response = await Api.get(`/church/admin-role/${authId}`);
      const rolesData = response.data.data.roles;

      const transformed: RolePermission[] = [];

      rolesData.forEach((role: any) => {
        const groupMap = new Map<string, { groupName: string; permissions: string[] }>();

        // Add groups
        role.permissionGroups.forEach((g: any) => {
          groupMap.set(g.id, { groupName: g.name, permissions: [] });
        });

        // Add permissions to corresponding groups
        role.permissions.forEach((p: any) => {
          const groupId = p.permissionGroupId;
          if (!groupMap.has(groupId)) {
            groupMap.set(groupId, { groupName: "Unknown", permissions: [p.name] });
          } else {
            groupMap.get(groupId)!.permissions.push(p.name);
          }
        });

        // Flatten map to array
        groupMap.forEach((value) => {
          transformed.push({
            permissionGroupName: value.groupName,
            permissionNames: value.permissions,
          });
        });
      });

      // Dispatch transformed roles to Redux
      dispatch(setUserRoles(transformed));

      // Update authData with permissionGroupNames
      const permissionGroups = transformed.map((e) => e.permissionGroupName);
      dispatch(setAuthData({ ...authData, permission: permissionGroups }));

    } catch (error) {
      console.error("Failed to fetch roles:", error);
      setRolesFetched(false); // Retry on next render
    }
  };

  fetchAndDispatchRoles();
}, [authId, hasRoles, rolesFetched, dispatch, authData]);


  // === 2. Fetch Departments (Only for department role) ===
  const fetchDepartments = useCallback(async (): Promise<Department[] | undefined> => {
    if (!branchId) return undefined;
    try {
      const res = await Api.get(`/church/get-departments?branchId=${branchId}`);
      return res.data.departments;
    } catch (error) {
      console.error("Fetch departments failed:", error);
      return undefined;
    }
  }, [branchId]);

  // === 3. Fetch Dashboard Data ===
  const fetchDashboardData = useCallback(async () => {
    if (!branchId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({ branchId });

      let deptId = department;

      // Auto-assign department if missing
      if (role === "department" && !deptId) {
        const depts = await fetchDepartments();
        const activeDept = depts?.find((d) => d.isActive && !d.isDeleted);
        if (activeDept) {
          deptId = activeDept.id;
          dispatch(setAuthData({ ...authData, department: deptId }));
        }
        if (deptId) params.append("departmentId", deptId);
      } else if (role === "department" && deptId) {
        params.append("departmentId", deptId);
      }

      const res = await Api.get<ApiResponse>(`/member/get-dashboard?${params.toString()}`);
      const c = res.data.collections || {
        weekly: 0,
        lastWeek: 0,
        weeklyChange: 0,
        monthly: 0,
        lastMonth: 0,
        monthlyChange: 0,
      };

      setData({
        followUps: res.data.followUps,
        collections: {
          weekly: {
            thisWeek: Number(c.weekly) || 0,
            lastWeek: Number(c.lastWeek) || 0,
            change: Number(c.weeklyChange) || 0,
          },
          monthly: {
            thisMonth: Number(c.monthly) || 0,
            lastMonth: Number(c.lastMonth) || 0,
            change: Number(c.monthlyChange) || 0,
          },
        },
        structure: res.data.structure || {
          totalDepartments: 0,
          totalUnits: 0,
          totalWorkers: 0,
        },
        upcomingPrograms: res.data.upcomingPrograms || [],
        scope: res.data.scope || role || "branch",
      });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [branchId, department, role, fetchDepartments, dispatch, authData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // === Handlers ===
  const handleViewChange = (e: SelectChangeEvent) => setView(e.target.value as "weekly" | "monthly");
  const handleQuickAction = (path: string) => navigate(path);

  // === Computed Values ===
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

  const followUpsValue = dashboardData.followUps
    ? view === "monthly"
      ? dashboardData.followUps.monthly.thisMonth
      : dashboardData.followUps.weekly.thisWeek
    : 0;
  const followUpsChange = dashboardData.followUps
    ? view === "monthly"
      ? dashboardData.followUps.monthly.change
      : dashboardData.followUps.weekly.change
    : 0;

  const collectionsValue = view === "monthly"
    ? dashboardData.collections.monthly.thisMonth
    : dashboardData.collections.weekly.thisWeek;
  const collectionsChange = view === "monthly"
    ? dashboardData.collections.monthly.change
    : dashboardData.collections.weekly.change;

  const chartData = view === "monthly"
    ? [
        { period: "This Month", amount: dashboardData.collections.monthly.thisMonth },
        { period: "Last Month", amount: dashboardData.collections.monthly.lastMonth },
      ]
    : [
        { period: "This Week", amount: dashboardData.collections.weekly.thisWeek },
        { period: "Last Week", amount: dashboardData.collections.weekly.lastWeek },
      ];

  // === Loading State ===
  if (loading || !authData) {
    return (
      <DashboardManager>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
        </Box>
      </DashboardManager>
    );
  }

  // === Render ===
  return (
    <DashboardManager>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ color: "#F6F4FE", fontWeight: "bold", mb: 1 }}>
            Welcome back, {authData.name || "Admin"}
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
            Here's what's happening in your {dashboardData.scope}
          </Typography>
        </Box>

        {/* Structure Cards */}
        {isBranch && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {dashboardData.structure.totalBranches !== undefined && (
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard title="Total Branches" value={dashboardData.structure.totalBranches} icon={<TbArrowFork className="text-[24px] text-[#F6F4FE]" />} color="#2196F3" />
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Total Departments" value={dashboardData.structure.totalDepartments} icon={<TbArrowBearRight2 className="text-[24px] text-[#F6F4FE]" />} color="#FF9800" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Total Units" value={dashboardData.structure.totalUnits} icon={<MdOutlineHub className="text-[24px] text-[#F6F4FE]" />} color="#607D8B" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Total Workers" value={dashboardData.structure.totalWorkers} icon={<FaPeopleCarry className="text-[24px] text-[#F6F4FE]" />} color="#9C27B0" />
            </Grid>
          </Grid>
        )}

        {/* HOD & Unit Cards */}
        {isHOD && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard title="Total Departments" value={dashboardData.structure.totalDepartments} icon={<TbArrowBearRight2 className="text-[24px] text-[#F6F4FE]" />} color="#FF9800" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard title="Total Units" value={dashboardData.structure.totalUnits} icon={<MdOutlineHub className="text-[24px] text-[#F6F4FE]" />} color="#607D8B" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard title="Total Workers" value={dashboardData.structure.totalWorkers} icon={<FaPeopleCarry className="text-[24px] text-[#F6F4FE]" />} color="#9C27B0" />
            </Grid>
          </Grid>
        )}

        {isUnit && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <StatCard title="Total Units" value={dashboardData.structure.totalUnits} icon={<MdOutlineHub className="text-[24px] text-[#F6F4FE]" />} color="#607D8B" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <StatCard title="Total Workers" value={dashboardData.structure.totalWorkers} icon={<FaPeopleCarry className="text-[24px] text-[#F6F4FE]" />} color="#9C27B0" />
            </Grid>
          </Grid>
        )}

        {/* Follow-ups + Collections */}
        <Grid container spacing={3} sx={{ mb: 4, p: 3, background: "rgba(255,255,255,0.06)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Grid size={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: "#F6F4FE" }}>View</InputLabel>
              <Select value={view} onChange={handleViewChange} label="View" sx={{ color: "#F6F4FE", ".MuiSvgIcon-root": { color: "#F6F4FE" } }}>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {isBranch && dashboardData.followUps && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <StatCard
                title={view === "monthly" ? "This Month Newcomers" : "This Week Newcomers"}
                value={followUpsValue}
                change={followUpsChange}
                icon={<FaPeopleGroup className="text-[24px] text-[#F6F4FE]" />}
                color="#00BCD4"
              />
            </Grid>
          )}

          <Grid size={{ xs: 12, sm: 6 }}>
            <StatCard
              title={collectionsTitle}
              value={`₦${collectionsValue.toLocaleString()}`}
              change={collectionsChange}
              icon={<CiMoneyBill className="text-[30px] text-[#F6F4FE]" />}
              color="#795548"
            />
          </Grid>
        </Grid>

        {/* Chart */}
        <Grid size={12} sx={{ mb: 4 }}>
          <Paper sx={{ p: 3, background: "rgba(255,255,255,0.06)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Typography variant="h6" sx={{ color: "#F6F4FE", mb: 2, fontWeight: "bold" }}>
              {collectionsTitle} ({view === "monthly" ? "Monthly" : "Weekly"})
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="period" stroke="#F6F4FE" />
                <YAxis stroke="#F6F4FE" />
                <Tooltip contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", color: "#F6F4FE" }} />
                <Bar dataKey="amount" fill="#795548" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Quick Actions & Events */}
        <Grid container spacing={3}>
          {isBranch && (
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper sx={{ p: 3, background: "rgba(255,255,255,0.06)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", height: 400, overflow: "auto" }}>
                <Typography variant="h6" sx={{ color: "#F6F4FE", mb: 3, fontWeight: "bold" }}>Quick Actions</Typography>
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
            <Paper sx={{ p: 3, background: "rgba(255,255,255,0.06)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", height: 400 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <CalendarIcon sx={{ color: "#F6F4FE", mr: 1 }} />
                <Typography variant="h6" sx={{ color: "#F6F4FE", fontWeight: "bold" }}>Upcoming Events</Typography>
              </Box>
              <List sx={{ maxHeight: 300, overflow: "auto" }}>
                {dashboardData.upcomingPrograms.length > 0 ? (
                  dashboardData.upcomingPrograms.slice(0, 5).map((p) => (
                    <EventItem
                      key={p.event.id}
                      activity={p.event.title}
                      time={`${moment(p.date).format("MMM DD, YYYY")} | ${p.startTime} - ${p.endTime}`}
                      icon={<ProgramIcon />}
                    />
                  ))
                ) : (
                  <Typography sx={{ color: "rgba(255,255,255,0.6)", textAlign: "center", py: 4 }}>
                    No upcoming events
                  </Typography>
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