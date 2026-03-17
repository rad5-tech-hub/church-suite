import { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { BibleLoader } from '../components/BibleLoader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Users,
  UsersRound,
  Calendar,
  DollarSign,
  UserPlus,
  TrendingUp,
  Building2,
  Layers,
  Filter,
  ArrowRight,
  Inbox
} from 'lucide-react';
import { Link } from 'react-router';
import { useChurch } from '../context/ChurchContext';
import { useAuth } from '../context/AuthContext';
import { CURRENCIES } from '../constants/currencies';
import { ProductTour } from '../components/ProductTour';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  fetchMembers,
  fetchWorkforce,
  fetchPrograms,
  fetchNewcomers,
  fetchCollections,
  fetchDepartments,
  fetchUnits,
  fetchLedgerEntries,
} from '../api';

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
  const [deptCount, setDeptCount] = useState(0);
  const [unitCount, setUnitCount] = useState(0);
  const [recentCollections, setRecentCollections] = useState<any[]>([]);

  const currSymbol = CURRENCIES.find(c => c.code === church.currency)?.symbol || '₦';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const brId = branches[0]?.id;
      const [mems, wf, progs, newcomers, colls, deps, uns, ledger] = await Promise.all([
        fetchMembers(),
        fetchWorkforce(),
        fetchPrograms(brId),
        fetchNewcomers(brId),
        fetchCollections(brId),
        fetchDepartments(),
        fetchUnits(),
        fetchLedgerEntries(),
      ]);

      setMemberCount((mems as any[]).length);
      setWorkforceCount((wf as any[]).length);
      setProgramCount((progs as any[]).length);

      setAllNewcomers(newcomers as any[]);

      setDeptCount((deps as any[]).length);
      setUnitCount((uns as any[]).length);

      // Show recent ledger entries as "collections summary"
      const churchLedger = (ledger as any[])
        .filter(e => e.type === 'income')
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);
      
      if (churchLedger.length > 0) {
        setRecentCollections(churchLedger);
      } else {
        // Fallback to program collections
        setRecentCollections(
          (colls as any[])
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3)
        );
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [church.id, branches]);

  useEffect(() => { loadData(); }, [loadData]);

  const newcomerLabelMap: Record<typeof filterPeriod, string> = {
    'this-week': 'Newcomers This Week',
    'this-month': 'Newcomers This Month',
    'this-year': 'Newcomers This Year',
    'all-time': 'Total Newcomers',
  };

  const newcomerCount = useMemo(() => {
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
    } else {
      return allNewcomers.length;
    }
  }, [allNewcomers, filterPeriod]);

  const stats = [
    {
      label: 'Total Members',
      value: memberCount.toString(),
      icon: <UsersRound className="w-6 h-6" />,
      color: 'bg-blue-500',
      link: '/members'
    },
    {
      label: 'Workforce',
      value: workforceCount.toString(),
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-purple-500',
      link: '/workforce'
    },
    {
      label: 'Programs',
      value: programCount.toString(),
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-green-500',
      link: '/programs'
    },
    {
      label: newcomerLabelMap[filterPeriod],
      value: newcomerCount.toString(),
      icon: <UserPlus className="w-6 h-6" />,
      color: 'bg-orange-500',
      link: '/follow-up'
    }
  ];

  const quickActions = [
    {
      title: 'Add New Member',
      description: 'Register a new church member',
      icon: <UsersRound className="w-5 h-5" />,
      link: '/members',
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Create Program',
      description: 'Schedule a new event or program',
      icon: <Calendar className="w-5 h-5" />,
      link: '/programs',
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'Record Collection',
      description: 'Add tithes or offerings',
      icon: <DollarSign className="w-5 h-5" />,
      link: '/finance',
      color: 'text-purple-600 bg-purple-50'
    },
    {
      title: 'Follow Up Newcomers',
      description: 'Reach out to first-timers',
      icon: <UserPlus className="w-5 h-5" />,
      link: '/follow-up',
      color: 'text-orange-600 bg-orange-50'
    }
  ];

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        description="Track your church's growth at a glance — attendance, finances, and newcomers."
      />
      <div className="p-4 md:p-6 space-y-6">
        {loading ? (
          <BibleLoader message="Loading dashboard..." />
        ) : (
          <>
            {/* Church Structure */}
            {adminLevel === 'church' && (
              <div>
                <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">Church Structure</p>
                <div className={`grid grid-cols-1 gap-4 ${isHeadQuarter ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                  {isHeadQuarter && (
                    <Link to="/branches">
                      <div className="bg-white rounded-xl border-l-4 border-blue-500 p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <Building2 className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
                          <p className="text-sm text-gray-500">Branches</p>
                        </div>
                      </div>
                    </Link>
                  )}
                  <Link to="/departments">
                    <div className="bg-white rounded-xl border-l-4 border-purple-500 p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <Layers className="w-6 h-6 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{deptCount}</p>
                        <p className="text-sm text-gray-500">Depts & Outreaches</p>
                      </div>
                    </div>
                  </Link>
                  <Link to="/units">
                    <div className="bg-white rounded-xl border-l-4 border-green-500 p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <Users className="w-6 h-6 text-green-500" />
                      </div>
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
                <Filter className="w-4 h-4" />
                Filters
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
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
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
                        <div className={`${stat.color} text-white p-3 rounded-lg`}>
                          {stat.icon}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-2" data-tour="dashboard-quick-actions">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks you can perform right now</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {quickActions.map((action, index) => (
                        <Link key={index} to={action.link}>
                          <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${action.color}`}>
                                {action.icon}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {action.title}
                                </h3>
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
                    <CardDescription>Latest financial entries</CardDescription>
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
                              <p className="text-xs text-gray-500">
                                {new Date(entry.date).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="font-semibold text-green-600">
                              {currSymbol}{(entry.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        ))}
                        <div className="pt-3 border-t">
                          <Link to="/finance" className="text-sm text-blue-600 hover:underline">
                            View all finances &rarr;
                          </Link>
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
