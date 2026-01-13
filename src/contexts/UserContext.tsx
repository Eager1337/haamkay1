import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  phone_number: string;
  display_name: string;
  how_found_us: string | null;
  shopping_interests: string[] | null;
  avatar_url: string | null;
}

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isOnboarded: boolean;
  isGuest: boolean;
  setUser: (user: UserProfile | null) => void;
  setIsGuest: (isGuest: boolean) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuestState] = useState(false);

  useEffect(() => {
    // Check localStorage for existing user or guest status
    const storedPhone = localStorage.getItem('haamkay_user_phone');
    const guestStatus = localStorage.getItem('haamkay_is_guest');
    
    if (storedPhone) {
      fetchUserProfile(storedPhone);
    } else if (guestStatus === 'true') {
      setIsGuestState(true);
      setIsLoading(false);
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
        setUser(data as UserProfile);
      } else {
        localStorage.removeItem('haamkay_user_phone');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setIsGuest = (guest: boolean) => {
    setIsGuestState(guest);
    if (guest) {
      localStorage.setItem('haamkay_is_guest', 'true');
    } else {
      localStorage.removeItem('haamkay_is_guest');
    }
  };

  const logout = () => {
    localStorage.removeItem('haamkay_user_phone');
    localStorage.removeItem('haamkay_is_guest');
    setUser(null);
    setIsGuestState(false);
  };

  return (
    <UserContext.Provider value={{
      user,
      isLoading,
      isOnboarded: !!user || isGuest,
      isGuest,
      setUser: (userData) => setUser(userData as UserProfile | null),
      setIsGuest,
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
