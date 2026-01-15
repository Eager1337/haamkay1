import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShoppingBag, Heart, Users, MessageCircle, Gift, Phone, User, ArrowRight, Check, ChevronLeft, Lock, Eye, EyeOff, SkipForward } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import FloatingDiamonds from '@/components/3d/FloatingDiamonds';

const howFoundOptions = [
  { id: 'social', label: 'Social Media', icon: Users, emoji: '📱' },
  { id: 'friend', label: 'Friend Recommended', icon: Heart, emoji: '💕' },
  { id: 'search', label: 'Google Search', icon: MessageCircle, emoji: '🔍' },
  { id: 'walk_by', label: 'Walked By Store', icon: ShoppingBag, emoji: '🚶' },
  { id: 'ad', label: 'Saw an Ad', icon: Gift, emoji: '📺' },
  { id: 'other', label: 'Other', icon: Sparkles, emoji: '✨' },
];

const shoppingInterests = [
  { id: 'dresses', label: 'Dresses', emoji: '👗' },
  { id: 'shoes', label: 'Shoes', emoji: '👠' },
  { id: 'bags', label: 'Bags & Purses', emoji: '👜' },
  { id: 'jewelry', label: 'Jewelry', emoji: '💍' },
  { id: 'wedding', label: 'Wedding Items', emoji: '💒' },
  { id: 'kids', label: 'Kids Fashion', emoji: '👶' },
  { id: 'men', label: "Men's Wear", emoji: '👔' },
  { id: 'accessories', label: 'Accessories', emoji: '🎀' },
];

const Onboarding = () => {
  const { setUser, setIsGuest } = useUser();
  const [step, setStep] = useState(1);
  const [howFound, setHowFound] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const toggleInterest = (id: string) => {
    setInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSkip = () => {
    setIsGuest(true);
    toast.success('Welcome to Haamkay! 🎉', { description: 'You can create a profile anytime from the menu.' });
  };

  const sendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
      // Store OTP in database
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      const { error } = await supabase
        .from('phone_verifications')
        .insert({
          phone_number: phoneNumber,
          otp_code: otp,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      setOtpSent(true);
      // For demo - in production, send via SMS
      toast.success(`Verification code sent!`, { 
        description: `Demo: ${otp}`,
        duration: 15000 
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndComplete = async () => {
    if (otpCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    
    try {
      // Verify OTP using server-side function
      const { data: isValid, error: verifyError } = await supabase
        .rpc('verify_otp', {
          p_phone: phoneNumber,
          p_otp: otpCode
        });

      if (verifyError) throw verifyError;

      if (!isValid) {
        toast.error('Invalid or expired verification code');
        setIsLoading(false);
        return;
      }

      // Create user profile with password
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          phone_number: phoneNumber,
          display_name: displayName,
          how_found_us: howFound,
          shopping_interests: interests,
          password_hash: password // Will be hashed by trigger
        })
        .select()
        .single();

      if (error) throw error;

      // Save to localStorage and context
      localStorage.setItem('haamkay_user_phone', phoneNumber);
      setUser(data);
      
      toast.success(`Welcome to Haamkay, ${displayName}! 🎉`);
    } catch (error: any) {
      console.error('Error completing signup:', error);
      if (error.code === '23505') {
        toast.error('This phone number is already registered. Try logging in instead.');
      } else {
        toast.error('Failed to complete signup. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!howFound;
      case 2: return interests.length > 0;
      case 3: return displayName.length >= 2 && phoneNumber.length >= 8 && password.length >= 6;
      case 4: return otpCode.length === 6;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* 3D Background */}
      <div className="fixed inset-0 pointer-events-none">
        <FloatingDiamonds />
      </div>

      {/* Header */}
      <div className="p-4 md:p-6 flex items-center justify-between relative z-10">
        {step > 1 ? (
          <button 
            onClick={() => setStep(step - 1)}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-9" />
        )}
        
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="flex items-center gap-2"
        >
          <div className="w-10 h-10 rounded-lg bg-gold flex items-center justify-center shadow-gold">
            <span className="text-teal-darker font-serif font-bold text-xl">H</span>
          </div>
          <span className="font-serif font-bold text-xl">Haamkay</span>
        </motion.div>
        
        {/* Skip Button */}
        {step === 1 && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleSkip}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-gold transition-colors"
          >
            Skip
            <SkipForward className="w-4 h-4" />
          </motion.button>
        )}
        {step !== 1 && <div className="w-9" />}
      </div>

      {/* Progress */}
      <div className="px-6 mb-6 relative z-10">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(s => (
            <motion.div 
              key={s}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: s * 0.1 }}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-gold shadow-gold' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 md:px-6 pb-24 relative z-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-gold"
                >
                  <Sparkles className="w-12 h-12 text-teal-darker" />
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl md:text-3xl font-serif font-bold mb-2"
                >
                  Welcome to <span className="text-gold-gradient">Haamkay</span>! ✨
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground text-sm md:text-base"
                >
                  How did you discover us?
                </motion.p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {howFoundOptions.map((option, index) => (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setHowFound(option.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${
                      howFound === option.id
                        ? 'border-gold bg-gold/10 shadow-gold'
                        : 'border-border bg-card/80 backdrop-blur-sm hover:border-gold/50'
                    }`}
                  >
                    {howFound === option.id && (
                      <motion.div
                        layoutId="selectedOption"
                        className="absolute inset-0 bg-gradient-to-br from-gold/20 to-transparent"
                      />
                    )}
                    <span className="text-3xl mb-2 block">{option.emoji}</span>
                    <span className="text-sm font-medium relative z-10">{option.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Already have account link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center mt-8"
              >
                <Link to="/login" className="text-sm text-gold hover:underline">
                  Already have an account? Log in
                </Link>
              </motion.div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-gold"
                >
                  <ShoppingBag className="w-12 h-12 text-teal-darker" />
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold mb-2">
                  What interests you? 🛍️
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Select all that apply - we'll personalize your experience
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {shoppingInterests.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleInterest(item.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${
                      interests.includes(item.id)
                        ? 'border-gold bg-gold/10 shadow-gold'
                        : 'border-border bg-card/80 backdrop-blur-sm hover:border-gold/50'
                    }`}
                  >
                    {interests.includes(item.id) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gold flex items-center justify-center shadow-gold"
                      >
                        <Check className="w-4 h-4 text-teal-darker" />
                      </motion.div>
                    )}
                    <span className="text-3xl mb-2 block">{item.emoji}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-gold"
                >
                  <User className="w-12 h-12 text-teal-darker" />
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold mb-2">
                  Create your account 👋
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Set up your profile to start shopping
                </p>
              </div>

              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-medium mb-2">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="What should we call you?"
                      className="w-full bg-card/80 backdrop-blur-sm border border-border rounded-xl pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold transition-all"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password"
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
                  <p className="text-xs text-muted-foreground mt-2">
                    At least 6 characters
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-gold"
                >
                  <MessageCircle className="w-12 h-12 text-teal-darker" />
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold mb-2">
                  Verify your number 📱
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  {otpSent 
                    ? `Enter the 6-digit code sent to ${phoneNumber}`
                    : 'Click below to receive your verification code'
                  }
                </p>
              </div>

              {!otpSent ? (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={sendOtp}
                  disabled={isLoading}
                  className="w-full btn-gold py-4 flex items-center justify-center gap-2 shadow-gold"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-teal-darker border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Phone className="w-5 h-5" />
                      Send Verification Code
                    </>
                  )}
                </motion.button>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <motion.input
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        type="text"
                        maxLength={1}
                        value={otpCode[i] || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const newOtp = otpCode.split('');
                          newOtp[i] = val;
                          setOtpCode(newOtp.join(''));
                          if (val && e.target.nextElementSibling) {
                            (e.target.nextElementSibling as HTMLInputElement).focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otpCode[i] && e.currentTarget.previousElementSibling) {
                            (e.currentTarget.previousElementSibling as HTMLInputElement).focus();
                          }
                        }}
                        className="w-12 h-14 text-center text-xl font-bold bg-card/80 backdrop-blur-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold transition-all"
                      />
                    ))}
                  </div>
                  
                  <button
                    onClick={sendOtp}
                    className="text-sm text-gold hover:underline mx-auto block"
                  >
                    Didn't receive code? Resend
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-20">
        <div className="max-w-md mx-auto">
          {step < 4 ? (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                canProceed()
                  ? 'btn-gold shadow-gold'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={verifyAndComplete}
              disabled={!canProceed() || isLoading}
              className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                canProceed() && !isLoading
                  ? 'btn-gold shadow-gold'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-teal-darker border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Complete Setup
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;