import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Events that should trigger query invalidation
const AUTH_EVENTS_TO_INVALIDATE: AuthChangeEvent[] = [
  'SIGNED_IN',
  'SIGNED_OUT',
  'INITIAL_SESSION',
  'TOKEN_REFRESHED',
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Ensure profile exists for authenticated user
  const ensureProfileExists = useCallback(async (authUser: User) => {
    try {
      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking profile:', checkError);
        return;
      }

      // If no profile, create one
      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: authUser.id,
            name: authUser.user_metadata?.name || 'Student',
            email: authUser.email,
          });

        if (insertError) {
          // Ignore duplicate key errors (profile may have been created by another tab)
          if (!insertError.message.includes('duplicate key')) {
            console.error('Error creating profile:', insertError);
          }
        } else {
          console.log('Profile created for user:', authUser.id);
        }
      }
    } catch (err) {
      console.error('Profile bootstrap error:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let initialSessionResolved = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        // Only set isLoading=false from onAuthStateChange AFTER initial session has resolved
        // This prevents the race condition where onAuthStateChange fires before getSession
        if (initialSessionResolved) {
          // For SIGNED_OUT, clear persisted store to prevent stale data
          if (event === 'SIGNED_OUT') {
            try {
              localStorage.removeItem('campus-duty-storage');
            } catch {}
            queryClient.clear();
          }
        }
        
        // Invalidate all queries on significant auth events
        if (AUTH_EVENTS_TO_INVALIDATE.includes(event)) {
          setTimeout(() => {
            queryClient.invalidateQueries();
          }, 0);
        }

        // Ensure profile exists on sign in or initial session
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          setTimeout(() => {
            ensureProfileExists(session.user);
          }, 100);
        }
      }
    );

    // THEN check for existing session - THIS is the only source of isLoading=false on init
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (mounted) {
          initialSessionResolved = true;
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Auth session check failed:", err);
        if (mounted) {
          initialSessionResolved = true;
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient, ensureProfileExists]);

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name: name || 'Student',
          },
        },
      });
      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
