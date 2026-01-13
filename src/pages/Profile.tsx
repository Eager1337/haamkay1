import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, User, Phone, Heart, LogOut, ChevronLeft, Save, Loader2, Edit2, ShoppingBag, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

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

const Profile = () => {
  const { user, setUser, logout } = useUser();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [interests, setInterests] = useState<string[]>(user?.shopping_interests || []);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  const toggleInterest = (id: string) => {
    setInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('product-media')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-media')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setUser({ ...user, avatar_url: publicUrl });
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (displayName.length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          display_name: displayName,
          shopping_interests: interests
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 md:pt-40 pb-20">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <User className="w-12 h-12 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-serif font-bold mb-4">No Profile Found</h1>
              <p className="text-muted-foreground mb-6">Create an account to access your profile</p>
              <Link to="/signup" className="btn-gold inline-flex items-center gap-2">
                Create Account
              </Link>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 md:pt-40 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </motion.div>

          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-6 md:p-8 border border-border mb-6"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-gold">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={displayName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl md:text-5xl font-serif font-bold text-teal-darker">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gold text-teal-darker flex items-center justify-center shadow-lg hover:bg-gold-light transition-colors"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </motion.button>
              </div>

              {/* Info */}
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="text-2xl font-serif font-bold bg-muted border border-border rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  ) : (
                    <h1 className="text-2xl md:text-3xl font-serif font-bold">{user.display_name}</h1>
                  )}
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-muted-foreground hover:text-gold transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone_number}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Shopping Interests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-6 md:p-8 border border-border mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-serif font-bold">Shopping Interests</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {shoppingInterests.map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={isEditing ? { scale: 1.02 } : {}}
                  whileTap={isEditing ? { scale: 0.98 } : {}}
                  onClick={() => isEditing && toggleInterest(item.id)}
                  disabled={!isEditing}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    interests.includes(item.id)
                      ? 'border-gold bg-gold/10'
                      : 'border-border bg-muted/50'
                  } ${isEditing ? 'cursor-pointer hover:border-gold/50' : 'cursor-default'}`}
                >
                  <span className="text-2xl block mb-1">{item.emoji}</span>
                  <span className="text-xs font-medium">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-4 mb-6"
          >
            <Link
              to="/cart"
              className="bg-card rounded-xl p-4 border border-border hover:border-gold/50 transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-medium">My Cart</p>
                <p className="text-xs text-muted-foreground">View items</p>
              </div>
            </Link>
            
            <Link
              to="/categories"
              className="bg-card rounded-xl p-4 border border-border hover:border-gold/50 transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                <Settings className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-medium">Browse</p>
                <p className="text-xs text-muted-foreground">Shop categories</p>
              </div>
            </Link>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            {isEditing && (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setDisplayName(user.display_name);
                    setInterests(user.shopping_interests || []);
                  }}
                  className="flex-1 py-3 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 btn-gold py-3 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
