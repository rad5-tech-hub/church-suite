import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp, X,
  Building2, Layers, Box, Users, UsersRound, TrendingUp, Wallet, Settings, Sparkles,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { useAuth } from '../context/AuthContext';
import {
  fetchDepartments, fetchUnits, fetchAdmins, fetchMembers,
  fetchWorkforce, fetchSMSWallet,
} from '../api';

interface ChecklistItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  done: boolean;
  link: string;
  /** Only show for multi-branch churches */
  multiBranchOnly?: boolean;
  tutorial: string;
}

export function SetupChecklist() {
  const { church, branches } = useChurch();
  const { currentAdmin } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('churchset_checklist_dismissed') === 'true'; } catch { return false; }
  });
  const [openTutorial, setOpenTutorial] = useState<string | null>(null);

  const loadChecklist = useCallback(async () => {
    try {
      const [deps, uns, admins, mems, wf, wallet] = await Promise.all([
        fetchDepartments(), fetchUnits(), fetchAdmins(),
        fetchMembers(), fetchWorkforce(), fetchSMSWallet(),
      ]);

      const cId = church.id;
      const churchAdmins = (admins as any[]).filter(a => a.churchId === cId && !a.isSuperAdmin);
      const churchMembers = (mems as any[]).filter(m => m.churchId === cId);
      const churchWorkforce = (wf as any[]).filter(w => w.churchId === cId);
      const walletBalance = (wallet as any)?.balance ?? 0;
      const hasChurchSettings = !!(church.currency || church.address || church.phone);

      const list: ChecklistItem[] = [];

      if (church.type === 'multi') {
        list.push({
          id: 'branch',
          label: 'Create your first branch',
          icon: <Building2 className="w-4 h-4" />,
          done: branches.length > 0,
          link: '/branches',
          multiBranchOnly: true,
          tutorial: "Head over to the Branches page and click \"Add Branch\" — give it a name like \"Main Campus\" or \"North Branch.\" This is where your church's different locations live. You already have a headquarters branch if you set one up during onboarding, so feel free to add more!",
        });
      }

      list.push({
        id: 'department',
        label: 'Create a department or outreach',
        icon: <Layers className="w-4 h-4" />,
        done: (deps as any[]).length > 0,
        link: '/departments',
        tutorial: "Go to the Departments page and hit \"Add Department.\" Think of departments as your internal teams (like the Prayer Team, Choir, or Ushering) and outreaches as your external missions (like Prison Ministry or Community Feeding). Name it, pick the type, and you're good to go!",
      });

      list.push({
        id: 'unit',
        label: 'Create a unit inside a department',
        icon: <Box className="w-4 h-4" />,
        done: (uns as any[]).length > 0,
        link: '/units',
        tutorial: "Units sit inside departments — for example, your Choir department might have a \"Soprano\" unit and a \"Tenor\" unit. Head to the Units page, pick which department it belongs to, and give it a name. This helps you organize people at a more detailed level.",
      });

      list.push({
        id: 'admin',
        label: 'Add your first administrator',
        icon: <Users className="w-4 h-4" />,
        done: churchAdmins.length > 0,
        link: '/admins',
        tutorial: "Go to Administrators and click \"Add Administrator.\" Fill in their name and email, pick their access level (church, branch, department, or unit), then assign them a role. A temporary password will be generated — share it with them so they can log in. You're the super admin, so they'll have whatever permissions their role allows.",
      });

      list.push({
        id: 'member',
        label: 'Add your first church member',
        icon: <UsersRound className="w-4 h-4" />,
        done: churchMembers.length > 0,
        link: '/members',
        tutorial: "Head to the Members page and click \"Add Member.\" Fill in their basic details — name, phone number, gender, year they joined, and so on. Members are the heart of your church database. Once they're in, you can assign them to the workforce, track their attendance, and much more.",
      });

      list.push({
        id: 'workforce',
        label: 'Add your first workforce member',
        icon: <TrendingUp className="w-4 h-4" />,
        done: churchWorkforce.length > 0,
        link: '/workforce',
        tutorial: "Go to the Workforce page and click \"Add to Workforce.\" Search for a member you've already added, then assign them to a department (and optionally a unit). Workforce members are your active volunteers and workers — you can track their training progress and attendance from here.",
      });

      list.push({
        id: 'wallet',
        label: 'Fund your SMS wallet',
        icon: <Wallet className="w-4 h-4" />,
        done: walletBalance > 0,
        link: '/wallet',
        tutorial: "Visit the Wallet page under Communication to see your SMS credit balance. Top up your wallet so you can send bulk SMS messages to members, newcomers, or custom groups. Each message costs a credit, so make sure you're topped up before sending!",
      });

      list.push({
        id: 'settings',
        label: 'Complete your church settings',
        icon: <Settings className="w-4 h-4" />,
        done: hasChurchSettings,
        link: '/profile',
        tutorial: "Go to Settings (or click your profile at the top) to fill in your church's address, phone number, currency, and reporting mode. These settings affect how the entire platform behaves — for example, the currency you choose is used everywhere in Finance, and the reporting mode controls how reports flow between admins.",
      });

      setItems(list);
    } catch (err) {
      console.error('Failed to load checklist:', err);
    } finally {
      setLoading(false);
    }
  }, [church, branches]);

  useEffect(() => { loadChecklist(); }, [loadChecklist]);

  const completedCount = items.filter(i => i.done).length;
  const totalCount = items.length;
  const allDone = completedCount === totalCount && totalCount > 0;

  if (dismissed || loading || totalCount === 0 || allDone) return null;

  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const circumference = 2 * Math.PI * 18;
  const dashOffset = circumference * (1 - progress);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('churchset_checklist_dismissed', 'true');
  };

  return (
    <div className="mx-6 mt-4 mb-2" data-tour="setup-checklist">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl overflow-hidden">
        {/* Header — always visible */}
        <div className="flex items-center justify-between px-4 py-3">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setExpanded(!expanded)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
            className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          >
            {/* Circular progress */}
            <div className="relative w-11 h-11 flex-shrink-0">
              <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="22" cy="22" r="18" fill="none"
                  stroke="#3b82f6" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-700">
                {completedCount}/{totalCount}
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Getting Started Checklist
              </p>
              <p className="text-xs text-gray-500">
                {completedCount === 0
                  ? "Let's set up your church step by step — here's what to do first."
                  : `Nice work! You've completed ${completedCount} of ${totalCount} steps so far.`}
              </p>
            </div>
            <div className="ml-auto mr-2">
              {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 flex-shrink-0"
            title="Dismiss checklist"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expanded items */}
        {expanded && (
          <div className="px-4 pb-4 space-y-1">
            {items.map(item => (
              <div key={item.id}>
                <div className="flex items-center gap-3 group">
                  {item.done ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  )}
                  <Link
                    to={item.link}
                    className={`flex-1 flex items-center gap-2 py-2 text-sm rounded-md transition-colors ${
                      item.done ? 'text-gray-400 line-through' : 'text-gray-800 hover:text-blue-700'
                    }`}
                  >
                    <span className={item.done ? 'text-gray-300' : 'text-gray-500'}>{item.icon}</span>
                    {item.label}
                  </Link>
                  {!item.done && (
                    <button
                      onClick={() => setOpenTutorial(openTutorial === item.id ? null : item.id)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex-shrink-0"
                    >
                      {openTutorial === item.id ? 'Hide' : 'How?'}
                    </button>
                  )}
                </div>
                {openTutorial === item.id && !item.done && (
                  <div className="ml-8 mb-2 p-3 bg-white/80 rounded-lg border border-blue-100 text-xs text-gray-600 leading-relaxed animate-in slide-in-from-top-1 fade-in duration-200">
                    {item.tutorial}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}