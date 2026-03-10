import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { BibleLoader } from '../components/BibleLoader';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  FileText, Plus, Send, Inbox, SendHorizonal, Download, Printer, Search, X,
  CheckCircle, Loader2, Paperclip, Image, Users, Briefcase, UserPlus, Calendar,
  DollarSign, Database, Clock, Star, Reply, Eye, EyeOff, MailPlus, Filter,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Report, ReportDataInsert, ReportAttachment, ReportReply, Admin, AdminLevel, Department, Unit } from '../types';
import {
  fetchReports, saveReports, fetchAdmins, fetchMembers, fetchWorkforce,
  fetchNewcomers, fetchPrograms, fetchLedgerEntries, fetchDepartments, fetchUnits,
} from '../api';
import { resolvePrimaryBranchId } from '../utils/scope';

const LEVEL_HIERARCHY: AdminLevel[] = ['unit', 'department', 'branch', 'church'];
const LEVEL_LABELS: Record<AdminLevel, string> = { unit: 'Unit Head', department: 'Dept. Head', branch: 'Branch Head', church: 'Super Admin' };

export function Reports() {
  const { church, branches } = useChurch();
  const { currentAdmin } = useAuth();
  const branchId = resolvePrimaryBranchId(branches, currentAdmin);
  const departmentId = currentAdmin?.departmentId || currentAdmin?.departmentIds?.[0];

  const [reports, setReports] = useState<Report[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Compose
  const [composeOpen, setComposeOpen] = useState(false);
  const [cTitle, setCTitle] = useState('');
  const [cContent, setCContent] = useState('');
  const [cRecipientId, setCRecipientId] = useState('');
  const [cDataInserts, setCDataInserts] = useState<ReportDataInsert[]>([]);
  const [cAttachments, setCAttachments] = useState<ReportAttachment[]>([]);
  const [showDataPicker, setShowDataPicker] = useState(false);

  // Report reference picker for super admin compose
  const [showReportRefPicker, setShowReportRefPicker] = useState(false);
  const [reportRefSearch, setReportRefSearch] = useState('');

  // View
  const [viewReport, setViewReport] = useState<Report | null>(null);

  // Reply
  const [replyContent, setReplyContent] = useState('');
  const [replyOpen, setReplyOpen] = useState(false);

  // Tabs & filters
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [starFilter, setStarFilter] = useState(false);
  // Organizational filters (for multi-branch or any structured church)
  const [filterBranchId, setFilterBranchId] = useState('');
  const [filterDeptId, setFilterDeptId] = useState('');
  const [filterUnitId, setFilterUnitId] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [showOrgFilters, setShowOrgFilters] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const roleBranchIds = Array.from(new Set([
        ...branches.map((branch) => branch.id),
        ...(currentAdmin?.branchIds || []),
        currentAdmin?.branchId,
      ].filter(Boolean)));
      const adminPromises = roleBranchIds.length > 0
        ? roleBranchIds.map((bid) => fetchAdmins(bid))
        : [fetchAdmins()];

      const [rpts, adminsData, deps, uns] = await Promise.all([
        fetchReports(), Promise.all(adminPromises), fetchDepartments(), fetchUnits(),
      ]);
      const mergedAdmins = Array.from(new Map(adminsData.flat().map((admin: Admin) => [admin.id, admin])).values());
      setReports(rpts as Report[]);
      setAdmins((mergedAdmins as Admin[]).filter(a => a.status === 'active'));
      setDepartments(deps as Department[]);
      setUnits(uns as Unit[]);
    } catch (err) { console.error('Failed to load reports:', err); }
    finally { setLoading(false); }
  }, [church.id, branches, currentAdmin]);

  useEffect(() => { loadData(); }, [loadData]);

  // ──────── HIERARCHY ────────
  const isSuperAdmin = currentAdmin?.isSuperAdmin || currentAdmin?.level === 'church';

  const getEligibleRecipients = (): Admin[] => {
    if (!currentAdmin) return [];
    // Super admin can send to ANY administrator below them
    if (isSuperAdmin) {
      return admins.filter(a => a.id !== currentAdmin.id);
    }
    const mode = church.reportingMode || 'hierarchical';
    const myLevelIdx = LEVEL_HIERARCHY.indexOf(currentAdmin.level);
    return admins.filter(a => {
      if (a.id === currentAdmin.id) return false;
      const theirIdx = LEVEL_HIERARCHY.indexOf(a.level);
      if (mode === 'hierarchical') return theirIdx === myLevelIdx + 1;
      else return theirIdx > myLevelIdx;
    });
  };

  const eligibleRecipients = getEligibleRecipients();

  const inbox = useMemo(() => {
    if (!currentAdmin) return [];
    return reports.filter(r => r.recipientId === currentAdmin.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reports, currentAdmin]);

  const sent = useMemo(() => {
    if (!currentAdmin) return [];
    return reports.filter(r => r.authorId === currentAdmin.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reports, currentAdmin]);

  const starred = useMemo(() => {
    if (!currentAdmin) return [];
    return reports.filter(r => r.isStarred && (r.recipientId === currentAdmin.id || r.authorId === currentAdmin.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reports, currentAdmin]);

  const unreadCount = inbox.filter(r => !r.isRead).length;

  // ──────── REPORT REFERENCE (super admin) ───────
  const referenceableReports = useMemo(() => {
    if (!isSuperAdmin) return [];
    return inbox.filter(r =>
      !reportRefSearch ||
      r.title.toLowerCase().includes(reportRefSearch.toLowerCase()) ||
      r.authorName.toLowerCase().includes(reportRefSearch.toLowerCase())
    ).slice(0, 10);
  }, [inbox, isSuperAdmin, reportRefSearch]);

  const insertReportReference = (report: Report) => {
    const snippet = report.content.slice(0, 200).replace(/\n/g, ' ');
    const dataStr = report.dataInserts?.map(d => `${d.label}: ${d.value}`).join(', ') || '';
    const refText = `\n\n📋 Referencing report: "${report.title}" from ${report.authorName} (${LEVEL_LABELS[report.authorLevel]}, ${new Date(report.createdAt).toLocaleDateString()}):\n> "${snippet}${report.content.length > 200 ? '...' : ''}"${dataStr ? `\n> Data: ${dataStr}` : ''}\n`;
    setCContent(prev => prev + refText);
    const insert: ReportDataInsert = {
      id: `di-ref-${Date.now()}`,
      type: 'report-reference' as any,
      label: `Ref: ${report.title}`,
      value: `From ${report.authorName} — "${snippet.slice(0, 80)}..."`,
    };
    setCDataInserts(prev => [...prev, insert]);
    setShowReportRefPicker(false);
    setReportRefSearch('');
  };

  // ──────── ORG FILTER HELPERS ────────
  const matchesOrgFilter = (report: Report, isSentTab?: boolean) => {
    // Get the relevant admin — for inbox we filter by author, for sent by recipient
    const relevantAdminId = isSentTab ? report.recipientId : report.authorId;
    const admin = admins.find(a => a.id === relevantAdminId);
    if (!admin) return true; // If admin not found, don't filter out

    if (filterLevel && admin.level !== filterLevel) return false;
    if (filterBranchId && admin.branchId !== filterBranchId) return false;
    if (filterDeptId && admin.departmentId !== filterDeptId) return false;
    if (filterUnitId && admin.unitId !== filterUnitId) return false;
    return true;
  };

  const hasActiveOrgFilter = filterBranchId || filterDeptId || filterUnitId || filterLevel;

  const clearOrgFilters = () => {
    setFilterBranchId('');
    setFilterDeptId('');
    setFilterUnitId('');
    setFilterLevel('');
  };

  const filteredInbox = inbox.filter(r => {
    if (starFilter && !r.isStarred) return false;
    if (!matchesOrgFilter(r, false)) return false;
    return !searchTerm || r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.authorName.toLowerCase().includes(searchTerm.toLowerCase());
  });
  const filteredSent = sent.filter(r => {
    if (!matchesOrgFilter(r, true)) return false;
    return !searchTerm || r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.recipientName.toLowerCase().includes(searchTerm.toLowerCase());
  });
  const filteredStarred = starred.filter(r => {
    if (!matchesOrgFilter(r)) return false;
    return !searchTerm || r.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // ──────── DATA INSERTION ────────
  const fetchDataSnippet = async (type: string): Promise<ReportDataInsert> => {
    const id = `di-${Date.now()}`;
    try {
      switch (type) {
        case 'members-count': {
          const m = await fetchMembers();
          const count = (m as any[]).length;
          return { id, type: 'members-count', label: 'Total Members', value: `${count} members` };
        }
        case 'workforce-count': {
          const w = await fetchWorkforce();
          const count = (w as any[]).length;
          return { id, type: 'workforce-count', label: 'Workforce Size', value: `${count} active workers` };
        }
        case 'newcomers-count': {
          const n = await fetchNewcomers(branchId);
          const active = (n as any[]).filter(x => !x.movedToMemberId);
          return { id, type: 'newcomers-count', label: 'Active Newcomers', value: `${active.length} newcomers` };
        }
        case 'programs-summary': {
          const p = await fetchPrograms(branchId);
          const count = (p as any[]).length;
          return { id, type: 'programs-summary', label: 'Programs', value: `${count} programs running` };
        }
        case 'finance-summary': {
          const entries = await fetchLedgerEntries(branchId, currentAdmin?.level === 'department' ? departmentId : undefined);
          const ce = entries as any[];
          const income = ce.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
          const expense = ce.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
          return { id, type: 'finance-summary', label: 'Finance Summary', value: `Income: ${income.toLocaleString()} | Expenses: ${expense.toLocaleString()} | Net: ${(income - expense).toLocaleString()}` };
        }
        default: return { id, type: 'custom', label: 'Custom', value: '' };
      }
    } catch {
      return { id, type: type as any, label: type, value: 'Unable to fetch data' };
    }
  };

  const insertData = async (type: string) => {
    const snippet = await fetchDataSnippet(type);
    setCDataInserts(prev => [...prev, snippet]);
    setCContent(prev => prev + `\n\n📊 ${snippet.label}: ${snippet.value}\n`);
    setShowDataPicker(false);
  };

  const removeDataInsert = (id: string) => setCDataInserts(prev => prev.filter(d => d.id !== id));

  // ──────── FILE UPLOAD ────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) { showToast(`${file.name} is too large (max 5MB)`); return; }
      const reader = new FileReader();
      reader.onload = () => {
        setCAttachments(prev => [...prev, {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name, type: file.type, dataUrl: reader.result as string, size: file.size,
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // ──────── SEND REPORT ────────
  const handleSendReport = async () => {
    if (!cTitle.trim() || !cContent.trim() || !cRecipientId || !currentAdmin) return;
    setSaving(true);
    try {
      const recipient = admins.find(a => a.id === cRecipientId);
      const report: Report = {
        id: `rpt-${Date.now()}`, churchId: church.id,
        title: cTitle.trim(), content: cContent.trim(),
        dataInserts: cDataInserts.length > 0 ? cDataInserts : undefined,
        authorId: currentAdmin.id, authorName: currentAdmin.name, authorLevel: currentAdmin.level,
        recipientId: cRecipientId, recipientName: recipient?.name || 'Unknown',
        isRead: false, isStarred: false, replies: [],
        attachments: cAttachments.length > 0 ? cAttachments : undefined,
        createdAt: new Date(),
      };
      const all = await fetchReports();
      const updated = [...(all as Report[]), report];
      await saveReports(updated);
      setReports(updated.filter(r => r.churchId === church.id));
      setComposeOpen(false);
      resetCompose();
      showToast(`Report sent to ${recipient?.name}.`);
    } catch (err: any) { console.error(err); showToast(`Error: ${err.message}`, 'error'); }
    finally { setSaving(false); }
  };

  const resetCompose = () => {
    setCTitle(''); setCContent(''); setCRecipientId('');
    setCDataInserts([]); setCAttachments([]); setShowDataPicker(false);
    setShowReportRefPicker(false); setReportRefSearch('');
  };

  // ──────── MARK READ ────────
  const markAsRead = async (report: Report) => {
    if (report.isRead) return;
    const all = await fetchReports();
    const updated = (all as Report[]).map(r => r.id === report.id ? { ...r, isRead: true, readAt: new Date() } : r);
    await saveReports(updated);
    setReports(updated.filter(r => r.churchId === church.id));
  };

  // ──────── TOGGLE STAR ────────
  const toggleStar = async (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    const all = await fetchReports();
    const updated = (all as Report[]).map(r => r.id === reportId ? { ...r, isStarred: !r.isStarred } : r);
    await saveReports(updated);
    setReports(updated.filter(r => r.churchId === church.id));
    // Also refresh viewReport if open
    if (viewReport?.id === reportId) {
      setViewReport(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);
    }
  };

  // ──────── REPLY ────────
  const handleSendReply = async () => {
    if (!viewReport || !replyContent.trim() || !currentAdmin) return;
    setSaving(true);
    try {
      const newReply: ReportReply = {
        id: `reply-${Date.now()}`,
        authorId: currentAdmin.id,
        authorName: currentAdmin.name,
        authorLevel: currentAdmin.level,
        content: replyContent.trim(),
        createdAt: new Date(),
      };
      const all = await fetchReports();
      const updated = (all as Report[]).map(r =>
        r.id === viewReport.id
          ? { ...r, replies: [...(r.replies || []), newReply] }
          : r
      );
      await saveReports(updated);
      const churchReports = updated.filter(r => r.churchId === church.id);
      setReports(churchReports);
      setViewReport(churchReports.find(r => r.id === viewReport.id) || null);
      setReplyContent('');
      setReplyOpen(false);
      showToast('Reply sent.');
    } catch (err: any) { console.error(err); showToast(`Error: ${err.message}`, 'error'); }
    finally { setSaving(false); }
  };

  // ──────── EXPORT ────────
  const exportReport = (report: Report, format: 'txt' | 'html' | 'csv') => {
    let content = ''; let mime = ''; const ext = format;
    const repliesText = report.replies?.map(r => `\n--- Reply from ${r.authorName} (${new Date(r.createdAt).toLocaleString()}) ---\n${r.content}`).join('\n') || '';
    switch (format) {
      case 'txt':
        content = `${report.title}\n${'='.repeat(report.title.length)}\nFrom: ${report.authorName} (${LEVEL_LABELS[report.authorLevel]})\nTo: ${report.recipientName}\nDate: ${new Date(report.createdAt).toLocaleString()}\n\n${report.content}\n\n${report.dataInserts?.map(d => `${d.label}: ${d.value}`).join('\n') || ''}${repliesText}`;
        mime = 'text/plain'; break;
      case 'html':
        content = `<!DOCTYPE html><html><head><title>${report.title}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#333}h1{color:#1e40af}.meta{color:#666;margin-bottom:20px}.data{background:#f0f4ff;padding:12px;border-radius:8px;margin:8px 0}.reply{background:#f9fafb;border-left:3px solid #6366f1;padding:12px;margin:8px 0;border-radius:4px}</style></head><body><h1>${report.title}</h1><div class="meta"><strong>From:</strong> ${report.authorName} (${LEVEL_LABELS[report.authorLevel]})<br/><strong>To:</strong> ${report.recipientName}<br/><strong>Date:</strong> ${new Date(report.createdAt).toLocaleString()}</div><div>${report.content.replace(/\n/g, '<br/>')}</div>${report.dataInserts?.map(d => `<div class="data"><strong>${d.label}:</strong> ${d.value}</div>`).join('') || ''}${report.replies?.map(r => `<div class="reply"><strong>${r.authorName}</strong> <small>(${new Date(r.createdAt).toLocaleString()})</small><p>${r.content.replace(/\n/g, '<br/>')}</p></div>`).join('') || ''}</body></html>`;
        mime = 'text/html'; break;
      case 'csv':
        content = `Title,Author,Recipient,Date,Content\n"${report.title}","${report.authorName}","${report.recipientName}","${new Date(report.createdAt).toLocaleString()}","${report.content.replace(/"/g, '""')}"`;
        mime = 'text/csv'; break;
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
    a.click(); URL.revokeObjectURL(url);
  };

  const printReport = (report: Report) => {
    const w = window.open('', '_blank'); if (!w) return;
    w.document.write(`<html><head><title>${report.title}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px}h1{color:#1e40af}.meta{color:#666;margin-bottom:20px}.data{background:#f0f4ff;padding:12px;border-radius:8px;margin:8px 0}.reply{background:#f9fafb;border-left:3px solid #6366f1;padding:12px;margin:8px 0;border-radius:4px}</style></head><body><h1>${report.title}</h1><div class="meta"><strong>From:</strong> ${report.authorName} (${LEVEL_LABELS[report.authorLevel]})<br/><strong>To:</strong> ${report.recipientName}<br/><strong>Date:</strong> ${new Date(report.createdAt).toLocaleString()}</div><div>${report.content.replace(/\n/g, '<br/>')}</div>${report.dataInserts?.map(d => `<div class="data"><strong>${d.label}:</strong> ${d.value}</div>`).join('') || ''}${report.replies?.map(r => `<div class="reply"><strong>${r.authorName}</strong> <small>(${new Date(r.createdAt).toLocaleString()})</small><p>${r.content.replace(/\n/g, '<br/>')}</p></div>`).join('') || ''}${report.attachments?.map(a => `<p>📎 ${a.name} (${(a.size / 1024).toFixed(1)}KB)</p>`).join('') || ''}</body></html>`);
    w.document.close(); w.print();
  };

  // ──────── REPORT CARD ────────
  const ReportCard = ({ report, isSent }: { report: Report; isSent?: boolean }) => (
    <div
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${!report.isRead && !isSent ? 'bg-blue-50/50' : ''}`}
      onClick={() => { setViewReport(report); setReplyOpen(false); setReplyContent(''); if (!isSent) markAsRead(report); }}
    >
      <div className="flex items-start gap-3">
        <button
          className="mt-1 flex-shrink-0"
          onClick={(e) => toggleStar(e, report.id)}
          title={report.isStarred ? 'Unstar this report' : 'Star this report'}
        >
          <Star className={`w-4 h-4 ${report.isStarred ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
        </button>
        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${!report.isRead && !isSent ? 'bg-blue-500' : 'bg-transparent'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm truncate ${!report.isRead && !isSent ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{report.title}</h4>
            <span className="text-[10px] text-gray-400 flex-shrink-0">{new Date(report.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {isSent ? `To: ${report.recipientName}` : `From: ${report.authorName}`}
            <Badge variant="outline" className="ml-2 text-[10px]">{LEVEL_LABELS[report.authorLevel]}</Badge>
          </p>
          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{report.content.slice(0, 120)}...</p>
          <div className="flex items-center gap-2 mt-1">
            {report.attachments && report.attachments.length > 0 && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Paperclip className="w-3 h-3" />{report.attachments.length}</span>}
            {report.dataInserts && report.dataInserts.length > 0 && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Database className="w-3 h-3" />{report.dataInserts.length} data</span>}
            {report.replies && report.replies.length > 0 && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Reply className="w-3 h-3" />{report.replies.length}</span>}
            {/* Read receipt for sent tab */}
            {isSent && report.isRead && (
              <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                <Eye className="w-3 h-3" />Read {report.readAt ? new Date(report.readAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            )}
            {isSent && !report.isRead && (
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><EyeOff className="w-3 h-3" />Unread</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <PageHeader
        title="Reports"
        description={isSuperAdmin
          ? "Your inbox shows reports from all administrators. Use the Outbox to send messages, ask for clarification, or request updates from any administrator — you can even reference their reports directly."
          : "Write and send reports to your administrators. Pull in live data from across the platform, attach files, and track what's been read. Star important reports to find them quickly."
        }
        action={{
          label: isSuperAdmin ? 'New Message' : 'New Report',
          onClick: () => { resetCompose(); setComposeOpen(true); },
          icon: isSuperAdmin ? <MailPlus className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />,
        }}
      />

      <div className="p-4 md:p-6">

        {loading ? <BibleLoader message="Loading reports..." /> : (
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchTerm(''); setStarFilter(false); }} className="space-y-4">
            <TabsList>
              <TabsTrigger value="inbox" className="flex items-center gap-2">
                <Inbox className="w-4 h-4" />Inbox
                {unreadCount > 0 && <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-blue-500">{unreadCount}</Badge>}
              </TabsTrigger>
              {isSuperAdmin && (
                <TabsTrigger value="sent" className="flex items-center gap-2">
                  <MailPlus className="w-4 h-4" />Outbox ({sent.length})
                </TabsTrigger>
              )}
              {!isSuperAdmin && (
                <TabsTrigger value="sent" className="flex items-center gap-2">
                  <SendHorizonal className="w-4 h-4" />Sent ({sent.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="starred" className="flex items-center gap-2">
                <Star className="w-4 h-4" />Starred ({starred.length})
              </TabsTrigger>
            </TabsList>

            {/* Search + star filter */}
            <Card><CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search reports by title or name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Button size="sm" variant={showOrgFilters ? 'default' : 'outline'} onClick={() => setShowOrgFilters(!showOrgFilters)} title="Filter by branch, department, or unit">
                  <Filter className="w-4 h-4" />
                  {hasActiveOrgFilter && <span className="ml-1 w-2 h-2 bg-blue-400 rounded-full" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setStarFilter(!starFilter)}>
                  <Star className={`w-4 h-4 ${starFilter ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
                </Button>
              </div>

              {/* Organizational filter row */}
              {showOrgFilters && (
                <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 w-full mb-1">Filter reports by admin level, branch, department, or unit to organize your inbox.</p>
                  {/* Admin Level filter */}
                  <div className="w-36">
                    <Label className="text-[10px] text-gray-500">Admin Level</Label>
                    <Select value={filterLevel} onValueChange={(v) => { setFilterLevel(v === '__all__' ? '' : v); }}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All levels" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All levels</SelectItem>
                        <SelectItem value="church">Church</SelectItem>
                        {church.type === 'multi' && <SelectItem value="branch">Branch</SelectItem>}
                        <SelectItem value="department">Department</SelectItem>
                        <SelectItem value="unit">Unit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Branch filter (multi-branch only) */}
                  {church.type === 'multi' && branches.length > 0 && (
                    <div className="w-44">
                      <Label className="text-[10px] text-gray-500">Branch</Label>
                      <Select value={filterBranchId} onValueChange={(v) => { setFilterBranchId(v === '__all__' ? '' : v); setFilterDeptId(''); setFilterUnitId(''); }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All branches" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All branches</SelectItem>
                          {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Department filter */}
                  {departments.length > 0 && (
                    <div className="w-44">
                      <Label className="text-[10px] text-gray-500">Department</Label>
                      <Select value={filterDeptId} onValueChange={(v) => { setFilterDeptId(v === '__all__' ? '' : v); setFilterUnitId(''); }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All departments" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All departments</SelectItem>
                          {(filterBranchId ? departments.filter(d => d.branchId === filterBranchId) : departments).map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Unit filter */}
                  {filterDeptId && units.filter(u => u.departmentId === filterDeptId).length > 0 && (
                    <div className="w-40">
                      <Label className="text-[10px] text-gray-500">Unit</Label>
                      <Select value={filterUnitId} onValueChange={(v) => setFilterUnitId(v === '__all__' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All units" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All units</SelectItem>
                          {units.filter(u => u.departmentId === filterDeptId).map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {hasActiveOrgFilter && (
                    <Button size="sm" variant="ghost" onClick={clearOrgFilters} className="text-xs text-gray-500 h-8">
                      <X className="w-3 h-3 mr-1" />Clear filters
                    </Button>
                  )}
                </div>
              )}
            </CardContent></Card>

            {/* INBOX */}
            <TabsContent value="inbox">
              {filteredInbox.length === 0 ? (
                <Card><CardContent className="py-16 text-center">
                  <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-700 mb-1">No reports in your inbox</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    {inbox.length > 0 ? 'No reports match your search.' : 'When administrators below you send reports, they\'ll appear here. You can read, reply, star, export, and print them.'}
                  </p>
                </CardContent></Card>
              ) : (
                <Card><CardContent className="p-0">
                  {filteredInbox.map(r => <ReportCard key={r.id} report={r} />)}
                </CardContent></Card>
              )}
            </TabsContent>

            {/* SENT */}
            <TabsContent value="sent">
              {filteredSent.length === 0 ? (
                <Card><CardContent className="py-16 text-center">
                  <SendHorizonal className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-700 mb-1">No sent reports</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">Reports you compose and send will appear here. You'll see read receipts when your recipient opens a report.</p>
                </CardContent></Card>
              ) : (
                <Card><CardContent className="p-0">
                  {filteredSent.map(r => <ReportCard key={r.id} report={r} isSent />)}
                </CardContent></Card>
              )}
            </TabsContent>

            {/* STARRED */}
            <TabsContent value="starred">
              {filteredStarred.length === 0 ? (
                <Card><CardContent className="py-16 text-center">
                  <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-700 mb-1">No starred reports</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">Click the star icon on any report to pin it here for quick access. Starred reports show up from both your inbox and sent items.</p>
                </CardContent></Card>
              ) : (
                <Card><CardContent className="p-0">
                  {filteredStarred.map(r => <ReportCard key={r.id} report={r} isSent={r.authorId === currentAdmin?.id} />)}
                </CardContent></Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* ═══ COMPOSE DIALOG ═══ */}
      <Dialog open={composeOpen} onOpenChange={(o) => { if (!o) { setComposeOpen(false); resetCompose(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isSuperAdmin ? 'Compose Message' : 'Compose Report'}</DialogTitle>
            <DialogDescription>
              {isSuperAdmin
                ? 'Send a message to any administrator in your church. You can ask for clarification, request updates, or reference reports you\'ve received — all with live data and attachments.'
                : 'Write your report below. You can pull in live data from the platform (member counts, finance totals, etc.) and attach images or files. The report will be sent to the administrator you select.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Recipient */}
            <div>
              <Label>Send To <span className="text-red-500">*</span></Label>
              <p className="text-xs text-gray-500 mb-1">
                {isSuperAdmin
                  ? 'As a super admin, you can reach any administrator across all levels — branch heads, department heads, or unit heads.'
                  : church.reportingMode === 'direct'
                    ? 'You can send this report to any administrator above your level.'
                    : 'Reports follow the chain of command — you can only report to the level directly above yours.'}
              </p>
              {eligibleRecipients.length === 0 ? (
                <div className="border border-dashed rounded-lg p-3 text-center"><p className="text-sm text-gray-500">No eligible recipients found. There may be no administrators above your level.</p></div>
              ) : (
                <Select value={cRecipientId} onValueChange={setCRecipientId}>
                  <SelectTrigger><SelectValue placeholder="Choose recipient" /></SelectTrigger>
                  <SelectContent>
                    {eligibleRecipients.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name} — {LEVEL_LABELS[a.level]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Title */}
            <div>
              <Label>Report Title <span className="text-red-500">*</span></Label>
              <Input value={cTitle} onChange={e => setCTitle(e.target.value)} placeholder="e.g., Weekly Department Update — Feb 28" />
            </div>

            {/* Content */}
            <div>
              <Label>Report Content <span className="text-red-500">*</span></Label>
              <Textarea value={cContent} onChange={e => setCContent(e.target.value)} placeholder="Write your report here. Be detailed — include updates, challenges, prayer points, and recommendations..." rows={10} className="font-mono text-sm" />
            </div>

            {/* Data inserts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-1"><Database className="w-3.5 h-3.5" />Insert Platform Data</Label>
                <Button size="sm" variant="outline" onClick={() => setShowDataPicker(!showDataPicker)}><Plus className="w-3.5 h-3.5 mr-1" />Add Data</Button>
              </div>
              <p className="text-xs text-gray-500 mb-2">Pull in live numbers from the platform to include in your report. These will be embedded as data snapshots.</p>
              {showDataPicker && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {[
                    { type: 'members-count', label: 'Members Count', icon: <Users className="w-4 h-4" /> },
                    { type: 'workforce-count', label: 'Workforce Count', icon: <Briefcase className="w-4 h-4" /> },
                    { type: 'newcomers-count', label: 'Newcomers Count', icon: <UserPlus className="w-4 h-4" /> },
                    { type: 'programs-summary', label: 'Programs Summary', icon: <Calendar className="w-4 h-4" /> },
                    { type: 'finance-summary', label: 'Finance Summary', icon: <DollarSign className="w-4 h-4" /> },
                  ].map(item => (
                    <Button key={item.type} variant="outline" size="sm" className="justify-start text-xs" onClick={() => insertData(item.type)}>
                      {item.icon}<span className="ml-1">{item.label}</span>
                    </Button>
                  ))}
                </div>
              )}
              {cDataInserts.length > 0 && (
                <div className="space-y-1.5">
                  {cDataInserts.map(d => (
                    <div key={d.id} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 text-xs">
                      <Database className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-medium text-blue-800">{d.label}:</span>
                      <span className="text-blue-600 flex-1">{d.value}</span>
                      <button onClick={() => removeDataInsert(d.id)}><X className="w-3.5 h-3.5 text-blue-400" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div>
              <Label className="flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" />Attachments</Label>
              <p className="text-xs text-gray-500 mb-2">Upload images, documents, or other files (max 5MB each).</p>
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" className="hidden" onChange={handleFileUpload} />
              <div className="flex gap-2 mb-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Image className="w-3.5 h-3.5 mr-1" />Upload Image</Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Paperclip className="w-3.5 h-3.5 mr-1" />Upload File</Button>
              </div>
              {cAttachments.length > 0 && (
                <div className="space-y-1.5">
                  {cAttachments.map(a => (
                    <div key={a.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs">
                      {a.type.startsWith('image/') ? <Image className="w-3.5 h-3.5 text-green-500" /> : <FileText className="w-3.5 h-3.5 text-gray-500" />}
                      <span className="flex-1 truncate">{a.name}</span>
                      <span className="text-gray-400">{(a.size / 1024).toFixed(1)}KB</span>
                      <button onClick={() => setCAttachments(prev => prev.filter(x => x.id !== a.id))}><X className="w-3.5 h-3.5 text-gray-400" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Report reference picker */}
            {isSuperAdmin && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />Reference a Report</Label>
                  <Button size="sm" variant="outline" onClick={() => setShowReportRefPicker(!showReportRefPicker)}><Plus className="w-3.5 h-3.5 mr-1" />Add Reference</Button>
                </div>
                <p className="text-xs text-gray-500 mb-2">Reference a report from your inbox to include in this report.</p>
                {showReportRefPicker && (
                  <div className="space-y-1.5">
                    <Input
                      value={reportRefSearch}
                      onChange={e => setReportRefSearch(e.target.value)}
                      placeholder="Search reports..."
                      className="text-sm"
                    />
                    {referenceableReports.length > 0 ? (
                      referenceableReports.map(r => (
                        <div key={r.id} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 text-xs cursor-pointer" onClick={() => insertReportReference(r)}>
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-medium text-blue-800">{r.title}:</span>
                          <span className="text-blue-600 flex-1">{r.content.slice(0, 80)}...</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No reports found.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setComposeOpen(false); resetCompose(); }}>Cancel</Button>
              <Button className="flex-1" disabled={!cTitle.trim() || !cContent.trim() || !cRecipientId || saving} onClick={handleSendReport}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<Send className="w-4 h-4 mr-2" />Send Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ VIEW REPORT DIALOG ═══ */}
      <Dialog open={!!viewReport} onOpenChange={() => { setViewReport(null); setReplyOpen(false); setReplyContent(''); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewReport && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => toggleStar(e, viewReport.id)} title="Toggle star">
                    <Star className={`w-5 h-5 ${viewReport.isStarred ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
                  </button>
                  <DialogTitle className="flex-1">{viewReport.title}</DialogTitle>
                </div>
                <DialogDescription>
                  <span className="flex flex-wrap items-center gap-2 mt-1">
                    <span>From: <strong>{viewReport.authorName}</strong></span>
                    <Badge variant="outline" className="text-xs">{LEVEL_LABELS[viewReport.authorLevel]}</Badge>
                    <span className="text-gray-400">→</span>
                    <span>To: <strong>{viewReport.recipientName}</strong></span>
                    <span className="text-gray-400">•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(viewReport.createdAt).toLocaleString()}</span>
                  </span>
                  {/* Read receipt */}
                  <span className="flex items-center gap-1 mt-1">
                    {viewReport.isRead ? (
                      <Badge className="bg-green-100 text-green-700 border-0 text-[10px] font-normal">
                        <Eye className="w-3 h-3 mr-1" />Read {viewReport.readAt ? `on ${new Date(viewReport.readAt).toLocaleString()}` : ''}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500 border-0 text-[10px] font-normal">
                        <EyeOff className="w-3 h-3 mr-1" />Not yet read
                      </Badge>
                    )}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Content */}
                <div className="prose prose-sm max-w-none">
                  {viewReport.content.split('\n').map((line, i) => <p key={i} className="text-sm text-gray-700 mb-1">{line || '\u00A0'}</p>)}
                </div>

                {/* Data inserts */}
                {viewReport.dataInserts && viewReport.dataInserts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Embedded Data</h4>
                    {viewReport.dataInserts.map(d => (
                      <div key={d.id} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 text-sm">
                        <Database className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-blue-800">{d.label}:</span>
                        <span className="text-blue-600">{d.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Attachments */}
                {viewReport.attachments && viewReport.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Attachments</h4>
                    {viewReport.attachments.map(a => (
                      <div key={a.id} className="border rounded-lg overflow-hidden">
                        {a.type.startsWith('image/') && a.dataUrl ? (
                          <img src={a.dataUrl} alt={a.name} className="w-full max-h-64 object-contain bg-gray-50" />
                        ) : null}
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-xs">
                          <FileText className="w-3.5 h-3.5 text-gray-500" />
                          <span className="flex-1">{a.name}</span>
                          <span className="text-gray-400">{(a.size / 1024).toFixed(1)}KB</span>
                          {a.dataUrl && <a href={a.dataUrl} download={a.name} className="text-blue-600 hover:underline flex items-center gap-0.5"><Download className="w-3 h-3" />Download</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Replies thread */}
                {viewReport.replies && viewReport.replies.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1"><Reply className="w-3.5 h-3.5" />Replies ({viewReport.replies.length})</h4>
                    {viewReport.replies.map(r => (
                      <div key={r.id} className="border-l-3 border-indigo-300 bg-gray-50 rounded-r-lg p-3 space-y-1" style={{ borderLeftWidth: '3px' }}>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-gray-800">{r.authorName}</span>
                          <Badge variant="outline" className="text-[10px]">{LEVEL_LABELS[r.authorLevel]}</Badge>
                          <span className="text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                        {r.content.split('\n').map((line, i) => <p key={i} className="text-sm text-gray-700">{line || '\u00A0'}</p>)}
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                {/* Reply section */}
                {replyOpen ? (
                  <div className="space-y-3 bg-indigo-50/50 border border-indigo-100 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-indigo-800 flex items-center gap-1"><Reply className="w-4 h-4" />Write a Reply</h4>
                    <Textarea
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      placeholder="Type your reply here..."
                      rows={4}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setReplyOpen(false); setReplyContent(''); }}>Cancel</Button>
                      <Button size="sm" disabled={!replyContent.trim() || saving} onClick={handleSendReply}>
                        {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}<Send className="w-3.5 h-3.5 mr-1" />Send Reply
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setReplyOpen(true)}>
                    <Reply className="w-4 h-4 mr-2" />Reply to this report
                  </Button>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => printReport(viewReport)}><Printer className="w-4 h-4 mr-1" />Print</Button>
                  <Button variant="outline" size="sm" onClick={() => exportReport(viewReport, 'txt')}><Download className="w-4 h-4 mr-1" />.txt</Button>
                  <Button variant="outline" size="sm" onClick={() => exportReport(viewReport, 'html')}><Download className="w-4 h-4 mr-1" />.html</Button>
                  <Button variant="outline" size="sm" onClick={() => exportReport(viewReport, 'csv')}><Download className="w-4 h-4 mr-1" />.csv</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
