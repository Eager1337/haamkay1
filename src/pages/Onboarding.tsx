import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShoppingBag, Heart, Users, MessageCircle, Gift, Phone, User, ArrowRight, Check, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';

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
  const { setUser } = useUser();
  const [step, setStep] = useState(1);
  const [howFound, setHowFound] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const toggleInterest = (id: string) => {
    setInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const sendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    
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
      // In production, you'd send SMS here. For demo, we show the code
      toast.success(`Your verification code is: ${otp}`, { duration: 10000 });
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndComplete = async () => {
    if (otpCode !== generatedOtp) {
      toast.error('Invalid verification code');
      return;
    }

    setIsLoading(true);
    
    try {
      // Create user profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          phone_number: phoneNumber,
          display_name: displayName,
          how_found_us: howFound,
          shopping_interests: interests
        })
        .select()
        .single();

      if (error) throw error;

      // Mark OTP as verified
      await supabase
        .from('phone_verifications')
        .update({ verified: true })
        .eq('phone_number', phoneNumber)
        .eq('otp_code', otpCode);

      // Save to localStorage and context
      localStorage.setItem('haamkay_user_phone', phoneNumber);
      setUser(data);
      
      toast.success(`Welcome to Haamkay, ${displayName}! 🎉`);
    } catch (error: any) {
      console.error('Error completing signup:', error);
      if (error.code === '23505') {
        toast.error('This phone number is already registered');
      } else {
        toast.error('Failed to complete signup');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!howFound;
      case 2: return interests.length > 0;
      case 3: return displayName.length >= 2 && phoneNumber.length >= 8;
      case 4: return otpCode.length === 6;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 flex items-center justify-between">
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
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
            <span className="text-teal-darker font-serif font-bold text-lg">H</span>
          </div>
          <span className="font-serif font-bold text-lg">Haamkay</span>
        </div>
        
        <div className="w-9" />
      </div>

      {/* Progress */}
      <div className="px-6 mb-6">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-gold' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 md:px-6 pb-24">
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
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center"
                >
                  <Sparkles className="w-10 h-10 text-gold" />
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold mb-2">
                  Welcome to Haamkay! ✨
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  How did you discover us?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {howFoundOptions.map(option => (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setHowFound(option.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      howFound === option.id
                        ? 'border-gold bg-gold/10'
                        : 'border-border bg-card hover:border-gold/50'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{option.emoji}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </motion.button>
                ))}
              </div>
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
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center"
                >
                  <ShoppingBag className="w-10 h-10 text-gold" />
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold mb-2">
                  What interests you? 🛍️
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Select all that apply - we'll personalize your experience
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {shoppingInterests.map(item => (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleInterest(item.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left relative ${
                      interests.includes(item.id)
                        ? 'border-gold bg-gold/10'
                        : 'border-border bg-card hover:border-gold/50'
                    }`}
                  >
                    {interests.includes(item.id) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gold flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-teal-darker" />
                      </motion.div>
                    )}
                    <span className="text-2xl mb-2 block">{item.emoji}</span>
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
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center"
                >
                  <User className="w-10 h-10 text-gold" />
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold mb-2">
                  Let's get to know you! 👋
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Tell us your name and phone number
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="What should we call you?"
                      className="w-full bg-muted border border-border rounded-xl pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="+232 XX XXX XXXX"
                      className="w-full bg-muted border border-border rounded-xl pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    We'll send you a verification code
                  </p>
                </div>
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
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center"
                >
                  <MessageCircle className="w-10 h-10 text-gold" />
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
                <button
                  onClick={sendOtp}
                  disabled={isLoading}
                  className="w-full btn-gold py-4 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-teal-darker border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Phone className="w-5 h-5" />
                      Send Verification Code
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <input
                        key={i}
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
                        className="w-12 h-14 text-center text-xl font-bold bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold"
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
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <div className="max-w-md mx-auto">
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                canProceed()
                  ? 'btn-gold'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={verifyAndComplete}
              disabled={!canProceed() || isLoading}
              className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                canProceed() && !isLoading
                  ? 'btn-gold'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-teal-darker border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Complete Setup
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
