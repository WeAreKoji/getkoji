import { createContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isCreator: boolean;
  checkAuth: () => Promise<User | null>;
  signOut: () => Promise<void>;
  refreshCreatorStatus: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isCreator: false,
  checkAuth: async () => null,
  signOut: async () => {},
  refreshCreatorStatus: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);

  const checkCreatorRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "creator")
      .maybeSingle();

    setIsCreator(!!data);
  };

  const refreshCreatorStatus = async () => {
    if (user) {
      await checkCreatorRole(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer creator role check
        if (session?.user) {
          setTimeout(() => {
            checkCreatorRole(session.user.id);
          }, 0);
        } else {
          setIsCreator(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          checkCreatorRole(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async (): Promise<User | null> => {
    if (user) return user;
    
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    return currentUser;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsCreator(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isCreator,
        checkAuth,
        signOut,
        refreshCreatorStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
