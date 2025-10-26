// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'; // Adicionado useCallback
import { supabase } from '../integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Database } from '../integrations/supabase/types';

// Tipos (mantidos)
type UserProfile = Database['public']['Tables']['profiles']['Row'] & {
  roles: { role: Database['public']['Enums']['app_role'] }[];
};

// Novo tipo para o status da autenticação
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  // isLoading substituído por authStatus
  authStatus: AuthStatus;
  // signIn agora foca apenas em autenticar, o estado global é gerenciado pelo useEffect/onAuthStateChange
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: Error | null; isActualAdmin: boolean | null }>; // Retorna se o usuário É admin
  signOut: () => Promise<void>;
  setUserProfile: (profile: UserProfile | null) => void; // Para Onboarding
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading'); // Estado inicial: carregando

  // Função robusta para buscar perfil E roles
  const fetchUserProfileAndRoles = useCallback(async (currentUser: User | null): Promise<UserProfile | null> => {
    if (!currentUser) return null;
    console.log('AuthContext: Buscando perfil e roles para usuário:', currentUser.id); // Log
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, roles:user_roles!inner(role)') // Exige roles
        .eq('id', currentUser.id)
        .single();

      if (error) {
         // Log detalhado do erro
         console.error('AuthContext: Erro ao buscar perfil/roles:', error);
         // Se PGRST116 (sem roles), retorna perfil básico sem roles e loga erro crítico
         if (error.code === 'PGRST116') {
             console.error("AuthContext Erro Crítico: Perfil encontrado, mas SEM roles na tabela user_roles. Verifique o trigger 'handle_new_user'. ID:", currentUser.id);
             const { data: basicProfile } = await supabase
                .from('profiles').select('*').eq('id', currentUser.id).single();
             return basicProfile ? { ...basicProfile, roles: [] } as UserProfile : null;
         }
        // Para outros erros, retorna null
        return null;
      }
      console.log('AuthContext: Perfil e roles encontrados:', profile); // Log de sucesso
      // Garante que roles seja sempre um array
      return { ...profile, roles: profile.roles || [] } as UserProfile;
    } catch (fetchError) {
      console.error('AuthContext: Exceção na busca de perfil/roles:', fetchError);
      return null; // Falha = null
    }
  }, []); // useCallback para estabilizar a função

  // Efeito principal para gerenciar estado de autenticação
  useEffect(() => {
    let isMounted = true;
    setAuthStatus('loading'); // Sempre começa carregando ao montar ou mudar usuário

    const updateUserState = async (sessionUser: User | null) => {
       console.log('AuthContext: updateUserState chamado com sessionUser:', sessionUser?.id ?? 'null'); // Log
      // Busca o perfil associado ao usuário da sessão
      const profile = await fetchUserProfileAndRoles(sessionUser);

      if (isMounted) {
         console.log('AuthContext: Atualizando estado...'); // Log
        setUser(sessionUser);
        setUserProfile(profile);
        // Define isAdmin APENAS se o perfil foi carregado E contém o role ADMIN
        const calculatedIsAdmin = profile?.roles?.some(r => r.role === 'ADMIN') || false;
        setIsAdmin(calculatedIsAdmin);
        // Define o status final: autenticado se user e profile existem, não autenticado senão
        setAuthStatus(sessionUser && profile ? 'authenticated' : 'unauthenticated');
        console.log('AuthContext: Estado atualizado -> user:', sessionUser?.id ?? 'null', 'isAdmin:', calculatedIsAdmin, 'status:', sessionUser && profile ? 'authenticated' : 'unauthenticated'); // Log final
      }
    };

    // Assina o onAuthStateChange
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
         console.log('AuthContext: onAuthStateChange disparado, evento:', _event); // Log
        // Revalida o estado sempre que a autenticação mudar
        updateUserState(session?.user ?? null);
      }
    );

    // Verifica sessão inicial (await para garantir que termine antes de desmontar)
    supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('AuthContext: Sessão inicial verificada, user:', session?.user?.id ?? 'null'); // Log
        updateUserState(session?.user ?? null);
    });

    // Limpeza
    return () => {
      console.log('AuthContext: Desmontando e cancelando assinatura.'); // Log
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchUserProfileAndRoles]); // Depende apenas da função estável

  // signIn SIMPLIFICADO: apenas autentica, confia no onAuthStateChange para atualizar o estado global
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error: Error | null; isActualAdmin: boolean | null }> => {
    try {
      // 1. Tenta autenticar
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        return { success: false, error: signInError, isActualAdmin: null }; // Falha na autenticação
      }

      // 2. LOGO APÓS o login, faz uma busca RÁPIDA e síncrona apenas para *verificar* o role,
      //    sem atualizar o estado global aqui (onAuthStateChange fará isso).
      //    Isso é SÓ para dar a resposta correta para a página de login.
      const profileCheck = await fetchUserProfileAndRoles(signInData.user);
      const isActualAdmin = profileCheck?.roles?.some(r => r.role === 'ADMIN') || false;

      // Retorna sucesso e se o usuário é admin ou não.
      // O estado global (user, userProfile, isAdmin, authStatus) será atualizado pelo onAuthStateChange -> useEffect.
      return { success: true, error: null, isActualAdmin: isActualAdmin };

    } catch (e: any) {
        console.error("AuthContext: Exceção durante signIn:", e); // Log de exceção
        return { success: false, error: e, isActualAdmin: null };
    }
    // Não precisa de setIsLoading aqui, pois o onAuthStateChange gerencia o 'loading' global.
  };

  // signOut (sem alterações significativas, mas garante status)
  const signOut = async () => {
    setAuthStatus('loading'); // Indica transição
    await supabase.auth.signOut();
    // Limpeza explícita, embora onAuthStateChange vá disparar
    setUser(null);
    setUserProfile(null);
    setIsAdmin(false);
    setAuthStatus('unauthenticated'); // Define estado final
  };

  const value = {
    user,
    userProfile,
    isAdmin,
    authStatus, // Exporta o novo status
    signIn,
    signOut,
    setUserProfile,
  };

  // Não renderiza children enquanto o status inicial for 'loading'
  // Isso garante que o estado esteja definido antes de renderizar rotas protegidas
  if (authStatus === 'loading') {
    return (
       <div className="flex h-screen w-full items-center justify-center">
         <LoadingSpinner />
       </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
