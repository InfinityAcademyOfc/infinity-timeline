// src/contexts/AuthContext.tsx (CORRIGIDO para estrutura original)
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { User } from '@supabase/supabase-js';
// Garanta que seus tipos TS estejam sincronizados com o DB, especialmente app_role
import { Database } from '../integrations/supabase/types';

type UserProfile = Database['public']['Tables']['profiles']['Row'] & {
  roles: { role: Database['public']['Enums']['app_role'] }[]; // Usa Enum se type.ts estiver atualizado
};
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  authStatus: AuthStatus;
  // signIn retorna roles para AuthPage decidir
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: Error | null; roles: string[] }>;
  signOut: () => Promise<void>;
  setUserProfile: (profile: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  // Função robusta para buscar perfil E roles
  const fetchUserProfileAndRoles = useCallback(async (currentUser: User | null): Promise<UserProfile | null> => {
    if (!currentUser) return null;
    console.log('[AuthContext] Buscando perfil/roles para:', currentUser.id);
    try {
      // Tenta buscar perfil JUNTO com roles da tabela user_roles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, roles:user_roles!inner(role)') // !inner garante que SÓ retorne se tiver role em user_roles
        .eq('id', currentUser.id)
        .single();

      if (error) {
         console.error('[AuthContext] Erro ao buscar perfil/roles:', error);
         // Se o erro for PGRST116 (sem roles), loga erro crítico mas tenta retornar perfil básico
         if (error.code === 'PGRST116') {
             console.error("[AuthContext] ERRO CRÍTICO: Usuário autenticado mas sem entrada correspondente na tabela 'user_roles'. Verifique o trigger 'handle_new_user' no Supabase. ID:", currentUser.id);
             // Tenta buscar só o perfil como fallback
             const { data: basicProfile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
             // Retorna perfil básico COM roles VAZIO - importante para isAdmin ser false
             return basicProfile ? { ...basicProfile, roles: [] } as UserProfile : null;
         }
        return null; // Retorna null para outros erros
      }
      console.log('[AuthContext] Perfil/roles encontrados:', profile);
      // Garante que roles seja sempre um array
      return { ...profile, roles: profile.roles || [] } as UserProfile;
    } catch (fetchError) {
      console.error('[AuthContext] Exceção em fetchUserProfileAndRoles:', fetchError);
      return null;
    }
  }, []);

  // Efeito principal que reage a mudanças de autenticação
  useEffect(() => {
    let isMounted = true;
    // Define como loading sempre que o efeito roda (montagem inicial ou mudança de usuário)
    setAuthStatus('loading');
    console.log('[AuthContext] useEffect: Iniciando verificação de estado.');

    const updateUserState = async (sessionUser: User | null) => {
       console.log('[AuthContext] updateUserState chamado com user ID:', sessionUser?.id ?? 'null');
      // Busca o perfil + roles associado ao usuário da sessão ATUAL
      const profile = await fetchUserProfileAndRoles(sessionUser);

      // SÓ atualiza o estado se o componente ainda estiver montado
      if (isMounted) {
         console.log('[AuthContext] Atualizando estado global...');
        setUser(sessionUser); // Atualiza usuário (pode ser null)
        setUserProfile(profile); // Atualiza perfil (pode ser null)
        // Calcula isAdmin SÓ E SOMENTE SÓ se o perfil foi carregado E tem role 'ADMIN'
        const calculatedIsAdmin = profile?.roles?.some(r => r.role === 'ADMIN') || false;
        setIsAdmin(calculatedIsAdmin);
        // Define o status final baseado na presença de user E profile
        const finalStatus = sessionUser && profile ? 'authenticated' : 'unauthenticated';
        setAuthStatus(finalStatus);
        console.log(`[AuthContext] Estado final: Status=${finalStatus}, User=${sessionUser?.id ?? 'null'}, isAdmin=${calculatedIsAdmin}`);
      }
    };

    // Assina o listener do Supabase Auth
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
         console.log(`[AuthContext] onAuthStateChange disparado: Evento=${_event}, User=${session?.user?.id ?? 'null'}`);
        // SEMPRE revalida o estado inteiro quando auth muda
        updateUserState(session?.user ?? null);
      }
    );

    // Verifica a sessão inicial UMA VEZ ao montar
    supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('[AuthContext] Verificação de sessão inicial concluída. User:', session?.user?.id ?? 'null');
        // Chama updateUserState para definir o estado inicial (loading -> authenticated/unauthenticated)
        // Isso garante que o estado inicial esteja correto antes do primeiro render útil
        updateUserState(session?.user ?? null);
    });

    // Função de limpeza
    return () => {
      console.log('[AuthContext] Desmontando.');
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchUserProfileAndRoles]); // Depende apenas da função estável

  // Função signIn - AUTENTICA e retorna os ROLES para a página de login decidir
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error: Error | null; roles: string[] }> => {
     // Não gerencia isLoading/authStatus aqui, o useEffect/onAuthStateChange cuidam disso
     console.log('[AuthContext] signIn chamado para:', email);
     try {
       // 1. Tenta autenticar via Supabase
       const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
       if (signInError) {
         console.error('[AuthContext] Erro na autenticação Supabase:', signInError.message);
         return { success: false, error: signInError, roles: [] };
       }
       console.log('[AuthContext] Autenticação Supabase OK para:', signInData.user?.id);

       // 2. Busca perfil/roles IMEDIATAMENTE após autenticar (SÓ para retornar à AuthPage)
       const profileCheck = await fetchUserProfileAndRoles(signInData.user);
       if (!profileCheck) {
           console.error('[AuthContext] ERRO PÓS-LOGIN: Perfil/Roles não encontrados. Deslogando usuário.');
           await supabase.auth.signOut(); // Desloga imediatamente se não encontrar perfil/roles
           return { success: false, error: new Error('Falha ao carregar dados do usuário após login.'), roles: [] };
       }
       const currentRoles = profileCheck.roles.map(r => r.role);
       console.log('[AuthContext] Verificação de roles pós-login OK. Roles:', currentRoles);

       // 3. Retorna sucesso e os roles encontrados. O estado global será atualizado pelo onAuthStateChange -> useEffect.
       return { success: true, error: null, roles: currentRoles };

     } catch (e: any) {
         console.error("[AuthContext] Exceção durante signIn:", e);
         return { success: false, error: e, roles: [] };
     }
  };

  // Função signOut
  const signOut = async () => {
    console.log('[AuthContext] signOut chamado.');
    setAuthStatus('loading'); // Indica transição
    await supabase.auth.signOut();
    // Limpeza explícita, embora onAuthStateChange vá disparar e chamar updateUserState(null)
    setUser(null);
    setUserProfile(null);
    setIsAdmin(false);
    setAuthStatus('unauthenticated');
    console.log('[AuthContext] signOut concluído.');
  };

  const value = { user, userProfile, isAdmin, authStatus, signIn, signOut, setUserProfile };

  // Mostra um estado de carregamento global enquanto o status inicial é 'loading'
  // Isso impede que ProtectedRoute tome decisões com estado incompleto
  if (authStatus === 'loading') {
    console.log('[AuthContext] Estado global = loading. Renderizando spinner global.');
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background"> {/* Fundo para tema */}
          {/* Use seu componente LoadingSpinner aqui */}
         <p>Carregando Aplicação...</p>
       </div>
    );
  }

  // Renderiza a aplicação normal quando o estado estiver definido ('authenticated' ou 'unauthenticated')
  console.log('[AuthContext] Estado definido. Renderizando children.');
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook useAuth (sem alterações)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  return context;
};
