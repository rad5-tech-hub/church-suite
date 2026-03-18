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
  Loader2, Paperclip, Image, Users, Briefcase, UserPlus, Calendar,
  DollarSign, Database, Clock, Star, Reply, Eye, EyeOff, MailPlus, Filter,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Report, ReportDataInsert, ReportAttachment, ReportReply, Admin, AdminLevel, Department, Unit } from '../types';
import {
  createReport, fetchReportById, fetchReports, saveReports, fetchAdmins, fetchMembers, fetchWorkforce,
  fetchNewcomers, fetchPrograms, fetchLedgerEntries, fetchDepartments, fetchUnits,
} from '../api';
import { resolvePrimaryBranchId } from '../utils/scope';

const LEVEL_LABELS: Record<AdminLevel, string> = { unit: 'Unit Head', department: 'Dept. Head', branch: 'Branch Head', church: 'Super Admin' };
const SCOPE_LABELS: Record<'church' | 'branch' | 'department', string> = {
  church: 'Church',
  branch: 'Branch',
  department: 'Department',
};

export function Reports() {
  const { church, branches } = useChurch();
  const { currentAdmin } = useAuth();
  const primaryBranchId = resolvePrimaryBranchId(branches, currentAdmin);

  const [reports, setReports] = useState<Report[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const { showToast } = useToast();

  // Compose
  const [composeOpen, setComposeOpen] = useState(false);
  const [cTitle, setCTitle] = useState('');
  const [cContent, setCContent] = useState('');
  const [cResponseComments, setCResponseComments] = useState('');
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
  const [filterBranchId, setFilterBranchId] = useState('');
  const [filterDeptId, setFilterDeptId] = useState('');
  const [filterUnitId, setFilterUnitId] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [showOrgFilters, setShowOrgFilters] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const resolvedDepartmentId = useMemo(() => {
    if (currentAdmin?.departmentId) return currentAdmin.departmentId;
    if (currentAdmin?.departmentIds?.[0]) return currentAdmin.departmentIds[0];
    if (currentAdmin?.unitId) {
      return units.find((unit) => unit.id === currentAdmin.unitId)?.departmentId || '';
    }
    if (currentAdmin?.unitIds?.length) {
      const unitDepartmentId = units.find((unit) => currentAdmin.unitIds?.includes(unit.id))?.departmentId;
      return unitDepartmentId || '';
    }
    return '';
  }, [currentAdmin, units]);

  const resolvedBranchId = useMemo(() => {
    if (currentAdmin?.branchId) return currentAdmin.branchId;
    if (currentAdmin?.branchIds?.[0]) return currentAdmin.branchIds[0];
    if (resolvedDepartmentId) {
      return departments.find((department) => department.id === resolvedDepartmentId)?.branchId || primaryBranchId || '';
    }
    return primaryBranchId || '';
  }, [currentAdmin, departments, resolvedDepartmentId, primaryBranchId]);

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
      setAdmins((mergedAdmins as Admin[]).filter((admin) => admin.status === 'active'));
      setDepartments(deps as Department[]);
      setUnits(uns as Unit[]);
    } catch (err) {
      console.error('Failed to load reports:', err);
      showToast('Failed to load reports.', 'error');
    } finally {
      setLoading(false);
    }
  }, [branches, currentAdmin, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  // ──────── HIERARCHY ────────
  const isSuperAdmin = currentAdmin?.isSuperAdmin || currentAdmin?.level === 'church';

  const getReportScopeLevel = (report: Report): 'church' | 'branch' | 'department' => {
    if (report.departmentId) return 'department';
    if (report.branchId) return 'branch';
    return 'church';
  };

  const getReportScopeName = (report: Report) => {
    if (report.departmentId) {
      return departments.find((department) => department.id === report.departmentId)?.name || 'Department';
    }
    if (report.branchId) {
      return branches.find((branch) => branch.id === report.branchId)?.name || 'Branch';
    }
    return church.name;
  };

  const getReportScopeSummary = (report: Report) => {
    const scopeLevel = getReportScopeLevel(report);
    const scopeLabel = SCOPE_LABELS[scopeLevel];
    const scopeName = getReportScopeName(report);
    return scopeName && scopeName !== scopeLabel ? `${scopeLabel}: ${scopeName}` : scopeLabel;
  };

  const getAuthorLevelLabel = (authorId: string, fallback: AdminLevel) => {
    const author = admins.find((admin) => admin.id === authorId);
    return LEVEL_LABELS[author?.level || fallback];
  };

  const composeScopeChips = useMemo(() => {
    const chips = [{ label: 'Church', value: church.name }];
    if (resolvedBranchId) {
      chips.push({
        label: 'Branch',
        value: branches.find((branch) => branch.id === resolvedBranchId)?.name || 'Branch',
      });
    }
    if (resolvedDepartmentId) {
      chips.push({
        label: 'Department',
        value: departments.find((department) => department.id === resolvedDepartmentId)?.name || 'Department',
      });
    }
    return chips;
  }, [branches, church.name, departments, resolvedBranchId, resolvedDepartmentId]);

  const inbox = useMemo(() => {
    if (!currentAdmin) return [];
    return reports
      .filter((report) => report.authorId !== currentAdmin.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [reports, currentAdmin]);

  const sent = useMemo(() => {
    if (!currentAdmin) return [];
    return reports
      .filter((report) => report.authorId === currentAdmin.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [reports, currentAdmin]);

  const starred = useMemo(() => {
    if (!currentAdmin) return [];
    return reports
      .filter((report) => report.isStarred)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [reports, currentAdmin]);

  const unreadCount = inbox.filter((report) => !report.isRead).length;

  useEffect(() => {
    if (loading) return;
    if (activeTab === 'inbox' && inbox.length === 0 && sent.length > 0) {
      setActiveTab('sent');
    }
  }, [activeTab, inbox.length, loading, sent.length]);

  const referenceableReports = useMemo(() => {
    if (!isSuperAdmin) return [];
    return inbox.filter((report) =>
      !reportRefSearch
      || report.title.toLowerCase().includes(reportRefSearch.toLowerCase())
      || report.authorName.toLowerCase().includes(reportRefSearch.toLowerCase())
    ).slice(0, 10);
  }, [inbox, isSuperAdmin, reportRefSearch]);

  const insertReportReference = (report: Report) => {
    const snippet = report.content.slice(0, 200).replace(/\n/g, ' ');
    const dataStr = report.dataInserts?.map((dataInsert) => `${dataInsert.label}: ${dataInsert.value}`).join(', ') || '';
    const refText = `\n\n[Referenced report] "${report.title}" from ${report.authorName} (${getAuthorLevelLabel(report.authorId, report.authorLevel)}, ${new Date(report.createdAt).toLocaleDateString()}):\n> "${snippet}${report.content.length > 200 ? '...' : ''}"${dataStr ? `\n> Data: ${dataStr}` : ''}\n`;
    setCContent((prev) => prev + refText);
    setCDataInserts((prev) => ([
      ...prev,
      {
        id: `di-ref-${Date.now()}`,
        type: 'report-reference',
        label: `Ref: ${report.title}`,
        value: `From ${report.authorName} - "${snippet.slice(0, 80)}..."`,
      },
    ]));
    setShowReportRefPicker(false);
    setReportRefSearch('');
  };

  const matchesOrgFilter = (report: Report) => {
    const author = admins.find((admin) => admin.id === report.authorId);
    const reportScopeLevel = getReportScopeLevel(report);

    if (filterLevel) {
      const authorLevel = author?.level || reportScopeLevel;
      if (authorLevel !== filterLevel) return false;
    }

    if (filterBranchId) {
      const branchMatches = report.branchId === filterBranchId
        || author?.branchId === filterBranchId
        || author?.branchIds?.includes(filterBranchId);
      if (!branchMatches) return false;
    }

    if (filterDeptId) {
      const departmentMatches = report.departmentId === filterDeptId
        || author?.departmentId === filterDeptId
        || author?.departmentIds?.includes(filterDeptId);
      if (!departmentMatches) return false;
    }

    if (filterUnitId) {
      const unitMatches = author?.unitId === filterUnitId || author?.unitIds?.includes(filterUnitId);
      if (!unitMatches) return false;
    }

    return true;
  };

  const hasActiveOrgFilter = Boolean(filterBranchId || filterDeptId || filterUnitId || filterLevel);

  const clearOrgFilters = () => {
    setFilterBranchId('');
    setFilterDeptId('');
    setFilterUnitId('');
    setFilterLevel('');
  };

  const filteredInbox = inbox.filter((report) => {
    if (starFilter && !report.isStarred) return false;
    if (!matchesOrgFilter(report)) return false;
    if (!searchTerm) return true;
    const loweredSearch = searchTerm.toLowerCase();
    return report.title.toLowerCase().includes(loweredSearch)
      || report.authorName.toLowerCase().includes(loweredSearch)
      || getReportScopeSummary(report).toLowerCase().includes(loweredSearch);
  });

  const filteredSent = sent.filter((report) => {
    if (!matchesOrgFilter(report)) return false;
    if (!searchTerm) return true;
    const loweredSearch = searchTerm.toLowerCase();
    return report.title.toLowerCase().includes(loweredSearch)
      || getReportScopeSummary(report).toLowerCase().includes(loweredSearch);
  });

  const filteredStarred = starred.filter((report) => {
    if (!matchesOrgFilter(report)) return false;
    if (!searchTerm) return true;
    const loweredSearch = searchTerm.toLowerCase();
    return report.title.toLowerCase().includes(loweredSearch)
      || report.authorName.toLowerCase().includes(loweredSearch)
      || getReportScopeSummary(report).toLowerCase().includes(loweredSearch);
  });
  const fetchDataSnippet = async (type: string): Promise<ReportDataInsert> => {
    const id = `di-${Date.now()}`;
    try {
      switch (type) {
        case 'members-count': {
          const m = await fetchMembers(resolvedBranchId || undefined);
          const count = (m as any[]).length;
          return { id, type: 'members-count', label: 'Total Members', value: `${count} members` };
        }
        case 'workforce-count': {
          const w = await fetchWorkforce(resolvedBranchId || undefined);
          const count = (w as any[]).length;
          return { id, type: 'workforce-count', label: 'Workforce Size', value: `${count} active workers` };
        }
        case 'newcomers-count': {
          const n = await fetchNewcomers(resolvedBranchId || undefined);
          const active = (n as any[]).filter(x => !x.movedToMemberId);
          return { id, type: 'newcomers-count', label: 'Active Newcomers', value: `${active.length} newcomers` };
        }
        case 'programs-summary': {
          const p = await fetchPrograms(resolvedBranchId || undefined);
          const count = (p as any[]).length;
          return { id, type: 'programs-summary', label: 'Programs', value: `${count} programs running` };
        }
        case 'finance-summary': {
          const entries = await fetchLedgerEntries(resolvedBranchId || undefined, currentAdmin?.level === 'department' || currentAdmin?.level === 'unit' ? resolvedDepartmentId || undefined : undefined);
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
    setCContent(prev => prev + `\n\n[Data] ${snippet.label}: ${snippet.value}\n`);
    setShowDataPicker(false);
  };

  const removeDataInsert = (id: string) => setCDataInserts(prev => prev.filter(d => d.id !== id));

  // ──────── FILE UPLOAD ────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        showToast(`${file.name} is too large (max 5MB)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setCAttachments((prev) => ([
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            type: file.type,
            dataUrl: reader.result as string,
            size: file.size,
            file,
          },
        ]));
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const resetCompose = () => {
    setCTitle('');
    setCContent('');
    setCResponseComments('');
    setCDataInserts([]);
    setCAttachments([]);
    setShowDataPicker(false);
    setShowReportRefPicker(false);
    setReportRefSearch('');
  };

  const handleSendReport = async () => {
    if (!cTitle.trim() || !cContent.trim() || !currentAdmin) return;

    setSaving(true);
    try {
      const response = await createReport({
        title: cTitle.trim(),
        comments: cContent.trim(),
        churchId: church.id,
        branchId: resolvedBranchId || undefined,
        departmentId: resolvedDepartmentId || undefined,
        responseComments: cResponseComments.trim() || undefined,
        files: cAttachments
          .map((attachment) => attachment.file)
          .filter((file): file is File => Boolean(file)),
      });

      const freshReports = await fetchReports();
      const createdReportId = response?.report?.id;
      const nextReports = createdReportId && cDataInserts.length > 0
        ? freshReports.map((report) => report.id === createdReportId ? { ...report, dataInserts: cDataInserts } : report)
        : freshReports;

      if (cDataInserts.length > 0) {
        await saveReports(nextReports);
      }

      setReports(nextReports);
      setComposeOpen(false);
      resetCompose();
      showToast(response?.message || 'Report created successfully.');
    } catch (err: any) {
      console.error('Failed to create report:', err);
      showToast(`Error: ${err.message || 'Unable to create report.'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const markAsRead = async (report: Report) => {
    if (report.isRead) return report;

    const readAt = new Date();
    const updatedReport = { ...report, isRead: true, readAt };
    const nextReports = reports.map((currentReport) => (
      currentReport.id === report.id ? { ...currentReport, isRead: true, readAt } : currentReport
    ));

    setReports(nextReports);
    setViewReport((prev) => prev?.id === report.id ? updatedReport : prev);
    await saveReports(nextReports);
    return updatedReport;
  };

  const toggleStar = async (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    const nextReports = reports.map((report) => (
      report.id === reportId ? { ...report, isStarred: !report.isStarred } : report
    ));
    const updatedReport = nextReports.find((report) => report.id === reportId) || null;

    setReports(nextReports);
    if (viewReport?.id === reportId) {
      setViewReport(updatedReport);
    }
    await saveReports(nextReports);
  };

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

      const nextReports = reports.map((report) => (
        report.id === viewReport.id
          ? { ...report, replies: [...(report.replies || []), newReply] }
          : report
      ));
      const updatedViewReport = nextReports.find((report) => report.id === viewReport.id) || null;

      setReports(nextReports);
      setViewReport(updatedViewReport);
      await saveReports(nextReports);
      setReplyContent('');
      setReplyOpen(false);
      showToast('Reply saved locally.');
    } catch (err: any) {
      console.error('Failed to save reply:', err);
      showToast(`Error: ${err.message || 'Unable to save reply.'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const openReport = async (report: Report, isSent?: boolean) => {
    setReplyOpen(false);
    setReplyContent('');
    setViewReport(report);
    setViewLoading(true);

    try {
      const freshReport = await fetchReportById(report.id);
      setViewReport(freshReport);
      if (!isSent && !freshReport.isRead) {
        const readReport = await markAsRead(freshReport);
        setViewReport(readReport);
      }
    } catch (err: any) {
      console.error('Failed to fetch report details:', err);
      showToast(`Error: ${err.message || 'Unable to refresh this report.'}`, 'error');
      if (!isSent && !report.isRead) {
        const readReport = await markAsRead(report);
        setViewReport(readReport);
      }
    } finally {
      setViewLoading(false);
    }
  };

  const exportReport = (report: Report, format: 'txt' | 'html' | 'csv') => {
    let content = '';
    let mime = '';
    const ext = format;
    const repliesText = report.replies?.map((reply) => `\n--- Reply from ${reply.authorName} (${new Date(reply.createdAt).toLocaleString()}) ---\n${reply.content}`).join('\n') || '';
    const responseCommentsText = report.responseComments ? `\n\nResponse / Remarks\n${report.responseComments}` : '';
    const scopeSummary = getReportScopeSummary(report);
    const authorLevelLabel = getAuthorLevelLabel(report.authorId, report.authorLevel);

    switch (format) {
      case 'txt':
        content = `${report.title}\n${'='.repeat(report.title.length)}\nFrom: ${report.authorName} (${authorLevelLabel})\nScope: ${scopeSummary}\nDate: ${new Date(report.createdAt).toLocaleString()}\n\n${report.content}${responseCommentsText}\n\n${report.dataInserts?.map((dataInsert) => `${dataInsert.label}: ${dataInsert.value}`).join('\n') || ''}${repliesText}`;
        mime = 'text/plain';
        break;
      case 'html':
        content = `<!DOCTYPE html><html><head><title>${report.title}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#333}h1{color:#1e40af}.meta{color:#666;margin-bottom:20px}.data{background:#f0f4ff;padding:12px;border-radius:8px;margin:8px 0}.reply{background:#f9fafb;border-left:3px solid #6366f1;padding:12px;margin:8px 0;border-radius:4px}.response{background:#fff7ed;border:1px solid #fed7aa;padding:12px;border-radius:8px;margin:12px 0}</style></head><body><h1>${report.title}</h1><div class="meta"><strong>From:</strong> ${report.authorName} (${authorLevelLabel})<br/><strong>Scope:</strong> ${scopeSummary}<br/><strong>Date:</strong> ${new Date(report.createdAt).toLocaleString()}</div><div>${report.content.replace(/\n/g, '<br/>')}</div>${report.responseComments ? `<div class="response"><strong>Response / Remarks:</strong><p>${report.responseComments.replace(/\n/g, '<br/>')}</p></div>` : ''}${report.dataInserts?.map((dataInsert) => `<div class="data"><strong>${dataInsert.label}:</strong> ${dataInsert.value}</div>`).join('') || ''}${report.replies?.map((reply) => `<div class="reply"><strong>${reply.authorName}</strong> <small>(${new Date(reply.createdAt).toLocaleString()})</small><p>${reply.content.replace(/\n/g, '<br/>')}</p></div>`).join('') || ''}</body></html>`;
        mime = 'text/html';
        break;
      case 'csv':
        content = `Title,Author,Scope,Date,Content\n"${report.title}","${report.authorName}","${scopeSummary}","${new Date(report.createdAt).toLocaleString()}","${report.content.replace(/"/g, '""')}"`;
        mime = 'text/csv';
        break;
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const printReport = (report: Report) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const scopeSummary = getReportScopeSummary(report);
    const authorLevelLabel = getAuthorLevelLabel(report.authorId, report.authorLevel);
    printWindow.document.write(`<html><head><title>${report.title}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px}h1{color:#1e40af}.meta{color:#666;margin-bottom:20px}.data{background:#f0f4ff;padding:12px;border-radius:8px;margin:8px 0}.reply{background:#f9fafb;border-left:3px solid #6366f1;padding:12px;margin:8px 0;border-radius:4px}.response{background:#fff7ed;border:1px solid #fed7aa;padding:12px;border-radius:8px;margin:12px 0}</style></head><body><h1>${report.title}</h1><div class="meta"><strong>From:</strong> ${report.authorName} (${authorLevelLabel})<br/><strong>Scope:</strong> ${scopeSummary}<br/><strong>Date:</strong> ${new Date(report.createdAt).toLocaleString()}</div><div>${report.content.replace(/\n/g, '<br/>')}</div>${report.responseComments ? `<div class="response"><strong>Response / Remarks:</strong><p>${report.responseComments.replace(/\n/g, '<br/>')}</p></div>` : ''}${report.dataInserts?.map((dataInsert) => `<div class="data"><strong>${dataInsert.label}:</strong> ${dataInsert.value}</div>`).join('') || ''}${report.replies?.map((reply) => `<div class="reply"><strong>${reply.authorName}</strong> <small>(${new Date(reply.createdAt).toLocaleString()})</small><p>${reply.content.replace(/\n/g, '<br/>')}</p></div>`).join('') || ''}${report.attachments?.map((attachment) => `<p>Attachment: ${attachment.name} (${(attachment.size / 1024).toFixed(1)}KB)</p>`).join('') || ''}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const ReportCard = ({ report, isSent }: { report: Report; isSent?: boolean }) => (
    <div
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${!report.isRead && !isSent ? 'bg-blue-50/50' : ''}`}
      onClick={() => { openReport(report, isSent); }}
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
          <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-2">
            <span>{isSent ? 'Created by you' : `From: ${report.authorName}`}</span>
            <Badge variant="outline" className="text-[10px]">{getAuthorLevelLabel(report.authorId, report.authorLevel)}</Badge>
            <Badge variant="secondary" className="text-[10px]">{getReportScopeSummary(report)}</Badge>
          </p>
          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{report.content.slice(0, 120)}{report.content.length > 120 ? '...' : ''}</p>
          <div className="flex items-center gap-2 mt-1">
            {report.attachments && report.attachments.length > 0 && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Paperclip className="w-3 h-3" />{report.attachments.length}</span>}
            {report.dataInserts && report.dataInserts.length > 0 && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Database className="w-3 h-3" />{report.dataInserts.length} data</span>}
            {report.replies && report.replies.length > 0 && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Reply className="w-3 h-3" />{report.replies.length}</span>}
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
          ? "Your inbox shows reports from all leaders. Use the Outbox to send messages, ask for clarification, or request updates from any leader — you can even reference their reports directly."
          : "Write and send reports to your leaders. Pull in live data from across the platform, attach files, and track what's been read. Star important reports to find them quickly."
        }
        action={{
          label: 'New Report',
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
                    {inbox.length > 0 ? 'No reports match your search.' : 'When leaders below you send reports, they\'ll appear here. You can read, reply, star, export, and print them.'}
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

      {/* COMPOSE DIALOG */}
      <Dialog open={composeOpen} onOpenChange={(open) => { if (!open) { setComposeOpen(false); resetCompose(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isSuperAdmin ? 'Create Church Report' : 'Create Report'}</DialogTitle>
            <DialogDescription>
              Create a report for your current scope. The backend payload is built from your church, branch, and department access automatically, and attachments are uploaded as form-data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Report Scope</Label>
              <p className="text-xs text-gray-500 mb-2">These values will be sent as the report visibility fields for this request.</p>
              <div className="flex flex-wrap gap-2">
                {composeScopeChips.map((chip) => (
                  <Badge key={`${chip.label}-${chip.value}`} variant="secondary" className="px-3 py-1 text-xs">
                    {chip.label}: {chip.value}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Report Title <span className="text-red-500">*</span></Label>
              <Input value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="e.g., Weekly Department Update - Feb 28" />
            </div>

            <div>
              <Label>Report Content <span className="text-red-500">*</span></Label>
              <Textarea value={cContent} onChange={(e) => setCContent(e.target.value)} placeholder="Write your report here. Include updates, challenges, prayer points, and recommendations..." rows={10} className="font-mono text-sm" />
            </div>

            <div>
              <Label>Response / Remarks</Label>
              <Textarea value={cResponseComments} onChange={(e) => setCResponseComments(e.target.value)} placeholder="Optional response comments or remarks to include with this report..." rows={4} className="text-sm" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-1"><Database className="w-3.5 h-3.5" />Insert Platform Data</Label>
                <Button size="sm" variant="outline" onClick={() => setShowDataPicker(!showDataPicker)}><Plus className="w-3.5 h-3.5 mr-1" />Add Data</Button>
              </div>
              <p className="text-xs text-gray-500 mb-2">Pull in live numbers from the platform to include in your report. These snapshots are also stored locally for this device after the report is created.</p>
              {showDataPicker && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {[
                    { type: 'members-count', label: 'Members Count', icon: <Users className="w-4 h-4" /> },
                    { type: 'workforce-count', label: 'Workforce Count', icon: <Briefcase className="w-4 h-4" /> },
                    { type: 'newcomers-count', label: 'Newcomers Count', icon: <UserPlus className="w-4 h-4" /> },
                    { type: 'programs-summary', label: 'Programs Summary', icon: <Calendar className="w-4 h-4" /> },
                    { type: 'finance-summary', label: 'Finance Summary', icon: <DollarSign className="w-4 h-4" /> },
                  ].map((item) => (
                    <Button key={item.type} variant="outline" size="sm" className="justify-start text-xs" onClick={() => insertData(item.type)}>
                      {item.icon}<span className="ml-1">{item.label}</span>
                    </Button>
                  ))}
                </div>
              )}
              {cDataInserts.length > 0 && (
                <div className="space-y-1.5">
                  {cDataInserts.map((dataInsert) => (
                    <div key={dataInsert.id} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 text-xs">
                      <Database className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-medium text-blue-800">{dataInsert.label}:</span>
                      <span className="text-blue-600 flex-1">{dataInsert.value}</span>
                      <button onClick={() => removeDataInsert(dataInsert.id)}><X className="w-3.5 h-3.5 text-blue-400" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" />Attachments</Label>
              <p className="text-xs text-gray-500 mb-2">Upload images, PDFs, or documents. Files are sent to the backend as form-data.</p>
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" className="hidden" onChange={handleFileUpload} />
              <div className="flex gap-2 mb-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Image className="w-3.5 h-3.5 mr-1" />Upload Image</Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Paperclip className="w-3.5 h-3.5 mr-1" />Upload File</Button>
              </div>
              {cAttachments.length > 0 && (
                <div className="space-y-1.5">
                  {cAttachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs">
                      {attachment.type.startsWith('image/') ? <Image className="w-3.5 h-3.5 text-green-500" /> : <FileText className="w-3.5 h-3.5 text-gray-500" />}
                      <span className="flex-1 truncate">{attachment.name}</span>
                      <span className="text-gray-400">{(attachment.size / 1024).toFixed(1)}KB</span>
                      <button onClick={() => setCAttachments((prev) => prev.filter((item) => item.id !== attachment.id))}><X className="w-3.5 h-3.5 text-gray-400" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                      onChange={(e) => setReportRefSearch(e.target.value)}
                      placeholder="Search reports..."
                      className="text-sm"
                    />
                    {referenceableReports.length > 0 ? (
                      referenceableReports.map((report) => (
                        <div key={report.id} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 text-xs cursor-pointer" onClick={() => insertReportReference(report)}>
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-medium text-blue-800">{report.title}:</span>
                          <span className="text-blue-600 flex-1">{report.content.slice(0, 80)}...</span>
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
              <Button className="flex-1" disabled={!cTitle.trim() || !cContent.trim() || saving} onClick={handleSendReport}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<Send className="w-4 h-4 mr-2" />Create Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* VIEW REPORT DIALOG */}
      <Dialog open={!!viewReport} onOpenChange={() => { setViewReport(null); setReplyOpen(false); setReplyContent(''); setViewLoading(false); }}>
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
                    <Badge variant="outline" className="text-xs">{getAuthorLevelLabel(viewReport.authorId, viewReport.authorLevel)}</Badge>
                    <Badge variant="secondary" className="text-xs">{getReportScopeSummary(viewReport)}</Badge>
                    <span className="text-gray-400">�</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(viewReport.createdAt).toLocaleString()}</span>
                  </span>
                  {viewReport.creatorEmail && <span className="block mt-1 text-xs text-gray-500">{viewReport.creatorEmail}</span>}
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
                {viewLoading && (
                  <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                    <Loader2 className="w-4 h-4 animate-spin" />Refreshing report details...
                  </div>
                )}

                <div className="prose prose-sm max-w-none">
                  {viewReport.content.split('\n').map((line, index) => <p key={index} className="text-sm text-gray-700 mb-1">{line || '\u00A0'}</p>)}
                </div>

                {viewReport.responseComments && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Response / Remarks</h4>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900 whitespace-pre-wrap">{viewReport.responseComments}</div>
                  </div>
                )}

                {viewReport.dataInserts && viewReport.dataInserts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Embedded Data</h4>
                    {viewReport.dataInserts.map((dataInsert) => (
                      <div key={dataInsert.id} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 text-sm">
                        <Database className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-blue-800">{dataInsert.label}:</span>
                        <span className="text-blue-600">{dataInsert.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {viewReport.attachments && viewReport.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Attachments</h4>
                    {viewReport.attachments.map((attachment) => (
                      <div key={attachment.id} className="border rounded-lg overflow-hidden">
                        {attachment.type.startsWith('image/') && attachment.dataUrl ? (
                          <img src={attachment.dataUrl} alt={attachment.name} className="w-full max-h-64 object-contain bg-gray-50" />
                        ) : null}
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-xs">
                          <FileText className="w-3.5 h-3.5 text-gray-500" />
                          <span className="flex-1">{attachment.name}</span>
                          <span className="text-gray-400">{(attachment.size / 1024).toFixed(1)}KB</span>
                          {attachment.dataUrl && <a href={attachment.dataUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-0.5"><Download className="w-3 h-3" />Open</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {viewReport.replies && viewReport.replies.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1"><Reply className="w-3.5 h-3.5" />Replies ({viewReport.replies.length})</h4>
                    {viewReport.replies.map((reply) => (
                      <div key={reply.id} className="border-l-3 border-indigo-300 bg-gray-50 rounded-r-lg p-3 space-y-1" style={{ borderLeftWidth: '3px' }}>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-gray-800">{reply.authorName}</span>
                          <Badge variant="outline" className="text-[10px]">{getAuthorLevelLabel(reply.authorId, reply.authorLevel)}</Badge>
                          <span className="text-gray-400">{new Date(reply.createdAt).toLocaleString()}</span>
                        </div>
                        {reply.content.split('\n').map((line, index) => <p key={index} className="text-sm text-gray-700">{line || '\u00A0'}</p>)}
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                {replyOpen ? (
                  <div className="space-y-3 bg-indigo-50/50 border border-indigo-100 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-indigo-800 flex items-center gap-1"><Reply className="w-4 h-4" />Write a Reply</h4>
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your reply here..."
                      rows={4}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setReplyOpen(false); setReplyContent(''); }}>Cancel</Button>
                      <Button size="sm" disabled={!replyContent.trim() || saving} onClick={handleSendReply}>
                        {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}<Send className="w-3.5 h-3.5 mr-1" />Save Reply
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setReplyOpen(true)}>
                    <Reply className="w-4 h-4 mr-2" />Reply to this report
                  </Button>
                )}

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












