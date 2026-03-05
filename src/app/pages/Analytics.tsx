import { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { BibleLoader } from '../components/BibleLoader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  BarChart3, Users, TrendingUp, UserPlus, Calendar, DollarSign,
  Briefcase, FileText, CheckCircle, Clock, X, Filter,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from 'recharts';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  fetchMembers, fetchWorkforce, fetchNewcomers, fetchPrograms,
  fetchLedgerEntries, fetchStandaloneCollections, fetchTrainingPrograms,
} from '../api';
import { Member, WorkforceMember, Newcomer, Program, LedgerEntry, StandaloneCollection, TrainingProgram } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Section = 'overview' | 'members' | 'workforce' | 'newcomers' | 'programs' | 'finance';

type PeriodPreset = 'this-month' | 'last-3-months' | 'last-6-months' | 'this-year' | 'all-time' | 'custom';

function getPresetDates(preset: PeriodPreset): { from: string; to: string } {
  const today = new Date();
  const toStr = today.toISOString().split('T')[0];
  if (preset === 'this-month') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: from.toISOString().split('T')[0], to: toStr };
  }
  if (preset === 'last-3-months') {
    const from = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
    return { from: from.toISOString().split('T')[0], to: toStr };
  }
  if (preset === 'last-6-months') {
    const from = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
    return { from: from.toISOString().split('T')[0], to: toStr };
  }
  if (preset === 'this-year') {
    const from = new Date(today.getFullYear(), 0, 1);
    return { from: from.toISOString().split('T')[0], to: toStr };
  }
  return { from: '', to: '' };
}

function isInRange(dateStr: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  const d = dateStr.slice(0, 10); // YYYY-MM-DD
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

export function Analytics() {
  const { church, branches } = useChurch();
  const { currentAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>('overview');

  // Period filter
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('all-time');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handlePresetChange = (preset: PeriodPreset) => {
    setPeriodPreset(preset);
    if (preset !== 'custom') {
      const { from, to } = getPresetDates(preset);
      setDateFrom(from);
      setDateTo(to);
    }
  };

  const isFiltered = periodPreset !== 'all-time';

  // Data
  const [members, setMembers] = useState<Member[]>([]);
  const [workforce, setWorkforce] = useState<WorkforceMember[]>([]);
  const [newcomers, setNewcomers] = useState<Newcomer[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [fundraisers, setFundraisers] = useState<StandaloneCollection[]>([]);
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);

  const { showToast } = useToast();
  const showCopied = (msg: string) => showToast(msg);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const brId = branches[0]?.id;
      const [m, w, n, p, l, f, tp] = await Promise.all([
        fetchMembers(), fetchWorkforce(), fetchNewcomers(brId), fetchPrograms(brId),
        fetchLedgerEntries(), fetchStandaloneCollections(), fetchTrainingPrograms(),
      ]);
      setMembers(m as Member[]);
      setWorkforce(w as WorkforceMember[]);
      setNewcomers(n as Newcomer[]);
      setPrograms(p as Program[]);
      setLedger(l as LedgerEntry[]);
      setFundraisers(f as StandaloneCollection[]);
      setTrainingPrograms(tp as TrainingProgram[]);
    } catch (err) { console.error('Analytics load error:', err); }
    finally { setLoading(false); }
  }, [church.id, branches]);

  useEffect(() => { loadData(); }, [loadData]);

  // ──────── FILTERED DATA ────────

  // Apply period filter to date-sensitive data
  const filteredNewcomers = useMemo(() => {
    if (!isFiltered) return newcomers;
    return newcomers.filter(n => isInRange(n.visitDate, dateFrom, dateTo));
  }, [newcomers, isFiltered, dateFrom, dateTo]);

  const filteredLedger = useMemo(() => {
    if (!isFiltered) return ledger;
    return ledger.filter(e => isInRange(e.date, dateFrom, dateTo));
  }, [ledger, isFiltered, dateFrom, dateTo]);

  const filteredFundraisers = useMemo(() => {
    return fundraisers.map(f => ({
      name: f.name.length > 20 ? f.name.slice(0, 20) + '...' : f.name,
      target: f.targetAmount,
      raised: (!isFiltered ? f.entries : f.entries.filter(e => isInRange(e.date, dateFrom, dateTo))).reduce((s, e) => s + e.amount, 0),
    }));
  }, [fundraisers, isFiltered, dateFrom, dateTo]);

  // Members created within period (approximated via yearJoined for year filters, or createdAt if available)
  const filteredMembers = useMemo(() => {
    if (!isFiltered) return members;
    return members.filter(m => {
      // Use createdAt if available, otherwise approximate with yearJoined
      if ((m as any).createdAt) return isInRange((m as any).createdAt, dateFrom, dateTo);
      if (dateFrom) {
        const fromYear = parseInt(dateFrom.split('-')[0]);
        if (m.yearJoined < fromYear) return false;
      }
      if (dateTo) {
        const toYear = parseInt(dateTo.split('-')[0]);
        if (m.yearJoined > toYear) return false;
      }
      return true;
    });
  }, [members, isFiltered, dateFrom, dateTo]);

  // ──────── COMPUTED DATA ────────

  // Members by gender
  const genderData = useMemo(() => {
    const male = filteredMembers.filter(m => m.gender === 'male').length;
    const female = filteredMembers.filter(m => m.gender === 'female').length;
    return [{ name: 'Male', value: male }, { name: 'Female', value: female }];
  }, [filteredMembers]);

  // Members by join year
  const membersByYear = useMemo(() => {
    const map: Record<number, number> = {};
    filteredMembers.forEach(m => { map[m.yearJoined] = (map[m.yearJoined] || 0) + 1; });
    return Object.entries(map).sort(([a], [b]) => +a - +b).map(([year, count]) => ({ year, count }));
  }, [filteredMembers]);

  // Members by marital status
  const maritalData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredMembers.forEach(m => { map[m.maritalStatus] = (map[m.maritalStatus] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({ name: status.charAt(0).toUpperCase() + status.slice(1), value: count }));
  }, [filteredMembers]);

  // Newcomers by month
  const newcomersByMonth = useMemo(() => {
    const monthly = MONTHS.map((m) => ({ month: m, count: 0 }));
    filteredNewcomers.forEach(n => {
      const d = new Date(n.visitDate);
      monthly[d.getMonth()].count++;
    });
    return monthly;
  }, [filteredNewcomers]);

  // Newcomer conversion
  const newcomerConversion = useMemo(() => {
    const moved = filteredNewcomers.filter(n => n.movedToMemberId).length;
    const active = filteredNewcomers.filter(n => !n.movedToMemberId).length;
    return [{ name: 'Converted', value: moved }, { name: 'Active', value: active }];
  }, [filteredNewcomers]);

  // Workforce training progress (not date-filtered — shows current status always)
  const workforceProgress = useMemo(() => {
    let completed = 0, inProgress = 0, notStarted = 0;
    workforce.forEach(w => {
      w.roadmapMarkers.forEach(m => {
        if (m.status === 'completed') completed++;
        else if (m.status === 'in-progress') inProgress++;
        else notStarted++;
      });
    });
    return [
      { name: 'Completed', value: completed },
      { name: 'In Progress', value: inProgress },
      { name: 'Not Started', value: notStarted },
    ];
  }, [workforce]);

  // Programs by frequency
  const programsByType = useMemo(() => {
    const map: Record<string, number> = {};
    programs.forEach(p => { map[p.type] = (map[p.type] || 0) + 1; });
    return Object.entries(map).map(([type, count]) => ({ name: type.replace('-', ' ').replace(/^\w/, c => c.toUpperCase()), value: count }));
  }, [programs]);

  // Finance by month (income vs expense)
  const financeByMonth = useMemo(() => {
    const monthly = MONTHS.map((m) => ({ month: m, income: 0, expense: 0 }));
    filteredLedger.forEach(e => {
      const d = new Date(e.date);
      if (e.type === 'income') monthly[d.getMonth()].income += e.amount;
      else monthly[d.getMonth()].expense += e.amount;
    });
    return monthly;
  }, [filteredLedger]);

  // Finance totals
  const financeTotals = useMemo(() => {
    const income = filteredLedger.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expense = filteredLedger.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    return { income, expense, net: income - expense };
  }, [filteredLedger]);

  // Fundraiser progress (uses filteredFundraisers)
  const fundraiserData = useMemo(() =>
    filteredFundraisers.map(f => ({
      name: f.name.length > 20 ? f.name.slice(0, 20) + '...' : f.name,
      target: f.target,
      raised: f.raised,
    })),
  [filteredFundraisers]);

  const currency = church.currency || 'USD';
  const currencySymbol = currency === 'NGN' ? '\u20A6' : currency === 'GBP' ? '\u00A3' : currency === 'EUR' ? '\u20AC' : '$';

  // ──────── COPY DATA SNIPPET ────────
  const copyDataForReport = (label: string, value: string) => {
    const text = `\u{1F4CA} ${label}: ${value}`;
    navigator.clipboard.writeText(text).then(() => showCopied(`Copied "${label}" — paste it into your report.`));
  };

  // ──────── STAT CARD ────────
  const StatCard = ({ icon, label, value, color, snippet, detail }: { icon: React.ReactNode; label: string; value: string | number; color: string; snippet?: string; detail?: string }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
          {snippet && (
            <Button variant="ghost" size="sm" className="flex-shrink-0 p-1.5 h-auto text-gray-400 hover:text-gray-600" title="Copy for report" onClick={() => copyDataForReport(label, String(value))}>
              <FileText className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {detail && <p className="text-[11px] sm:text-xs text-gray-400 mt-1">{detail}</p>}
      </CardContent>
    </Card>
  );

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'members', label: 'Members', icon: <Users className="w-4 h-4" /> },
    { id: 'workforce', label: 'Workforce', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'newcomers', label: 'Follow-Up', icon: <UserPlus className="w-4 h-4" /> },
    { id: 'programs', label: 'Programs', icon: <Calendar className="w-4 h-4" /> },
    { id: 'finance', label: 'Finance', icon: <DollarSign className="w-4 h-4" /> },
  ];

  return (
    <Layout>
      <PageHeader
        title="Analytics"
        description="Visual insights across every area of your church. Use the section filters to drill into specific data. Click the document icon on any stat to copy it for your reports."
      />

      <div className="p-4 md:p-6 space-y-6">

        {/* Section switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {sections.map(s => (
            <Button
              key={s.id}
              variant={section === s.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSection(s.id)}
              className="flex items-center gap-1.5"
            >
              {s.icon}{s.label}
            </Button>
          ))}
        </div>

        {/* Period filter bar */}
        <Card className="border-gray-200">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-500 mr-1">Period:</span>
              {([
                { id: 'all-time', label: 'All Time' },
                { id: 'this-month', label: 'This Month' },
                { id: 'last-3-months', label: 'Last 3 Months' },
                { id: 'last-6-months', label: 'Last 6 Months' },
                { id: 'this-year', label: 'This Year' },
                { id: 'custom', label: 'Custom' },
              ] as { id: PeriodPreset; label: string }[]).map(p => (
                <Button
                  key={p.id}
                  variant={periodPreset === p.id ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs h-7 px-2.5"
                  onClick={() => handlePresetChange(p.id)}
                >
                  {p.label}
                </Button>
              ))}
              {periodPreset === 'custom' && (
                <div className="flex items-center gap-2 ml-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPeriodPreset('custom'); }}
                    className="h-7 text-xs w-36"
                  />
                  <span className="text-xs text-gray-400">to</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPeriodPreset('custom'); }}
                    className="h-7 text-xs w-36"
                  />
                </div>
              )}
              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-2 text-gray-400 hover:text-gray-600"
                  onClick={() => handlePresetChange('all-time')}
                >
                  <X className="w-3 h-3 mr-1" /> Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {loading ? <BibleLoader message="Crunching numbers..." /> : (
          <>
            {/* ═══ OVERVIEW ═══ */}
            {section === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label="Total Members" value={filteredMembers.length} color="bg-blue-100" snippet="yes" detail={`${genderData[0]?.value || 0} male, ${genderData[1]?.value || 0} female`} />
                  <StatCard icon={<Briefcase className="w-5 h-5 text-green-600" />} label="Workforce" value={workforce.length} color="bg-green-100" snippet="yes" detail={members.length > 0 ? `${Math.round((workforce.length / members.length) * 100)}% of members` : 'No members yet'} />
                  <StatCard icon={<UserPlus className="w-5 h-5 text-purple-600" />} label="Active Newcomers" value={filteredNewcomers.filter(n => !n.movedToMemberId).length} color="bg-purple-100" snippet="yes" detail={`${newcomers.filter(n => n.movedToMemberId).length} converted to members`} />
                  <StatCard icon={<Calendar className="w-5 h-5 text-orange-600" />} label="Programs" value={programs.length} color="bg-orange-100" snippet="yes" detail={`${programs.filter(p => p.type === 'weekly').length} weekly, ${programs.filter(p => p.type === 'one-time').length} one-time`} />
                  <StatCard icon={<TrendingUp className="w-5 h-5 text-emerald-600" />} label="Net Income" value={`${currencySymbol}${financeTotals.net.toLocaleString()}`} color="bg-emerald-100" snippet="yes" detail={`${currencySymbol}${financeTotals.income.toLocaleString()} in — ${currencySymbol}${financeTotals.expense.toLocaleString()} out`} />
                  <StatCard icon={<DollarSign className="w-5 h-5 text-red-600" />} label="Fundraisers" value={fundraisers.length} color="bg-red-100" snippet="yes" detail={`${currencySymbol}${filteredFundraisers.reduce((s, f) => s + f.raised, 0).toLocaleString()} total raised`} />
                </div>

                {/* Quick charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Income vs Expenses (This Year)</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={financeByMonth}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="income" fill="#bbf7d0" stroke="#16a34a" name="Income" />
                          <Area type="monotone" dataKey="expense" fill="#fecaca" stroke="#dc2626" name="Expenses" />
                          <Legend />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-sm">Newcomers This Year</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={newcomersByMonth}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Newcomers" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ═══ MEMBERS ═══ */}
            {section === 'members' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={<Users className="w-6 h-6 text-blue-600" />} label="Total Members" value={members.length} color="bg-blue-100" snippet="yes" detail={`Across ${branches.length} branch${branches.length !== 1 ? 'es' : ''}`} />
                  <StatCard icon={<Users className="w-6 h-6 text-cyan-600" />} label="Male Members" value={genderData[0]?.value || 0} color="bg-cyan-100" snippet="yes" detail={members.length > 0 ? `${Math.round(((genderData[0]?.value || 0) / members.length) * 100)}% of total` : ''} />
                  <StatCard icon={<Users className="w-6 h-6 text-pink-600" />} label="Female Members" value={genderData[1]?.value || 0} color="bg-pink-100" snippet="yes" detail={members.length > 0 ? `${Math.round(((genderData[1]?.value || 0) / members.length) * 100)}% of total` : ''} />
                  <StatCard icon={<TrendingUp className="w-6 h-6 text-green-600" />} label="Workforce Ratio" value={members.length > 0 ? `${Math.round((workforce.length / members.length) * 100)}%` : '0%'} color="bg-green-100" snippet="yes" detail={`${workforce.length} workers out of ${members.length}`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Gender Distribution</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={genderData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {genderData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-sm">Marital Status</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={maritalData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {maritalData.map((_, i) => <Cell key={i} fill={COLORS[i + 2]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-sm">Members by Join Year</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={membersByYear}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Joined" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ═══ WORKFORCE ═══ */}
            {section === 'workforce' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={<Briefcase className="w-6 h-6 text-green-600" />} label="Total Workers" value={workforce.length} color="bg-green-100" snippet="yes" detail={members.length > 0 ? `${Math.round((workforce.length / members.length) * 100)}% of members` : ''} />
                  <StatCard icon={<TrendingUp className="w-6 h-6 text-blue-600" />} label="Training Programs" value={trainingPrograms.length} color="bg-blue-100" snippet="yes" detail="Programs available for assignment" />
                  <StatCard icon={<CheckCircle className="w-6 h-6 text-emerald-600" />} label="Completed Trainings" value={workforceProgress.find(x => x.name === 'Completed')?.value || 0} color="bg-emerald-100" snippet="yes" detail="Milestones marked as done" />
                  <StatCard icon={<Clock className="w-6 h-6 text-amber-600" />} label="In Progress" value={workforceProgress.find(x => x.name === 'In Progress')?.value || 0} color="bg-amber-100" snippet="yes" detail="Currently being worked on" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Training Progress</CardTitle></CardHeader>
                    <CardContent>
                      {workforceProgress.every(x => x.value === 0) ? (
                        <p className="text-sm text-gray-400 text-center py-8">No training assignments yet. Assign programs to workforce members to see progress here.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie data={workforceProgress.filter(x => x.value > 0)} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                              {workforceProgress.map((_, i) => <Cell key={i} fill={[COLORS[1], COLORS[0], COLORS[6]][i]} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-sm">Workers per Training Program</CardTitle></CardHeader>
                    <CardContent>
                      {trainingPrograms.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">No training programs created yet.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={trainingPrograms.map(tp => ({
                            name: tp.name.length > 15 ? tp.name.slice(0, 15) + '...' : tp.name,
                            workers: workforce.filter(w => w.roadmapMarkers.some(m => m.programId === tp.id)).length,
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="workers" fill="#10b981" radius={[4, 4, 0, 0]} name="Workers" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ═══ NEWCOMERS ═══ */}
            {section === 'newcomers' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={<UserPlus className="w-6 h-6 text-purple-600" />} label="Total Newcomers" value={newcomers.length} color="bg-purple-100" snippet="yes" detail="All-time visitor count" />
                  <StatCard icon={<Users className="w-6 h-6 text-green-600" />} label="Converted to Members" value={newcomers.filter(n => n.movedToMemberId).length} color="bg-green-100" snippet="yes" detail="Successfully moved to membership" />
                  <StatCard icon={<Clock className="w-6 h-6 text-blue-600" />} label="Active Newcomers" value={newcomers.filter(n => !n.movedToMemberId).length} color="bg-blue-100" snippet="yes" detail="Still in follow-up pipeline" />
                  <StatCard icon={<TrendingUp className="w-6 h-6 text-amber-600" />} label="Conversion Rate" value={newcomers.length > 0 ? `${Math.round((newcomers.filter(n => n.movedToMemberId).length / newcomers.length) * 100)}%` : 'N/A'} color="bg-amber-100" snippet="yes" detail="Newcomers to members ratio" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Newcomers by Month (This Year)</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={newcomersByMonth}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} name="Newcomers" dot />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-sm">Conversion Funnel</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={newcomerConversion.filter(x => x.value > 0)} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            <Cell fill="#10b981" />
                            <Cell fill="#8b5cf6" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Newcomer types */}
                <Card>
                  <CardHeader><CardTitle className="text-sm">Visit Type Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span className="text-sm text-gray-600">First Timers: <strong>{newcomers.filter(n => n.visitType === 'first-timer').length}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm text-gray-600">Second Timers: <strong>{newcomers.filter(n => n.visitType === 'second-timer').length}</strong></span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ═══ PROGRAMS ═══ */}
            {section === 'programs' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard icon={<Calendar className="w-6 h-6 text-orange-600" />} label="Total Programs" value={programs.length} color="bg-orange-100" snippet="yes" detail={`Across ${new Set(programs.flatMap(p => p.departmentIds)).size} departments`} />
                  <StatCard icon={<Clock className="w-6 h-6 text-blue-600" />} label="Weekly Programs" value={programs.filter(p => p.type === 'weekly').length} color="bg-blue-100" snippet="yes" detail="Recurring weekly schedules" />
                  <StatCard icon={<Calendar className="w-6 h-6 text-green-600" />} label="One-Time Events" value={programs.filter(p => p.type === 'one-time').length} color="bg-green-100" snippet="yes" detail="Special events and conferences" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Programs by Frequency Type</CardTitle></CardHeader>
                    <CardContent>
                      {programsByType.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">No programs created yet.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie data={programsByType} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                              {programsByType.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-sm">Programs List</CardTitle></CardHeader>
                    <CardContent>
                      {programs.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">No programs to display.</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {programs.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{p.name}</p>
                                <Badge variant="outline" className="text-[10px]">{p.type}</Badge>
                              </div>
                              <span className="text-xs text-gray-400">{p.departmentIds.length} dept{p.departmentIds.length !== 1 ? 's' : ''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ═══ FINANCE ═══ */}
            {section === 'finance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={<TrendingUp className="w-6 h-6 text-green-600" />} label="Total Income" value={`${currencySymbol}${financeTotals.income.toLocaleString()}`} color="bg-green-100" snippet="yes" detail={`${filteredLedger.filter(e => e.type === 'income').length} income entries`} />
                  <StatCard icon={<DollarSign className="w-6 h-6 text-red-600" />} label="Total Expenses" value={`${currencySymbol}${financeTotals.expense.toLocaleString()}`} color="bg-red-100" snippet="yes" detail={`${filteredLedger.filter(e => e.type === 'expense').length} expense entries`} />
                  <StatCard icon={<BarChart3 className="w-6 h-6 text-blue-600" />} label="Net Balance" value={`${currencySymbol}${financeTotals.net.toLocaleString()}`} color="bg-blue-100" snippet="yes" detail={financeTotals.net >= 0 ? 'Positive balance' : 'Negative balance'} />
                  <StatCard icon={<Calendar className="w-6 h-6 text-purple-600" />} label="Ledger Entries" value={ledger.length} color="bg-purple-100" snippet="yes" detail={`${fundraisers.length} fundraiser${fundraisers.length !== 1 ? 's' : ''} active`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Monthly Income vs Expenses</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={financeByMonth}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(val: number) => `${currencySymbol}${val.toLocaleString()}`} />
                          <Legend />
                          <Bar dataKey="income" fill="#16a34a" radius={[4, 4, 0, 0]} name="Income" />
                          <Bar dataKey="expense" fill="#dc2626" radius={[4, 4, 0, 0]} name="Expenses" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-sm">Fundraiser Progress</CardTitle></CardHeader>
                    <CardContent>
                      {fundraiserData.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">No fundraisers created yet.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={fundraiserData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tick={{ fontSize: 10 }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                            <Tooltip formatter={(val: number) => `${currencySymbol}${val.toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="target" fill="#e5e7eb" name="Target" />
                            <Bar dataKey="raised" fill="#3b82f6" name="Raised" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tip card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Use analytics data in your reports</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Click the <FileText className="w-3 h-3 inline" /> icon on any stat card to copy the data to your clipboard. Then paste it directly into your report when composing from the Reports page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}