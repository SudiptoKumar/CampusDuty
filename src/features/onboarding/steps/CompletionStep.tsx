import { useEffect, useState } from 'react';
import { CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

const PENDING_IMPORT_RESULT_KEY = 'pending-import-result';

interface ImportResult {
  subjects: number;
  teachers: number;
  classes: number;
}

interface Props {
  profile: Profile;
  onComplete: () => void;
}

export function CompletionStep({ profile, onComplete }: Props) {
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    // Check for pending import result
    const stored = localStorage.getItem(PENDING_IMPORT_RESULT_KEY);
    if (stored) {
      try {
        setImportResult(JSON.parse(stored));
      } catch {}
      localStorage.removeItem(PENDING_IMPORT_RESULT_KEY);
    }

    // Fire confetti
    const end = Date.now() + 1500;
    const colors = ['#F97316', '#A855F7', '#3B82F6', '#F59E0B'];
    
    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  const filledItems = [
    profile.avatar_url && 'Profile photo',
    profile.faculty && `Faculty: ${profile.faculty}`,
    profile.semester && `Semester ${profile.semester}`,
    profile.username && `@${profile.username}`,
    profile.bio && 'Bio added',
    profile.blood_group && `Blood: ${profile.blood_group}`,
  ].filter(Boolean);

  const importTotal = importResult
    ? importResult.subjects + importResult.teachers + importResult.classes
    : 0;

  return (
    <div className="text-center py-4">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Your profile is ready. You can always update it later in Settings.
      </p>

      {/* Import Data Complete section */}
      {importResult && importTotal > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Download className="w-4 h-4 text-primary" />
            <p className="text-xs font-medium text-primary uppercase tracking-wide">Import Data Complete</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {importResult.subjects > 0 && (
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-sm font-medium">
                {importResult.subjects} {importResult.subjects === 1 ? 'Subject' : 'Subjects'}
              </span>
            )}
            {importResult.teachers > 0 && (
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-sm font-medium">
                {importResult.teachers} {importResult.teachers === 1 ? 'Teacher' : 'Teachers'}
              </span>
            )}
            {importResult.classes > 0 && (
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-sm font-medium">
                {importResult.classes} {importResult.classes === 1 ? 'Class' : 'Classes'}
              </span>
            )}
          </div>
        </div>
      )}

      {filledItems.length > 0 && (
        <div className="bg-muted/30 rounded-2xl p-4 mb-8 text-left">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">What you added</p>
          <div className="space-y-2">
            {filledItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button 
        onClick={onComplete}
        className="w-full h-12 rounded-xl text-base font-semibold"
        style={{ 
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent-lavender)) 100%)',
        }}
      >
        Let's Go! 🚀
      </Button>
    </div>
  );
}
