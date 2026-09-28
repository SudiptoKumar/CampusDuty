import { useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useImportSharedData } from '@/hooks/useSharedLinks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';

const PENDING_TOKEN_KEY = 'pending-import-token';
const PENDING_CODE_KEY = 'pending-import-code';
const PENDING_IMPORT_RESULT_KEY = 'pending-import-result';

export function PendingImportHandler() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const importData = useImportSharedData();
  const hasTriggered = useRef(false);

  // Determine if the user is new (hasn't completed profile setup)
  const isNewUser = profile && !profile.profile_setup_completed;

  useEffect(() => {
    if (!user || hasTriggered.current) return;

    const pendingToken = localStorage.getItem(PENDING_TOKEN_KEY);
    const pendingCode = localStorage.getItem(PENDING_CODE_KEY);

    if (!pendingToken && !pendingCode) return;

    hasTriggered.current = true;

    const runImport = async () => {
      try {
        let token: string | null = pendingToken;

        // If we have a code, resolve it to a token first
        if (!token && pendingCode) {
          const { data, error } = await supabase.rpc('get_shared_link_by_code', { _code: pendingCode });
          if (error || !data || (data as any[]).length === 0) {
            console.warn('[PendingImport] Invalid or expired code, clearing');
            localStorage.removeItem(PENDING_CODE_KEY);
            return;
          }
          token = (data as any[])[0].token;
        }

        if (!token) {
          localStorage.removeItem(PENDING_TOKEN_KEY);
          localStorage.removeItem(PENDING_CODE_KEY);
          return;
        }

        // Clear localStorage immediately to prevent re-triggers
        localStorage.removeItem(PENDING_TOKEN_KEY);
        localStorage.removeItem(PENDING_CODE_KEY);

        importData.mutate(
          {
            token,
            importSubjects: true,
            importTeachers: true,
            importClasses: true,
          },
          {
            onSuccess: (result) => {
              if (isNewUser) {
                // For new users, store result for onboarding completion step
                localStorage.setItem(PENDING_IMPORT_RESULT_KEY, JSON.stringify(result.imported));
              } else {
                // For existing users, show a brief toast
                toast.success(`Imported ${result.imported.subjects} subjects, ${result.imported.teachers} teachers, ${result.imported.classes} classes!`, { duration: 2000 });
              }
            },
            onError: (error) => {
              console.error('[PendingImport] Failed:', error);
              toast.error('Failed to import shared data. You can try again from Settings.');
            },
          }
        );
      } catch (error) {
        console.error('[PendingImport] Error:', error);
        localStorage.removeItem(PENDING_TOKEN_KEY);
        localStorage.removeItem(PENDING_CODE_KEY);
      }
    };

    runImport();
  }, [user, isNewUser]);

  return null;
}

export { PENDING_TOKEN_KEY, PENDING_CODE_KEY, PENDING_IMPORT_RESULT_KEY };
