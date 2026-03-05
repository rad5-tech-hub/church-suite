import { useState, useEffect, useCallback } from 'react';
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
  ArrowRight,
  Sparkles,
  Crown,
  Inbox
} from 'lucide-react';
import { Link } from 'react-router';
import { useChurch } from '../context/ChurchContext';
import { useAuth } from '../context/AuthContext';
import { CURRENCIES } from './Finance';
import { ProductTour } from '../components/ProductTour';
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
  const { church, branches } = useChurch();
  const { currentAdmin } = useAuth();
  const adminLevel = currentAdmin?.level || 'church';

  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);
  const [workforceCount, setWorkforceCount] = useState(0);
  const [programCount, setProgramCount] = useState(0);
  const [newcomerCount, setNewcomerCount] = useState(0);
  const [deptCount, setDeptCount] = useState(0);
  const [unitCount, setUnitCount] = useState(0);
  const [recentCollections, setRecentCollections] = useState<any[]>([]);

  const currSymbol = CURRENCIES.find(c => c.code === church.currency)?.symbol || '$';

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

      const now = new Date();
      setNewcomerCount(
        (newcomers as any[]).filter(n => {
          const vd = new Date(n.visitDate);
          return vd.getMonth() === now.getMonth() && vd.getFullYear() === now.getFullYear();
        }).length
      );

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
      label: 'Newcomers (This Month)',
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
        description="Welcome back! Here's an overview of your church activities and key metrics."
      />
      <div className="p-4 md:p-6 space-y-6">
        {loading ? (
          <BibleLoader message="Loading dashboard..." />
        ) : (
          <>
            {/* Upgrade Prompt for Single Church Users */}
            {church.type === 'single' && adminLevel === 'church' && (
              <Card className="bg-gradient-to-r from-purple-500 to-blue-600 border-0 text-white">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm flex-shrink-0">
                        <Crown className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1">Ready to Expand?</h3>
                        <p className="text-white/90 text-sm mb-3">
                          Upgrade to Multi-Branch and manage multiple church locations from one dashboard. 
                          Perfect for growing churches with expansion plans.
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded">
                            <Sparkles className="w-3 h-3" />
                            <span>Unlimited Branches</span>
                          </div>
                          <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded">
                            <Sparkles className="w-3 h-3" />
                            <span>Cross-Branch Reports</span>
                          </div>
                          <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded">
                            <Sparkles className="w-3 h-3" />
                            <span>Centralized Control</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Link to="/subscription" className="w-full md:w-auto">
                      <Button className="bg-white text-purple-600 hover:bg-gray-100 font-semibold w-full md:w-auto whitespace-nowrap">
                        Upgrade Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

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

                {/* Structure Overview (Church Admin Only) */}
                {adminLevel === 'church' && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Church Structure</CardTitle>
                      <CardDescription>Overview of your organizational structure</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className={`grid grid-cols-1 gap-4 ${church.type === 'multi' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                        {church.type === 'multi' && branches.length > 0 && (
                          <Link to="/branches">
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                              <Building2 className="w-8 h-8 text-blue-600 mb-2" />
                              <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
                              <p className="text-sm text-gray-600">Branches</p>
                            </div>
                          </Link>
                        )}
                        <Link to="/departments">
                          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                            <Layers className="w-8 h-8 text-purple-600 mb-2" />
                            <p className="text-2xl font-bold text-gray-900">{deptCount}</p>
                            <p className="text-sm text-gray-600">Depts & Outreaches</p>
                          </div>
                        </Link>
                        <Link to="/units">
                          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                            <Users className="w-8 h-8 text-green-600 mb-2" />
                            <p className="text-2xl font-bold text-gray-900">{unitCount}</p>
                            <p className="text-sm text-gray-600">Units</p>
                          </div>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}
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