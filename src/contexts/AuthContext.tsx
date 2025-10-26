import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; roles: string[] }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  userProfile: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user profile and roles after auth state change
        if (session?.user) {
          setTimeout(async () => {
            try {
              // Fetch profile
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              // Fetch user roles
              const { data: roles } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id);
              
              setUserProfile({
                ...profile,
                roles: roles || []
              });
            } catch (error) {
              console.error('Error fetching profile:', error);
            }
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta.",
      });

      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast({
        title: "Erro no cadastro",
        description: err.message,
        variant: "destructive",
      });
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
        return { error, roles: [] };
      }

      if (signInData.user) {
        // Buscar perfil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return { error: profileError, roles: [] };
        }

        // Buscar roles separadamente
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', signInData.user.id);

        const roles = rolesData?.map((r: any) => r.role) || [];
        
        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta!",
        });

        return { error: null, roles };
      }

      return { error: new Error('Usuário não encontrado após o login.'), roles: [] };
    } catch (error) {
      const err = error as Error;
      toast({
        title: "Erro no login",
        description: err.message,
        variant: "destructive",
      });
      return { error: err, roles: [] };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Check if user has ADMIN role
  const isAdmin = userProfile?.roles?.some((r: any) => r.role === 'ADMIN') || false;

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin,
    userProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};