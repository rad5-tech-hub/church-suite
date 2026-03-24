import { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { BibleLoader } from '../components/BibleLoader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Users, UsersRound, Calendar, DollarSign, UserPlus, TrendingUp,
  Building2, Layers, Filter, ArrowRight, Inbox, Crown, Sparkles,
} from 'lucide-react';
import { Link } from 'react-router';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useChurch } from '../context/ChurchContext';
import { useAuth } from '../context/AuthContext';
import { CURRENCIES } from '../constants/currencies';
import { ProductTour } from '../components/ProductTour';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  fetchMembers, fetchNewcomers, fetchCollections, fetchLedgerEntries, fetchDashboard,
} from '../api';

// ── Weekly chart helpers ──────────────────────────────────────────────────────

function getWeekBounds() {
  const now = new Date();
  const thisSunday = new Date(now);
  thisSunday.setDate(now.getDate() - now.getDay());
  thisSunday.setHours(0, 0, 0, 0);
  const lastSunday = new Date(thisSunday);
  lastSunday.setDate(thisSunday.getDate() - 7);
  return { thisSunday, lastSunday };
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildWeeklyCount(items: any[], dateField: string) {
  const { thisSunday, lastSunday } = getWeekBounds();
  return DAYS.map((day, i) => {
    const thisDay = new Date(thisSunday); thisDay.setDate(thisSunday.getDate() + i);
    const nextThisDay = new Date(thisDay); nextThisDay.setDate(thisDay.getDate() + 1);
    const lastDay = new Date(lastSunday); lastDay.setDate(lastSunday.getDate() + i);
    const nextLastDay = new Date(lastDay); nextLastDay.setDate(lastDay.getDate() + 1);
    return {
      day,
      thisWeek: items.filter(it => { const d = new Date(it[dateField]); return d >= thisDay && d < nextThisDay; }).length,
      lastWeek: items.filter(it => { const d = new Date(it[dateField]); return d >= lastDay && d < nextLastDay; }).length,
    };
  });
}

function buildWeeklySum(items: any[], dateField: string, valueField: string) {
  const { thisSunday, lastSunday } = getWeekBounds();
  return DAYS.map((day, i) => {
    const thisDay = new Date(thisSunday); thisDay.setDate(thisSunday.getDate() + i);
    const nextThisDay = new Date(thisDay); nextThisDay.setDate(thisDay.getDate() + 1);
    const lastDay = new Date(lastSunday); lastDay.setDate(lastSunday.getDate() + i);
    const nextLastDay = new Date(lastDay); nextLastDay.setDate(lastDay.getDate() + 1);
    const sum = (arr: any[], from: Date, to: Date) =>
      arr.filter(it => { const d = new Date(it[dateField]); return d >= from && d < to; })
         .reduce((s, it) => s + (Number(it[valueField]) || 0), 0);
    return { day, thisWeek: sum(items, thisDay, nextThisDay), lastWeek: sum(items, lastDay, nextLastDay) };
  });
}

function weekTotal(data: { thisWeek: number; lastWeek: number }[]) {
  return {
    thisWeek: data.reduce((s, d) => s + d.thisWeek, 0),
    lastWeek: data.reduce((s, d) => s + d.lastWeek, 0),
  };
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ── Trend chart card ──────────────────────────────────────────────────────────

interface TrendChartProps {
  title: string;
  subtitle: string;
  data: { day: string; thisWeek: number; lastWeek: number }[];
  color: string;
  formatValue?: (v: number) => string;
  thisWeekLabel?: string;
  lastWeekLabel?: string;
}

function TrendChart({ title, subtitle, data, color, formatValue, thisWeekLabel = 'This Week', lastWeekLabel = 'Last Week' }: TrendChartProps) {
  const totals = weekTotal(data);
  const pct = pctChange(totals.thisWeek, totals.lastWeek);
  const fmt = formatValue ?? ((v: number) => String(v));

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${pct >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {pct >= 0 ? '↗' : '↘'} {Math.abs(pct)}%
          </span>
        </div>

        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(val: number, name: string) => [fmt(val), name === 'thisWeek' ? thisWeekLabel : lastWeekLabel]}
            />
            <Line type="monotone" dataKey="thisWeek" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="lastWeek" stroke={color} strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2, fill: color, fillOpacity: 0.5 }} strokeOpacity={0.5} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(val) => <span style={{ fontSize: 11, color: '#6b7280' }}>{val === 'thisWeek' ? thisWeekLabel : lastWeekLabel}</span>}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="flex justify-between mt-3 pt-3 border-t border-gray-100 text-sm">
          <div>
            <p className="text-xs text-gray-500">This week</p>
            <p className="font-bold text-gray-900">{fmt(totals.thisWeek)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Last week</p>
            <p className="font-bold text-gray-400">{fmt(totals.lastWeek)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export function Dashboard() {
  const { church, branches, isHeadQuarter } = useChurch();
  const { currentAdmin } = useAuth();
  const adminLevel = currentAdmin?.level || 'church';

  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<'this-week' | 'this-month' | 'this-year' | 'all-time'>('this-week');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [memberCount, setMemberCount] = useState(0);
  const [workforceCount, setWorkforceCount] = useState(0);
  const [programCount, setProgramCount] = useState(0);
  const [allNewcomers, setAllNewcomers] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [allLedger, setAllLedger] = useState<any[]>([]);
  const [deptCount, setDeptCount] = useState(0);
  const [unitCount, setUnitCount] = useState(0);
  const [recentCollections, setRecentCollections] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const currSymbol = CURRENCIES.find(c => c.code === church.currency)?.symbol || '₦';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const brId = branches[0]?.id;
      const [mems, newcomers, colls, ledger, dashboardRes] = await Promise.all([
        fetchMembers(),
        fetchNewcomers(brId),
        fetchCollections(brId),
        fetchLedgerEntries(),
        fetchDashboard({ scope: 'all' }).catch(() => null),
      ]);

      const dashboard = dashboardRes?.data || dashboardRes;
      setDashboardData(dashboard);

      const memArr = mems as any[];
      setAllMembers(memArr);
      setMemberCount(dashboard?.structure?.totalMembers ?? memArr.length);
      setWorkforceCount(dashboard?.structure?.totalWorkers ?? 0);
      setProgramCount(dashboard?.upcomingPrograms?.length ?? 0);

      const newcomerArr = newcomers as any[];
      setAllNewcomers(newcomerArr);

      setDeptCount(dashboard?.structure?.totalDepartments ?? 0);
      setUnitCount(dashboard?.structure?.totalUnits ?? 0);

      const ledgerArr = ledger as any[];
      setAllLedger(ledgerArr);

      const churchLedger = ledgerArr
        .filter((e: any) => e.type === 'income')
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);
      setRecentCollections(
        churchLedger.length > 0
          ? churchLedger
          : (colls as any[]).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3)
      );
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [church.id, branches]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Weekly chart data ───────────────────────────────────────────────────────
  const attendanceChartData = useMemo(() =>
    buildWeeklyCount(allMembers, 'createdAt'),
    [allMembers]
  );

  const financialChartData = useMemo(() =>
    buildWeeklySum(allLedger.filter((e: any) => e.type === 'income'), 'date', 'amount'),
    [allLedger]
  );

  const newSoulsChartData = useMemo(() =>
    buildWeeklyCount(allNewcomers, 'visitDate'),
    [allNewcomers]
  );

  // ── Newcomer count by period ────────────────────────────────────────────────
  const newcomerLabelMap: Record<typeof filterPeriod, string> = {
    'this-week': 'Newcomers This Week',
    'this-month': 'Newcomers This Month',
    'this-year': 'Newcomers This Year',
    'all-time': 'Total Newcomers',
  };

  const newcomerCount = useMemo(() => {
    if (filterPeriod === 'this-week' && dashboardData?.followUps?.weekly?.thisWeek !== undefined) {
      return dashboardData.followUps.weekly.thisWeek;
    } else if (filterPeriod === 'this-month' && dashboardData?.followUps?.monthly?.thisMonth !== undefined) {
      return dashboardData.followUps.monthly.thisMonth;
    }
    const now = new Date();
    if (filterPeriod === 'this-week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return allNewcomers.filter(n => new Date(n.visitDate) >= startOfWeek).length;
    } else if (filterPeriod === 'this-month') {
      return allNewcomers.filter(n => {
        const vd = new Date(n.visitDate);
        return vd.getMonth() === now.getMonth() && vd.getFullYear() === now.getFullYear();
      }).length;
    } else if (filterPeriod === 'this-year') {
      return allNewcomers.filter(n => new Date(n.visitDate).getFullYear() === now.getFullYear()).length;
    }
    return allNewcomers.length;
  }, [allNewcomers, filterPeriod, dashboardData]);

  const stats = [
    { label: 'Total Members', value: memberCount.toString(), icon: <UsersRound className="w-6 h-6" />, color: 'bg-blue-500', link: '/members' },
    { label: 'Workforce', value: workforceCount.toString(), icon: <TrendingUp className="w-6 h-6" />, color: 'bg-purple-500', link: '/workforce' },
    { label: 'Programs', value: programCount.toString(), icon: <Calendar className="w-6 h-6" />, color: 'bg-green-500', link: '/programs' },
    { label: newcomerLabelMap[filterPeriod], value: newcomerCount.toString(), icon: <UserPlus className="w-6 h-6" />, color: 'bg-orange-500', link: '/follow-up' },
  ];

  const quickActions = [
    { title: 'Add New Member', description: 'Register a new church member', icon: <UsersRound className="w-5 h-5" />, link: '/members', color: 'text-blue-600 bg-blue-50' },
    { title: 'Create Program', description: 'Schedule a new event or program', icon: <Calendar className="w-5 h-5" />, link: '/programs', color: 'text-green-600 bg-green-50' },
    { title: 'Record Collection', description: 'Add tithes or offerings', icon: <DollarSign className="w-5 h-5" />, link: '/finance', color: 'text-purple-600 bg-purple-50' },
    { title: 'Follow Up Newcomers', description: 'Reach out to first-timers', icon: <UserPlus className="w-5 h-5" />, link: '/follow-up', color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        description="Give account for every soul — track spiritual growth, engagement, and your church's mission impact."
      />
      <div className="p-4 md:p-6 space-y-6">
        {loading ? (
          <BibleLoader message="Loading dashboard..." />
        ) : (
          <>
            {/* Multi-Branch Upgrade Banner — shown for single-branch churches */}
            {!isHeadQuarter && (
              <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg leading-tight">Expand Your Soul Winning Mission</h3>
                    <p className="text-purple-100 text-sm mt-1">
                      Upgrade to Multi-Branch and track spiritual growth across all your church locations.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {['Unlimited Branches', 'Cross-Branch Reports', 'Centralized Control'].map(pill => (
                        <span key={pill} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
                          <Sparkles className="w-3 h-3" /> {pill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <Link to="/subscription" className="flex-shrink-0">
                  <Button className="bg-white text-purple-700 hover:bg-purple-50 font-semibold gap-2 whitespace-nowrap">
                    Upgrade Now <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Church Structure */}
            {adminLevel === 'church' && (
              <div>
                <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">Church Structure</p>
                <div className={`grid grid-cols-1 gap-4 ${isHeadQuarter ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                  {isHeadQuarter && (
                    <Link to="/branches">
                      <div className="bg-white rounded-xl border-l-4 border-blue-500 p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="p-3 bg-blue-50 rounded-lg"><Building2 className="w-6 h-6 text-blue-500" /></div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
                          <p className="text-sm text-gray-500">Branches</p>
                        </div>
                      </div>
                    </Link>
                  )}
                  <Link to="/departments">
                    <div className="bg-white rounded-xl border-l-4 border-purple-500 p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className="p-3 bg-purple-50 rounded-lg"><Layers className="w-6 h-6 text-purple-500" /></div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{deptCount}</p>
                        <p className="text-sm text-gray-500">Depts & Outreaches</p>
                      </div>
                    </div>
                  </Link>
                  <Link to="/units">
                    <div className="bg-white rounded-xl border-l-4 border-green-500 p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className="p-3 bg-green-50 rounded-lg"><Users className="w-6 h-6 text-green-500" /></div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{unitCount}</p>
                        <p className="text-sm text-gray-500">Units</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 h-9 border-gray-300 text-gray-600 font-medium">
                <Filter className="w-4 h-4" /> Filters
              </Button>
              <Select value={filterPeriod} onValueChange={v => setFilterPeriod(v as typeof filterPeriod)}>
                <SelectTrigger className="w-auto h-9 gap-2 border-gray-300 text-gray-600 text-sm font-medium">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="all-time">All Time</SelectItem>
                </SelectContent>
              </Select>
              {isHeadQuarter && (
                <Select value={filterBranch} onValueChange={setFilterBranch}>
                  <SelectTrigger className="w-auto h-9 gap-2 border-gray-300 text-gray-600 text-sm font-medium">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger className="w-auto h-9 gap-2 border-gray-300 text-gray-600 text-sm font-medium">
                  <Layers className="w-4 h-4 text-gray-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterUnit} onValueChange={setFilterUnit}>
                <SelectTrigger className="w-auto h-9 gap-2 border-gray-300 text-gray-600 text-sm font-medium">
                  <Users className="w-4 h-4 text-gray-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="dashboard-stats">
              {stats.map((stat, index) => (
                <Link key={index} to={stat.link}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                          <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                        <div className={`${stat.color} text-white p-3 rounded-lg`}>{stat.icon}</div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Weekly Trend Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TrendChart
                title="Souls in Attendance"
                subtitle="Weekly engagement tracking"
                data={attendanceChartData}
                color="#3b82f6"
              />
              <TrendChart
                title="Financial Growth"
                subtitle="Income this week vs last week"
                data={financialChartData}
                color="#10b981"
                formatValue={v => `${currSymbol}${v.toLocaleString()}`}
              />
              <TrendChart
                title="New Souls Won"
                subtitle="Newcomers requiring follow-up"
                data={newSoulsChartData}
                color="#f59e0b"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-2" data-tour="dashboard-quick-actions">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {quickActions.map((action, index) => (
                        <Link key={index} to={action.link}>
                          <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${action.color}`}>{action.icon}</div>
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{action.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                              </div>
                              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Financial Activity */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentCollections.length === 0 ? (
                      <div className="text-center py-6">
                        <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No income recorded yet. Head to Finance to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentCollections.map((entry: any) => (
                          <div key={entry.id} className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{entry.description || entry.name}</p>
                              <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
                            </div>
                            <p className="font-semibold text-green-600">
                              {currSymbol}{(entry.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        ))}
                        <div className="pt-3 border-t">
                          <Link to="/finance" className="text-sm text-blue-600 hover:underline">View all finances &rarr;</Link>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
      <ProductTour churchName={church.name} />
    </Layout>
  );
}
