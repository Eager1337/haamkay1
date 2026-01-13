import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Lock, Eye, EyeOff, ArrowRight, Sparkles, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import FloatingDiamonds from '@/components/3d/FloatingDiamonds';

const Login = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (!password || password.length < 6) {
      toast.error('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      // Verify password using database function
      const { data: userId, error: verifyError } = await supabase
        .rpc('verify_user_password', {
          p_phone: phoneNumber,
          p_password: password
        });

      if (verifyError) throw verifyError;

      if (!userId) {
        toast.error('Invalid phone number or password');
        setIsLoading(false);
        return;
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Save to localStorage and context
      localStorage.setItem('haamkay_user_phone', profile.phone_number);
      setUser(profile);
      
      toast.success(`Welcome back, ${profile.display_name}! 🎉`);
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* 3D Background */}
      <div className="fixed inset-0 pointer-events-none">
        <FloatingDiamonds />
      </div>

      {/* Header */}
      <div className="p-6 flex items-center justify-center relative z-10">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring' }}
          className="flex items-center gap-2"
        >
          <div className="w-12 h-12 rounded-lg bg-gold flex items-center justify-center shadow-gold">
            <span className="text-teal-darker font-serif font-bold text-2xl">H</span>
          </div>
          <span className="font-serif font-bold text-2xl">Haamkay</span>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-gold"
            >
              <Sparkles className="w-12 h-12 text-teal-darker" />
            </motion.div>
            <h1 className="text-3xl font-serif font-bold mb-2">
              Welcome Back! 👋
            </h1>
            <p className="text-muted-foreground">
              Sign in to your Haamkay account
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="+232 XX XXX XXXX"
                  className="w-full bg-card/80 backdrop-blur-sm border border-border rounded-xl pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold transition-all"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-card/80 backdrop-blur-sm border border-border rounded-xl pl-12 pr-12 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>
          </div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full btn-gold py-4 flex items-center justify-center gap-2 shadow-gold"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-teal-darker border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-6 space-y-3"
          >
            <Link to="/" className="block text-sm text-muted-foreground hover:text-gold transition-colors">
              Continue as guest
            </Link>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">New to Haamkay?</span>
              <Link to="/signup" className="text-gold hover:underline flex items-center gap-1">
                <UserPlus className="w-4 h-4" />
                Create Account
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
