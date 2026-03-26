import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { BibleLoader } from '../components/BibleLoader';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  FileText,
  Plus,
  Send,
  Download,
  Printer,
  Search,
  X,
  Loader2,
  Paperclip,
  Image,
  Users,
  Briefcase,
  UserPlus,
  Calendar,
  DollarSign,
  Database,
  Clock,
  Star,
  Eye,
  EyeOff,
  UserCircle2,
  Reply,
  Forward,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Report, ReportDataInsert, ReportAttachment, Admin, AdminLevel, Department, Unit } from '../types';
import {
  createReport,
  fetchReportById,
  fetchReports,
  markReportRead,
  replyToReport,
  forwardReport,
  saveReports,
  fetchReportRecipients,
  fetchMembers,
  fetchWorkforce,
  fetchNewcomers,
  fetchPrograms,
  fetchLedgerEntries,
  fetchDepartments,
  fetchUnits,
} from '../api';
import { resolvePrimaryBranchId } from '../utils/scope';

const LEVEL_LABELS: Record<AdminLevel, string> = {
  unit: 'Unit Head',
  department: 'Dept. Head',
  branch: 'Branch Head',
  church: 'Super Admin',
};

const LEVEL_ORDER: Record<AdminLevel, number> = {
  church: 0,
  branch: 1,
  department: 2,
  unit: 3,
};

const SCOPE_LABELS: Record<'church' | 'branch' | 'department', string> = {
  church: 'Church',
  branch: 'Branch',
  department: 'Department',
};

type ReportListFilter = 'inbox' | 'outbox' | 'starred';
type ReportRecipientOption = { id: string; name: string };

function combineReportCollections(collections: Report[][]) {
  const seenReportIds = new Set<string>();

  return collections
    .flat()
    .filter((report) => {
      if (seenReportIds.has(report.id)) {
        return false;
      }
      seenReportIds.add(report.id);
      return true;
    })
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
}

export function Reports() {
  const { church, branches } = useChurch();
  const { currentAdmin } = useAuth();
  const primaryBranchId = resolvePrimaryBranchId(branches, currentAdmin);
  const { showToast } = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [reportRecipients, setReportRecipients] = useState<ReportRecipientOption[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  const [composeOpen, setComposeOpen] = useState(false);
  const [cTitle, setCTitle] = useState('');
  const [cContent, setCContent] = useState('');
  const [cRecipientIds, setCRecipientIds] = useState<string[]>([]);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientPopoverOpen, setRecipientPopoverOpen] = useState(false);
  const [cDataInserts, setCDataInserts] = useState<ReportDataInsert[]>([]);
  const [cAttachments, setCAttachments] = useState<ReportAttachment[]>([]);
  const [showDataPicker, setShowDataPicker] = useState(false);

  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardRecipientIds, setForwardRecipientIds] = useState<string[]>([]);
  const [forwardMessage, setForwardMessage] = useState('');
  const [forwardLoading, setForwardLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ title: string; content: string; format: 'txt' | 'html' | 'csv' } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [listFilter, setListFilter] = useState<ReportListFilter>('inbox');

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [receivedReportsResult, sentReportsResult, recipientsResult, departmentsResult, unitsResult] = await Promise.allSettled([
        fetchReports('received'),
        fetchReports('sent'),
        fetchReportRecipients(church.id || currentAdmin?.churchId),
        fetchDepartments(),
        fetchUnits(),
      ]);

      const nextReports = combineReportCollections([
        receivedReportsResult.status === 'fulfilled' ? receivedReportsResult.value as Report[] : [],
        sentReportsResult.status === 'fulfilled' ? sentReportsResult.value as Report[] : [],
      ]);

      setReports(nextReports);
      setReportRecipients(
        recipientsResult.status === 'fulfilled'
          ? Array.from(new Map((recipientsResult.value as ReportRecipientOption[]).map((recipient) => [recipient.id, recipient])).values())
          : [],
      );
      setDepartments(departmentsResult.status === 'fulfilled' ? departmentsResult.value as Department[] : []);
      setUnits(unitsResult.status === 'fulfilled' ? unitsResult.value as Unit[] : []);

      if (receivedReportsResult.status === 'rejected' && sentReportsResult.status === 'rejected') {
        console.error('Failed to load reports:', {
          received: receivedReportsResult.reason,
          sent: sentReportsResult.reason,
        });
        showToast('Failed to load reports.', 'error');
      }

      if (recipientsResult.status === 'rejected') {
        console.error('Failed to load report recipients:', recipientsResult.reason);
        showToast('Failed to load report recipients.', 'error');
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
      showToast('Failed to load reports.', 'error');
    } finally {
      setLoading(false);
    }
  }, [church.id, currentAdmin, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getReportScopeLevel = useCallback((report: Report): 'church' | 'branch' | 'department' => {
    if (report.departmentId) return 'department';
    if (report.branchId) return 'branch';
    return 'church';
  }, []);

  const getReportScopeName = useCallback((report: Report) => {
    if (report.departmentId) {
      return departments.find((department) => department.id === report.departmentId)?.name || 'Department';
    }
    if (report.branchId) {
      return branches.find((branch) => branch.id === report.branchId)?.name || 'Branch';
    }
    return church.name;
  }, [branches, church.name, departments]);

  const getReportScopeSummary = useCallback((report: Report) => {
    const scopeLevel = getReportScopeLevel(report);
    const scopeLabel = SCOPE_LABELS[scopeLevel];
    const scopeName = getReportScopeName(report);
    return scopeName && scopeName !== scopeLabel ? `${scopeLabel}: ${scopeName}` : scopeLabel;
  }, [getReportScopeLevel, getReportScopeName]);

  const getAuthorLevelLabel = useCallback((_authorId: string, fallback: AdminLevel) => {
    return LEVEL_LABELS[fallback];
  }, []);

  const getAdminScopeNames = useCallback((admin: Admin) => {
    switch (admin.level) {
      case 'church':
        return [church.name];
      case 'branch': {
        const branchIds = Array.from(new Set([...(admin.branchIds || []), admin.branchId].filter(Boolean)));
        const names = branchIds
          .map((branchId) => branches.find((branch) => branch.id === branchId)?.name)
          .filter((name): name is string => Boolean(name));
        return names.length > 0 ? names : ['Branch'];
      }
      case 'department': {
        const departmentIds = Array.from(new Set([...(admin.departmentIds || []), admin.departmentId].filter(Boolean)));
        const names = departmentIds
          .map((departmentId) => departments.find((department) => department.id === departmentId)?.name)
          .filter((name): name is string => Boolean(name));
        return names.length > 0 ? names : ['Department'];
      }
      case 'unit': {
        const unitIds = Array.from(new Set([...(admin.unitIds || []), admin.unitId].filter(Boolean)));
        const names = unitIds
          .map((unitId) => units.find((unit) => unit.id === unitId)?.name)
          .filter((name): name is string => Boolean(name));
        return names.length > 0 ? names : ['Unit'];
      }
      default:
        return [];
    }
  }, [branches, church.name, departments, units]);

  const formatAdminScopeSummary = useCallback((admin: Admin) => {
    const scopeNames = getAdminScopeNames(admin);
    if (scopeNames.length === 0) return LEVEL_LABELS[admin.level];
    if (scopeNames.length === 1) return scopeNames[0];
    return `${scopeNames[0]} +${scopeNames.length - 1}`;
  }, [getAdminScopeNames]);

  const composeContextChips = useMemo(() => {
    if (!currentAdmin) return [];

    const chips = [
      {
        label: 'Sender',
        value: `${currentAdmin.name} (${LEVEL_LABELS[currentAdmin.level]})`,
      },
    ];
    const senderScopeNames = getAdminScopeNames(currentAdmin);
    if (senderScopeNames.length > 0) {
      chips.push({
        label: 'Scope',
        value: senderScopeNames.length === 1 ? senderScopeNames[0] : `${senderScopeNames[0]} +${senderScopeNames.length - 1}`,
      });
    }
    return chips;
  }, [currentAdmin, getAdminScopeNames]);

  const eligibleRecipients = useMemo(() => (
    reportRecipients
      .filter((recipient) => recipient.id !== currentAdmin?.id)
      .sort((left, right) => {
        const nameSort = left.name.localeCompare(right.name);
        if (nameSort !== 0) return nameSort;
        return left.id.localeCompare(right.id);
      })
  ), [currentAdmin, reportRecipients]);

  const selectedRecipients = useMemo(() => (
    eligibleRecipients.filter((recipient) => cRecipientIds.includes(recipient.id))
  ), [eligibleRecipients, cRecipientIds]);

  const recipientNameCounts = useMemo(() => {
    const counts = new Map<string, number>();

    eligibleRecipients.forEach((recipient) => {
      counts.set(recipient.name, (counts.get(recipient.name) || 0) + 1);
    });

    return counts;
  }, [eligibleRecipients]);

  const formatRecipientDisplayName = useCallback((recipient: ReportRecipientOption) => {
    if ((recipientNameCounts.get(recipient.name) || 0) <= 1) {
      return recipient.name;
    }

    return `${recipient.name} (${recipient.id.slice(-6)})`;
  }, [recipientNameCounts]);

  const recipientTriggerLabel = useMemo(() => {
    if (selectedRecipients.length === 0) {
      return 'Search recipients by name...';
    }

    if (selectedRecipients.length === 1) {
      return formatRecipientDisplayName(selectedRecipients[0]);
    }

    return `${formatRecipientDisplayName(selectedRecipients[0])} +${selectedRecipients.length - 1} more`;
  }, [formatRecipientDisplayName, selectedRecipients]);

  const filteredRecipientOptions = useMemo(() => {
    const loweredSearch = recipientSearch.trim().toLowerCase();
    if (!loweredSearch) return eligibleRecipients;

    return eligibleRecipients.filter((recipient) => {
      const haystacks = [
        recipient.name,
        recipient.id,
      ];
      return haystacks.some((value) => value.toLowerCase().includes(loweredSearch));
    });
  }, [eligibleRecipients, recipientSearch]);

  const inboxCount = useMemo(() => (
    reports.filter((report) => report.reportType === 'received').length
  ), [reports]);

  const outboxCount = useMemo(() => (
    reports.filter((report) => report.reportType === 'sent').length
  ), [reports]);

  const starredCount = useMemo(() => (
    reports.filter((report) => report.isStarred).length
  ), [reports]);

  const unreadCount = useMemo(() => (
    reports.filter((report) => report.reportType === 'received' && !report.isRead).length
  ), [reports]);

  const attachmentCount = useMemo(() => (
    reports.reduce((total, report) => total + (report.attachments?.length || 0), 0)
  ), [reports]);

  const visibleReports = useMemo(() => {
    const loweredSearch = searchTerm.trim().toLowerCase();

    return reports
      .filter((report) => {
        if (listFilter === 'inbox' && report.reportType !== 'received') return false;
        if (listFilter === 'outbox' && report.reportType !== 'sent') return false;
        if (listFilter === 'starred' && !report.isStarred) return false;

        if (!loweredSearch) return true;

        const haystacks = [
          report.title,
          report.authorName,
          report.content,
          getReportScopeSummary(report),
          ...(report.recipientNames || []),
        ];

        return haystacks.some((value) => value.toLowerCase().includes(loweredSearch));
      })
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }, [getReportScopeSummary, listFilter, reports, searchTerm]);

  const fetchDataSnippet = async (type: string): Promise<ReportDataInsert> => {
    const id = `di-${Date.now()}`;
    try {
      switch (type) {
        case 'members-count': {
          const members = await fetchMembers(resolvedBranchId || undefined);
          const count = (members as any[]).length;
          return { id, type: 'members-count', label: 'Total Members', value: `${count} members` };
        }
        case 'workforce-count': {
          const workforce = await fetchWorkforce(resolvedBranchId || undefined);
          const count = (workforce as any[]).length;
          return { id, type: 'workforce-count', label: 'Workforce Size', value: `${count} active workers` };
        }
        case 'newcomers-count': {
          const newcomers = await fetchNewcomers(resolvedBranchId || undefined);
          const activeNewcomers = (newcomers as any[]).filter((item) => !item.movedToMemberId);
          return { id, type: 'newcomers-count', label: 'Active Newcomers', value: `${activeNewcomers.length} newcomers` };
        }
        case 'programs-summary': {
          const programs = await fetchPrograms(resolvedBranchId || undefined);
          const count = (programs as any[]).length;
          return { id, type: 'programs-summary', label: 'Programs', value: `${count} programs running` };
        }
        case 'finance-summary': {
          const entries = await fetchLedgerEntries(
            resolvedBranchId || undefined,
            currentAdmin?.level === 'department' || currentAdmin?.level === 'unit'
              ? resolvedDepartmentId || undefined
              : undefined,
          );
          const ledgerEntries = entries as any[];
          const income = ledgerEntries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0);
          const expense = ledgerEntries.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0);
          return {
            id,
            type: 'finance-summary',
            label: 'Finance Summary',
            value: `Income: ${income.toLocaleString()} | Expenses: ${expense.toLocaleString()} | Net: ${(income - expense).toLocaleString()}`,
          };
        }
        default:
          return { id, type: 'custom', label: 'Custom', value: '' };
      }
    } catch {
      return { id, type: type as ReportDataInsert['type'], label: type, value: 'Unable to fetch data' };
    }
  };

  const insertData = async (type: string) => {
    const snippet = await fetchDataSnippet(type);
    setCDataInserts((previous) => [...previous, snippet]);
    setCContent((previous) => `${previous}${previous.trim() ? '\n\n' : ''}[Data] ${snippet.label}: ${snippet.value}\n`);
    setShowDataPicker(false);
  };

  const removeDataInsert = (id: string) => {
    setCDataInserts((previous) => previous.filter((dataInsert) => dataInsert.id !== id));
  };

  const toggleRecipient = (recipientId: string) => {
    setCRecipientIds((previous) => (
      previous.includes(recipientId)
        ? previous.filter((id) => id !== recipientId)
        : [...previous, recipientId]
    ));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        showToast(`${file.name} is too large (max 5MB).`, 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setCAttachments((previous) => [
          ...previous,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            type: file.type,
            dataUrl: reader.result as string,
            size: file.size,
            file,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const resetCompose = useCallback(() => {
    setCTitle('');
    setCContent('');
    setCRecipientIds([]);
    setRecipientSearch('');
    setRecipientPopoverOpen(false);
    setCDataInserts([]);
    setCAttachments([]);
    setShowDataPicker(false);
  }, []);

  const getCurrentRecipientEntry = useCallback((report: Report) => {
    if (!report.recipientEntries || report.recipientEntries.length === 0) {
      return null;
    }

    return (
      report.recipientEntries.find((entry) => entry.recipientId === currentAdmin?.id) ||
      report.recipientEntries[0]
    );
  }, [currentAdmin?.id]);

  const handleSendReport = async () => {
    if (!currentAdmin) {
      showToast('Your admin profile is not ready yet.', 'error');
      return;
    }
    if (!cTitle.trim()) {
      showToast('Add a report title before sending.', 'error');
      return;
    }
    if (!cContent.trim()) {
      showToast('Write your report content before sending.', 'error');
      return;
    }
    if (cRecipientIds.length === 0) {
      showToast('Select at least one recipient.', 'error');
      return;
    }

    setSaving(true);
    try {
      const pendingDataInserts = cDataInserts;
      const response = await createReport({
        title: cTitle.trim(),
        comments: cContent.trim(),
        recipients: cRecipientIds,
        files: cAttachments
          .map((attachment) => attachment.file)
          .filter((file): file is File => Boolean(file)),
      });

      const createdReportId = response?.report?.id || response?.id;

      setComposeOpen(false);
      setListFilter('outbox');
      resetCompose();
      showToast(response?.message || 'Report created successfully.');

      try {
        const [receivedReports, sentReports] = await Promise.all([
          fetchReports('received'),
          fetchReports('sent'),
        ]);
        const refreshedReports = combineReportCollections([receivedReports, sentReports]);
        const nextReports = createdReportId && pendingDataInserts.length > 0
          ? refreshedReports.map((report) => report.id === createdReportId ? { ...report, dataInserts: pendingDataInserts } : report)
          : refreshedReports;

        if (pendingDataInserts.length > 0) {
          await saveReports(nextReports);
        }

        setReports(nextReports);
      } catch (refreshError: any) {
        console.error('Failed to refresh reports after create:', refreshError);
        showToast('Report created successfully, but refreshing the report list failed.', 'error');
      }
    } catch (error: any) {
      console.error('Failed to create report:', error);
      showToast(`Error: ${error.message || 'Unable to create report.'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const markAsRead = async (report: Report) => {
    if (report.isRead) return report;

    const recipientEntry = getCurrentRecipientEntry(report);

    try {
      const response = await markReportRead(report.id);
      const readAt = response?.readAt ? new Date(response.readAt) : new Date();
      const updatedReport = {
        ...report,
        isRead: true,
        readAt,
        recipientEntryId: recipientEntry?.id,
        recipientEntries: report.recipientEntries?.map((entry) => (
          entry.id === recipientEntry?.id ? { ...entry, isRead: true, readAt } : entry
        )),
      };
      const nextReports = reports.map((currentReport) => (
        currentReport.id === report.id ? updatedReport : currentReport
      ));

      setReports(nextReports);
      setViewReport((previous) => previous?.id === report.id ? updatedReport : previous);
      await saveReports(nextReports);
      return updatedReport;
    } catch (error) {
      console.error('Failed to mark report as read:', error);
      return report;
    }
  };

  const toggleStar = async (event: React.MouseEvent, reportId: string) => {
    event.stopPropagation();

    const nextReports = reports.map((currentReport) => (
      currentReport.id === reportId ? { ...currentReport, isStarred: !currentReport.isStarred } : currentReport
    ));
    const updatedReport = nextReports.find((report) => report.id === reportId) || null;

    setReports(nextReports);
    if (viewReport?.id === reportId) {
      setViewReport(updatedReport);
    }
    await saveReports(nextReports);
  };

  const handleSendReply = async () => {
    if (!viewReport || !replyText.trim()) return;
    setReplyLoading(true);
    try {
      await replyToReport(viewReport.id, replyText.trim());
      setReplyText('');
      // Refresh the report to get the new reply from server
      const fresh = await fetchReportById(viewReport.id, viewReport.reportType === 'starred' ? 'received' : viewReport.reportType);
      if (fresh) {
        setViewReport(fresh);
        setReports(prev => prev.map(r => r.id === fresh.id ? fresh : r));
        await saveReports(reports.map(r => r.id === fresh.id ? fresh : r));
      }
      showToast('Reply sent successfully.');
    } catch (err: any) {
      showToast(err?.body?.message || err?.message || 'Failed to send reply.', 'error');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleSendForward = async () => {
    if (!viewReport || forwardRecipientIds.length === 0) return;
    setForwardLoading(true);
    try {
      await forwardReport(viewReport.id, forwardRecipientIds, forwardMessage);
      setForwardOpen(false);
      setForwardRecipientIds([]);
      setForwardMessage('');
      showToast('Report forwarded successfully.');
    } catch (err: any) {
      showToast(err?.body?.message || err?.message || 'Failed to forward report.', 'error');
    } finally {
      setForwardLoading(false);
    }
  };

  const toggleForwardRecipient = (id: string) =>
    setForwardRecipientIds(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);

  const openReport = async (report: Report) => {
    setViewReport(report);
    setViewLoading(true);

    try {
      const freshReport = await fetchReportById(report.id, report.reportType === 'received' ? 'received' : 'sent');
      setViewReport(freshReport);

      if (freshReport.authorId !== currentAdmin?.id && !freshReport.isRead) {
        const readReport = await markAsRead(freshReport);
        setViewReport(readReport);
      }
    } catch (error: any) {
      console.error('Failed to fetch report details:', error);
      showToast(`Error: ${error.message || 'Unable to refresh this report.'}`, 'error');

      if (report.authorId !== currentAdmin?.id && !report.isRead) {
        const readReport = await markAsRead(report);
        setViewReport(readReport);
      }
    } finally {
      setViewLoading(false);
    }
  };

  const getRecipientSummary = useCallback((report: Report) => {
    const names = (report.recipientNames || []).filter(Boolean);
    if (names.length === 1) return names[0];
    if (names.length > 1) return `${names[0]} +${names.length - 1}`;
    if ((report.recipientIds || []).length > 0) {
      const count = report.recipientIds?.length || 0;
      return `${count} recipient${count === 1 ? '' : 's'}`;
    }
    return report.recipientName || 'Recipients';
  }, []);

  const getRecipientListText = useCallback((report: Report) => {
    const names = (report.recipientNames || []).filter(Boolean);
    if (names.length > 0) return names.join(', ');
    if ((report.recipientIds || []).length > 0) {
      const count = report.recipientIds?.length || 0;
      return `${count} recipient${count === 1 ? '' : 's'}`;
    }
    return report.recipientName || 'Not specified';
  }, []);

  const exportReport = (report: Report, format: 'txt' | 'html' | 'csv') => {
    let content = '';
    let mime = '';
    const extension = format;
    const repliesText = report.replies?.map((reply) => (
      `\n--- Reply from ${reply.authorName} (${new Date(reply.createdAt).toLocaleString()}) ---\n${reply.content}`
    )).join('\n') || '';
    const responseCommentsText = report.responseComments ? `\n\nResponse / Remarks\n${report.responseComments}` : '';
    const scopeSummary = getReportScopeSummary(report);
    const authorLevelLabel = getAuthorLevelLabel(report.authorId, report.authorLevel);
    const recipientSummary = getRecipientListText(report);

    switch (format) {
      case 'txt':
        content = `${report.title}\n${'='.repeat(report.title.length)}\nFrom: ${report.authorName} (${authorLevelLabel})\nScope: ${scopeSummary}\nRecipients: ${recipientSummary}\nDate: ${new Date(report.createdAt).toLocaleString()}\n\n${report.content}${responseCommentsText}\n\n${report.dataInserts?.map((dataInsert) => `${dataInsert.label}: ${dataInsert.value}`).join('\n') || ''}${repliesText}`;
        mime = 'text/plain';
        break;
      case 'html':
        content = `<!DOCTYPE html><html><head><title>${report.title}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#333}h1{color:#1e40af}.meta{color:#666;margin-bottom:20px}.data{background:#f0f4ff;padding:12px;border-radius:8px;margin:8px 0}.reply{background:#f9fafb;border-left:3px solid #6366f1;padding:12px;margin:8px 0;border-radius:4px}.response{background:#fff7ed;border:1px solid #fed7aa;padding:12px;border-radius:8px;margin:12px 0}</style></head><body><h1>${report.title}</h1><div class="meta"><strong>From:</strong> ${report.authorName} (${authorLevelLabel})<br/><strong>Scope:</strong> ${scopeSummary}<br/><strong>Recipients:</strong> ${recipientSummary}<br/><strong>Date:</strong> ${new Date(report.createdAt).toLocaleString()}</div><div>${report.content.replace(/\n/g, '<br/>')}</div>${report.responseComments ? `<div class="response"><strong>Response / Remarks:</strong><p>${report.responseComments.replace(/\n/g, '<br/>')}</p></div>` : ''}${report.dataInserts?.map((dataInsert) => `<div class="data"><strong>${dataInsert.label}:</strong> ${dataInsert.value}</div>`).join('') || ''}${report.replies?.map((reply) => `<div class="reply"><strong>${reply.authorName}</strong> <small>(${new Date(reply.createdAt).toLocaleString()})</small><p>${reply.content.replace(/\n/g, '<br/>')}</p></div>`).join('') || ''}</body></html>`;
        mime = 'text/html';
        break;
      case 'csv':
        content = `Title,Author,Scope,Recipients,Date,Content\n"${report.title}","${report.authorName}","${scopeSummary}","${recipientSummary}","${new Date(report.createdAt).toLocaleString()}","${report.content.replace(/"/g, '""')}"`;
        mime = 'text/csv';
        break;
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const previewReportContent = (report: Report, format: 'txt' | 'html' | 'csv') => {
    const repliesText = report.replies?.map((reply) => (
      `\n--- Reply from ${reply.authorName} (${new Date(reply.createdAt).toLocaleString()}) ---\n${reply.content}`
    )).join('\n') || '';
    const responseCommentsText = report.responseComments ? `\n\nResponse / Remarks\n${report.responseComments}` : '';
    const scopeSummary = getReportScopeSummary(report);
    const authorLevelLabel = getAuthorLevelLabel(report.authorId, report.authorLevel);
    const recipientSummary = getRecipientListText(report);
    let content = '';
    switch (format) {
      case 'txt':
        content = `${report.title}\n${'='.repeat(report.title.length)}\nFrom: ${report.authorName} (${authorLevelLabel})\nScope: ${scopeSummary}\nRecipients: ${recipientSummary}\nDate: ${new Date(report.createdAt).toLocaleString()}\n\n${report.content}${responseCommentsText}\n\n${report.dataInserts?.map((d) => `${d.label}: ${d.value}`).join('\n') || ''}${repliesText}`;
        break;
      case 'html':
        content = `<!DOCTYPE html><html><head><title>${report.title}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#333}h1{color:#1e40af}.meta{color:#666;margin-bottom:20px}.data{background:#f0f4ff;padding:12px;border-radius:8px;margin:8px 0}.reply{background:#f9fafb;border-left:3px solid #6366f1;padding:12px;margin:8px 0;border-radius:4px}.response{background:#fff7ed;border:1px solid #fed7aa;padding:12px;border-radius:8px;margin:12px 0}</style></head><body><h1>${report.title}</h1><div class="meta"><strong>From:</strong> ${report.authorName} (${authorLevelLabel})<br/><strong>Scope:</strong> ${scopeSummary}<br/><strong>Recipients:</strong> ${recipientSummary}<br/><strong>Date:</strong> ${new Date(report.createdAt).toLocaleString()}</div><div>${report.content.replace(/\n/g, '<br/>')}</div>${report.responseComments ? `<div class="response"><strong>Response / Remarks:</strong><p>${report.responseComments.replace(/\n/g, '<br/>')}</p></div>` : ''}${report.dataInserts?.map((d) => `<div class="data"><strong>${d.label}:</strong> ${d.value}</div>`).join('') || ''}${report.replies?.map((reply) => `<div class="reply"><strong>${reply.authorName}</strong> <small>(${new Date(reply.createdAt).toLocaleString()})</small><p>${reply.content.replace(/\n/g, '<br/>')}</p></div>`).join('') || ''}</body></html>`;
        break;
      case 'csv':
        content = `Title,Author,Scope,Recipients,Date,Content\n"${report.title}","${report.authorName}","${scopeSummary}","${recipientSummary}","${new Date(report.createdAt).toLocaleString()}","${report.content.replace(/"/g, '""')}"`;
        break;
    }
    setPreviewContent({ title: report.title, content, format });
  };

  const printReport = (report: Report) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const scopeSummary = getReportScopeSummary(report);
    const authorLevelLabel = getAuthorLevelLabel(report.authorId, report.authorLevel);
    const recipientSummary = getRecipientListText(report);

    printWindow.document.write(`<html><head><title>${report.title}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px}h1{color:#1e40af}.meta{color:#666;margin-bottom:20px}.data{background:#f0f4ff;padding:12px;border-radius:8px;margin:8px 0}.reply{background:#f9fafb;border-left:3px solid #6366f1;padding:12px;margin:8px 0;border-radius:4px}.response{background:#fff7ed;border:1px solid #fed7aa;padding:12px;border-radius:8px;margin:12px 0}</style></head><body><h1>${report.title}</h1><div class="meta"><strong>From:</strong> ${report.authorName} (${authorLevelLabel})<br/><strong>Scope:</strong> ${scopeSummary}<br/><strong>Recipients:</strong> ${recipientSummary}<br/><strong>Date:</strong> ${new Date(report.createdAt).toLocaleString()}</div><div>${report.content.replace(/\n/g, '<br/>')}</div>${report.responseComments ? `<div class="response"><strong>Response / Remarks:</strong><p>${report.responseComments.replace(/\n/g, '<br/>')}</p></div>` : ''}${report.dataInserts?.map((dataInsert) => `<div class="data"><strong>${dataInsert.label}:</strong> ${dataInsert.value}</div>`).join('') || ''}${report.replies?.map((reply) => `<div class="reply"><strong>${reply.authorName}</strong> <small>(${new Date(reply.createdAt).toLocaleString()})</small><p>${reply.content.replace(/\n/g, '<br/>')}</p></div>`).join('') || ''}${report.attachments?.map((attachment) => `<p>Attachment: ${attachment.name} (${(attachment.size / 1024).toFixed(1)}KB)</p>`).join('') || ''}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const ReportCard = ({ report }: { report: Report }) => {
    const isCreatedByCurrentUser = report.authorId === currentAdmin?.id;

    return (
      <div
        className={`p-4 transition-colors hover:bg-gray-50 cursor-pointer ${!report.isRead && !isCreatedByCurrentUser ? 'bg-blue-50/40' : ''}`}
        onClick={() => openReport(report)}
      >
        <div className="flex items-start gap-3">
          <button
            className="mt-1 flex-shrink-0"
            onClick={(event) => toggleStar(event, report.id)}
            title={report.isStarred ? 'Unstar this report' : 'Star this report'}
          >
            <Star className={`w-4 h-4 ${report.isStarred ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
          </button>
          <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${!report.isRead && !isCreatedByCurrentUser ? 'bg-blue-500' : 'bg-transparent'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {report.isForwarded && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 flex-shrink-0">
                      <Forward className="w-2.5 h-2.5" /> Fwd
                    </span>
                  )}
                  <h4 className={`truncate text-sm ${!report.isRead && !isCreatedByCurrentUser ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {report.title}
                  </h4>
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>{isCreatedByCurrentUser ? 'Created by you' : `From: ${report.authorName}`}</span>
                  <Badge variant="outline" className="text-[10px]">{getAuthorLevelLabel(report.authorId, report.authorLevel)}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{getReportScopeSummary(report)}</Badge>
                  {isCreatedByCurrentUser && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                      <Users className="w-3 h-3" />
                      {getRecipientSummary(report)}
                    </span>
                  )}
                </p>
              </div>
              <span className="flex-shrink-0 text-[10px] text-gray-400">
                {new Date(report.createdAt).toLocaleDateString()}
              </span>
            </div>

            <p className="mt-2 line-clamp-2 text-xs text-gray-400">
              {report.content.slice(0, 160)}
              {report.content.length > 160 ? '...' : ''}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
              {report.attachments && report.attachments.length > 0 && (
                <span className="flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  {report.attachments.length}
                </span>
              )}
              {report.dataInserts && report.dataInserts.length > 0 && (
                <span className="flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  {report.dataInserts.length} data
                </span>
              )}
              {report.replies && report.replies.length > 0 && (
                <span className="flex items-center gap-1">
                  <Reply className="w-3 h-3" />
                  {report.replies.length}
                </span>
              )}
              {isCreatedByCurrentUser ? (
                report.isRead ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Eye className="w-3 h-3" />
                    Read {report.readAt ? new Date(report.readAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    Unread
                  </span>
                )
              ) : (
                <span className={`flex items-center gap-1 ${report.isRead ? 'text-gray-400' : 'text-blue-600'}`}>
                  {report.isRead ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {report.isRead ? 'Opened' : 'New'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <PageHeader
        title="Reports"
        description="Create reports, choose recipients directly, attach supporting files, and review recent report activity in one place."
        action={{
          label: 'New Report',
          onClick: () => {
            resetCompose();
            setComposeOpen(true);
          },
          icon: <Plus className="w-4 h-4 mr-2" />,
        }}
      />

      <div className="p-4 md:p-6 space-y-6">
        {loading ? (
          <BibleLoader message="Loading reports..." />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Total Reports</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900">{reports.length}</p>
                    </div>
                    <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                      <FileText className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Outbox Reports</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900">{outboxCount}</p>
                    </div>
                    <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
                      <Send className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Unread Reports</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900">{unreadCount}</p>
                    </div>
                    <div className="rounded-full bg-violet-50 p-3 text-violet-600">
                      <EyeOff className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Attached Files</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900">{attachmentCount}</p>
                    </div>
                    <div className="rounded-full bg-amber-50 p-3 text-amber-600">
                      <Paperclip className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Recent Reports</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Switch between inbox, outbox, and starred reports to review activity from each view.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative min-w-[240px]">
                      <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={listFilter === 'inbox' ? 'default' : 'outline'}
                        onClick={() => setListFilter('inbox')}
                      >
                        Inbox ({inboxCount})
                      </Button>
                      <Button
                        size="sm"
                        variant={listFilter === 'outbox' ? 'default' : 'outline'}
                        onClick={() => setListFilter('outbox')}
                      >
                        Outbox ({outboxCount})
                      </Button>
                      <Button
                        size="sm"
                        variant={listFilter === 'starred' ? 'default' : 'outline'}
                        onClick={() => setListFilter('starred')}
                      >
                        <Star className={`w-4 h-4 mr-1 ${listFilter === 'starred' ? 'fill-current' : ''}`} />
                        Starred ({starredCount})
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100">
                  {visibleReports.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                      <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                      <h3 className="font-semibold text-gray-700">No reports found</h3>
                      <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                        {reports.length === 0
                          ? 'Create your first report to start sending updates to selected admins.'
                          : 'Try a different search term or switch to another report tab.'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {visibleReports.map((report) => (
                        <ReportCard key={report.id} report={report} />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={composeOpen} onOpenChange={(open) => {
        if (!open) {
          setComposeOpen(false);
          resetCompose();
        }
      }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Report</DialogTitle>
            <DialogDescription>
              Select one or more recipients, write your update, and attach any supporting files or platform data snapshots.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-5">
            {composeContextChips.length > 0 && (
              <div>
                <Label>Sending From</Label>
                <p className="mb-2 text-xs text-gray-500">This reflects your current admin access and is shown here for context.</p>
                <div className="flex flex-wrap gap-2">
                  {composeContextChips.map((chip) => (
                    <Badge key={`${chip.label}-${chip.value}`} variant="secondary" className="px-3 py-1 text-xs">
                      {chip.label}: {chip.value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Report Title <span className="text-red-500">*</span></Label>
              <Input
                value={cTitle}
                onChange={(event) => setCTitle(event.target.value)}
                placeholder="e.g., Monthly Financial Report"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label>Recipients <span className="text-red-500">*</span></Label>
                  <p className="text-xs text-gray-500 mt-1">Choose the admin accounts that should receive this report.</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {cRecipientIds.length} selected
                </Badge>
              </div>

              <Popover
                open={recipientPopoverOpen}
                onOpenChange={(open) => {
                  setRecipientPopoverOpen(open);
                  if (!open) {
                    setRecipientSearch('');
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto min-h-11 w-full justify-between px-3 py-3 font-normal"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Search className="w-4 h-4 text-gray-400" />
                      <span className={`truncate ${selectedRecipients.length === 0 ? 'text-gray-500' : 'text-gray-900'}`}>
                        {recipientTriggerLabel}
                      </span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${recipientPopoverOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                  <div className="border-b p-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        autoFocus
                        value={recipientSearch}
                        onChange={(event) => setRecipientSearch(event.target.value)}
                        placeholder="Search recipients by name..."
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="max-h-72 space-y-2 overflow-y-auto p-3">
                    {filteredRecipientOptions.length === 0 ? (
                      <div className="py-6 text-center text-sm text-gray-500">
                        No recipients match your search.
                      </div>
                    ) : (
                      filteredRecipientOptions.map((recipient) => {
                        const isSelected = cRecipientIds.includes(recipient.id);
                        return (
                          <div key={recipient.id} className={`rounded-lg border px-3 py-3 transition-colors ${isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                            <div className="flex items-start gap-3">
                              <Checkbox checked={isSelected} onCheckedChange={() => toggleRecipient(recipient.id)} className="mt-1" />
                              <button type="button" onClick={() => toggleRecipient(recipient.id)} className="flex-1 text-left">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-gray-900">{formatRecipientDisplayName(recipient)}</span>
                                </div>
                                {(recipientNameCounts.get(recipient.name) || 0) > 1 && (
                                  <p className="mt-1 text-xs text-gray-500">Recipient ID: {recipient.id}</p>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {selectedRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedRecipients.map((recipient) => (
                    <Badge key={recipient.id} variant="secondary" className="flex items-center gap-2 px-3 py-1 text-xs">
                      <span>{formatRecipientDisplayName(recipient)}</span>
                      <button type="button" onClick={() => toggleRecipient(recipient.id)} aria-label={`Remove ${recipient.name}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Report Content <span className="text-red-500">*</span></Label>
              <Textarea
                value={cContent}
                onChange={(event) => setCContent(event.target.value)}
                placeholder="Write your report here. Include updates, challenges, outcomes, and next steps..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" />
                  Insert Platform Data
                </Label>
                <Button size="sm" variant="outline" onClick={() => setShowDataPicker(!showDataPicker)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Data
                </Button>
              </div>
              <p className="mb-2 text-xs text-gray-500">
                Pull live numbers from the platform and save those snapshots alongside this report on this device.
              </p>

              {showDataPicker && (
                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    { type: 'members-count', label: 'Members Count', icon: <Users className="w-4 h-4" /> },
                    { type: 'workforce-count', label: 'Workforce Count', icon: <Briefcase className="w-4 h-4" /> },
                    { type: 'newcomers-count', label: 'Newcomers Count', icon: <UserPlus className="w-4 h-4" /> },
                    { type: 'programs-summary', label: 'Programs Summary', icon: <Calendar className="w-4 h-4" /> },
                    { type: 'finance-summary', label: 'Finance Summary', icon: <DollarSign className="w-4 h-4" /> },
                  ].map((item) => (
                    <Button
                      key={item.type}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => insertData(item.type)}
                    >
                      {item.icon}
                      <span className="ml-1">{item.label}</span>
                    </Button>
                  ))}
                </div>
              )}

              {cDataInserts.length > 0 && (
                <div className="space-y-1.5">
                  {cDataInserts.map((dataInsert) => (
                    <div key={dataInsert.id} className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs">
                      <Database className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-medium text-blue-800">{dataInsert.label}:</span>
                      <span className="flex-1 text-blue-600">{dataInsert.value}</span>
                      <button type="button" onClick={() => removeDataInsert(dataInsert.id)}>
                        <X className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5" />
                Attachments
              </Label>
              <p className="mb-2 text-xs text-gray-500">
                Upload images, PDFs, or documents. Files are sent with the report as multipart form-data.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="mb-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Image className="w-3.5 h-3.5 mr-1" />
                  Upload Image
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="w-3.5 h-3.5 mr-1" />
                  Upload File
                </Button>
              </div>

              {cAttachments.length > 0 && (
                <div className="space-y-1.5">
                  {cAttachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs">
                      {attachment.type.startsWith('image/') ? (
                        <Image className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-gray-500" />
                      )}
                      <span className="flex-1 truncate">{attachment.name}</span>
                      <span className="text-gray-400">{(attachment.size / 1024).toFixed(1)}KB</span>
                      <button type="button" onClick={() => setCAttachments((previous) => previous.filter((item) => item.id !== attachment.id))}>
                        <X className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setComposeOpen(false);
                  resetCompose();
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!cTitle.trim() || !cContent.trim() || cRecipientIds.length === 0 || saving}
                onClick={handleSendReport}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Send className="w-4 h-4 mr-2" />
                Send Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewReport} onOpenChange={() => {
        setViewReport(null);
        setViewLoading(false);
        setReplyText('');
        setForwardOpen(false);
        setForwardRecipientIds([]);
        setForwardMessage('');
      }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden p-0">
          {viewReport && (
            <>
              <div className="flex-1 overflow-y-auto px-6 pt-6 pb-2">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <button onClick={(event) => toggleStar(event, viewReport.id)} title="Toggle star">
                    <Star className={`w-5 h-5 ${viewReport.isStarred ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
                  </button>
                  <DialogTitle className="flex-1">{viewReport.title}</DialogTitle>
                </div>
                <DialogDescription>
                  <span className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1">
                      <UserCircle2 className="w-3.5 h-3.5" />
                      <strong>{viewReport.authorName}</strong>
                    </span>
                    <Badge variant="outline" className="text-xs">{getAuthorLevelLabel(viewReport.authorId, viewReport.authorLevel)}</Badge>
                    <Badge variant="secondary" className="text-xs">{getReportScopeSummary(viewReport)}</Badge>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(viewReport.createdAt).toLocaleString()}
                    </span>
                  </span>
                  {viewReport.creatorEmail && (
                    <span className="mt-1 block text-xs text-gray-500">{viewReport.creatorEmail}</span>
                  )}
                  <span className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Recipients: {getRecipientListText(viewReport)}
                    </Badge>
                    {viewReport.isRead ? (
                      <Badge className="bg-green-100 text-green-700 border-0 text-[10px] font-normal">
                        <Eye className="w-3 h-3 mr-1" />
                        Read {viewReport.readAt ? `on ${new Date(viewReport.readAt).toLocaleString()}` : ''}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500 border-0 text-[10px] font-normal">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Not yet read
                      </Badge>
                    )}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                {viewLoading && (
                  <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Refreshing report details...
                  </div>
                )}

                {/* Forwarded-from banner */}
                {viewReport.isForwarded && viewReport.referenceTitle && (
                  <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    <Forward className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Forwarded from: <strong>{viewReport.referenceTitle}</strong></span>
                  </div>
                )}

                <div className="prose prose-sm max-w-none">
                  {viewReport.content.split('\n').map((line, index) => (
                    <p key={index} className="mb-1 text-sm text-gray-700">{line || '\u00A0'}</p>
                  ))}
                </div>

                {viewReport.responseComments && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-gray-500">Response / Remarks</h4>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900 whitespace-pre-wrap">
                      {viewReport.responseComments}
                    </div>
                  </div>
                )}

                {viewReport.dataInserts && viewReport.dataInserts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-gray-500">Embedded Data</h4>
                    {viewReport.dataInserts.map((dataInsert) => (
                      <div key={dataInsert.id} className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm">
                        <Database className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-blue-800">{dataInsert.label}:</span>
                        <span className="text-blue-600">{dataInsert.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {viewReport.attachments && viewReport.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-gray-500">Attachments</h4>
                    {viewReport.attachments.map((attachment) => (
                      <div key={attachment.id} className="overflow-hidden rounded-lg border">
                        {attachment.type.startsWith('image/') && attachment.dataUrl ? (
                          <img src={attachment.dataUrl} alt={attachment.name} className="max-h-64 w-full object-contain bg-gray-50" />
                        ) : null}
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 text-xs">
                          <FileText className="w-3.5 h-3.5 text-gray-500" />
                          <span className="flex-1">{attachment.name}</span>
                          <span className="text-gray-400">{(attachment.size / 1024).toFixed(1)}KB</span>
                          {attachment.dataUrl && (
                            <a href={attachment.dataUrl} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-blue-600 hover:underline">
                              <Download className="w-3 h-3" />
                              Open
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recipient delivery status */}
                {viewReport.recipientEntries && viewReport.recipientEntries.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-gray-500 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Recipients ({viewReport.recipientEntries.length})
                    </h4>
                    <div className="space-y-1">
                      {viewReport.recipientEntries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-1.5">
                          <span className="font-medium text-gray-700">{entry.recipientName}</span>
                          <div className="flex items-center gap-2">
                            {entry.isForwarded && (
                              <span className="flex items-center gap-0.5 text-blue-600">
                                <Forward className="w-3 h-3" />
                                {entry.forwarderName ? `Fwd by ${entry.forwarderName}` : 'Forwarded'}
                              </span>
                            )}
                            {entry.isRead ? (
                              <span className="flex items-center gap-0.5 text-green-600">
                                <Eye className="w-3 h-3" /> Read
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 text-gray-400">
                                <EyeOff className="w-3 h-3" /> Unread
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewReport.replies && viewReport.replies.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-1 text-xs font-semibold uppercase text-gray-500">
                      <Reply className="w-3.5 h-3.5" />
                      Replies ({viewReport.replies.length})
                    </h4>
                    {viewReport.replies.map((reply) => (
                      <div key={reply.id} className="rounded-r-lg border-l-[3px] border-indigo-300 bg-gray-50 p-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-gray-800">{reply.authorName}</span>
                          <Badge variant="outline" className="text-[10px]">{getAuthorLevelLabel(reply.authorId, reply.authorLevel)}</Badge>
                          <span className="text-gray-400">{new Date(reply.createdAt).toLocaleString()}</span>
                        </div>
                        {reply.content.split('\n').map((line, index) => (
                          <p key={index} className="mt-1 text-sm text-gray-700">{line || '\u00A0'}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

              </div>
              </div>{/* end scrollable area */}

              {/* Reply box — always visible at bottom */}
              <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 space-y-2 flex-shrink-0">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-500">
                  <Reply className="w-3.5 h-3.5" /> Write a Reply
                </h4>
                <Textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  className="bg-white text-sm resize-none"
                  disabled={replyLoading}
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    className="gap-2"
                    disabled={!replyText.trim() || replyLoading}
                    onClick={handleSendReply}
                  >
                    {replyLoading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                      : <><Send className="w-3.5 h-3.5" /> Send Reply</>
                    }
                  </Button>
                </div>
              </div>

              {/* Forward panel */}
              {forwardOpen && (
                <div className="border-t border-blue-100 bg-blue-50 px-6 py-3 space-y-3 flex-shrink-0">
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase text-blue-600">
                    <Forward className="w-3.5 h-3.5" /> Forward Report
                  </h4>

                  {/* Recipient checkboxes */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Select recipients <span className="text-red-500">*</span></p>
                    <div className="max-h-36 overflow-y-auto space-y-1 rounded-lg border border-gray-200 bg-white p-2">
                      {eligibleRecipients.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">No recipients available</p>
                      ) : eligibleRecipients.map(r => (
                        <label key={r.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600"
                            checked={forwardRecipientIds.includes(r.id)}
                            onChange={() => toggleForwardRecipient(r.id)}
                          />
                          <span className="text-sm text-gray-700 flex items-center gap-1">
                            {r.name}
                            {forwardRecipientIds.includes(r.id) && <Check className="w-3 h-3 text-blue-500" />}
                          </span>
                        </label>
                      ))}
                    </div>
                    {forwardRecipientIds.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">{forwardRecipientIds.length} recipient{forwardRecipientIds.length > 1 ? 's' : ''} selected</p>
                    )}
                  </div>

                  {/* Optional message */}
                  <Textarea
                    value={forwardMessage}
                    onChange={e => setForwardMessage(e.target.value)}
                    placeholder="Add a message (optional)..."
                    rows={2}
                    className="bg-white text-sm resize-none"
                    disabled={forwardLoading}
                  />

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setForwardOpen(false); setForwardRecipientIds([]); setForwardMessage(''); }}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={forwardRecipientIds.length === 0 || forwardLoading}
                      onClick={handleSendForward}
                    >
                      {forwardLoading
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Forwarding...</>
                        : <><Forward className="w-3.5 h-3.5" /> Forward</>
                      }
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex flex-wrap gap-2 px-6 py-3 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setForwardOpen(v => !v)}>
                    <Forward className="w-4 h-4 mr-1" />
                    Forward
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => printReport(viewReport)}>
                    <Printer className="w-4 h-4 mr-1" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => previewReportContent(viewReport, 'txt')}>
                    <Eye className="w-4 h-4 mr-1" />
                    .txt
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportReport(viewReport, 'txt')}>
                    <Download className="w-4 h-4 mr-1" />
                    .txt
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => previewReportContent(viewReport, 'html')}>
                    <Eye className="w-4 h-4 mr-1" />
                    .html
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportReport(viewReport, 'html')}>
                    <Download className="w-4 h-4 mr-1" />
                    .html
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => previewReportContent(viewReport, 'csv')}>
                    <Eye className="w-4 h-4 mr-1" />
                    .csv
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportReport(viewReport, 'csv')}>
                    <Download className="w-4 h-4 mr-1" />
                    .csv
                  </Button>
                </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* In-app file preview dialog */}
      <Dialog open={!!previewContent} onOpenChange={(o) => { if (!o) setPreviewContent(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold truncate">{previewContent?.title} <span className="text-gray-400 font-normal">.{previewContent?.format}</span></DialogTitle>
            <DialogDescription>File preview</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto mt-2">
            {previewContent?.format === 'html' ? (
              <iframe
                srcDoc={previewContent.content}
                title="Report HTML preview"
                className="w-full h-[60vh] border rounded-lg bg-white"
                sandbox="allow-same-origin"
              />
            ) : (
              <pre className="whitespace-pre-wrap text-xs font-mono bg-gray-50 border rounded-lg p-4 leading-relaxed overflow-auto max-h-[60vh]">
                {previewContent?.content}
              </pre>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => setPreviewContent(null)}>Close</Button>
            {previewContent && viewReport && (
              <Button size="sm" onClick={() => exportReport(viewReport, previewContent.format)}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
