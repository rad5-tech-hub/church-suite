import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Church, X, ChevronRight, ChevronLeft, PartyPopper,
  LayoutDashboard, Layers, Box, Shield, UsersRound,
  TrendingUp, Calendar, DollarSign, UserPlus,
  MessageSquare, FileText, BarChart3, Settings, Sparkles,
} from 'lucide-react';
import { Button } from './ui/button';

// ─────────── TOUR STEP DEFINITIONS ───────────

interface TourStep {
  /** data-tour attribute value to target */
  target: string;
  /** Conversational title */
  title: string;
  /** Friendly description */
  description: string;
  /** Position of the tooltip relative to the target */
  placement: 'right' | 'bottom' | 'left' | 'top';
  /** Icon to show in the tooltip header */
  icon: React.ReactNode;
  /** If the sidebar needs to scroll to show this nav item */
  scrollIntoView?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'dashboard-stats',
    title: 'Your Dashboard at a Glance',
    description:
      "This is your command center! These cards show you live counts of your members, workforce, programs, and newcomers. Click any card to jump straight to that section. As your church grows, you'll see these numbers update in real time.",
    placement: 'bottom',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    target: 'dashboard-quick-actions',
    title: 'Quick Actions',
    description:
      "Need to do something fast? These shortcuts let you add a member, create a program, record a collection, or follow up with a newcomer — all in one click. Think of it as your church admin speed dial.",
    placement: 'top',
    icon: <ChevronRight className="w-5 h-5" />,
  },
  {
    target: 'setup-checklist',
    title: 'Getting Started Checklist',
    description:
      "This handy checklist tracks your setup progress — creating branches, departments, adding members, and more. Expand it to see what's done and what's left. Each item has a \"How?\" button with step-by-step instructions. It disappears automatically once you've completed everything!",
    placement: 'bottom',
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    target: 'nav-departments',
    title: 'Departments & Outreaches',
    description:
      "This is where you organize your church's internal teams (like Choir, Ushering, or Prayer Team) and external outreaches (like Prison Ministry or Community Feeding). Create as many as you need — each one can have its own units inside it.",
    placement: 'right',
    icon: <Layers className="w-5 h-5" />,
    scrollIntoView: true,
  },
  {
    target: 'nav-units',
    title: 'Units',
    description:
      "Units live inside departments. For example, your Choir department might have Soprano, Alto, Tenor, and Bass units. This lets you manage people at a really granular level — perfect for large departments with sub-teams.",
    placement: 'right',
    icon: <Box className="w-5 h-5" />,
    scrollIntoView: true,
  },
  {
    target: 'nav-administration',
    title: 'Roles & Administrators',
    description:
      "Under Administration, you'll find Roles and Administrators. First create roles with specific permissions (like 'Branch Pastor' or 'Finance Secretary'), then assign those roles to administrators. Each admin only sees what their role allows.",
    placement: 'right',
    icon: <Shield className="w-5 h-5" />,
    scrollIntoView: true,
  },
  {
    target: 'nav-members',
    title: 'Members',
    description:
      "Your church's member database lives here. Add members with their details — name, phone, gender, birthday, address, and more. You can search, filter, and even move members to the workforce when they start serving actively.",
    placement: 'right',
    icon: <UsersRound className="w-5 h-5" />,
    scrollIntoView: true,
  },
  {
    target: 'nav-workforce',
    title: 'Workforce',
    description:
      "The Workforce page is for your active volunteers and workers. Link any member to a department (and optionally a unit), assign training programs, and track their progress. When programs are managed, their attendance records show up here too!",
    placement: 'right',
    icon: <TrendingUp className="w-5 h-5" />,
    scrollIntoView: true,
  },
  {
    target: 'nav-programs',
    title: 'Programs & Events',
    description:
      "Create recurring programs (weekly services, monthly meetings) or one-time events. Each program can have attendance tracking, a workforce checklist, and collection recording. When you \"manage\" a program, you're capturing what happened at that occurrence.",
    placement: 'right',
    icon: <Calendar className="w-5 h-5" />,
    scrollIntoView: true,
  },
  {
    target: 'nav-finance',
    title: 'Finance',
    description:
      "Finance has three sub-tabs: the Finance Ledger (your main income/expense log), Collections (tied to programs), and Fundraisers (standalone campaigns). Click the arrow to expand the sub-menu and access each tab directly.",
    placement: 'right',
    icon: <DollarSign className="w-5 h-5" />,
    scrollIntoView: true,
  },
  {
    target: 'nav-follow-up',
    title: 'Follow-Up',
    description:
      "This is your newcomer pipeline. When first-timers visit, log them here and track follow-up actions. You can convert them to full members, assign training, or just keep notes. There's even a conversion dashboard to see how well you're retaining visitors.",
    placement: 'right',
    icon: <UserPlus className="w-5 h-5" />,
    scrollIntoView: true,
  },
  {
    target: 'nav-communication',
    title: 'SMS & Wallet',
    description:
      "Under Communication, you'll find SMS (for sending bulk messages to members, newcomers, or custom groups) and Wallet (to manage your SMS credit balance). Top up your wallet first, then craft messages using the 3-step recipient flow.",
    placement: 'right',
    icon: <MessageSquare className="w-5 h-5" />,
    scrollIntoView: true,
  },
  {
    target: 'nav-reports',
    title: 'Reports',
    description:
      "Reports flow between admin levels — unit admins report to department admins, who report up the chain. You can reply to reports, star important ones, and even reference previous reports inline. Super admins also have an Outbox for sending messages down.",
    placement: 'right',
    icon: <FileText className="w-5 h-5" />,
    scrollIntoView: true,
  },
  {
    target: 'nav-analytics',
    title: 'Analytics',
    description:
      "Beautiful charts and graphs that visualize your church's data — member growth, attendance trends, financial summaries, and more. You can even copy charts to your clipboard for reports or presentations.",
    placement: 'right',
    icon: <BarChart3 className="w-5 h-5" />,
    scrollIntoView: true,
  },
  {
    target: 'nav-settings',
    title: 'Settings',
    description:
      "Head here to update your church profile — name, address, phone, currency, brand colors, and reporting mode. Super admins can configure how reports flow (hierarchical vs. direct). This is also where you fine-tune how the whole platform behaves.",
    placement: 'right',
    icon: <Settings className="w-5 h-5" />,
    scrollIntoView: true,
  },
];

// ─────────── WELCOME MODAL ───────────

function WelcomeModal({
  churchName,
  onStart,
  onLater,
}: {
  churchName: string;
  onStart: () => void;
  onLater: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Card */}
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 px-6 pt-8 pb-10 text-center text-white">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Church className="w-9 h-9 text-white" />
            </div>
          </motion.div>
          <motion.h2
            className="text-2xl font-bold mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Welcome to Churchset!
          </motion.h2>
          <motion.p
            className="text-white/85 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {churchName} is all set up. Would you like a quick tour of everything the platform can do?
          </motion.p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-gray-600 text-sm text-center mb-6">
            It only takes about 2 minutes. We'll walk you through each section with friendly
            explanations so you know exactly where everything is.
          </p>
          <div className="space-y-3">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-base"
              onClick={onStart}
            >
              Yes, show me around!
            </Button>
            <Button
              variant="ghost"
              className="w-full text-gray-500 hover:text-gray-700 font-medium"
              onClick={onLater}
            >
              Show me later
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────── ANIMATED ARROW SVG ───────────

function AnimatedArrow({ placement }: { placement: 'right' | 'bottom' | 'left' | 'top' }) {
  const rotation = {
    right: 0,
    bottom: 90,
    left: 180,
    top: 270,
  }[placement];

  return (
    <motion.div
      animate={{ x: placement === 'right' ? [0, 8, 0] : placement === 'left' ? [0, -8, 0] : 0, y: placement === 'bottom' ? [0, 8, 0] : placement === 'top' ? [0, -8, 0] : 0 }}
      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
      style={{ transform: `rotate(${rotation}deg)` }}
      className="text-blue-500"
    >
      <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
        <path
          d="M2 12H26M26 12L18 4M26 12L18 20"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}

// ─────────── CELEBRATION ───────────

function Celebration({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center"
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-5">
            <PartyPopper className="w-10 h-10 text-white" />
          </div>
        </motion.div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">You're all set!</h2>
        <p className="text-gray-500 text-sm mb-6">
          You've seen everything Churchset has to offer. Check out the <strong>Getting Started Checklist</strong> at the top
          of the page to start setting things up. You've got this!
        </p>
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          onClick={onClose}
        >
          Let's go!
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ─────────── SPOTLIGHT OVERLAY + TOOLTIP ───────────

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function SpotlightStep({
  step,
  stepIndex,
  totalSteps,
  targetRect,
  onNext,
  onPrev,
  onSkip,
}: {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  targetRect: TargetRect | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}) {
  if (!targetRect) return null;

  const pad = 8;
  const spotlightRect = {
    x: targetRect.left - pad,
    y: targetRect.top - pad,
    w: targetRect.width + pad * 2,
    h: targetRect.height + pad * 2,
    rx: 12,
  };

  // Calculate tooltip position
  const tooltipStyle: React.CSSProperties = { position: 'fixed', zIndex: 10001, maxWidth: 360 };
  const arrowContainerStyle: React.CSSProperties = { position: 'fixed', zIndex: 10001 };

  const gap = 16;

  if (step.placement === 'right') {
    tooltipStyle.left = targetRect.left + targetRect.width + gap + 36;
    tooltipStyle.top = targetRect.top + targetRect.height / 2;
    tooltipStyle.transform = 'translateY(-50%)';
    arrowContainerStyle.left = targetRect.left + targetRect.width + gap;
    arrowContainerStyle.top = targetRect.top + targetRect.height / 2;
    arrowContainerStyle.transform = 'translateY(-50%)';
  } else if (step.placement === 'left') {
    tooltipStyle.right = `calc(100vw - ${targetRect.left}px + ${gap + 36}px)`;
    tooltipStyle.top = targetRect.top + targetRect.height / 2;
    tooltipStyle.transform = 'translateY(-50%)';
    arrowContainerStyle.left = targetRect.left - gap - 32;
    arrowContainerStyle.top = targetRect.top + targetRect.height / 2;
    arrowContainerStyle.transform = 'translateY(-50%)';
  } else if (step.placement === 'bottom') {
    tooltipStyle.left = targetRect.left + targetRect.width / 2;
    tooltipStyle.top = targetRect.top + targetRect.height + gap + 28;
    tooltipStyle.transform = 'translateX(-50%)';
    arrowContainerStyle.left = targetRect.left + targetRect.width / 2;
    arrowContainerStyle.top = targetRect.top + targetRect.height + gap;
    arrowContainerStyle.transform = 'translateX(-50%)';
  } else {
    tooltipStyle.left = targetRect.left + targetRect.width / 2;
    tooltipStyle.bottom = `calc(100vh - ${targetRect.top}px + ${gap + 28}px)`;
    tooltipStyle.transform = 'translateX(-50%)';
    arrowContainerStyle.left = targetRect.left + targetRect.width / 2;
    arrowContainerStyle.top = targetRect.top - gap - 24;
    arrowContainerStyle.transform = 'translateX(-50%)';
  }

  // Clamp tooltip so it doesn't go off screen
  if (step.placement === 'right' || step.placement === 'left') {
    const topVal = typeof tooltipStyle.top === 'number' ? tooltipStyle.top : 0;
    if (topVal < 80) {
      tooltipStyle.top = 80;
      tooltipStyle.transform = 'translateY(0)';
    }
  }

  return (
    <>
      {/* Dark overlay with spotlight cutout */}
      <svg
        className="fixed inset-0 w-full h-full"
        style={{ zIndex: 10000, pointerEvents: 'none' }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={spotlightRect.x}
              y={spotlightRect.y}
              width={spotlightRect.w}
              height={spotlightRect.h}
              rx={spotlightRect.rx}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Clickable overlay to prevent interactions outside spotlight */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Spotlight ring animation */}
      <motion.div
        className="fixed border-2 border-blue-400 rounded-xl pointer-events-none"
        style={{
          zIndex: 10001,
          left: spotlightRect.x,
          top: spotlightRect.y,
          width: spotlightRect.w,
          height: spotlightRect.h,
        }}
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.02, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />

      {/* Animated arrow */}
      <div style={arrowContainerStyle}>
        <AnimatedArrow placement={step.placement} />
      </div>

      {/* Tooltip card */}
      <motion.div
        style={tooltipStyle}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        key={stepIndex}
      >
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              {step.icon}
              <span className="font-semibold text-sm">{step.title}</span>
            </div>
            <button
              onClick={onSkip}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-4">
            <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
          </div>

          {/* Footer */}
          <div className="px-4 pb-4 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">
              {stepIndex + 1} of {totalSteps}
            </span>
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <Button variant="ghost" size="sm" onClick={onPrev} className="text-xs">
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={onNext}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                {stepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
                {stepIndex < totalSteps - 1 && <ChevronRight className="w-3.5 h-3.5 ml-1" />}
              </Button>
            </div>
          </div>

          {/* Progress dots */}
          <div className="px-4 pb-3 flex justify-center gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex
                    ? 'w-6 bg-blue-500'
                    : i < stepIndex
                      ? 'w-1.5 bg-blue-300'
                      : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─────────── MAIN PRODUCT TOUR COMPONENT ───────────

type TourPhase = 'idle' | 'welcome' | 'touring' | 'celebration' | 'done';

const TOUR_STORAGE_KEY = 'churchset_tour_completed';
const TOUR_LATER_KEY = 'churchset_tour_later';

export function ProductTour({ churchName }: { churchName: string }) {
  const [phase, setPhase] = useState<TourPhase>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const rafRef = useRef<number>(0);

  // Decide whether to show the welcome modal
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
    if (completed) {
      setPhase('done');
      return;
    }

    // Check if this is the first visit to the dashboard (post-onboarding)
    const isFirstDashboard = localStorage.getItem('churchset_first_dashboard') !== 'true';
    const laterDismissed = localStorage.getItem(TOUR_LATER_KEY);

    if (isFirstDashboard) {
      // Mark that user has visited dashboard
      localStorage.setItem('churchset_first_dashboard', 'true');
      // Show welcome after a short delay to let the dashboard render
      const timer = setTimeout(() => setPhase('welcome'), 800);
      return () => clearTimeout(timer);
    } else if (!laterDismissed) {
      // They've been here before but never clicked "later" or finished — show again
      const timer = setTimeout(() => setPhase('welcome'), 800);
      return () => clearTimeout(timer);
    }

    setPhase('done');
  }, []);

  // Track the target element's position
  const updateTargetRect = useCallback(() => {
    if (phase !== 'touring') return;
    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    } else {
      setTargetRect(null);
    }

    rafRef.current = requestAnimationFrame(updateTargetRect);
  }, [phase, currentStep]);

  useEffect(() => {
    if (phase === 'touring') {
      const step = TOUR_STEPS[currentStep];
      if (step?.scrollIntoView) {
        const el = document.querySelector(`[data-tour="${step.target}"]`);
        if (!el) {
          // Element doesn't exist in DOM — auto-skip this step
          const nextIdx = currentStep + 1;
          if (nextIdx >= TOUR_STEPS.length) {
            setPhase('celebration');
          } else {
            setCurrentStep(nextIdx);
          }
          return;
        }
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const el = document.querySelector(`[data-tour="${step.target}"]`);
        if (!el) {
          const nextIdx = currentStep + 1;
          if (nextIdx >= TOUR_STEPS.length) {
            setPhase('celebration');
          } else {
            setCurrentStep(nextIdx);
          }
          return;
        }
      }
      // Small delay for scroll to finish
      const timer = setTimeout(() => {
        rafRef.current = requestAnimationFrame(updateTargetRect);
      }, 150);
      return () => {
        clearTimeout(timer);
        cancelAnimationFrame(rafRef.current);
      };
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, currentStep, updateTargetRect]);

  const handleStart = () => {
    setCurrentStep(0);
    setPhase('touring');
  };

  const handleLater = () => {
    localStorage.setItem(TOUR_LATER_KEY, 'true');
    setPhase('done');
  };

  const handleNext = () => {
    cancelAnimationFrame(rafRef.current);
    if (currentStep >= TOUR_STEPS.length - 1) {
      setPhase('celebration');
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    cancelAnimationFrame(rafRef.current);
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    cancelAnimationFrame(rafRef.current);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setPhase('done');
  };

  const handleFinishCelebration = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setPhase('done');
  };

  if (phase === 'done' || phase === 'idle') return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {phase === 'welcome' && (
        <WelcomeModal
          key="welcome"
          churchName={churchName}
          onStart={handleStart}
          onLater={handleLater}
        />
      )}
      {phase === 'touring' && (
        <SpotlightStep
          key={`step-${currentStep}`}
          step={TOUR_STEPS[currentStep]}
          stepIndex={currentStep}
          totalSteps={TOUR_STEPS.length}
          targetRect={targetRect}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
        />
      )}
      {phase === 'celebration' && (
        <Celebration key="celebration" onClose={handleFinishCelebration} />
      )}
    </AnimatePresence>,
    document.body
  );
}