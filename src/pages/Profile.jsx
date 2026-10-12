import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/lib/NotificationContext";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { User, Mail, Trash2, LogOut, ShieldCheck, Package, Camera, Loader2, MapPin, Phone, Pencil, Lock, Calendar, Clock, CheckCircle, XCircle, Heart, X, Shield, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import TwoFactorAuth from "@/components/TwoFactorAuth";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    phone: "",
    address: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const { sendLocalNotification, resetNotifications } = useNotifications();

  useEffect(() => {
    if (!user) return;
    
    // Load profile data
    const loadProfileData = async () => {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setUserRole(profileData.role || 'user');
          if (profileData.avatar_url) {
            setProfileImage(profileData.avatar_url);
            setImagePreview(profileData.avatar_url);
          }
          setProfileData({
            full_name: profileData.full_name || user.user_metadata?.full_name || user.user_metadata?.display_name || "",
            phone: profileData.phone || "",
            address: profileData.address || "",
          });
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    const loadOrders = async () => {
      console.log('Loading orders for user ID:', user.id);
      
      // Load user's orders by user_id OR customer_email (for backward compatibility)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
        .order('created_date', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error loading orders:', error);
      } else {
        console.log('User orders loaded:', data);
        setOrders(data || []);
      }
    };

    const loadWishlist = async () => {
      const { data, error } = await supabase
        .from('wishlist')
        .select('*, products(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) console.error('Error loading wishlist:', error);
      else setWishlist(data || []);
      setLoading(false);
    };
    
    loadProfileData();
    loadOrders();
    loadWishlist();
  }, [user]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Mark user as deleted in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (profileError) {
        console.error('Error marking profile as deleted:', profileError);
        throw profileError;
      }

      // Delete user's wishlist
      await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id);

      // Delete user's 2FA data
      await supabase
        .from('user_2fa')
        .delete()
        .eq('user_id', user.id);

      // Sign out the user
      await logout();
      
      toast.success('Account deleted successfully');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again.');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setProfileImage(publicUrl);
      setImagePreview(publicUrl);
      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload profile image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      // Remove from storage if it exists
      if (profileImage) {
        const fileName = profileImage.split('/').pop();
        const { error: deleteError } = await supabase.storage
          .from('profile-images')
          .remove([`profile-images/${fileName}`]);
        
        if (deleteError) {
          console.error('Error removing from storage:', deleteError);
        }
      }

      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setProfileImage(null);
      setImagePreview(null);
      toast.success('Profile image removed');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove profile image');
    }
  };

  const handleUpdateProfile = async () => {
    setEditingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          address: profileData.address,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      setEditProfileOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setEditingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success('Password changed successfully');
      setPasswordDialogOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const getOrderStatus = (status) => {
    const statusMap = {
      paid: { label: 'Paid', color: 'text-green-500', icon: CheckCircle },
      pending: { label: 'Pending', color: 'text-yellow-500', icon: Clock },
      processing: { label: 'Processing', color: 'text-blue-500', icon: Clock },
      shipped: { label: 'Shipped', color: 'text-purple-500', icon: CheckCircle },
      delivered: { label: 'Delivered', color: 'text-green-500', icon: CheckCircle },
      cancelled: { label: 'Cancelled', color: 'text-red-500', icon: XCircle },
    };
    return statusMap[status] || { label: status, color: 'text-gray-500', icon: Clock };
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      
      setWishlist(wishlist.filter(item => item.product_id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <p className="text-[#0A3D2E]/60 dark:text-white/60 mb-4 sm:mb-6 text-sm sm:text-base">Sign in to view your profile.</p>
        <Link to="/login">
          <Button className="bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold rounded-xl w-full sm:w-auto text-sm sm:text-base h-10 sm:h-12">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 pb-28 md:pb-12">
      <div className="mb-8 sm:mb-10">
        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-[#0A3D2E] dark:text-white mb-2">My Profile</h1>
        <p className="text-[#0A3D2E]/60 dark:text-white/60 text-sm sm:text-base">Manage your account settings and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-white to-[#F8FAF5] dark:from-[#071f15] dark:to-[#051510] border border-[#E2F1E7] dark:border-[#22C55E]/10 rounded-3xl p-6 sm:p-8 mb-8 shadow-lg dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#22C55E]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#22C55E]/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
        
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-[#22C55E]/20 group-hover:ring-[#22C55E]/40 transition-all duration-300">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#22C55E]/20 to-[#22C55E]/10 flex items-center justify-center">
                    <User className="w-10 h-10 sm:w-12 sm:h-12 text-[#22C55E]" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#22C55E] rounded-full flex items-center justify-center text-white hover:bg-[#16a34a] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110"
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#0A3D2E] dark:text-white mb-1">
                {profileData.full_name || user.email?.split('@')[0] || "User"}
              </h2>
              <p className="text-sm sm:text-base text-[#0A3D2E]/60 dark:text-white/60 flex items-center justify-center sm:justify-start gap-2 mb-3">
                <Mail className="w-4 h-4" /> {user.email}
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22C55E]/10 text-[#22C55E] text-xs sm:text-sm font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {user.role || "member"}
                </span>
                {profileData.phone && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2F1E7] dark:bg-[#22C55E]/10 text-[#0A3D2E] dark:text-white/80 text-xs sm:text-sm">
                    <Phone className="w-3.5 h-3.5" />
                    {profileData.phone}
                  </span>
                )}
              </div>
            </div>
            
            {profileImage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveImage}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm"
              >
                Remove
              </Button>
            )}
          </div>
          
          {profileData.address && (
            <div className="flex items-start gap-3 p-4 bg-[#F8FAF5] dark:bg-[#051510] rounded-xl mb-6">
              <MapPin className="w-5 h-5 text-[#22C55E] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-[#0A3D2E]/60 dark:text-white/60 mb-1">Address</p>
                <p className="text-sm text-[#0A3D2E] dark:text-white">{profileData.address}</p>
              </div>
            </div>
          )}
          
          <Button
            variant="outline"
            onClick={() => setEditProfileOpen(true)}
            className="w-full border-[#0A3D2E]/20 text-[#0A3D2E] dark:border-white/10 dark:text-white dark:hover:bg-white/5 rounded-xl h-12 font-medium hover:border-[#22C55E] hover:bg-[#22C55E]/5 hover:text-[#22C55E] hover:shadow-md hover:shadow-[#22C55E]/10 hover:scale-[1.02] transition-all duration-300"
          >
            <Pencil className="w-4 h-4 mr-2" /> Edit Profile
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-[#071f15] border border-[#E2F1E7] dark:border-[#22C55E]/10 rounded-2xl p-5 hover:shadow-lg dark:hover:shadow-none transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-[#22C55E]" />
            </div>
            <span className="text-2xl font-bold text-[#0A3D2E] dark:text-white">{orders.length}</span>
          </div>
          <p className="text-sm text-[#0A3D2E]/60 dark:text-white/60">Total Orders</p>
        </div>
        
        <div className="bg-white dark:bg-[#071f15] border border-[#E2F1E7] dark:border-[#22C55E]/10 rounded-2xl p-5 hover:shadow-lg dark:hover:shadow-none transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-2xl font-bold text-[#0A3D2E] dark:text-white">{wishlist.length}</span>
          </div>
          <p className="text-sm text-[#0A3D2E]/60 dark:text-white/60">Wishlist Items</p>
        </div>
        
        <div className="bg-white dark:bg-[#071f15] border border-[#E2F1E7] dark:border-[#22C55E]/10 rounded-2xl p-5 hover:shadow-lg dark:hover:shadow-none transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-2xl font-bold text-[#0A3D2E] dark:text-white">
              {user.email ? "Active" : "Guest"}
            </span>
          </div>
          <p className="text-sm text-[#0A3D2E]/60 dark:text-white/60">Account Status</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-[#071f15] border border-[#E2F1E7] dark:border-[#22C55E]/10 rounded-3xl p-6 sm:p-8 mb-8 shadow-lg dark:shadow-none">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-semibold text-lg sm:text-xl text-[#0A3D2E] dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-[#22C55E]" /> Recent Orders
          </h2>
          <Link to="/orders" className="text-sm text-[#22C55E] hover:text-[#16a34a] font-medium">
            View All
          </Link>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#22C55E] animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#22C55E]/10 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-[#22C55E]" />
            </div>
            <p className="text-[#0A3D2E]/60 dark:text-white/60 text-sm">No orders yet. Start shopping!</p>
            <Link to="/shop" className="inline-block mt-4 text-[#22C55E] hover:text-[#16a34a] font-medium text-sm">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((o) => {
              const status = getOrderStatus(o.status);
              const StatusIcon = status.icon;
              return (
                <Link
                  key={o.id}
                  to={`/order/${o.id}`}
                  className="block group"
                >
                  <div className="border border-[#E2F1E7] dark:border-[#22C55E]/10 rounded-xl px-4 py-4 hover:border-[#22C55E]/30 hover:bg-[#22C55E]/5 transition-all duration-300 group-hover:shadow-md dark:group-hover:shadow-none">
                    <div className="flex items-center justify-between mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0A3D2E] dark:text-white mb-1">
                          {o.items?.length || 0} item(s)
                        </p>
                        <p className="text-xs text-[#0A3D2E]/40 dark:text-white/40 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(o.created_date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <span className="font-heading font-bold text-lg text-[#0A3D2E] dark:text-white flex-shrink-0">
                        ₦{o.total?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${status.color.replace('text-', 'bg-')}`}></div>
                      <span className={`text-sm font-medium ${status.color} capitalize`}>{status.label}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Wishlist */}
      <div className="bg-white dark:bg-[#071f15] border border-[#E2F1E7] dark:border-[#22C55E]/10 rounded-3xl p-6 sm:p-8 mb-8 shadow-lg dark:shadow-none">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-semibold text-lg sm:text-xl text-[#0A3D2E] dark:text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" /> Wishlist
          </h2>
          <span className="text-sm text-[#0A3D2E]/60 dark:text-white/60">
            {wishlist.length} items
          </span>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#22C55E] animate-spin" />
          </div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-[#0A3D2E]/60 dark:text-white/60 text-sm">Your wishlist is empty</p>
            <Link to="/shop" className="inline-block mt-4 text-[#22C55E] hover:text-[#16a34a] font-medium text-sm">
              Discover Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {wishlist.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 border border-[#E2F1E7] dark:border-[#22C55E]/10 rounded-xl hover:border-[#22C55E]/30 hover:bg-[#22C55E]/5 transition-all duration-300 group"
              >
                {item.products?.images && item.products.images.length > 0 ? (
                  <img
                    src={item.products.images[0]}
                    alt={item.products.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-[#22C55E]/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-[#22C55E]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.product_id}`}
                    className="text-sm font-medium text-[#0A3D2E] dark:text-white hover:text-[#22C55E] transition-colors truncate block mb-1"
                  >
                    {item.products?.name || "Unknown Product"}
                  </Link>
                  <p className="text-sm font-semibold text-[#22C55E]">
                    ₦{item.products?.price?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveFromWishlist(item.product_id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all duration-300 flex-shrink-0 hover:scale-110"
                  title="Remove from wishlist"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white dark:bg-[#071f15] border border-[#E2F1E7] dark:border-[#22C55E]/10 rounded-3xl p-6 sm:p-8 shadow-lg dark:shadow-none">
        <h2 className="font-heading font-semibold text-lg sm:text-xl text-[#0A3D2E] dark:text-white mb-6">Account Settings</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {userRole === 'admin' && (
            <Button
              asChild
              variant="outline"
              className="border-[#22C55E]/30 text-[#22C55E] dark:border-[#22C55E]/30 dark:text-[#22C55E] dark:hover:bg-[#22C55E]/10 rounded-xl h-12 font-medium hover:border-[#22C55E] hover:bg-[#22C55E]/10 hover:shadow-md hover:shadow-[#22C55E]/20 hover:scale-[1.02] transition-all duration-300 justify-start"
            >
              <Link to="/admin">
                <ShieldCheck className="w-4 h-4 mr-3" /> Admin Dashboard
              </Link>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => resetNotifications()}
            className="border-red-500/20 text-red-500 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10 rounded-xl h-12 font-medium hover:border-red-500 hover:bg-red-500/5 hover:text-red-500 hover:shadow-md hover:shadow-red-500/10 hover:scale-[1.02] transition-all duration-300 justify-start"
          >
            <X className="w-4 h-4 mr-3" /> Reset Notifications
          </Button>

          <Button
            variant="outline"
            onClick={() => setTwoFactorOpen(true)}
            className="border-[#0A3D2E]/20 text-[#0A3D2E] dark:border-white/10 dark:text-white dark:hover:bg-white/5 rounded-xl h-12 font-medium hover:border-[#22C55E] hover:bg-[#22C55E]/5 hover:text-[#22C55E] hover:shadow-md hover:shadow-[#22C55E]/10 hover:scale-[1.02] transition-all duration-300 justify-start"
          >
            <Shield className="w-4 h-4 mr-3" /> Two-Factor Auth
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setPasswordDialogOpen(true)}
            className="border-[#0A3D2E]/20 text-[#0A3D2E] dark:border-white/10 dark:text-white dark:hover:bg-white/5 rounded-xl h-12 font-medium hover:border-[#22C55E] hover:bg-[#22C55E]/5 hover:text-[#22C55E] hover:shadow-md hover:shadow-[#22C55E]/10 hover:scale-[1.02] transition-all duration-300 justify-start"
          >
            <Lock className="w-4 h-4 mr-3" /> Change Password
          </Button>
          
          <Button
            variant="outline"
            onClick={() => logout()}
            className="border-[#0A3D2E]/20 text-[#0A3D2E] dark:border-white/10 dark:text-white dark:hover:bg-white/5 rounded-xl h-12 font-medium hover:border-orange-500 hover:bg-orange-500/5 hover:text-orange-500 hover:shadow-md hover:shadow-orange-500/10 hover:scale-[1.02] transition-all duration-300 justify-start"
          >
            <LogOut className="w-4 h-4 mr-3" /> Sign Out
          </Button>
          
          <Button
            onClick={() => setConfirmOpen(true)}
            className="bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl h-12 font-medium hover:border-red-500 hover:shadow-md hover:shadow-red-500/20 hover:scale-[1.02] transition-all duration-300 justify-start"
          >
            <Trash2 className="w-4 h-4 mr-3" /> Delete Account
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-white dark:bg-[#071f15] border-[#E2F1E7] dark:border-[#22C55E]/10 mx-4 sm:mx-auto max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#0A3D2E] dark:text-white text-lg sm:text-xl">Delete your account?</DialogTitle>
            <DialogDescription className="text-[#0A3D2E]/60 dark:text-white/60 text-sm sm:text-base">
              This action is permanent and cannot be undone. Your session will be cleared.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="rounded-xl select-none w-full sm:w-auto text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 text-white hover:bg-red-600 rounded-xl select-none w-full sm:w-auto text-sm sm:text-base"
            >
              {deleting ? "Deleting…" : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="bg-white dark:bg-[#071f15] border-[#E2F1E7] dark:border-[#22C55E]/10 mx-4 sm:mx-auto max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0A3D2E] dark:text-white text-lg sm:text-xl">Edit Profile</DialogTitle>
            <DialogDescription className="text-[#0A3D2E]/60 dark:text-white/60 text-sm sm:text-base">
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#0A3D2E] dark:text-white/70 mb-2">
                <User className="w-4 h-4" />
                Full Name
              </label>
              <input
                type="text"
                value={profileData.full_name}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#F8FAF5] dark:bg-[#051510] border border-[#E2F1E7] dark:border-[#22C55E]/10 text-[#0A3D2E] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder-[#0A3D2E]/30 dark:placeholder-white/30"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#0A3D2E] dark:text-white/70 mb-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="Enter your phone number"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#F8FAF5] dark:bg-[#051510] border border-[#E2F1E7] dark:border-[#22C55E]/10 text-[#0A3D2E] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder-[#0A3D2E]/30 dark:placeholder-white/30"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#0A3D2E] dark:text-white/70 mb-2">
                <MapPin className="w-4 h-4" />
                Address
              </label>
              <textarea
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                placeholder="Enter your address"
                rows={3}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#F8FAF5] dark:bg-[#051510] border border-[#E2F1E7] dark:border-[#22C55E]/10 text-[#0A3D2E] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder-[#0A3D2E]/30 dark:placeholder-white/30 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setEditProfileOpen(false)}
              className="rounded-xl select-none w-full sm:w-auto text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={editingProfile}
              className="bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] rounded-xl select-none w-full sm:w-auto text-sm sm:text-base"
            >
              {editingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="bg-white dark:bg-[#071f15] border-[#E2F1E7] dark:border-[#22C55E]/10 mx-4 sm:mx-auto max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0A3D2E] dark:text-white text-lg sm:text-xl">Change Password</DialogTitle>
            <DialogDescription className="text-[#0A3D2E]/60 dark:text-white/60 text-sm sm:text-base">
              Update your account password
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#0A3D2E] dark:text-white/70 mb-2">
                <Lock className="w-4 h-4" />
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#F8FAF5] dark:bg-[#051510] border border-[#E2F1E7] dark:border-[#22C55E]/10 text-[#0A3D2E] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder-[#0A3D2E]/30 dark:placeholder-white/30"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#0A3D2E] dark:text-white/70 mb-2">
                <Lock className="w-4 h-4" />
                Confirm Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#F8FAF5] dark:bg-[#051510] border border-[#E2F1E7] dark:border-[#22C55E]/10 text-[#0A3D2E] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder-[#0A3D2E]/30 dark:placeholder-white/30"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
              className="rounded-xl select-none w-full sm:w-auto text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] rounded-xl select-none w-full sm:w-auto text-sm sm:text-base"
            >
              {changingPassword ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TwoFactorAuth 
        user={user} 
        isOpen={twoFactorOpen} 
        onClose={() => setTwoFactorOpen(false)} 
      />
    </div>
  );
}