import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  phone_number: string;
  display_name: string;
  how_found_us: string | null;
  shopping_interests: string[] | null;
}

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isOnboarded: boolean;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing user
    const storedPhone = localStorage.getItem('haamkay_user_phone');
    if (storedPhone) {
      fetchUserProfile(storedPhone);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async (phone: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('phone_number', phone)
        .maybeSingle();

      if (data && !error) {
        setUser(data);
      } else {
        localStorage.removeItem('haamkay_user_phone');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('haamkay_user_phone');
    setUser(null);
  };

  return (
    <UserContext.Provider value={{
      user,
      isLoading,
      isOnboarded: !!user,
      setUser,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
