// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Database } from '../integrations/supabase/types';

type UserProfile = Database['public']['Tables']['profiles']['Row'] & {
  roles: { role: Database['public']['Enums']['app_role'] }[];
};

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  // signIn agora retorna o caminho de redirecionamento
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: Error | null; redirectPath: string | null; isAdminLogin?: boolean }>; // Adicionado isAdminLogin para diferenciar
  signOut: () => Promise<void>;
  setUserProfile: (profile: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Função interna para buscar perfil E roles (robusta)
  const fetchUserProfileAndRoles = async (currentUser: User | null): Promise<UserProfile | null> => {
    if (!currentUser) return null;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, roles:user_roles!inner(role)') // Exige que roles existam
        .eq('id', currentUser.id)
        .single();
      if (error) {
         // Se PGRST116 (sem roles), loga erro crítico mas retorna perfil básico sem roles
         if (error.code === 'PGRST116') {
             console.error("AuthContext Erro Crítico: Perfil encontrado, mas sem roles na tabela user_roles. Verifique o trigger 'handle_new_user'. ID:", currentUser.id);
             const { data: basicProfile, error: basicError } = await supabase
                .from('profiles').select('*').eq('id', currentUser.id).single();
             if (basicError) throw basicError;
             // Retorna perfil básico com roles vazios - ProtectedRoute tratará isso como não-admin
             return { ...basicProfile, roles: [] } as UserProfile;
         }
        throw error; // Relança outros erros
      }
      return { ...profile, roles: profile.roles || [] } as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile and roles:', error);
      return null; // Falha na busca = null
    }
  };

  // Efeito principal para gerenciar estado de autenticação (robusto)
  useEffect(() => {
    let isMounted = true;
    const updateUserState = async (sessionUser: User | null) => {
      // Começa a carregar apenas se o estado do usuário realmente mudar
      if (sessionUser?.id !== user?.id) {
         setIsLoading(true);
      }
      const profile = await fetchUserProfileAndRoles(sessionUser);
      if (isMounted) {
        setUser(sessionUser);
        setUserProfile(profile);
        setIsAdmin(profile?.roles?.some(r => r.role === 'ADMIN') || false);
        // Só para de carregar DEPOIS de buscar o perfil
        setIsLoading(false);
      }
    };
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateUserState(session?.user ?? null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        updateUserState(session?.user ?? null);
      }
    );
    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependência vazia intencional para rodar só na montagem

  // signIn MODIFICADO para retornar redirectPath
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error: Error | null; redirectPath: string | null; isAdminLogin: boolean | null }> => {
    setIsLoading(true);
    let isAdminAttempt = false; // Flag para saber se veio do login admin
    try {
       // Identifica se a tentativa é da página admin (opcional, mas ajuda no debug)
       isAdminAttempt = window.location.pathname.includes('/admin/login');

      // 1. Autentica
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        return { success: false, error: signInError, redirectPath: null, isAdminLogin: isAdminAttempt };
      }

      // 2. Busca perfil/roles imediatamente
      const profile = await fetchUserProfileAndRoles(signInData.user);
      if (!profile) {
         await supabase.auth.signOut(); // Desloga se perfil falhar
         const profileError = new Error('Falha ao carregar dados do usuário após login.');
         return { success: false, error: profileError, redirectPath: null, isAdminLogin: isAdminAttempt };
      }

      // 3. Determina o role e o caminho de redirecionamento
      const currentRoles = profile.roles.map(r => r.role);
      const userIsAdmin = currentRoles.includes('ADMIN');
      const redirectPath = userIsAdmin ? '/admin/dashboard' : '/cliente/dashboard';

      // 4. Atualiza estado local (importante fazer aqui também)
      setUser(signInData.user);
      setUserProfile(profile);
      setIsAdmin(userIsAdmin);

      // 5. Retorna sucesso, roles e o caminho correto
      return { success: true, error: null, redirectPath: redirectPath, isAdminLogin: userIsAdmin }; // Retorna se o usuário É admin

    } catch (e: any) {
        return { success: false, error: e, redirectPath: null, isAdminLogin: isAdminAttempt };
    } finally {
        setIsLoading(false);
    }
  };

  // signOut (sem alterações)
  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setIsAdmin(false);
    setIsLoading(false);
  };

  const value = {
    user,
    userProfile,
    isAdmin,
    isLoading,
    signIn,
    signOut,
    setUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
