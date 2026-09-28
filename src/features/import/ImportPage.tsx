import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { useSharedLinkByToken, useImportSharedData, useImportHistory, SharedLink } from '@/hooks/useSharedLinks';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Book, Users, Calendar, Download, Loader2, AlertCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ImportSuccessOverlay } from './ImportSuccessOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PALETTE, rgba, extractFirstName, DynamicLogo, TypewriterText, GradientDivider,
  containerVariants, itemVariants,
} from '@/components/shared/BrandAnimations';
import { LiquidEffectAnimation } from '@/components/ui/liquid-effect-animation';

interface ImportPageProps {
  sharedLinkOverride?: SharedLink;
}

/* ── Stat Card ── */
function StatCard({ icon: Icon, label, count, color }: { icon: React.ElementType; label: string; count: number; color: string }) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex-1 min-w-0 p-4 rounded-2xl text-center"
      style={{
        background: rgba(color, 0.06),
        border: `1px solid ${rgba(color, 0.12)}`,
      }}
    >
      <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ background: rgba(color, 0.12) }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{count}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}

export function ImportPage({ sharedLinkOverride }: ImportPageProps) {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: fetchedLink, isLoading, error } = useSharedLinkByToken(sharedLinkOverride ? null : (token || null));

  const sharedLink = sharedLinkOverride || fetchedLink;
  const effectiveToken = sharedLink?.token || token || '';

  const importData = useImportSharedData();
  const { data: importRecord, isLoading: historyLoading } = useImportHistory(sharedLink?.id || null);

  const [importSubjects, setImportSubjects] = useState(true);
  const [importTeachers, setImportTeachers] = useState(true);
  const [importClasses, setImportClasses] = useState(true);
  const [importResult, setImportResult] = useState<{ subjects: number; teachers: number; classes: number } | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const accentColor = useMemo(() => PALETTE[Math.floor(Math.random() * PALETTE.length)], []);

  const alreadyImported = !!importRecord;

  const handleImport = () => {
    if (alreadyImported && !showDuplicateWarning) {
      setShowDuplicateWarning(true);
      return;
    }
    try {
      importData.mutate({
        token: effectiveToken,
        importSubjects: importSubjects && !!sharedLink?.include_subjects,
        importTeachers: importTeachers && !!sharedLink?.include_teachers,
        importClasses: importClasses && !!sharedLink?.include_classes,
      }, {
        onSuccess: (result) => setImportResult(result.imported),
        onError: (error) => {
          console.error('Import failed:', error);
          toast.error('Import failed. Please try again.');
        },
      });
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Something went wrong during import.');
    }
  };

  if (importResult) return <ImportSuccessOverlay imported={importResult} />;

  if (authLoading || isLoading || historyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accentColor }} />
      </div>
    );
  }

  /* ── Guest View ── */
  if (!user) {
    const handleCreateAccount = () => {
      if (effectiveToken) localStorage.setItem('pending-import-token', effectiveToken);
      navigate('/signup');
    };
    const handleSignIn = () => {
      if (effectiveToken) localStorage.setItem('pending-import-token', effectiveToken);
      navigate('/login');
    };

    const ownerName = (sharedLink?.data as any)?.owner_name;
    const firstName = ownerName ? extractFirstName(ownerName) : null;

    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center bg-background p-4 overflow-hidden">
        <LiquidEffectAnimation />
        <div className="absolute inset-0 bg-background/40 z-[1]" />

        <motion.div
          className="relative z-10 w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Frosted Glass Card */}
          <motion.div
            variants={itemVariants}
            className="rounded-3xl p-6 space-y-6 backdrop-blur-xl"
            style={{
              background: rgba(accentColor, 0.03),
              border: `1px solid ${rgba(accentColor, 0.1)}`,
              boxShadow: `0 20px 60px ${rgba(accentColor, 0.06)}, 0 1px 3px rgba(0,0,0,0.04)`,
            }}
          >
            {/* Branding */}
            <motion.div variants={itemVariants} className="flex flex-col items-center gap-2 pt-2">
              <DynamicLogo color={accentColor} />
              <div className="text-center mt-1">
                <TypewriterText text="Campus Duty" color={accentColor} />
                <motion.p
                  className="text-xs text-muted-foreground mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8 }}
                >
                  Your Academic Companion
                </motion.p>
              </div>
            </motion.div>

            <GradientDivider color={accentColor} />

            {/* Share Message */}
            <motion.div variants={itemVariants} className="text-center">
              <motion.div
                className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3"
                style={{ background: rgba(accentColor, 0.1), border: `1px solid ${rgba(accentColor, 0.12)}` }}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.4 }}
              >
                <Download className="w-5 h-5" style={{ color: accentColor }} />
              </motion.div>
              <h1 className="text-lg font-bold mb-1.5">
                {firstName
                  ? `${firstName} shared their timetable with you!`
                  : 'Someone shared their timetable with you!'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Create a free account to import and start organizing your academic life.
              </p>
            </motion.div>

            {/* Stat Cards */}
            {sharedLink && (
              <>
                <GradientDivider color={accentColor} />
                <motion.div className="flex gap-3" variants={containerVariants} initial="hidden" animate="visible">
                  {sharedLink.include_subjects && (
                    <StatCard icon={Book} label="Subjects" count={(sharedLink.data as any)?.subjects?.length || 0} color={accentColor} />
                  )}
                  {sharedLink.include_teachers && (
                    <StatCard icon={Users} label="Teachers" count={(sharedLink.data as any)?.teachers?.length || 0} color={accentColor} />
                  )}
                  {sharedLink.include_classes && (
                    <StatCard icon={Calendar} label="Classes" count={(sharedLink.data as any)?.classes?.length || 0} color={accentColor} />
                  )}
                </motion.div>
              </>
            )}

            <GradientDivider color={accentColor} />

            {/* Action Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col gap-3 pb-2">
              <Button
                onClick={handleCreateAccount}
                className="w-full h-12 text-base hover:scale-[1.02] transition-transform text-white"
                style={{ background: accentColor }}
              >
                Create Account & Import
              </Button>
              <Button
                variant="outline"
                onClick={handleSignIn}
                className="w-full h-12 hover:scale-[1.02] transition-transform"
                style={{ borderColor: rgba(accentColor, 0.4), color: accentColor }}
              >
                I already have an account
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  /* ── Error View ── */
  if (error || !sharedLink) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center bg-background p-4 overflow-hidden">
        <LiquidEffectAnimation />
        <div className="absolute inset-0 bg-background/40 z-[1]" />
        <motion.div
          className="relative z-10 w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="rounded-3xl p-8 text-center space-y-6 backdrop-blur-xl"
            style={{
              background: rgba(accentColor, 0.03),
              border: `1px solid ${rgba(accentColor, 0.1)}`,
              boxShadow: `0 20px 60px ${rgba(accentColor, 0.06)}`,
            }}
          >
            <DynamicLogo color={accentColor} />
            <div>
              <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-destructive" />
              </div>
              <h1 className="text-xl font-bold mb-2">Link Not Found</h1>
              <p className="text-muted-foreground text-sm">This share link doesn't exist or has expired.</p>
            </div>
            <Button onClick={() => navigate('/')} className="text-white" style={{ background: accentColor }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  /* ── Authenticated View ── */
  const data = sharedLink.data as any;
  const subjectsCount = data?.subjects?.length || 0;
  const teachersCount = data?.teachers?.length || 0;
  const classesCount = data?.classes?.length || 0;

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-background p-4 overflow-hidden">
      <LiquidEffectAnimation />
      <div className="absolute inset-0 bg-background/40 z-[1]" />

      <motion.div
        className="relative z-10 w-full max-w-md rounded-3xl p-6 space-y-5 backdrop-blur-xl"
        style={{
          background: rgba(accentColor, 0.03),
          border: `1px solid ${rgba(accentColor, 0.12)}`,
          boxShadow: `0 24px 80px ${rgba(accentColor, 0.08)}, inset 0 1px 0 ${rgba(accentColor, 0.06)}`,
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Branding */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-2 pt-2">
          <DynamicLogo color={accentColor} />
          <div className="text-center mt-1">
            <TypewriterText text="Campus Duty" color={accentColor} />
            <motion.p
              className="text-xs text-muted-foreground mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
            >
              Your Academic Companion
            </motion.p>
          </div>
        </motion.div>

        <GradientDivider color={accentColor} />

        {/* Share info */}
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-lg font-bold mb-1">{sharedLink.title}</h1>
          <p className="text-sm text-muted-foreground">
            Shared on {format(new Date(sharedLink.created_at), 'MMMM d, yyyy')}
          </p>
        </motion.div>

        {/* Duplicate warning */}
        <AnimatePresence>
          {alreadyImported && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Already Imported</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Importing again will create duplicates.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <GradientDivider color={accentColor} />

        {/* Toggle cards */}
        <motion.div variants={itemVariants}>
          <p className="text-sm font-semibold text-muted-foreground mb-3">Select what to import</p>
        </motion.div>

        <div className="space-y-3">
          {sharedLink.include_subjects && (
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between p-4 rounded-xl border backdrop-blur-xl transition-all cursor-pointer"
              style={{
                borderColor: importSubjects ? rgba(accentColor, 0.4) : rgba(accentColor, 0.1),
                background: importSubjects ? rgba(accentColor, 0.06) : rgba(accentColor, 0.02),
                boxShadow: importSubjects ? `0 0 20px ${rgba(accentColor, 0.08)}` : 'none',
              }}
              onClick={() => setImportSubjects(!importSubjects)}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: rgba(accentColor, 0.12) }}>
                  <Book className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                <div>
                  <p className="font-medium text-sm">Subjects</p>
                  <p className="text-xs text-muted-foreground">{subjectsCount} {subjectsCount === 1 ? 'subject' : 'subjects'}</p>
                </div>
              </div>
              <Switch checked={importSubjects} onCheckedChange={setImportSubjects} style={importSubjects ? { backgroundColor: accentColor } : undefined} />
            </motion.div>
          )}

          {sharedLink.include_teachers && (
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between p-4 rounded-xl border backdrop-blur-xl transition-all cursor-pointer"
              style={{
                borderColor: importTeachers ? rgba(accentColor, 0.4) : rgba(accentColor, 0.1),
                background: importTeachers ? rgba(accentColor, 0.06) : rgba(accentColor, 0.02),
                boxShadow: importTeachers ? `0 0 20px ${rgba(accentColor, 0.08)}` : 'none',
              }}
              onClick={() => setImportTeachers(!importTeachers)}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: rgba(accentColor, 0.12) }}>
                  <Users className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                <div>
                  <p className="font-medium text-sm">Teachers</p>
                  <p className="text-xs text-muted-foreground">{teachersCount} {teachersCount === 1 ? 'teacher' : 'teachers'}</p>
                </div>
              </div>
              <Switch checked={importTeachers} onCheckedChange={setImportTeachers} style={importTeachers ? { backgroundColor: accentColor } : undefined} />
            </motion.div>
          )}

          {sharedLink.include_classes && (
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between p-4 rounded-xl border backdrop-blur-xl transition-all cursor-pointer"
              style={{
                borderColor: importClasses ? rgba(accentColor, 0.4) : rgba(accentColor, 0.1),
                background: importClasses ? rgba(accentColor, 0.06) : rgba(accentColor, 0.02),
                boxShadow: importClasses ? `0 0 20px ${rgba(accentColor, 0.08)}` : 'none',
              }}
              onClick={() => setImportClasses(!importClasses)}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: rgba(accentColor, 0.12) }}>
                  <Calendar className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                <div>
                  <p className="font-medium text-sm">Timetable</p>
                  <p className="text-xs text-muted-foreground">{classesCount} {classesCount === 1 ? 'class' : 'classes'}</p>
                </div>
              </div>
              <Switch checked={importClasses} onCheckedChange={setImportClasses} style={importClasses ? { backgroundColor: accentColor } : undefined} />
            </motion.div>
          )}
        </div>

        <GradientDivider color={accentColor} />

        {/* Import button */}
        <motion.div variants={itemVariants} className="pb-2 space-y-3">
          <Button
            onClick={handleImport}
            className="w-full h-12 text-base hover:scale-[1.02] transition-transform text-white"
            disabled={importData.isPending || (!importSubjects && !importTeachers && !importClasses)}
            variant={showDuplicateWarning ? 'destructive' : 'default'}
            style={!showDuplicateWarning ? { background: accentColor } : undefined}
          >
            {importData.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            {showDuplicateWarning ? 'Import Anyway' : 'Import to My Account'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            This will create copies in your account. You can edit them freely.
          </p>

          <button
            onClick={() => navigate('/')}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            ← Back to Home
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default ImportPage;