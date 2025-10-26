// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Database } from '../integrations/supabase/types'; // Certifique-se que este tipo está atualizado!

// Tipo UserProfile ajustado para garantir que 'roles' sempre exista (pode ser array vazio)
type UserProfile = Database['public']['Tables']['profiles']['Row'] & {
  roles: { role: Database['public']['Enums']['app_role'] }[]; // Usando o Enum do DB se disponível
};

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  // A função signIn agora retorna um objeto mais detalhado
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: Error | null; roles: string[] }>;
  signOut: () => Promise<void>;
  setUserProfile: (profile: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Começa como true

  // Função interna para buscar perfil E roles
  const fetchUserProfileAndRoles = async (currentUser: User | null): Promise<UserProfile | null> => {
    if (!currentUser) return null;
    try {
      // Busca perfil E faz join com user_roles para pegar os roles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, roles:user_roles!inner(role)') // Usa !inner para garantir que user_roles exista
        .eq('id', currentUser.id)
        .single(); // Espera um único resultado

      if (error) {
        // Se o erro for PGRST116, significa que o perfil existe mas não tem role (erro no trigger?)
        if (error.code === 'PGRST116') {
           console.error("Erro Crítico: Perfil encontrado, mas sem roles na tabela user_roles. Verifique o trigger 'handle_new_user'.", currentUser.id);
           // Tenta buscar só o perfil como fallback, mas sem roles
           const { data: basicProfile, error: basicError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .single();
           if (basicError) throw basicError;
           return { ...basicProfile, roles: [] } as UserProfile; // Retorna com roles vazios
        }
        throw error; // Relança outros erros
      }
      // Garante que roles seja sempre um array
      return { ...profile, roles: profile.roles || [] } as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile and roles:', error);
      return null; // Retorna null se houver erro
    }
  };

  // Efeito principal para gerenciar estado de autenticação
  useEffect(() => {
    let isMounted = true; // Flag para evitar updates após desmontar

    const updateUserState = async (sessionUser: User | null) => {
      setIsLoading(true);
      const profile = await fetchUserProfileAndRoles(sessionUser);

      if (isMounted) {
        setUser(sessionUser);
        setUserProfile(profile);
        setIsAdmin(profile?.roles?.some(r => r.role === 'ADMIN') || false);
        setIsLoading(false);
      }
    };

    // Verifica sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateUserState(session?.user ?? null);
    });

    // Ouve mudanças (login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Atualiza estado baseado na nova sessão
        updateUserState(session?.user ?? null);
      }
    );

    // Limpeza ao desmontar
    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []); // Executa apenas uma vez na montagem

  // Função signIn aprimorada
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error: Error | null; roles: string[] }> => {
    setIsLoading(true); // Indica início do processo
    try {
      // 1. Tenta autenticar o usuário
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        // Se houver erro na autenticação (email/senha errados), retorna falha
        return { success: false, error: signInError, roles: [] };
      }

      // 2. Se autenticou, busca o perfil e roles imediatamente (onAuthStateChange pode demorar)
      const profile = await fetchUserProfileAndRoles(signInData.user);
      if (!profile) {
         // Se não encontrou perfil/roles após login (problema grave!), desloga e retorna erro
         await supabase.auth.signOut();
         const profileError = new Error('Falha ao carregar dados do usuário após login.');
         return { success: false, error: profileError, roles: [] };
      }

      // 3. Atualiza o estado local imediatamente (embora onAuthStateChange vá disparar também)
      //    Isso garante que 'isAdmin' e 'userProfile' estejam corretos para o redirecionamento
      const currentRoles = profile.roles.map(r => r.role);
      setUser(signInData.user); // Atualiza user
      setUserProfile(profile); // Atualiza profile
      setIsAdmin(currentRoles.includes('ADMIN')); // Atualiza isAdmin

      // 4. Retorna sucesso com os roles encontrados
      return { success: true, error: null, roles: currentRoles };

    } catch (e: any) {
        // Captura qualquer outro erro inesperado
        return { success: false, error: e, roles: [] };
    } finally {
        setIsLoading(false); // Garante que loading termine
    }
  };

  // Função signOut
  const signOut = async () => {
    setIsLoading(true); // Indica início
    await supabase.auth.signOut();
    // Limpa estado local (onAuthStateChange também fará isso, mas garantimos aqui)
    setUser(null);
    setUserProfile(null);
    setIsAdmin(false);
    setIsLoading(false); // Indica fim
  };

  // Valor fornecido pelo contexto
  const value = {
    user,
    userProfile,
    isAdmin,
    isLoading,
    signIn,
    signOut,
    setUserProfile, // Necessário para o Onboarding
  };

  // Renderiza children apenas se não estiver carregando (opcional, ProtectedRoute já faz isso)
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
