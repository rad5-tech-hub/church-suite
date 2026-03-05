import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  User,
  Church,
  Mail,
  Phone,
  Globe,
  MapPin,
  Save,
  CheckCircle,
  Palette,
  RotateCcw,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Shield,
  LayoutDashboard,
  Layers,
  Box,
  Users,
  UsersRound,
  TrendingUp,
  Calendar,
  DollarSign,
  MessageSquare,
  UserPlus,
  FileText,
  Building2,
  Wallet,
  Play,
  Camera,
  Trash2,
  Upload,
  ImageIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import { useTheme, lightenColor, DEFAULT_PRIMARY, DEFAULT_PRIMARY_LIGHT } from '../context/ThemeContext';
import { editAdmin, saveChurchConfig } from '../api';
import { CURRENCIES } from './Finance';

type ProfileTab = 'personal' | 'church' | 'appearance' | 'help';

const PRESET_COLORS = [
  { name: 'Blue', color: '#2563eb' },
  { name: 'Indigo', color: '#4f46e5' },
  { name: 'Purple', color: '#7c3aed' },
  { name: 'Pink', color: '#db2777' },
  { name: 'Rose', color: '#e11d48' },
  { name: 'Red', color: '#dc2626' },
  { name: 'Orange', color: '#ea580c' },
  { name: 'Amber', color: '#d97706' },
  { name: 'Green', color: '#16a34a' },
  { name: 'Teal', color: '#0d9488' },
  { name: 'Cyan', color: '#0891b2' },
  { name: 'Slate', color: '#475569' },
];

interface FAQItem {
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const FAQ_SECTIONS: { title: string; items: FAQItem[] }[] = [
  {
    title: 'Getting Started',
    items: [
      {
        question: 'How does the Dashboard work?',
        answer: 'The Dashboard is your command center. It shows you a quick overview of all your church activities at a glance -- total members, active programs, recent collections, and newcomer follow-ups. If you\'re a Super Admin, you\'ll see everything across the entire church. If you\'re a branch or department admin, you\'ll only see data relevant to your scope. Think of it as your daily summary page -- check it each morning to stay on top of things.',
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
      {
        question: 'What\'s the difference between Single Branch and Multi-Branch?',
        answer: 'A Single Branch church operates from one location. You can still create departments, outreaches, and units within it. A Multi-Branch church has a headquarters plus satellite locations. When you upgrade to multi-branch, you unlock the Branches page where you can manage each location independently, assign branch-level admins, and track performance per branch. You can always upgrade later from the Subscription page.',
        icon: <Building2 className="w-4 h-4" />,
      },
    ],
  },
  {
    title: 'Organization Structure',
    items: [
      {
        question: 'How do Departments and Outreaches work?',
        answer: 'Departments and Outreaches are the main working groups in your church. Departments handle internal operations like the choir, prayer team, or sanctuary cleaning crew. Outreaches handle external missions like prison ministry, community feeding, or hospital visits. Both work the same way in the system -- the distinction just helps you organize and report on internal vs. external activities. You create them from the Departments page, and can add Units underneath each one.',
        icon: <Layers className="w-4 h-4" />,
      },
      {
        question: 'What are Units?',
        answer: 'Units are smaller teams within a Department or Outreach. For example, your "Music Department" might have units like "Choir", "Band", and "Sound Team". Units let you organize members into specific teams, assign unit-level leaders, and track activities at a granular level. Not every department needs units -- it\'s completely optional. Use them when a department is large enough to warrant sub-groups.',
        icon: <Box className="w-4 h-4" />,
      },
      {
        question: 'How do Branches relate to Departments?',
        answer: 'In a multi-branch setup, each branch can have its own departments and units. When you create a department, you assign it to a specific branch. This way, your HQ might have a "Prayer Department" with 3 units, while your satellite branch has its own separate "Prayer Department" with different units and members. Everything stays organized under the right branch.',
        icon: <Building2 className="w-4 h-4" />,
      },
    ],
  },
  {
    title: 'Administration & Security',
    items: [
      {
        question: 'How do Roles and Permissions work?',
        answer: 'Roles are like templates that define what an admin can do. Each role has a set of permissions (e.g., "Manage Members", "View Reports", "Manage Collections"). When you create a new administrator, you assign them a role. The system comes with default roles like "Super Admin" and "Branch Pastor", but you can create custom ones from the Roles page. You can even fine-tune permissions per admin -- start with a role preset and then add or remove specific permissions.',
        icon: <Shield className="w-4 h-4" />,
      },
      {
        question: 'What are Access Levels?',
        answer: 'Access levels control the scope of what an admin can see. There are four levels: Church (sees everything), Branch (sees only their assigned branch), Department (sees only their department), and Unit (sees only their unit). Combined with roles and permissions, this creates a powerful security model. For example, a "Department Leader" role at the Department level can manage members and programs, but only within their specific department.',
        icon: <Users className="w-4 h-4" />,
      },
      {
        question: 'How do I add a new administrator?',
        answer: 'Go to Administration > Administrators and click "Add Administrator". Fill in their name, email, choose their access level and assign a role. When you click Create, the system generates a temporary password. You\'ll see this password in a dialog -- copy it and share it with the new admin. They can use it to log in immediately. You can also view their last generated password or reset it anytime from the admin\'s action menu.',
        icon: <Users className="w-4 h-4" />,
      },
    ],
  },
  {
    title: 'People Management',
    items: [
      {
        question: 'How do I manage Members?',
        answer: 'The Members page is where you keep track of everyone in your church. You can add members individually, assign them to branches, departments, and units, and track when they joined. Each member has a profile with their contact info and church involvement history. You can filter and search members by name, branch, department, or unit. Think of it as your church directory -- but much more powerful.',
        icon: <UsersRound className="w-4 h-4" />,
      },
      {
        question: 'What is the Workforce section?',
        answer: 'Workforce is a leadership development tool. It helps you track members who are on a growth path -- from new believer to trained leader. You can set up roadmap markers (like "Completed New Members Class", "Joined a Unit", "Leadership Training") and track each person\'s progress. It\'s perfect for discipleship programs and identifying emerging leaders in your church.',
        icon: <TrendingUp className="w-4 h-4" />,
      },
      {
        question: 'How does Follow-Up work?',
        answer: 'The Follow-Up section helps you care for newcomers. When someone visits your church for the first time (first-timer) or returns (second-timer), you create a record for them. Then you can log follow-up activities like phone calls, text messages, emails, or personal notes. You can create shareable forms with QR codes that newcomers can fill out themselves -- their responses automatically appear in your system.',
        icon: <UserPlus className="w-4 h-4" />,
      },
    ],
  },
  {
    title: 'Programs & Finance',
    items: [
      {
        question: 'How do Programs work?',
        answer: 'Programs represent your church activities -- services, Bible studies, prayer meetings, outreach events, etc. You can set them as one-time events or recurring (daily, weekly, monthly, yearly). Programs can be church-wide or tied to a specific branch, department, or unit. You track attendance and can link collections (offerings) to specific programs. This helps you see which activities are driving engagement.',
        icon: <Calendar className="w-4 h-4" />,
      },
      {
        question: 'How do Collections and Finance tracking work?',
        answer: 'The Collections page lets you record all financial giving -- tithes, offerings, donations, and special appeals. Each collection can be tied to a program, branch, or department. You get clear reports showing trends over time, helping you understand giving patterns. This is for record-keeping, not payment processing -- you record amounts after they\'ve been collected through your regular channels.',
        icon: <DollarSign className="w-4 h-4" />,
      },
    ],
  },
  {
    title: 'Communication',
    items: [
      {
        question: 'How does SMS messaging work?',
        answer: 'The SMS feature lets you send text messages to your members directly from Churchset. You can send to all members, or target specific branches, departments, or units. Each message uses credits from your SMS Wallet. You can compose messages, schedule them for later, and see delivery history. It\'s perfect for service reminders, announcements, and pastoral care messages.',
        icon: <MessageSquare className="w-4 h-4" />,
      },
      {
        question: 'What is the SMS Wallet?',
        answer: 'The SMS Wallet is your messaging credit balance. Every text message costs a certain number of credits. You can top up your wallet, view your transaction history, and monitor your spending. Think of it like a prepaid phone plan for your church messaging.',
        icon: <Wallet className="w-4 h-4" />,
      },
    ],
  },
  {
    title: 'Reports & Insights',
    items: [
      {
        question: 'What kind of Reports are available?',
        answer: 'The Reports section gives you bird\'s-eye insights into your church\'s health. You can see membership growth trends, attendance patterns, financial summaries, department activity, workforce development progress, and newcomer retention rates. Reports can be filtered by date range, branch, and department. Use these to make data-driven decisions about resource allocation, program effectiveness, and growth strategies.',
        icon: <FileText className="w-4 h-4" />,
      },
    ],
  },
];

export function Profile() {
  const { currentAdmin, setCurrentAdmin } = useAuth();
  const { church, updateChurch } = useChurch();
  const { brandColors, setBrandColors, resetToDefault, isCustomized } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<ProfileTab>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'help' || tab === 'appearance' || tab === 'church' || tab === 'personal') return tab as ProfileTab;
    return 'personal';
  });
  const [saving, setSaving] = useState(false);

  // Personal form
  const [personalName, setPersonalName] = useState(currentAdmin?.name || '');
  const [personalPhone, setPersonalPhone] = useState(currentAdmin?.phone || '');
  const [personalEmail, setPersonalEmail] = useState(currentAdmin?.email || '');

  // Church form
  const [churchName, setChurchName] = useState(church.name);
  const [churchAddress, setChurchAddress] = useState(church.address || '');
  const [churchCity, setChurchCity] = useState(church.city || '');
  const [churchState, setChurchState] = useState(church.state || '');
  const [churchCountry, setChurchCountry] = useState(church.country || '');
  const [churchPhone, setChurchPhone] = useState(church.phone || '');
  const [churchEmail, setChurchEmail] = useState(church.email || '');
  const [churchWebsite, setChurchWebsite] = useState(church.website || '');
  const [churchCurrency, setChurchCurrency] = useState(church.currency || 'USD');
  const [churchReportingMode, setChurchReportingMode] = useState(church.reportingMode || 'hierarchical');

  // Color customization
  const [selectedColor, setSelectedColor] = useState(brandColors?.primary || DEFAULT_PRIMARY);
  const [customColorInput, setCustomColorInput] = useState(brandColors?.primary || DEFAULT_PRIMARY);

  // FAQ expanded items
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  // File input refs
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Profile picture preview dialog
  const [showPicPreview, setShowPicPreview] = useState(false);

  // Sync form when currentAdmin changes
  useEffect(() => {
    if (currentAdmin) {
      setPersonalName(currentAdmin.name);
      setPersonalPhone(currentAdmin.phone || '');
      setPersonalEmail(currentAdmin.email || '');
    }
  }, [currentAdmin]);

  useEffect(() => {
    setChurchName(church.name);
    setChurchAddress(church.address || '');
    setChurchCity(church.city || '');
    setChurchState(church.state || '');
    setChurchCountry(church.country || '');
    setChurchPhone(church.phone || '');
    setChurchEmail(church.email || '');
    setChurchWebsite(church.website || '');
    setChurchCurrency(church.currency || 'USD');
    setChurchReportingMode(church.reportingMode || 'hierarchical');
  }, [church]);

  const { showToast } = useToast();
  const showSaved = () => showToast('Changes saved successfully.');

  const handleSavePersonal = async () => {
    if (!currentAdmin) return;
    setSaving(true);
    try {
      const trimmedEmail = personalEmail.trim().toLowerCase();
      await editAdmin(currentAdmin.id, {
        name: personalName.trim(),
        phone: personalPhone.trim() || undefined,
        ...(isSuperAdmin ? { email: trimmedEmail } : {}),
      });
      const updatedAdmin = {
        ...currentAdmin,
        name: personalName.trim(),
        phone: personalPhone.trim() || undefined,
        ...(isSuperAdmin ? { email: personalEmail.trim().toLowerCase() } : {}),
      };
      setCurrentAdmin(updatedAdmin);
      showSaved();
    } catch (err: any) {
      showToast(err?.body?.message || 'Failed to save personal info.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChurch = async () => {
    setSaving(true);
    try {
      const updates = {
        name: churchName.trim(),
        address: churchAddress.trim() || undefined,
        city: churchCity.trim() || undefined,
        state: churchState.trim() || undefined,
        country: churchCountry.trim() || undefined,
        phone: churchPhone.trim() || undefined,
        email: churchEmail.trim() || undefined,
        website: churchWebsite.trim() || undefined,
        currency: churchCurrency.trim() || undefined,
        reportingMode: (churchReportingMode as 'hierarchical' | 'direct') || undefined,
      };
      // Persist to server via multipart/form-data
      await saveChurchConfig(updates);
      // Keep local context in sync
      updateChurch(updates);
      showSaved();
    } catch (err: any) {
      showToast(err?.body?.message || 'Failed to save church info.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    setCustomColorInput(color);
    setBrandColors({
      primary: color,
      primaryLight: lightenColor(color, 0.85),
    });
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColorInput(color);
    if (/^#[0-9a-fA-F]{6}$/.test(color)) {
      setSelectedColor(color);
      setBrandColors({
        primary: color,
        primaryLight: lightenColor(color, 0.85),
      });
    }
  };

  const handleResetColors = () => {
    resetToDefault();
    setSelectedColor(DEFAULT_PRIMARY);
    setCustomColorInput(DEFAULT_PRIMARY);
  };

  // ─── Image upload helpers ───
  const readFileAsBase64 = (file: File, maxSizeKB = 500): Promise<string | null> =>
    new Promise((resolve) => {
      if (file.size > maxSizeKB * 1024) {
        alert(`File is too large. Please choose an image under ${maxSizeKB}KB.`);
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentAdmin) return;
    const base64 = await readFileAsBase64(file, 300);
    if (!base64) return;
    setSaving(true);
    try {
      // No server API for profile picture — persist in localStorage so it
      // survives page refreshes and is restored by AuthContext on init.
      try { localStorage.setItem(`churchset_profile_pic_${currentAdmin.id}`, base64); } catch { /* ignore */ }
      setCurrentAdmin({ ...currentAdmin, profilePicture: base64 });
      showSaved();
    } catch (err) {
      console.error('Failed to save profile picture:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveProfilePic = async () => {
    if (!currentAdmin) return;
    setSaving(true);
    try {
      try { localStorage.removeItem(`churchset_profile_pic_${currentAdmin.id}`); } catch { /* ignore */ }
      setCurrentAdmin({ ...currentAdmin, profilePicture: undefined });
      showSaved();
    } catch (err) {
      console.error('Failed to remove profile picture:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const res = await saveChurchConfig({ logo: file });
      // Server returns Cloudinary URL; fall back to local preview if missing
      const logoUrl = res?.church?.logo ?? res?.logo ?? res?.data?.logo ?? undefined;
      updateChurch({ logoUrl: logoUrl || church.logoUrl });
      showSaved();
    } catch (err: any) {
      showToast(err?.body?.message || 'Failed to upload logo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLogo = async () => {
    setSaving(true);
    try {
      // The API doesn't have a dedicated remove-logo endpoint;
      // uploading no file just re-saves church name to keep data consistent.
      await saveChurchConfig({ name: church.name });
      updateChurch({ logoUrl: undefined });
      showSaved();
    } catch (err: any) {
      // Non-critical — still clear locally even if server call fails
      updateChurch({ logoUrl: undefined });
      showSaved();
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdmin = currentAdmin?.isSuperAdmin ?? false;

  const tabs: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'personal', label: 'My Profile', icon: <User className="w-4 h-4" /> },
    ...(isSuperAdmin ? [{ id: 'church' as ProfileTab, label: 'Church Details', icon: <Church className="w-4 h-4" /> }] : []),
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'help', label: 'Help & FAQ', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  return (
    <Layout>
      <PageHeader
        title="Settings & Profile"
        description="Manage your personal information, church details, and app preferences."
      />

      <div className="p-4 md:p-6">

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              style={
                activeTab === tab.id
                  ? { backgroundColor: brandColors?.primary || '#2563eb' }
                  : undefined
              }
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ============ PERSONAL PROFILE ============ */}
        {activeTab === 'personal' && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Personal Information</h2>
                <p className="text-sm text-gray-500">Update your name, phone number, and other personal details.</p>
              </div>
              <Separator />

              {/* Profile Picture */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  {currentAdmin?.profilePicture ? (
                    <button
                      type="button"
                      onClick={() => setShowPicPreview(true)}
                      className="block"
                    >
                      <img
                        src={currentAdmin.profilePicture}
                        alt={currentAdmin.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    </button>
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                      style={{ backgroundColor: brandColors?.primary || '#2563eb' }}
                    >
                      {currentAdmin?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => profilePicInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                    title="Change photo"
                  >
                    <Camera className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                  <input
                    ref={profilePicInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleProfilePicChange}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">Profile Photo</p>
                  <p className="text-xs text-gray-500">Click the camera icon to upload a new photo. JPG, PNG, or WebP up to 300KB.</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => profilePicInputRef.current?.click()}
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      {currentAdmin?.profilePicture ? 'Change' : 'Upload'}
                    </Button>
                    {currentAdmin?.profilePicture && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={handleRemoveProfilePic}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Picture Preview Modal */}
              {showPicPreview && currentAdmin?.profilePicture && (
                <div
                  className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
                  onClick={() => setShowPicPreview(false)}
                >
                  <div className="relative bg-white rounded-2xl p-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                    <img
                      src={currentAdmin.profilePicture}
                      alt={currentAdmin.name}
                      className="w-full aspect-square object-cover rounded-xl"
                    />
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm font-medium text-gray-900">{currentAdmin.name}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setShowPicPreview(false); profilePicInputRef.current?.click(); }}>
                          <Camera className="w-3.5 h-3.5 mr-1" />
                          Change
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => { setShowPicPreview(false); handleRemoveProfilePic(); }}>
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <button
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                      onClick={() => setShowPicPreview(false)}
                    >
                      &times;
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Full Name</Label>
                  <Input
                    id="profile-name"
                    value={personalName}
                    onChange={(e) => setPersonalName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email Address</Label>
                  {isSuperAdmin ? (
                    <>
                      <Input
                        id="profile-email"
                        type="email"
                        value={personalEmail}
                        onChange={(e) => setPersonalEmail(e.target.value)}
                        placeholder="Your email address"
                      />
                      <p className="text-xs text-gray-400">As a Super Admin, you can update your login email.</p>
                    </>
                  ) : (
                    <>
                      <Input
                        id="profile-email"
                        value={currentAdmin?.email || ''}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-400">Only Super Admins can change their email address.</p>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-phone">Phone Number</Label>
                  <Input
                    id="profile-phone"
                    type="tel"
                    value={personalPhone}
                    onChange={(e) => setPersonalPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={`${currentAdmin?.isSuperAdmin ? 'Super Admin' : 'Administrator'} (${currentAdmin?.level || 'church'} level)`}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-400">Contact a Super Admin to change your role.</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSavePersonal} disabled={saving || !personalName.trim()}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============ CHURCH DETAILS (Super Admin Only) ============ */}
        {activeTab === 'church' && isSuperAdmin && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Church Information</h2>
                <p className="text-sm text-gray-500">Manage your church's name, address, and contact information. Only Super Admins can edit this.</p>
              </div>
              <Separator />

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="church-name">Church Name</Label>
                    <Input
                      id="church-name"
                      value={churchName}
                      onChange={(e) => setChurchName(e.target.value)}
                      placeholder="Grace Community Church"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="church-address">Street Address</Label>
                    <Input
                      id="church-address"
                      value={churchAddress}
                      onChange={(e) => setChurchAddress(e.target.value)}
                      placeholder="123 Faith Avenue"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="church-city">City</Label>
                    <Input
                      id="church-city"
                      value={churchCity}
                      onChange={(e) => setChurchCity(e.target.value)}
                      placeholder="Springfield"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="church-state">State / Province</Label>
                    <Input
                      id="church-state"
                      value={churchState}
                      onChange={(e) => setChurchState(e.target.value)}
                      placeholder="Illinois"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="church-country">Country</Label>
                    <Input
                      id="church-country"
                      value={churchCountry}
                      onChange={(e) => setChurchCountry(e.target.value)}
                      placeholder="United States"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="church-phone">Church Phone</Label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <Input
                        id="church-phone"
                        type="tel"
                        value={churchPhone}
                        onChange={(e) => setChurchPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="church-email">Church Email</Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <Input
                        id="church-email"
                        type="email"
                        value={churchEmail}
                        onChange={(e) => setChurchEmail(e.target.value)}
                        placeholder="info@gracechurch.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="church-website">Website</Label>
                    <div className="relative">
                      <Globe className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <Input
                        id="church-website"
                        type="url"
                        value={churchWebsite}
                        onChange={(e) => setChurchWebsite(e.target.value)}
                        placeholder="https://www.gracechurch.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="church-currency">Currency</Label>
                    <Select
                      value={churchCurrency}
                      onValueChange={(value) => setChurchCurrency(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} — {currency.name} ({currency.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-400">This currency symbol will be used across the Finance section.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="church-reporting-mode">Reporting Mode</Label>
                    <Select
                      value={churchReportingMode}
                      onValueChange={(value) => setChurchReportingMode(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select reporting mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hierarchical">Hierarchical (Strict Chain)</SelectItem>
                        <SelectItem value="direct">Direct (Open Reporting)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-400">
                      {churchReportingMode === 'hierarchical'
                        ? 'Administrators can only send reports to the level directly above them (e.g., Unit Head → Dept. Head → Branch Head → Super Admin).'
                        : 'Any administrator can send reports to anyone higher in the chain of command (e.g., a Unit Head can report directly to the Super Admin).'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveChurch} disabled={saving || !churchName.trim()}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Church Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============ APPEARANCE / COLOR CUSTOMIZATION ============ */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Brand Colors</h2>
                  <p className="text-sm text-gray-500">Customize the accent color used throughout the app to match your church's brand identity.</p>
                </div>
                <Separator />

                {/* Preview */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-4">Preview</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm"
                      style={{ backgroundColor: selectedColor }}
                    >
                      Primary Button
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-medium border"
                      style={{
                        backgroundColor: lightenColor(selectedColor, 0.85),
                        color: selectedColor,
                        borderColor: lightenColor(selectedColor, 0.6),
                      }}
                    >
                      Secondary Button
                    </button>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: lightenColor(selectedColor, 0.85),
                        color: selectedColor,
                      }}
                    >
                      Badge
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedColor }} />
                      <span className="text-sm font-medium" style={{ color: selectedColor }}>Active Link</span>
                    </div>
                  </div>
                </div>

                {/* Color Presets */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Choose a preset color</p>
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-3">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.color}
                        onClick={() => handleSelectColor(preset.color)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                          selectedColor === preset.color ? 'border-gray-900 ring-2 ring-offset-2' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: preset.color, ringColor: preset.color }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom Color */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Or enter a custom hex color</p>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={customColorInput}
                        onChange={(e) => handleCustomColorChange(e.target.value)}
                        className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-1"
                      />
                    </div>
                    <Input
                      value={customColorInput}
                      onChange={(e) => handleCustomColorChange(e.target.value)}
                      placeholder="#2563eb"
                      className="w-36 font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>

                {/* Reset */}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-400">
                    {isCustomized ? 'Custom brand color is active.' : 'Using default blue theme.'}
                  </p>
                  {isCustomized && (
                    <Button variant="outline" size="sm" onClick={handleResetColors}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset to Default
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ─── Church Logo (Super Admin only) ─── */}
            {isSuperAdmin && (
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Church Logo</h2>
                    <p className="text-sm text-gray-500">
                      Upload your church logo. It will appear as a subtle watermark in the background of every page, giving your team a personalized experience.
                    </p>
                  </div>
                  <Separator />

                  <div className="flex items-start gap-6">
                    {/* Logo preview */}
                    <div className="flex-shrink-0">
                      {church.logoUrl ? (
                        <div className="w-28 h-28 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                          <img
                            src={church.logoUrl}
                            alt="Church logo"
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                      ) : (
                        <div className="w-28 h-28 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                          <ImageIcon className="w-8 h-8 mb-1" />
                          <span className="text-[10px]">No logo</span>
                        </div>
                      )}
                    </div>

                    {/* Upload controls */}
                    <div className="space-y-3 flex-1">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {church.logoUrl ? 'Logo uploaded' : 'No logo yet'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Upload a PNG, JPG, or WebP file up to 500KB. The logo will appear as a very faint watermark behind every page so it never interferes with readability.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4 mr-1.5" />
                          {church.logoUrl ? 'Change Logo' : 'Upload Logo'}
                        </Button>
                        {church.logoUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={handleRemoveLogo}
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Remove
                          </Button>
                        )}
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={handleLogoChange}
                        />
                      </div>

                      {/* Watermark preview */}
                      {church.logoUrl && (
                        <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200 p-6 relative overflow-hidden">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-2">Watermark Preview</p>
                          <div className="h-20 relative">
                            <img
                              src={church.logoUrl}
                              alt=""
                              className="absolute inset-0 w-full h-full object-contain"
                              style={{ opacity: (church.logoOpacity ?? 4) / 100 }}
                            />
                            <div className="relative z-[1] flex items-center justify-center h-full">
                              <p className="text-xs text-gray-500">This is how the logo appears behind your content — barely visible but always present.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Opacity slider */}
                      {church.logoUrl && (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700">Watermark Opacity</Label>
                            <span className="text-sm font-mono text-gray-500">{church.logoOpacity ?? 4}%</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={30}
                            step={1}
                            value={church.logoOpacity ?? 4}
                            onChange={(e) => {
                              updateChurch({ logoOpacity: parseInt(e.target.value) });
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>Subtle (1%)</span>
                            <span>Visible (30%)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ============ HELP & FAQ ============ */}
        {activeTab === 'help' && (
          <div className="space-y-6">
            {/* Restart Product Tour — top of FAQ */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Play className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Restart Product Tour</p>
                      <p className="text-xs text-blue-600 mt-0.5">
                        Walk through every section of Churchset again with our guided, step-by-step tour.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={() => {
                      localStorage.removeItem('churchset_tour_completed');
                      localStorage.removeItem('churchset_tour_later');
                      localStorage.removeItem('churchset_first_dashboard');
                      navigate('/dashboard');
                    }}
                  >
                    <Play className="w-3.5 h-3.5 mr-1.5" />
                    Start Tour
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Help & Frequently Asked Questions</h2>
                  <p className="text-sm text-gray-500">
                    Everything you need to know about using Churchset. Click on any question to learn more.
                  </p>
                </div>

                <div className="space-y-8">
                  {FAQ_SECTIONS.map((section) => (
                    <div key={section.title}>
                      <h3
                        className="text-sm font-semibold uppercase tracking-wide mb-3"
                        style={{ color: brandColors?.primary || '#2563eb' }}
                      >
                        {section.title}
                      </h3>
                      <div className="space-y-2">
                        {section.items.map((item) => {
                          const key = `${section.title}-${item.question}`;
                          const isOpen = expandedFAQ === key;
                          return (
                            <div
                              key={key}
                              className="border border-gray-200 rounded-lg overflow-hidden"
                            >
                              <button
                                onClick={() => setExpandedFAQ(isOpen ? null : key)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                              >
                                <span className="text-gray-400 flex-shrink-0">{item.icon}</span>
                                <span className="flex-1 text-sm font-medium text-gray-900">{item.question}</span>
                                {isOpen ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                )}
                              </button>
                              {isOpen && (
                                <div className="px-4 pb-4 pt-1">
                                  <div
                                    className="rounded-lg p-4 text-sm leading-relaxed"
                                    style={{
                                      backgroundColor: lightenColor(brandColors?.primary || '#2563eb', 0.92),
                                      color: '#374151',
                                    }}
                                  >
                                    {item.answer}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-8" />

                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                    <HelpCircle className="w-6 h-6 text-gray-500" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Still need help?</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    If you can't find what you're looking for, reach out to our support team.
                  </p>
                  <Button variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>


          </div>
        )}
      </div>
    </Layout>
  );
}