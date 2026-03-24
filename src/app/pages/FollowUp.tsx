import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Checkbox } from '../components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  UserPlus, Phone, Mail, MessageSquare, Plus, Search, Calendar, AlertCircle, CheckCircle, Loader2, X,
  GraduationCap, ArrowRight, Users, LayoutGrid, List, Trash2, Clock, TrendingUp, MapPin, ExternalLink, RefreshCw, Send,
  FileText, Copy, Link,
} from 'lucide-react';
import { Newcomer, NewcomerForm, Program, Member, NewcomerTrainingClass, NewcomerTrainingStatus, SMSWallet } from '../types';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import {
  fetchNewcomers, createFollowUp, editFollowUp, fetchNewcomerForms, fetchPrograms, fetchMembers, createMember,
  fetchNewcomerTrainingClasses, saveNewcomers, markNewcomerMovedToMember, hideNewcomersLocally,
  fetchSMSWallet, sendSms,
  createCustomForm, createCustomQuestions,
} from '../api';
import { BibleLoader } from '../components/BibleLoader';
import { resolvePrimaryBranchId } from '../utils/scope';

function RequiredStar() { return <span className="text-red-500 ml-0.5">*</span>; }

const TRAINING_STATUSES: { value: NewcomerTrainingStatus; label: string; color: string }[] = [
  { value: 'not-enrolled', label: 'Not Enrolled', color: 'bg-gray-100 text-gray-600' },
  { value: 'started', label: 'Started', color: 'bg-blue-100 text-blue-700' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'finished', label: 'Finished', color: 'bg-green-100 text-green-700' },
  { value: 'dropped-off', label: 'Dropped Off', color: 'bg-red-100 text-red-700' },
];
const getStatusInfo = (s?: NewcomerTrainingStatus) => TRAINING_STATUSES.find(t => t.value === s) || TRAINING_STATUSES[0];

type ViewMode = 'cards' | 'list';
type FollowUpActionType = 'call' | 'sms' | 'email' | 'note';

export function FollowUp() {
  const { currentAdmin } = useAuth();
  const { church, branches } = useChurch();
  const isMultiBranch = church.type === 'multi' && branches.length > 0;
  const primaryBranchId = resolvePrimaryBranchId(branches, currentAdmin);
  const navigate = useNavigate();

  const [newcomers, setNewcomers] = useState<Newcomer[]>([]);
  const [newcomerForms, setNewcomerForms] = useState<NewcomerForm[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [trainingClasses, setTrainingClasses] = useState<NewcomerTrainingClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'first-timer' | 'second-timer'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedNewcomer, setSelectedNewcomer] = useState<Newcomer | null>(null);
  const [followUpComment, setFollowUpComment] = useState('');

  const { showToast } = useToast();

  // Add Newcomer dialog
  const [addOpen, setAddOpen] = useState(false);
  const [nFirstName, setNFirstName] = useState('');
  const [nLastName, setNLastName] = useState('');
  const [nEmail, setNEmail] = useState('');
  const [nPhone, setNPhone] = useState('');
  const [nVisitType, setNVisitType] = useState<'first-timer' | 'second-timer' | ''>('');
  const [nVisitDate, setNVisitDate] = useState('');
  const [nBranchId, setNBranchId] = useState('');
  const [nProgramId, setNProgramId] = useState('');
  const [nNotes, setNNotes] = useState('');
  const [nAddress, setNAddress] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  // SMS follow-up dialog
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [smsRecipients, setSmsRecipients] = useState<Newcomer[]>([]);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  // Bulk delete
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  // Bulk move to members
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  // Follow up now mode
  const [followUpNowMode, setFollowUpNowMode] = useState(false);
  const [followUpPickerOpen, setFollowUpPickerOpen] = useState(false);
  const [pickerSelectedIds, setPickerSelectedIds] = useState<string[]>([]);
  const [pickerSearch, setPickerSearch] = useState('');
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  // Move to member dialog
  const [moveTarget, setMoveTarget] = useState<Newcomer | null>(null);

  // Assign training dialog
  const [assignTrainingTargets, setAssignTrainingTargets] = useState<Newcomer[]>([]);
  const [assignClassId, setAssignClassId] = useState('');

  // Create training class dialog
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [tcName, setTcName] = useState('');
  const [tcDescription, setTcDescription] = useState('');
  const [tcDuration, setTcDuration] = useState('');

  // Create form dialog
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formVisitType, setFormVisitType] = useState<'first-timer' | 'second-timer'>('first-timer');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const resetAddForm = () => {
    setNFirstName(''); setNLastName(''); setNEmail(''); setNPhone('');
    setNVisitType(''); setNVisitDate(''); setNBranchId(''); setNProgramId(''); setNNotes('');
    setNAddress(''); setFormErrors({});
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [newcomersResult, formsResult, programsResult, membersResult, trainingClassesResult] = await Promise.allSettled([
        fetchNewcomers(primaryBranchId),
        fetchNewcomerForms(primaryBranchId),
        fetchPrograms(primaryBranchId),
        fetchMembers(primaryBranchId),
        fetchNewcomerTrainingClasses(),
      ]);

      if (newcomersResult.status === 'fulfilled') {
        setNewcomers(newcomersResult.value as Newcomer[]);
      } else {
        console.error('Failed to load follow-up newcomers:', newcomersResult.reason);
      }

      if (formsResult.status === 'fulfilled') {
        setNewcomerForms(formsResult.value as NewcomerForm[]);
      } else {
        console.error('Failed to load newcomer forms:', formsResult.reason);
      }

      if (programsResult.status === 'fulfilled') {
        setPrograms(programsResult.value as Program[]);
      } else {
        console.error('Failed to load follow-up programs:', programsResult.reason);
      }

      if (membersResult.status === 'fulfilled') {
        setMembers(membersResult.value as Member[]);
      } else {
        console.error('Failed to load follow-up members:', membersResult.reason);
      }

      if (trainingClassesResult.status === 'fulfilled') {
        setTrainingClasses(trainingClassesResult.value as NewcomerTrainingClass[]);
      } else {
        console.error('Failed to load newcomer training classes:', trainingClassesResult.reason);
      }
    } catch (err) {
      console.error('Failed to load follow-up data:', err);
    }
    finally { setLoading(false); }
  }, [primaryBranchId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!selectedNewcomer) {
      setFollowUpComment('');
      return;
    }
    setFollowUpComment(selectedNewcomer.adminComment || '');
  }, [selectedNewcomer]);

  const activeNewcomers = newcomers.filter(n => !n.movedToMemberId);
  const filteredNewcomers = activeNewcomers.filter(nc => {
    const s = searchTerm.toLowerCase();
    const matchSearch = !s || nc.firstName.toLowerCase().includes(s) || nc.lastName.toLowerCase().includes(s) || nc.email?.toLowerCase().includes(s) || nc.phone?.includes(searchTerm);
    const matchType = filterType === 'all' || nc.visitType === filterType;
    return matchSearch && matchType;
  });

  // Dashboard stats
  const stats = useMemo(() => {
    const total = newcomers.length;
    const moved = newcomers.filter(n => n.movedToMemberId).length;
    const enrolled = activeNewcomers.filter(n => n.trainingClassId && n.trainingStatus && n.trainingStatus !== 'not-enrolled').length;
    const finished = activeNewcomers.filter(n => n.trainingStatus === 'finished').length;
    const conversionRate = total > 0 ? Math.round((moved / total) * 100) : 0;
    return { total, moved, enrolled, finished, conversionRate, active: activeNewcomers.length };
  }, [newcomers, activeNewcomers]);

  const getProgramName = (id?: string) => programs.find(p => p.id === id)?.name || '';
  const getClassName = (id?: string) => trainingClasses.find(c => c.id === id)?.name || '';

  const normalizeFollowUpField = (value?: string | number | null) => {
    if (value === undefined || value === null || value === '') return undefined;
    return typeof value === 'number' ? String(value).padStart(2, '0') : value;
  };

  const splitFollowUpName = (fullName?: string) => {
    const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' '),
    };
  };

  const normalizeFollowUpAnswers = (answers?: Newcomer['answers']) => {
    if (!Array.isArray(answers) || answers.length === 0) return undefined;
    return answers
      .filter(answer => Boolean(answer?.questionId))
      .map(answer => ({
        questionId: answer?.questionId as string,
        answer: answer?.answer ?? null,
      }));
  };

  const buildFollowUpEditPayload = (newcomer: Newcomer, type: FollowUpActionType, note: string) => ({
    name: `${newcomer.firstName} ${newcomer.lastName}`.trim(),
    email: newcomer.email || undefined,
    address: newcomer.address || undefined,
    whatappNo: newcomer.whatsapp || newcomer.phone || undefined,
    timer: newcomer.timer ?? undefined,
    isActive: newcomer.isActive ?? true,
    isVisitor: newcomer.visitType === 'first-timer',
    phoneNo: newcomer.phone || undefined,
    sex: newcomer.sex || undefined,
    birthMonth: normalizeFollowUpField(newcomer.birthMonth),
    birthDay: normalizeFollowUpField(newcomer.birthDay),
    maritalStatus: newcomer.maritalStatus || undefined,
    newComersComment: newcomer.newComersComment || undefined,
    called: type === 'call' ? true : newcomer.called ?? false,
    messaged: type === 'sms' || type === 'email' ? true : newcomer.messaged ?? false,
    visited: newcomer.visited ?? false,
    eventOccurrenceId: newcomer.eventOccurrenceId || undefined,
    formId: newcomer.formId || undefined,
    adminComment: note,
    answers: normalizeFollowUpAnswers(newcomer.answers),
  });

  const mergeUpdatedNewcomer = (
    current: Newcomer,
    source: any,
    type: FollowUpActionType,
    note: string,
  ): Newcomer => {
    const payload = source && typeof source === 'object' ? source : {};
    const fullName = typeof payload.name === 'string' && payload.name.trim()
      ? payload.name
      : `${current.firstName} ${current.lastName}`.trim();
    const { firstName, lastName } = splitFollowUpName(fullName);
    const followUpEntry = {
      id: `fu-${Date.now()}`,
      newcomerId: current.id,
      adminId: 'admin',
      comment: note,
      type,
      createdAt: new Date(),
    };

    return {
      ...current,
      firstName,
      lastName,
      email: payload.email ?? current.email,
      phone: payload.phoneNo ?? current.phone,
      whatsapp: payload.whatappNo ?? current.whatsapp,
      address: payload.address ?? current.address,
      visitType: typeof payload.isVisitor === 'boolean'
        ? (payload.isVisitor ? 'first-timer' : 'second-timer')
        : current.visitType,
      sex: payload.sex ?? current.sex,
      maritalStatus: payload.maritalStatus ?? current.maritalStatus,
      newComersComment: payload.newComersComment ?? current.newComersComment,
      adminComment: payload.adminComment ?? note,
      birthMonth: payload.birthMonth ?? current.birthMonth,
      birthDay: payload.birthDay ?? current.birthDay,
      timer: payload.timer ?? current.timer,
      isActive: payload.isActive ?? current.isActive,
      called: payload.called ?? (type === 'call' ? true : current.called ?? false),
      messaged: payload.messaged ?? ((type === 'sms' || type === 'email') ? true : current.messaged ?? false),
      visited: payload.visited ?? current.visited ?? false,
      eventOccurrenceId: payload.eventOccurrenceId ?? current.eventOccurrenceId ?? null,
      formId: payload.formId ?? current.formId ?? null,
      answers: Array.isArray(payload.answers)
        ? payload.answers.map((answer: any) => ({
            questionId: answer?.questionId || answer?.question?.id,
            answer: answer?.answer ?? null,
          }))
        : current.answers,
      followUps: [
        ...(current.followUps || []),
        followUpEntry,
      ],
    };
  };

  // ──────── VALIDATION ────────
  const scrollToError = (errors: Record<string, string>) => {
    const firstKey = Object.keys(errors)[0];
    if (firstKey && fieldRefs.current[firstKey]) fieldRefs.current[firstKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const validateAddForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!nFirstName.trim()) errors.nFirstName = 'First name is required.';
    if (!nLastName.trim()) errors.nLastName = 'Last name is required.';
    if (!nVisitType) errors.nVisitType = 'Please select visit type.';
    if (!nVisitDate) errors.nVisitDate = 'Please enter the date they visited.';
    if (nEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nEmail)) errors.nEmail = 'Invalid email.';
    if (isMultiBranch && !nBranchId) errors.nBranchId = 'Please select a branch.';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) { setTimeout(() => scrollToError(errors), 100); return false; }
    return true;
  };
  const FieldError = ({ field }: { field: string }) => {
    if (!formErrors[field]) return null;
    return <p className="flex items-center gap-1 text-xs text-red-500 mt-1"><AlertCircle className="w-3 h-3" />{formErrors[field]}</p>;
  };

  // ──────── SAVE NEWCOMER ────────
  const handleAddNewcomer = async () => {
    if (!validateAddForm()) return;
    setSaving(true);
    try {
      await createFollowUp(
        {
          name: `${nFirstName.trim()} ${nLastName.trim()}`,
          phoneNo: nPhone.trim() || undefined,
          address: nAddress.trim() || undefined,
          isVisitor: nVisitType === 'first-timer',
          adminComment: nNotes.trim() || undefined,
        },
        church.id,
        isMultiBranch ? nBranchId : primaryBranchId
      );
      await loadData();
      setAddOpen(false);
      resetAddForm();
      showToast(`${nFirstName.trim()} ${nLastName.trim()} added as a newcomer.`);
    } catch (err: any) { console.error(err); showToast(`Error: ${err.message}`, 'error'); }
    finally { setSaving(false); }
  };

  // ──────── MOVE TO MEMBER ────────
  const handleMoveToMember = async () => {
    if (!moveTarget) return;
    setSaving(true);
    try {
      await createMember({
        name: `${moveTarget.firstName} ${moveTarget.lastName}`,
        phoneNo: moveTarget.phone || undefined,
        address: moveTarget.address || undefined,
      }, church.id, moveTarget.branchId || primaryBranchId);
      await markNewcomerMovedToMember(moveTarget.id);
      setNewcomers(prev => prev.map(n => n.id === moveTarget.id ? { ...n, movedToMemberId: 'moved' } : n));
      setMoveTarget(null);
      showToast(`${moveTarget.firstName} ${moveTarget.lastName} has been moved to the Members directory. You can update their full details in the Members section.`);
    } catch (err: any) { console.error(err); showToast(`Error: ${err.message}`, 'error'); }
    finally { setSaving(false); }
  };

  // ──────── FOLLOW-UP ────────
  const handleAddFollowUp = async (type: FollowUpActionType) => {
    if (!selectedNewcomer || !followUpComment.trim()) return;
    const activeNewcomer = selectedNewcomer;
    const note = followUpComment.trim();
    setSaving(true);
    try {
      const response = await editFollowUp(
        activeNewcomer.id,
        buildFollowUpEditPayload(activeNewcomer, type, note),
        activeNewcomer.branchId || primaryBranchId,
      );
      const updatedNewcomer = mergeUpdatedNewcomer(activeNewcomer, response?.data ?? response, type, note);
      setNewcomers(prev => prev.map(n => n.id === activeNewcomer.id ? updatedNewcomer : n));
      await saveNewcomers([updatedNewcomer]);
      setFollowUpComment('');
      setSelectedNewcomer(null);
      showToast('Follow-up logged.');
    }
    catch (err: any) {
      console.error(err);
      showToast(`Error: ${err?.message || 'Failed to update follow-up.'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ──────── SMS FOLLOW-UP ────────
  const [smsWallet, setSmsWallet] = useState<SMSWallet | null>(null);

  const openSmsFollowUp = async (targets: Newcomer[]) => {
    setSmsRecipients(targets);
    setSmsMessage('');
    setSmsDialogOpen(true);
    // Load wallet balance
    try {
      const w = await fetchSMSWallet();
      if (w) setSmsWallet(w as SMSWallet);
      else setSmsWallet(null);
    } catch { setSmsWallet(null); }
  };

  const smsCharCount = smsMessage.length;
  const smsCreditsPerRecipient = Math.max(1, Math.ceil(smsCharCount / 160));
  const smsTotalCredits = smsCreditsPerRecipient * smsRecipients.filter(n => n.phone).length;
  const hasEnoughCredits = smsWallet && smsWallet.balance >= smsTotalCredits;

  const handleSendSms = async () => {
    if (!smsMessage.trim() || smsRecipients.length === 0) return;
    const recipientsWithPhone = smsRecipients.filter(n => n.phone);
    if (recipientsWithPhone.length === 0) return;

    setSmsSending(true);
    try {
      await sendSms({
        message: smsMessage.trim(),
        walletId: smsWallet?.id || '',
        toNumbers: recipientsWithPhone.map(n => n.phone!),
        followUpIds: recipientsWithPhone.map(n => n.id),
        channel: 'generic',
      });
      setSmsDialogOpen(false);
      setSmsRecipients([]);
      setSmsMessage('');
      setSelectedIds([]);
      setFollowUpNowMode(false);
      showToast(`SMS sent to ${recipientsWithPhone.length} newcomer${recipientsWithPhone.length > 1 ? 's' : ''}.`);
    } catch (err: any) { console.error(err); showToast(`Error: ${err.message}`, 'error'); }
    finally { setSmsSending(false); }
  };

  // ──────── BULK DELETE ────────
  const handleBulkDelete = async () => {
    setSaving(true);
    try {
      await hideNewcomersLocally(selectedIds);
      setNewcomers(prev => prev.filter(n => !selectedIds.includes(n.id)));
      setBulkDeleteOpen(false);
      showToast(`${selectedIds.length} newcomer(s) deleted.`);
      setSelectedIds([]);
    } catch (err: any) { console.error(err); showToast(`Error: ${err.message}`, 'error'); }
    finally { setSaving(false); }
  };

  // ──────── BULK MOVE TO MEMBERS ────────
  const handleBulkMoveToMembers = async () => {
    setSaving(true);
    try {
      const targets = activeNewcomers.filter(n => selectedIds.includes(n.id));
      await Promise.all(
        targets.map(nc =>
          createMember({
            name: `${nc.firstName} ${nc.lastName}`,
            phoneNo: nc.phone || undefined,
            address: nc.address || undefined,
          }, church.id, nc.branchId || primaryBranchId)
        )
      );
      await Promise.all(targets.map((newcomer) => markNewcomerMovedToMember(newcomer.id)));
      const movedIds = new Set(targets.map(n => n.id));
      setNewcomers(prev => prev.map(n => movedIds.has(n.id) ? { ...n, movedToMemberId: 'moved' } : n));
      setBulkMoveOpen(false);
      showToast(`${targets.length} newcomer(s) moved to members.`);
      setSelectedIds([]);
    } catch (err: any) { console.error(err); showToast(`Error: ${err.message}`, 'error'); }
    finally { setSaving(false); }
  };

  // ──────── TRAINING CLASSES ────────
  const handleCreateClass = async () => {
    if (!tcName.trim()) return;
    setSaving(true);
    try {
      const cls: NewcomerTrainingClass = { id: `tc-${Date.now()}`, churchId: church.id, name: tcName.trim(), description: tcDescription.trim() || undefined, durationWeeks: tcDuration ? parseInt(tcDuration) : undefined, createdAt: new Date() };
      setTrainingClasses(prev => [...prev, cls]);
      setCreateClassOpen(false); setTcName(''); setTcDescription(''); setTcDuration('');
      showToast(`Training class "${cls.name}" created.`);
    } catch (err: any) { console.error(err); showToast(`Error: ${err.message}`, 'error'); }
    finally { setSaving(false); }
  };

  const handleAssignTraining = async () => {
    if (!assignClassId || assignTrainingTargets.length === 0) return;
    setSaving(true);
    try {
      const ids = new Set(assignTrainingTargets.map(n => n.id));
      setNewcomers(prev => prev.map(n => ids.has(n.id) ? { ...n, trainingClassId: assignClassId, trainingStatus: (n.trainingStatus === 'not-enrolled' || !n.trainingStatus) ? 'started' as NewcomerTrainingStatus : n.trainingStatus } : n));
      setAssignTrainingTargets([]); setAssignClassId(''); setSelectedIds([]);
      showToast(`${ids.size} newcomer(s) assigned to training.`);
    } catch (err: any) { console.error(err); showToast(`Error: ${err.message}`, 'error'); }
    finally { setSaving(false); }
  };

  const handleUpdateTrainingStatus = (ncId: string, status: NewcomerTrainingStatus) => {
    setNewcomers(prev => prev.map(n => n.id === ncId ? { ...n, trainingStatus: status } : n));
  };

  const handleDeleteClass = async (cls: NewcomerTrainingClass) => {
    setTrainingClasses(prev => prev.filter(c => c.id !== cls.id));
    setNewcomers(prev => prev.map(n => n.trainingClassId === cls.id ? { ...n, trainingClassId: undefined, trainingStatus: 'not-enrolled' as NewcomerTrainingStatus } : n));
    showToast(`"${cls.name}" deleted.`);
  };

  // ──────── CREATE FORM ────────
  const handleCreateForm = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      await createCustomForm({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
      }, primaryBranchId);
      await loadData();
      setCreateFormOpen(false);
      setFormName(''); setFormDescription(''); setFormVisitType('first-timer');
      showToast(`Form "${formName.trim()}" created.`);
    } catch (err: any) { console.error(err); showToast(`Error: ${err.message}`, 'error'); }
    finally { setSaving(false); }
  };

  const handleCopyShareLink = (form: NewcomerForm) => {
    if (form.shareableLink) {
      navigator.clipboard.writeText(form.shareableLink);
      showToast('Form link copied to clipboard.');
    }
  };

  // Bulk toggle
  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNewcomers.length) setSelectedIds([]);
    else setSelectedIds(filteredNewcomers.map(n => n.id));
  };

  // ──────── TOGGLE VISIT TYPE ────────
  const handleToggleVisitType = async (nc: Newcomer) => {
    const newType = nc.visitType === 'first-timer' ? 'second-timer' : 'first-timer';
    const upd = newcomers.map(n => n.id === nc.id ? { ...n, visitType: newType as 'first-timer' | 'second-timer' } : n);
    try { await saveNewcomers(upd); setNewcomers(upd); showToast(`${nc.firstName} ${nc.lastName} changed to ${newType === 'first-timer' ? 'First Timer' : 'Second Timer'}.`); }
    catch (err) { console.error(err); }
  };

  // ──────── DUPLICATE NAME DETECTION ────────
  const duplicateMatch = useMemo(() => {
    if (!nFirstName.trim() || !nLastName.trim()) return null;
    const fn = nFirstName.trim().toLowerCase();
    const ln = nLastName.trim().toLowerCase();
    return activeNewcomers.find(nc =>
      nc.firstName.toLowerCase() === fn && nc.lastName.toLowerCase() === ln && nc.visitType === 'first-timer'
    ) || null;
  }, [nFirstName, nLastName, activeNewcomers]);

  const handlePromoteToSecondTimer = async (nc: Newcomer) => {
    const upd = newcomers.map(n => n.id === nc.id ? { ...n, visitType: 'second-timer' as const } : n);
    try { await saveNewcomers(upd); setNewcomers(upd); setAddOpen(false); resetAddForm(); showToast(`${nc.firstName} ${nc.lastName} promoted to Second Timer.`); }
    catch (err) { console.error(err); }
  };

  const FOLLOWUP_TYPE_LABELS: Record<string, string> = { call: 'Phone Call', sms: 'SMS', email: 'Email', note: 'Note' };
  const FOLLOWUP_TYPE_ICONS: Record<string, React.ReactNode> = {
    call: <Phone className="w-3 h-3" />, sms: <MessageSquare className="w-3 h-3" />,
    email: <Mail className="w-3 h-3" />, note: <Plus className="w-3 h-3" />,
  };

  // ──────── Newcomer card/row renderer ────────
  const renderNewcomerCard = (nc: Newcomer) => {
    const statusInfo = getStatusInfo(nc.trainingStatus);
    return (
      <Card key={nc.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox checked={selectedIds.includes(nc.id)} onCheckedChange={() => toggleSelect(nc.id)} className="mt-1" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{nc.firstName} {nc.lastName}</h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <button onClick={() => handleToggleVisitType(nc)} title="Click to toggle visit type">
                      <Badge variant={nc.visitType === 'first-timer' ? 'default' : 'secondary'} className="text-[10px] cursor-pointer hover:opacity-80">
                        {nc.visitType === 'first-timer' ? '1st Timer' : '2nd Timer'}
                        <RefreshCw className="w-2.5 h-2.5 ml-1 inline" />
                      </Badge>
                    </button>
                    <span className="text-xs text-gray-500 flex items-center gap-0.5"><Calendar className="w-3 h-3" />{new Date(nc.visitDate).toLocaleDateString()}</span>
                    {nc.programId && <Badge variant="outline" className="text-[10px]">{getProgramName(nc.programId)}</Badge>}
                    {nc.trainingClassId && <Badge className={`text-[10px] ${statusInfo.color} border-0`}>{getClassName(nc.trainingClassId)} — {statusInfo.label}</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                {nc.phone && (
                  <a href={`tel:${nc.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline"><Phone className="w-3 h-3" />{nc.phone}</a>
                )}
                {nc.email && (
                  <a href={`mailto:${nc.email}`} className="flex items-center gap-1 text-blue-600 hover:underline"><Mail className="w-3 h-3" />{nc.email}</a>
                )}
                {nc.address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nc.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                    <MapPin className="w-3 h-3" />{nc.address.length > 30 ? nc.address.slice(0, 30) + '...' : nc.address}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedNewcomer(nc)}><MessageSquare className="w-3 h-3 mr-1" />Follow Up</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAssignTrainingTargets([nc])}><GraduationCap className="w-3 h-3 mr-1" />Assign Training</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs text-green-700 hover:bg-green-50" onClick={() => setMoveTarget(nc)}><ArrowRight className="w-3 h-3 mr-1" />Move to Members</Button>
              </div>
              {nc.followUps && nc.followUps.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-[10px] font-medium text-gray-500 mb-1">Latest follow-up</p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-0.5">
                      {FOLLOWUP_TYPE_ICONS[nc.followUps[nc.followUps.length - 1].type]}
                      {FOLLOWUP_TYPE_LABELS[nc.followUps[nc.followUps.length - 1].type]}
                    </Badge>
                    <p className="text-xs text-gray-600 line-clamp-1 flex-1">{nc.followUps[nc.followUps.length - 1].comment}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderNewcomerRow = (nc: Newcomer) => {
    const statusInfo = getStatusInfo(nc.trainingStatus);
    return (
      <div key={nc.id} className="flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <Checkbox checked={selectedIds.includes(nc.id)} onCheckedChange={() => toggleSelect(nc.id)} />
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm text-gray-900">{nc.firstName} {nc.lastName}</span>
            {nc.phone && <a href={`tel:${nc.phone}`} className="text-xs text-blue-600 hover:underline ml-2">{nc.phone}</a>}
          </div>
          <button onClick={() => handleToggleVisitType(nc)} title="Click to toggle">
            <Badge variant={nc.visitType === 'first-timer' ? 'default' : 'secondary'} className="text-[10px] cursor-pointer hover:opacity-80 hidden sm:inline-flex">
              {nc.visitType === 'first-timer' ? '1st' : '2nd'}
              <RefreshCw className="w-2.5 h-2.5 ml-0.5" />
            </Badge>
          </button>
          {nc.trainingClassId && <Badge className={`text-[10px] ${statusInfo.color} border-0 hidden md:inline-flex`}>{statusInfo.label}</Badge>}
          <span className="text-xs text-gray-400 hidden lg:inline">{new Date(nc.visitDate).toLocaleDateString()}</span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelectedNewcomer(nc)}><MessageSquare className="w-3.5 h-3.5" /></Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setAssignTrainingTargets([nc])}><GraduationCap className="w-3.5 h-3.5" /></Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600" onClick={() => setMoveTarget(nc)}><ArrowRight className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <PageHeader
        title="Follow-Up Module"
        description="Track newcomers from their first visit through training to full membership. Add visitors, assign training classes, and monitor their journey into your church family."
        action={{ label: 'Add Newcomer', onClick: () => { resetAddForm(); setAddOpen(true); }, icon: <UserPlus className="w-4 h-4 mr-2" /> }}
      />

      <div className="p-4 md:p-6">

        {loading ? <BibleLoader message="Loading follow-up data..." /> : (
        <Tabs defaultValue="newcomers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="newcomers">Newcomers</TabsTrigger>
            {/* <TabsTrigger value="training">Training</TabsTrigger> */}
            <TabsTrigger value="forms">Collection Forms</TabsTrigger>
          </TabsList>

          {/* ═══ NEWCOMERS TAB ═══ */}
          <TabsContent value="newcomers" className="space-y-4">
            {/* Conversion bar (slim) */}
            {newcomers.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 px-4 py-2 rounded-lg bg-gray-50 border border-gray-100">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="text-xs text-gray-500">{stats.total} total</span>
                <span className="text-xs text-green-600">{stats.moved} converted</span>
                <span className="text-xs text-blue-600">{stats.enrolled} training</span>
                <div className="flex items-center gap-2 ml-auto">
                  <Progress value={stats.conversionRate} className="h-1.5 w-20" />
                  <span className="text-xs font-semibold text-blue-700">{stats.conversionRate}%</span>
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Card className="flex-1"><CardContent className="p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search newcomers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
              </CardContent></Card>
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Newcomers</SelectItem>
                  <SelectItem value="first-timer">First Timers</SelectItem>
                  <SelectItem value="second-timer">Second Timers</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="text-blue-700 border-blue-200 hover:bg-blue-50" onClick={() => { setFollowUpNowMode(true); setFollowUpPickerOpen(true); }}>
                <Send className="w-3.5 h-3.5 mr-1" />Follow Up Now
              </Button>
              <div className="flex gap-1">
                <Button variant={viewMode === 'cards' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('cards')}><LayoutGrid className="w-4 h-4" /></Button>
                <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}><List className="w-4 h-4" /></Button>
              </div>
            </div>

            {/* Bulk actions */}
            {selectedIds.length > 0 && (
              <Card><CardContent className="p-3 flex flex-wrap items-center gap-3">
                <p className="text-sm text-gray-600">{selectedIds.length} selected</p>
                <Button size="sm" variant="outline" onClick={() => { const targets = activeNewcomers.filter(n => selectedIds.includes(n.id)); openSmsFollowUp(targets); }}>
                  <Send className="w-3.5 h-3.5 mr-1" />{selectedIds.length > 1 ? 'Bulk Follow Up' : 'Follow Up'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { const targets = activeNewcomers.filter(n => selectedIds.includes(n.id)); setAssignTrainingTargets(targets); }}>
                  <GraduationCap className="w-3.5 h-3.5 mr-1" />{selectedIds.length > 1 ? 'Bulk Assign Training' : 'Assign Training'}
                </Button>
                <Button size="sm" variant="outline" className="text-green-700 hover:bg-green-50" onClick={() => setBulkMoveOpen(true)}>
                  <ArrowRight className="w-3.5 h-3.5 mr-1" />{selectedIds.length > 1 ? 'Move All to Members' : 'Move to Members'}
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => setBulkDeleteOpen(true)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" />Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setSelectedIds([]); setFollowUpNowMode(false); }}>Clear</Button>
              </CardContent></Card>
            )}

            {/* Newcomers list/cards */}
            {filteredNewcomers.length === 0 ? (
              <Card><CardContent className="py-16 px-4 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 mb-4"><UserPlus className="w-8 h-8 text-purple-400" /></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No newcomers yet</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  {newcomers.length > 0 ? 'No newcomers match your current filters.' : 'Your newcomers list is empty. Add your first newcomer to start tracking visitors and building meaningful follow-up connections.'}
                </p>
                {newcomers.length === 0 && <Button onClick={() => { resetAddForm(); setAddOpen(true); }}><UserPlus className="w-4 h-4 mr-2" />Add Your First Newcomer</Button>}
              </CardContent></Card>
            ) : viewMode === 'cards' ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Checkbox checked={selectedIds.length === filteredNewcomers.length && filteredNewcomers.length > 0} onCheckedChange={toggleSelectAll} />
                  <span className="text-xs text-gray-500">Select all ({filteredNewcomers.length})</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredNewcomers.map(renderNewcomerCard)}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 p-3 border-b border-gray-200 bg-gray-50">
                    <Checkbox checked={selectedIds.length === filteredNewcomers.length && filteredNewcomers.length > 0} onCheckedChange={toggleSelectAll} />
                    <span className="text-xs font-medium text-gray-500">Select all ({filteredNewcomers.length})</span>
                  </div>
                  {filteredNewcomers.map(renderNewcomerRow)}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══ TRAINING TAB ═══ */}
          {/* <TabsContent value="training" className="space-y-6">
            <Card><CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">
                <strong>Training classes</strong> help newcomers progress toward full membership. Create classes like "Baptism Class" or "New Convert Class", assign newcomers, and track their status from enrollment through completion.
              </p>
            </CardContent></Card>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Training Classes</h3>
              <Button size="sm" onClick={() => setCreateClassOpen(true)}><Plus className="w-4 h-4 mr-1" />Create Class</Button>
            </div>

            {trainingClasses.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-700 mb-1">No training classes yet</h4>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">Create a training class to start tracking newcomer progression — for example, "Baptism Class", "Foundation Class", or "New Members' Orientation".</p>
                <Button size="sm" onClick={() => setCreateClassOpen(true)}><Plus className="w-4 h-4 mr-1" />Create Your First Class</Button>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trainingClasses.map(cls => {
                  const assigned = activeNewcomers.filter(n => n.trainingClassId === cls.id);
                  const finished = assigned.filter(n => n.trainingStatus === 'finished').length;
                  const progress = assigned.length > 0 ? Math.round((finished / assigned.length) * 100) : 0;
                  return (
                    <Card key={cls.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{cls.name}</CardTitle>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDeleteClass(cls)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                        </div>
                        {cls.description && <p className="text-xs text-gray-500">{cls.description}</p>}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          {cls.durationWeeks && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.durationWeeks} week{cls.durationWeeks !== 1 ? 's' : ''}</span>}
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{assigned.length} enrolled</span>
                        </div>
                        <div className="mb-2">
                          <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>Completion</span><span>{progress}%</span></div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                        {assigned.length > 0 && (
                          <div className="space-y-1.5 mt-3 max-h-32 overflow-y-auto">
                            {assigned.map(nc => (
                              <div key={nc.id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-700">{nc.firstName} {nc.lastName}</span>
                                <Select value={nc.trainingStatus || 'not-enrolled'} onValueChange={(v) => handleUpdateTrainingStatus(nc.id, v as NewcomerTrainingStatus)}>
                                  <SelectTrigger className="h-6 w-28 text-[10px]"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {TRAINING_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent> */}

          {/* ═══ FORMS TAB ═══ */}
          <TabsContent value="forms" className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Create and share forms with newcomers to collect their information digitally.</p>
              <Button size="sm" onClick={() => { setFormName(''); setFormDescription(''); setFormVisitType('first-timer'); setCreateFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" />Create Form
              </Button>
            </div>
            {newcomerForms.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-1">No collection forms yet</p>
                  <p className="text-sm text-gray-400">Create a form to collect visitor information digitally. You'll get a shareable link you can send out or display as a QR code.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {newcomerForms.map((form) => (
                  <Card key={form.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{form.name}</CardTitle>
                          <Badge variant={form.visitType === 'first-timer' ? 'default' : 'secondary'} className="mt-2">{form.visitType === 'first-timer' ? 'First Timer' : 'Second Timer'}</Badge>
                        </div>
                        <Badge variant={form.isActive ? 'default' : 'secondary'}>{form.isActive ? 'Active' : 'Inactive'}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Form Fields ({form.fields.length})</p>
                        <div className="space-y-1">
                          {form.fields.slice(0, 3).map((field) => (
                            <div key={field.id} className="text-sm text-gray-600 flex items-center gap-2"><div className="w-1 h-1 bg-gray-400 rounded-full" />{field.label}{field.required && <span className="text-red-500">*</span>}</div>
                          ))}
                          {form.fields.length > 3 && <p className="text-xs text-gray-500">+{form.fields.length - 3} more</p>}
                        </div>
                      </div>
                      {form.shareableLink && (
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleCopyShareLink(form)}>
                            <Copy className="w-3.5 h-3.5 mr-1.5" />Copy Link
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={form.shareableLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />Open
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        )}
      </div>

      {/* ═══ ADD NEWCOMER DIALOG ═══ */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) { setAddOpen(false); resetAddForm(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Newcomer</DialogTitle>
            <DialogDescription>Manually add a newcomer to your follow-up list. Fill in their details so your team can reach out and make them feel welcome.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Duplicate name detection */}
            {duplicateMatch && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      "{duplicateMatch.firstName} {duplicateMatch.lastName}" is already a First Timer
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Added on {new Date(duplicateMatch.visitDate).toLocaleDateString()}. Would you like to promote them to Second Timer instead?
                    </p>
                    <Button size="sm" variant="outline" className="mt-2 h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => handlePromoteToSecondTimer(duplicateMatch)}>
                      <RefreshCw className="w-3 h-3 mr-1" />Move to Second Timer
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div ref={el => { fieldRefs.current.nFirstName = el; }}>
                <Label>First Name<RequiredStar /></Label>
                <Input value={nFirstName} onChange={e => { setNFirstName(e.target.value); if (formErrors.nFirstName) setFormErrors(p => { const n = {...p}; delete n.nFirstName; return n; }); }} placeholder="e.g., John" className={formErrors.nFirstName ? 'border-red-400' : ''} />
                <FieldError field="nFirstName" />
              </div>
              <div ref={el => { fieldRefs.current.nLastName = el; }}>
                <Label>Last Name<RequiredStar /></Label>
                <Input value={nLastName} onChange={e => { setNLastName(e.target.value); if (formErrors.nLastName) setFormErrors(p => { const n = {...p}; delete n.nLastName; return n; }); }} placeholder="e.g., Doe" className={formErrors.nLastName ? 'border-red-400' : ''} />
                <FieldError field="nLastName" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div ref={el => { fieldRefs.current.nEmail = el; }}>
                <Label>Email</Label>
                <Input type="email" value={nEmail} onChange={e => { setNEmail(e.target.value); if (formErrors.nEmail) setFormErrors(p => { const n = {...p}; delete n.nEmail; return n; }); }} placeholder="email@example.com" className={formErrors.nEmail ? 'border-red-400' : ''} />
                <FieldError field="nEmail" />
              </div>
              <div><Label>Phone</Label><Input type="tel" value={nPhone} onChange={e => setNPhone(e.target.value)} placeholder="+1 234 567 8900" /></div>
            </div>
            <div>
              <Label>Address <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Input value={nAddress} onChange={e => setNAddress(e.target.value)} placeholder="e.g., 123 Main St, Lagos" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div ref={el => { fieldRefs.current.nVisitType = el; }}>
                <Label>Visit Type<RequiredStar /></Label>
                <Select value={nVisitType} onValueChange={(v: any) => { setNVisitType(v); if (formErrors.nVisitType) setFormErrors(p => { const n = {...p}; delete n.nVisitType; return n; }); }}>
                  <SelectTrigger className={formErrors.nVisitType ? 'border-red-400' : ''}><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent><SelectItem value="first-timer">First Timer</SelectItem><SelectItem value="second-timer">Second Timer</SelectItem></SelectContent>
                </Select>
                <FieldError field="nVisitType" />
              </div>
              <div ref={el => { fieldRefs.current.nVisitDate = el; }}>
                <Label>Visit Date<RequiredStar /></Label>
                <Input type="date" value={nVisitDate} onChange={e => { setNVisitDate(e.target.value); if (formErrors.nVisitDate) setFormErrors(p => { const n = {...p}; delete n.nVisitDate; return n; }); }} className={formErrors.nVisitDate ? 'border-red-400' : ''} />
                <FieldError field="nVisitDate" />
              </div>
            </div>
            {/* Program (optional) */}
            <div>
              <Label>Program / Event Attended <span className="text-gray-400 font-normal">(optional)</span></Label>
              <p className="text-xs text-gray-500 mb-1">If this newcomer came through a specific program or event, select it here. Leave empty if they just walked in.</p>
              <Select value={nProgramId} onValueChange={setNProgramId}>
                <SelectTrigger><SelectValue placeholder="No specific program" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific program</SelectItem>
                  {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {isMultiBranch && (
              <div ref={el => { fieldRefs.current.nBranchId = el; }}>
                <Label>Branch Visited<RequiredStar /></Label>
                <Select value={nBranchId} onValueChange={(v) => { setNBranchId(v); if (formErrors.nBranchId) setFormErrors(p => { const n = {...p}; delete n.nBranchId; return n; }); }}>
                  <SelectTrigger className={formErrors.nBranchId ? 'border-red-400' : ''}><SelectValue placeholder="Which branch?" /></SelectTrigger>
                  <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
                <FieldError field="nBranchId" />
              </div>
            )}
            <div>
              <Label>Initial Notes <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Textarea value={nNotes} onChange={e => setNNotes(e.target.value)} placeholder="First impressions, prayer requests, or anything useful..." rows={3} />
              <p className="text-xs text-gray-400 mt-1">Saved as the first follow-up note.</p>
            </div>
            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setAddOpen(false); resetAddForm(); }}>Cancel</Button>
              <Button className="flex-1" disabled={saving} onClick={handleAddNewcomer}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<UserPlus className="w-4 h-4 mr-2" />Add Newcomer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ FOLLOW-UP DIALOG ═══ */}
      <Dialog open={!!selectedNewcomer} onOpenChange={() => setSelectedNewcomer(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Follow Up: {selectedNewcomer?.firstName} {selectedNewcomer?.lastName}</DialogTitle>
            <DialogDescription>Log your interaction with this newcomer. Use the quick-action buttons below to call, text, or email them directly.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Quick contact actions */}
            {selectedNewcomer && (
              <div className="flex flex-wrap gap-2">
                {selectedNewcomer.phone && (
                  <a href={`tel:${selectedNewcomer.phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs hover:bg-blue-100 transition-colors">
                    <Phone className="w-3 h-3" />Call {selectedNewcomer.phone}
                  </a>
                )}
                {selectedNewcomer.phone && (
                  <button onClick={() => { setSelectedNewcomer(null); navigate('/sms'); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs hover:bg-green-100 transition-colors cursor-pointer">
                    <Send className="w-3 h-3" />Send SMS
                  </button>
                )}
                {selectedNewcomer.email && (
                  <a href={`mailto:${selectedNewcomer.email}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-xs hover:bg-purple-100 transition-colors">
                    <Mail className="w-3 h-3" />{selectedNewcomer.email}
                  </a>
                )}
                {selectedNewcomer.address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedNewcomer.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 text-xs hover:bg-orange-100 transition-colors">
                    <MapPin className="w-3 h-3" />Open in Maps
                  </a>
                )}
              </div>
            )}
            <Separator />
            <div className="space-y-2">
              <Label>Follow-up Notes</Label>
              <Textarea placeholder="What did you discuss? Any prayer requests or next steps?" value={followUpComment} onChange={(e) => setFollowUpComment(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>How did you follow up?</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => handleAddFollowUp('call')} variant="outline" disabled={!followUpComment.trim() || saving}><Phone className="w-4 h-4 mr-2" />Log Call</Button>
                <Button onClick={() => handleAddFollowUp('sms')} variant="outline" disabled={!followUpComment.trim() || saving}><MessageSquare className="w-4 h-4 mr-2" />Log SMS</Button>
                <Button onClick={() => handleAddFollowUp('email')} variant="outline" disabled={!followUpComment.trim() || saving}><Mail className="w-4 h-4 mr-2" />Log Email</Button>
                <Button onClick={() => handleAddFollowUp('note')} variant="outline" disabled={!followUpComment.trim() || saving}><Plus className="w-4 h-4 mr-2" />Add Note</Button>
              </div>
            </div>
            {/* Interaction History */}
            {selectedNewcomer && selectedNewcomer.followUps && selectedNewcomer.followUps.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Interaction History ({selectedNewcomer.followUps.length})</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {[...selectedNewcomer.followUps].reverse().map(fu => (
                      <div key={fu.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-0.5 flex-shrink-0 mt-0.5">
                          {FOLLOWUP_TYPE_ICONS[fu.type]}
                          {FOLLOWUP_TYPE_LABELS[fu.type]}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700">{fu.comment}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{new Date(fu.createdAt).toLocaleDateString()} {new Date(fu.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ SMS FOLLOW-UP DIALOG ═══ */}
      <Dialog open={smsDialogOpen} onOpenChange={(o) => { if (!o) { setSmsDialogOpen(false); setSmsRecipients([]); setSmsMessage(''); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle><Send className="w-4 h-4 inline mr-2" />{smsRecipients.length > 1 ? 'Bulk SMS Follow-Up' : 'SMS Follow-Up'}</DialogTitle>
            <DialogDescription>Compose a message to send to {smsRecipients.length} newcomer{smsRecipients.length > 1 ? 's' : ''}. The interaction will be logged automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Recipients */}
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">Recipients ({smsRecipients.length})</Label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-gray-200 bg-gray-50 max-h-24 overflow-y-auto">
                {smsRecipients.map(nc => (
                  <Badge key={nc.id} variant="secondary" className="text-xs gap-1">
                    {nc.firstName} {nc.lastName}
                    {nc.phone && <span className="text-gray-400">({nc.phone})</span>}
                    <button onClick={() => { const upd = smsRecipients.filter(r => r.id !== nc.id); if (upd.length === 0) { setSmsDialogOpen(false); setSmsRecipients([]); } else setSmsRecipients(upd); }} className="ml-0.5 hover:text-red-500"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
              {smsRecipients.some(nc => !nc.phone) && (
                <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Some recipients don't have a phone number on file.</p>
              )}
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)} placeholder="Hi! We're glad you visited our church. We'd love to see you again this Sunday..." rows={4} />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>{smsCharCount} char{smsCharCount !== 1 ? 's' : ''} ({smsCreditsPerRecipient} credit{smsCreditsPerRecipient !== 1 ? 's' : ''}/recipient)</span>
                <span>Total: ~{smsTotalCredits} credits</span>
              </div>
            </div>
            {/* Wallet balance info */}
            <div className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${smsWallet && hasEnoughCredits ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
              <span>Wallet: {smsWallet ? `${smsWallet.balance.toLocaleString()} credits` : 'Not set up'}</span>
              {smsWallet && !hasEnoughCredits && smsMessage.trim() && <span className="font-medium">Insufficient credits</span>}
            </div>
            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setSmsDialogOpen(false); setSmsRecipients([]); setSmsMessage(''); }}>Cancel</Button>
              <Button className="flex-1" disabled={!smsMessage.trim() || smsSending || !hasEnoughCredits} onClick={handleSendSms}>
                {smsSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send & Log Follow-Up
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ BULK DELETE CONFIRM ═══ */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={() => setBulkDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} Newcomer{selectedIds.length > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the selected newcomer{selectedIds.length > 1 ? 's' : ''} and all their follow-up history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<Trash2 className="w-4 h-4 mr-2" />Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ BULK MOVE TO MEMBERS CONFIRM ═══ */}
      <AlertDialog open={bulkMoveOpen} onOpenChange={() => setBulkMoveOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move {selectedIds.length} Newcomer{selectedIds.length > 1 ? 's' : ''} to Members?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create member records for all selected newcomers and mark them as converted. Their names, phone numbers, and emails will be transferred. You can edit their full details in the Members section afterward.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkMoveToMembers} className="bg-green-600 hover:bg-green-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<ArrowRight className="w-4 h-4 mr-2" />Move to Members
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ MOVE TO MEMBER CONFIRM ═══ */}
      <AlertDialog open={!!moveTarget} onOpenChange={() => setMoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Members</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new member record for <strong>{moveTarget?.firstName} {moveTarget?.lastName}</strong> and mark them as converted. Their name, phone, and email will be transferred. You can edit their full details (address, birthday, etc.) in the Members section afterward.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMoveToMember} className="bg-green-600 hover:bg-green-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<ArrowRight className="w-4 h-4 mr-2" />Move to Members
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ FOLLOW UP NOW PICKER DIALOG ═══ */}
      <Dialog open={followUpPickerOpen} onOpenChange={(o) => { if (!o) { setFollowUpPickerOpen(false); setPickerSelectedIds([]); setPickerSearch(''); setFollowUpNowMode(false); } }}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle><Send className="w-4 h-4 inline mr-2" />Follow Up Now</DialogTitle>
            <DialogDescription>Select the newcomers you'd like to reach out to via SMS.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search newcomers..." value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto border rounded-lg p-1">
              {activeNewcomers.filter(nc => {
                if (!pickerSearch) return true;
                const s = pickerSearch.toLowerCase();
                return nc.firstName.toLowerCase().includes(s) || nc.lastName.toLowerCase().includes(s) || nc.phone?.includes(pickerSearch);
              }).map(nc => (
                <label key={nc.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <Checkbox
                    checked={pickerSelectedIds.includes(nc.id)}
                    onCheckedChange={(checked) => {
                      if (checked) setPickerSelectedIds(prev => [...prev, nc.id]);
                      else setPickerSelectedIds(prev => prev.filter(id => id !== nc.id));
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{nc.firstName} {nc.lastName}</p>
                    {nc.phone && <p className="text-xs text-gray-500">{nc.phone}</p>}
                  </div>
                  {!nc.phone && <Badge variant="outline" className="text-[9px] text-amber-600">No phone</Badge>}
                </label>
              ))}
              {activeNewcomers.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No active newcomers.</p>}
            </div>
            {pickerSelectedIds.length > 0 && (
              <p className="text-xs text-gray-500">{pickerSelectedIds.length} newcomer{pickerSelectedIds.length > 1 ? 's' : ''} selected</p>
            )}
            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setFollowUpPickerOpen(false); setPickerSelectedIds([]); setPickerSearch(''); setFollowUpNowMode(false); }}>Cancel</Button>
              <Button className="flex-1" disabled={pickerSelectedIds.length === 0} onClick={() => {
                const targets = activeNewcomers.filter(n => pickerSelectedIds.includes(n.id));
                setFollowUpPickerOpen(false);
                setPickerSelectedIds([]);
                setPickerSearch('');
                openSmsFollowUp(targets);
              }}>
                <Send className="w-4 h-4 mr-2" />Compose SMS ({pickerSelectedIds.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ ASSIGN TRAINING DIALOG ═══ */}
      <Dialog open={assignTrainingTargets.length > 0} onOpenChange={() => { setAssignTrainingTargets([]); setAssignClassId(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Training Class</DialogTitle>
            <DialogDescription>
              {assignTrainingTargets.length === 1
                ? `Choose a training class for ${assignTrainingTargets[0]?.firstName}. This helps track their progression toward membership.`
                : `Assign ${assignTrainingTargets.length} newcomers to a training class. Their status will be set to "Started" if not already enrolled.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {trainingClasses.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">No training classes created yet.</p>
                <Button size="sm" onClick={() => { setAssignTrainingTargets([]); setCreateClassOpen(true); }}><Plus className="w-4 h-4 mr-1" />Create a Class First</Button>
              </div>
            ) : (
              <>
                <Select value={assignClassId} onValueChange={setAssignClassId}>
                  <SelectTrigger><SelectValue placeholder="Select a training class" /></SelectTrigger>
                  <SelectContent>{trainingClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.durationWeeks ? ` (${c.durationWeeks}wk)` : ''}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => { setAssignTrainingTargets([]); setAssignClassId(''); }}>Cancel</Button>
                  <Button className="flex-1" disabled={!assignClassId || saving} onClick={handleAssignTraining}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Assign
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ CREATE TRAINING CLASS DIALOG ═══ */}
      <Dialog open={createClassOpen} onOpenChange={(o) => { if (!o) setCreateClassOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Training Class</DialogTitle>
            <DialogDescription>Set up a training class like "Baptism Class" or "New Convert Class". You'll be able to assign newcomers and track their progress.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Class Name<RequiredStar /></Label><Input value={tcName} onChange={e => setTcName(e.target.value)} placeholder="e.g., Baptism Class" /></div>
            <div><Label>Description <span className="text-gray-400 font-normal">(optional)</span></Label><Input value={tcDescription} onChange={e => setTcDescription(e.target.value)} placeholder="What does this class cover?" /></div>
            <div><Label>Duration in Weeks <span className="text-gray-400 font-normal">(optional)</span></Label><Input type="number" min="1" value={tcDuration} onChange={e => setTcDuration(e.target.value)} placeholder="e.g., 6" /></div>
            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setCreateClassOpen(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!tcName.trim() || saving} onClick={handleCreateClass}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create Class
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ CREATE FORM DIALOG ═══ */}
      <Dialog open={createFormOpen} onOpenChange={(o) => { if (!o) setCreateFormOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Collection Form</DialogTitle>
            <DialogDescription>Build a form to collect newcomer information. Once created, you'll get a shareable link to distribute.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Form Name<RequiredStar /></Label><Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., First Timer Registration" /></div>
            <div><Label>Description <span className="text-gray-400 font-normal">(optional)</span></Label><Input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="What is this form for?" /></div>
            <div>
              <Label>Visitor Type</Label>
              <Select value={formVisitType} onValueChange={(v: 'first-timer' | 'second-timer') => setFormVisitType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="first-timer">First Timer</SelectItem>
                  <SelectItem value="second-timer">Second Timer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setCreateFormOpen(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!formName.trim() || saving} onClick={handleCreateForm}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create Form
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

