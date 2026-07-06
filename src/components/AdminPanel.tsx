import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc, 
  deleteDoc, 
  addDoc,
  query, 
  orderBy, 
  limit,
  getDoc
} from 'firebase/firestore';
import { db, logUserActivity } from '../firebase';
import { 
  Users, 
  FileAudio, 
  Layout, 
  Settings, 
  Megaphone, 
  Lock, 
  Plus, 
  Trash2, 
  Edit, 
  ShieldAlert, 
  Check, 
  X, 
  Search, 
  Ban, 
  CheckCircle2, 
  VolumeX, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight,
  Gift,
  CreditCard,
  RefreshCw,
  Clock,
  ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile, Song, Album, Artist, AdConfig, HomepageConfig, ActivityLog, PaymentHistoryRecord, PricingCoupon } from '../types';

interface AdminPanelProps {
  userProfile: UserProfile | null;
  allSongs: Song[];
  onRefreshSongs: () => void;
}

export default function AdminPanel({ userProfile, allSongs, onRefreshSongs }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'catalog' | 'billing' | 'homepage' | 'ads' | 'security'>('analytics');
  
  // Data lists
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [payments, setPayments] = useState<PaymentHistoryRecord[]>([]);
  const [coupons, setCoupons] = useState<PricingCoupon[]>([]);
  
  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  
  // Loading & Action states
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Song Form State
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songGenre, setSongGenre] = useState('Synthwave');
  const [songAudioUrl, setSongAudioUrl] = useState('');
  const [songCoverUrl, setSongCoverUrl] = useState('');
  const [songDuration, setSongDuration] = useState(240);
  const [songLyrics, setSongLyrics] = useState('');

  // Homepage Settings State
  const [tagline, setTagline] = useState('Feel Every Beat.');
  const [announcement, setAnnouncement] = useState('Welcome to Melvora! Experience high-fidelity audio streams and custom curated playlists built for audiophiles.');

  // Ads Settings State
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [admobId, setAdmobId] = useState('ca-pub-3940256099942544');

  // Coupon Form State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponPercent, setNewCouponPercent] = useState(10);

  // Manual Subscription Override State
  const [selectedUserForSubs, setSelectedUserForSubs] = useState<string | null>(null);
  const [manualPlan, setManualPlan] = useState<'free' | 'premium'>('free');
  const [manualType, setManualType] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [manualExpiresInDays, setManualExpiresInDays] = useState(30);

  // Fetch Users, Logs, Coupons, and Payments on Load
  const fetchAdminData = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      // Fetch registered users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList = usersSnap.docs.map(d => d.data() as UserProfile);
      setUsers(usersList);

      // Fetch activity logs
      const logsSnap = await getDocs(query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(40)));
      const logsList = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as ActivityLog);
      setActivityLogs(logsList);

      // Fetch Coupons
      const couponsSnap = await getDocs(collection(db, 'coupons'));
      const couponsList = couponsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as PricingCoupon);
      setCoupons(couponsList);

      // Fetch Payments
      const paymentsSnap = await getDocs(query(collection(db, 'payments'), orderBy('createdAt', 'desc')));
      const paymentsList = paymentsSnap.docs.map(d => d.data() as PaymentHistoryRecord);
      setPayments(paymentsList);
    } catch (e) {
      console.error("Could not fetch admin details:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [userProfile]);

  // Update user role (RBAC management) with Owner protection
  const handleChangeRole = async (targetUid: string, targetEmail: string, newRole: any) => {
    if (targetEmail === 'mr.vishnu4321@gmail.com') {
      alert("Immunity Violation: Permanent Owner's credentials cannot be altered or downgraded.");
      return;
    }
    try {
      const userRef = doc(db, 'users', targetUid);
      await updateDoc(userRef, { role: newRole });
      setActionSuccess(`Role updated to ${newRole} for ${targetEmail}`);
      
      setUsers(users.map(u => u.uid === targetUid ? { ...u, role: newRole } : u));
      
      await logUserActivity(userProfile?.uid || 'system', userProfile?.email || 'system', 'RBAC Update', `Updated role of user ${targetEmail} to "${newRole}".`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Ban/Unban target user with Owner protection
  const handleToggleBan = async (targetUid: string, targetEmail: string, currentStatus: string) => {
    if (targetEmail === 'mr.vishnu4321@gmail.com') {
      alert("Immunity Violation: Permanent Owner account cannot be banned or suspended.");
      return;
    }
    const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
    try {
      const userRef = doc(db, 'users', targetUid);
      await updateDoc(userRef, { status: newStatus });
      setActionSuccess(`User ${targetEmail} status changed to ${newStatus}.`);
      
      setUsers(users.map(u => u.uid === targetUid ? { ...u, status: newStatus } : u));
      
      await logUserActivity(userProfile?.uid || 'system', userProfile?.email || 'system', 'User Moderation', `Toggled user status of ${targetEmail} to "${newStatus}".`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Delete User Document with Owner protection
  const handleDeleteUser = async (targetUid: string, targetEmail: string) => {
    if (targetEmail === 'mr.vishnu4321@gmail.com') {
      alert("Immunity Violation: Permanent Owner account cannot be deleted or pruned.");
      return;
    }
    if (!window.confirm(`Are you absolutely sure you want to delete user ${targetEmail} from the database?`)) return;
    try {
      await deleteDoc(doc(db, 'users', targetUid));
      setActionSuccess(`Successfully deleted user document for ${targetEmail}`);
      
      setUsers(users.filter(u => u.uid !== targetUid));
      
      await logUserActivity(userProfile?.uid || 'system', userProfile?.email || 'system', 'Delete User', `Removed user profile document of ${targetEmail} from database.`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Add/Upload Song to Database Catalog
  const handleAddSongSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle || !songArtist || !songAudioUrl || !songCoverUrl) {
      alert("Please fill in all mandatory fields.");
      return;
    }
    
    setLoading(true);
    try {
      const newSongId = 'sng-' + Math.random().toString(36).substr(2, 9);
      const newSong: Song = {
        id: newSongId,
        title: songTitle,
        artistId: 'art-custom',
        artistName: songArtist,
        albumId: 'alb-custom',
        albumName: 'Single release',
        audioUrl: songAudioUrl,
        coverUrl: songCoverUrl,
        duration: Number(songDuration),
        genre: songGenre,
        playsCount: 0,
        likesCount: 0,
        lyrics: songLyrics,
        isFeatured: true,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'songs', newSongId), newSong);
      setActionSuccess(`Song "${songTitle}" uploaded successfully into Melvora catalog!`);
      
      await logUserActivity(userProfile?.uid || 'system', userProfile?.email || 'system', 'Upload Music', `Uploaded a new catalog song: "${songTitle}" by "${songArtist}".`);
      
      setSongTitle('');
      setSongArtist('');
      setSongAudioUrl('');
      setSongCoverUrl('');
      setSongLyrics('');

      onRefreshSongs();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      alert("Could not upload song.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Song from database catalog
  const handleDeleteSong = async (songId: string, songTitle: string) => {
    if (!window.confirm(`Delete "${songTitle}" from Melvora library permanently?`)) return;
    try {
      await deleteDoc(doc(db, 'songs', songId));
      setActionSuccess(`Deleted song "${songTitle}" from database.`);
      
      await logUserActivity(userProfile?.uid || 'system', userProfile?.email || 'system', 'Delete Music', `Deleted song "${songTitle}" from music catalog.`);
      onRefreshSongs();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Create Promo Discount Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const code = newCouponCode.trim().toUpperCase();

    try {
      const couponRef = doc(db, 'coupons', code);
      const payload: PricingCoupon = {
        id: code,
        code: code,
        discountPercent: Number(newCouponPercent),
        active: true,
        createdAt: new Date().toISOString()
      };

      await setDoc(couponRef, payload);
      setActionSuccess(`Discount promo coupon "${code}" created with ${newCouponPercent}% discount!`);
      setNewCouponCode('');
      setNewCouponPercent(10);
      
      // Refresh coupons list
      setCoupons(prev => [payload, ...prev.filter(c => c.id !== code)]);
      await logUserActivity(userProfile?.uid || 'system', userProfile?.email || 'system', 'Create Coupon', `Created promotional discount coupon: ${code} (${newCouponPercent}%)`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle/Delete Promo Coupon
  const handleDeleteCoupon = async (code: string) => {
    if (!window.confirm(`Permanently revoke and delete coupon code "${code}"?`)) return;
    try {
      await deleteDoc(doc(db, 'coupons', code));
      setActionSuccess(`Promo coupon "${code}" deleted successfully.`);
      setCoupons(coupons.filter(c => c.id !== code));
      await logUserActivity(userProfile?.uid || 'system', userProfile?.email || 'system', 'Delete Coupon', `Deleted discount promo coupon: ${code}`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Manual Subscription Override
  const handleManualSubscriptionOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForSubs) return;

    try {
      const userRef = doc(db, 'users', selectedUserForSubs);
      const targetUser = users.find(u => u.uid === selectedUserForSubs);
      if (!targetUser) return;

      if (targetUser.email === 'mr.vishnu4321@gmail.com') {
        alert("Immunity Violation: Permanent Owner subscription plan cannot be overridden or modified.");
        return;
      }

      let expiresAt: string | null = null;
      if (manualPlan === 'premium') {
        if (manualType === 'lifetime') {
          expiresAt = null;
        } else {
          const d = new Date();
          d.setDate(d.getDate() + Number(manualExpiresInDays));
          expiresAt = d.toISOString();
        }
      }

      const updatePayload = {
        plan: manualPlan,
        subscriptionType: manualPlan === 'premium' ? manualType : null,
        subscriptionStatus: manualPlan === 'premium' ? 'active' : null,
        subscriptionExpiresAt: expiresAt,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(userRef, updatePayload);
      setActionSuccess(`Successfully updated subscription for ${targetUser.email} to ${manualPlan.toUpperCase()}`);
      
      // Update local state
      setUsers(users.map(u => u.uid === selectedUserForSubs ? { ...u, ...updatePayload } : u));
      setSelectedUserForSubs(null);

      await logUserActivity(userProfile?.uid || 'system', userProfile?.email || 'system', 'Override Subscription', `Manually overrode plan of ${targetUser.email} to ${manualPlan} (${manualType})`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Issue Billing Refund
  const handleIssueRefund = async (payment: PaymentHistoryRecord) => {
    if (payment.status === 'refunded') return;
    if (!window.confirm(`Issue a FULL sandbox refund for invoice #${payment.id} ($${payment.amount})? This will automatically downgrade the user's plan to Free.`)) return;

    try {
      // 1. Update Payment record status
      const paymentRef = doc(db, 'payments', payment.id);
      await updateDoc(paymentRef, { status: 'refunded' });

      // 2. Downgrade target User
      const userRef = doc(db, 'users', payment.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile;
        if (userData.email !== 'mr.vishnu4321@gmail.com') {
          await updateDoc(userRef, {
            plan: 'free',
            subscriptionStatus: 'refunded',
            subscriptionType: null,
            subscriptionExpiresAt: null,
            updatedAt: new Date().toISOString()
          });
        }
      }

      setActionSuccess(`Refund processed successfully for invoice #${payment.id}. User downgraded to Free.`);
      
      // Refresh local states
      setPayments(payments.map(p => p.id === payment.id ? { ...p, status: 'refunded' as any } : p));
      fetchAdminData();

      await logUserActivity(userProfile?.uid || 'system', userProfile?.email || 'system', 'Issue Refund', `Refunded billing transaction #${payment.id} for amount $${payment.amount}`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (e) {
      console.error("Refund failed:", e);
    }
  };

  // Save Ad Settings
  const handleSaveAds = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const configRef = doc(db, 'adConfig', 'global');
      await setDoc(configRef, {
        adsEnabled,
        admobId,
        bannerAdsEnabled: adsEnabled,
        interstitialAdsEnabled: adsEnabled,
        rewardedAdsEnabled: adsEnabled
      });
      setActionSuccess("Ad configurations saved and synchronized!");
      await logUserActivity(userProfile?.uid || 'system', userProfile?.email || 'system', 'Configure Ads', `Toggled advertisements status to ${adsEnabled}.`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Save Homepage Settings
  const handleSaveHomepage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const homeRef = doc(db, 'homepageConfig', 'global');
      await setDoc(homeRef, {
        bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
        tagline,
        announcement,
        logoUrl: ''
      });
      setActionSuccess("Homepage layout updated successfully!");
      await logUserActivity(userProfile?.uid || 'system', userProfile?.email || 'system', 'Configure Homepage', `Updated tagline to "${tagline}"`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.displayName.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredPayments = payments.filter(p => 
    p.userEmail.toLowerCase().includes(paymentSearch.toLowerCase()) || 
    p.userDisplayName.toLowerCase().includes(paymentSearch.toLowerCase()) ||
    p.id.toLowerCase().includes(paymentSearch.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-zinc-950 text-zinc-100 pb-28 font-sans" id="admin-panel-root">
      
      {/* Super Admin Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="text-purple-500 shrink-0" size={28} />
            <span>Melvora Owner & Admin Hub</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">Configure role privileges, adjust memberships, manage promotional codes, and view security audits.</p>
        </div>
        <div className="flex gap-2 text-xs bg-purple-950/40 border border-purple-800/40 text-purple-300 px-4 py-2 rounded-xl">
          <CheckCircle2 size={14} className="text-purple-400" />
          <span>Verified Owner Credentials</span>
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-purple-900/30 border border-purple-800/60 text-purple-200 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-purple-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex flex-wrap border-b border-zinc-900 mb-8 gap-4 sm:gap-6 text-sm font-medium text-zinc-400">
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 relative cursor-pointer flex items-center gap-2 ${activeTab === 'analytics' ? 'text-purple-400 font-bold' : 'hover:text-white'}`}
        >
          <TrendingUp size={16} />
          <span>Analytics Overview</span>
          {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded" />}
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-3 relative cursor-pointer flex items-center gap-2 ${activeTab === 'users' ? 'text-purple-400 font-bold' : 'hover:text-white'}`}
        >
          <Users size={16} />
          <span>Users List ({users.length})</span>
          {activeTab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded" />}
        </button>
        <button 
          onClick={() => setActiveTab('billing')}
          className={`pb-3 relative cursor-pointer flex items-center gap-2 ${activeTab === 'billing' ? 'text-purple-400 font-bold' : 'hover:text-white'}`}
        >
          <CreditCard size={16} />
          <span>Payments & Coupons</span>
          {activeTab === 'billing' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded" />}
        </button>
        <button 
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 relative cursor-pointer flex items-center gap-2 ${activeTab === 'catalog' ? 'text-purple-400 font-bold' : 'hover:text-white'}`}
        >
          <FileAudio size={16} />
          <span>Catalog ({allSongs.length})</span>
          {activeTab === 'catalog' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded" />}
        </button>
        <button 
          onClick={() => setActiveTab('homepage')}
          className={`pb-3 relative cursor-pointer flex items-center gap-2 ${activeTab === 'homepage' ? 'text-purple-400 font-bold' : 'hover:text-white'}`}
        >
          <Layout size={16} />
          <span>Banners & Page</span>
          {activeTab === 'homepage' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded" />}
        </button>
        <button 
          onClick={() => setActiveTab('ads')}
          className={`pb-3 relative cursor-pointer flex items-center gap-2 ${activeTab === 'ads' ? 'text-purple-400 font-bold' : 'hover:text-white'}`}
        >
          <Megaphone size={16} />
          <span>Ads Monetization</span>
          {activeTab === 'ads' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded" />}
        </button>
        <button 
          onClick={() => setActiveTab('security')}
          className={`pb-3 relative cursor-pointer flex items-center gap-2 ${activeTab === 'security' ? 'text-purple-400 font-bold' : 'hover:text-white'}`}
        >
          <Lock size={16} />
          <span>Security & Audits</span>
          {activeTab === 'security' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded" />}
        </button>
      </div>

      {/* SWITCH VIEWS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8" id="admin-analytics">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Total Listeners</span>
              <div className="text-2xl font-extrabold text-white mt-1.5">{users.length}</div>
              <p className="text-[10px] text-zinc-500 mt-2">Active database nodes</p>
            </div>
            <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Songs in Catalog</span>
              <div className="text-2xl font-extrabold text-white mt-1.5">{allSongs.length}</div>
              <p className="text-[10px] text-zinc-500 mt-2">Upload tracks dynamically</p>
            </div>
            <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Payments Catalog</span>
              <div className="text-2xl font-extrabold text-white mt-1.5">${payments.filter(p => p.status === 'succeeded').reduce((s, p) => s + (p.amount || 0), 0).toFixed(2)}</div>
              <p className="text-[10px] text-zinc-500 mt-2">Total gross revenue</p>
            </div>
            <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Active Coupons</span>
              <div className="text-2xl font-extrabold text-white mt-1.5">{coupons.filter(c => c.active).length}</div>
              <p className="text-[10px] text-zinc-500 mt-2">Discounts configured</p>
            </div>
          </div>

          <div className="p-6 bg-purple-950/20 border border-purple-900/20 rounded-2xl">
            <h3 className="text-base font-bold text-purple-300">Administrative Overview</h3>
            <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
              Use the tabs above to modify roles and ban abusive users under robust role-based access controls (RBAC). Changes take effect instantly across all client applications.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: USERS LIST */}
      {activeTab === 'users' && (
        <div className="space-y-6" id="admin-users">
          {/* User Search */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"><Search size={16} /></span>
            <input 
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search user profiles by name or email address..."
              className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-2.5 pl-11 pr-4 text-xs outline-none placeholder-zinc-500"
            />
          </div>

          {/* Users Table */}
          <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-black/40 text-xs font-semibold uppercase text-zinc-500 tracking-wider">
                    <th className="py-4.5 px-4.5">Profile</th>
                    <th className="py-4.5 px-4.5">Email</th>
                    <th className="py-4.5 px-4.5">Plan / Status</th>
                    <th className="py-4.5 px-4.5">Role</th>
                    <th className="py-4.5 px-4.5">Status</th>
                    <th className="py-4.5 px-4.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-xs">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => {
                      const isOwner = user.email === 'mr.vishnu4321@gmail.com' || user.role === 'Owner';
                      return (
                        <tr key={user.uid} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="py-4 px-4.5 flex items-center gap-3">
                            <img 
                              src={user.photoURL} 
                              alt={user.displayName} 
                              className="w-9 h-9 rounded-lg object-cover bg-zinc-900 border border-zinc-800"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <span className="font-semibold text-white block truncate">{user.displayName}</span>
                              <span className="text-[9px] text-zinc-500 font-mono">Node ID: #{user.uid.substring(0, 6)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4.5 text-zinc-400">{user.email}</td>
                          
                          {/* Plan details */}
                          <td className="py-4 px-4.5">
                            <div className="space-y-0.5">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                user.plan === 'premium' ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20' : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                {user.plan || 'free'}
                              </span>
                              {user.plan === 'premium' && (
                                <p className="text-[9px] text-zinc-500 font-mono">
                                  {user.subscriptionType} • Expires: {user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString() : 'Never'}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-4.5">
                            <select 
                              value={user.role}
                              disabled={isOwner}
                              onChange={(e) => handleChangeRole(user.uid, user.email, e.target.value as any)}
                              className="bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg px-2.5 py-1.5 text-xs text-white cursor-pointer outline-none font-medium disabled:opacity-50"
                            >
                              <option value="User">User</option>
                              <option value="Moderator">Moderator</option>
                              <option value="Admin">Admin</option>
                              <option value="Owner">Owner</option>
                            </select>
                          </td>
                          <td className="py-4 px-4.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              user.status === 'banned' 
                                ? 'bg-red-950/50 text-red-400 border border-red-800/30' 
                                : 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/30'
                            }`}>
                              {user.status === 'banned' ? <Ban size={10} /> : <Check size={10} />}
                              {user.status}
                            </span>
                          </td>
                          <td className="py-4 px-4.5 text-right space-x-2">
                            {/* Manual Override Subscription button */}
                            {!isOwner && (
                              <button 
                                onClick={() => {
                                  setSelectedUserForSubs(user.uid);
                                  setManualPlan(user.plan || 'free');
                                  setManualType(user.subscriptionType || 'monthly');
                                }}
                                className="p-1.5 text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg cursor-pointer"
                                title="Override Membership"
                              >
                                Modify Sub
                              </button>
                            )}
                            <button 
                              disabled={isOwner}
                              onClick={() => handleToggleBan(user.uid, user.email, user.status)}
                              className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors disabled:opacity-40 ${
                                user.status === 'banned' 
                                  ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40 hover:bg-emerald-950/60' 
                                  : 'bg-red-950/30 text-red-400 border-red-900/40 hover:bg-red-950/60'
                              }`}
                              title={user.status === 'banned' ? 'Activate user' : 'Ban user'}
                            >
                              {user.status === 'banned' ? 'Activate' : 'Ban'}
                            </button>
                            <button 
                              disabled={isOwner}
                              onClick={() => handleDeleteUser(user.uid, user.email)}
                              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-900/40 hover:bg-red-950/20 cursor-pointer transition-colors disabled:opacity-40"
                              title="Delete user document"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 px-4.5 text-center text-zinc-500 italic">No user accounts found matching query.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MANUAL SUBSCRIPTION OVERRIDE MODAL DRAWER */}
          {selectedUserForSubs && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
              <form 
                onSubmit={handleManualSubscriptionOverride}
                className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-md space-y-4 text-xs"
              >
                <div className="flex justify-between items-center pb-2.5 border-b border-zinc-850">
                  <h4 className="text-sm font-bold text-white">Override User Subscription Plan</h4>
                  <button type="button" onClick={() => setSelectedUserForSubs(null)}><X size={15} /></button>
                </div>

                <div>
                  <label className="block font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Target Membership Plan</label>
                  <select 
                    value={manualPlan}
                    onChange={(e: any) => setManualPlan(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl text-white outline-none"
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                {manualPlan === 'premium' && (
                  <>
                    <div>
                      <label className="block font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Billing Frequency Type</label>
                      <select 
                        value={manualType}
                        onChange={(e: any) => setManualType(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl text-white outline-none"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="lifetime">Lifetime (Permanent)</option>
                      </select>
                    </div>

                    {manualType !== 'lifetime' && (
                      <div>
                        <label className="block font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Duration (Expires in days)</label>
                        <input 
                          type="number"
                          value={manualExpiresInDays}
                          onChange={(e) => setManualExpiresInDays(Number(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl text-white font-mono"
                        />
                      </div>
                    )}
                  </>
                )}

                <button 
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-500 font-bold text-white py-2.5 rounded-xl"
                >
                  Save Override Changes
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENTS & COUPONS */}
      {activeTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="admin-billing-billing-tab">
          
          {/* Create promotional coupons code Form */}
          <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-6 h-fit space-y-5">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300">Generate Coupon Codes</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Saves directly into Firestore for sandbox checkout validation.</p>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Promotional Code Name</label>
                <input 
                  type="text"
                  required
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  placeholder="e.g. SUMMER50"
                  className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded-xl text-white outline-none font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Discount Percentage (%)</label>
                <input 
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={newCouponPercent}
                  onChange={(e) => setNewCouponPercent(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded-xl text-white font-mono"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
              >
                <Gift size={14} />
                <span>Create Coupon</span>
              </button>
            </form>

            {/* List existing promo coupons */}
            <div className="border-t border-zinc-900/60 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Promotional Coupons</h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {coupons.length === 0 ? (
                  <p className="text-[10px] text-zinc-600 italic">No coupons registered.</p>
                ) : (
                  coupons.map((c) => (
                    <div key={c.id} className="flex justify-between items-center p-2.5 bg-zinc-950/40 border border-zinc-850 rounded-xl">
                      <div>
                        <span className="font-mono font-bold text-white uppercase">{c.id}</span>
                        <p className="text-[9px] text-purple-400 font-semibold">{c.discountPercent}% OFF • {c.active ? 'active' : 'inactive'}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteCoupon(c.id)}
                        className="text-zinc-650 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Billing Receipts Logs / Issue Refunds */}
          <div className="lg:col-span-2 bg-zinc-900/10 border border-zinc-900 rounded-2xl p-6 space-y-5 flex flex-col">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300">Subscriber Payments Ledger</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Audit transaction invoices and issue regional billing refunds.</p>
              </div>
              <input 
                type="text"
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                placeholder="Search payments by email..."
                className="bg-zinc-900 border border-zinc-850 p-2 rounded-lg text-[10px] text-white outline-none placeholder-zinc-600 font-mono"
              />
            </div>

            {/* Table layout */}
            <div className="border border-zinc-900 bg-zinc-950/30 rounded-xl overflow-hidden flex-1 overflow-y-auto max-h-[480px]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 bg-black/40 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                    <th className="py-3.5 px-4">Invoice ID</th>
                    <th className="py-3.5 px-4">Subscriber</th>
                    <th className="py-3.5 px-4 text-center">Amount</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Refund Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-zinc-500 italic">No payments logged.</td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-900/10 font-sans">
                        <td className="py-3 px-4 font-mono text-[10px] text-zinc-500">#{p.id}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-zinc-300 block">{p.userDisplayName}</span>
                          <span className="text-[9px] text-zinc-500 font-mono">{p.userEmail}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-white">${p.amount?.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            p.status === 'refunded' ? 'bg-red-950/40 text-red-400 border border-red-900/30' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {p.status === 'succeeded' ? (
                            <button
                              onClick={() => handleIssueRefund(p)}
                              className="bg-red-950/10 hover:bg-red-950/30 text-red-400 border border-red-900/20 text-[9px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer"
                            >
                              Issue Refund
                            </button>
                          ) : (
                            <span className="text-[9px] text-zinc-650 font-semibold font-mono uppercase">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="admin-catalog">
          {/* Add Song Form */}
          <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-6 h-fit space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300">Add Song to Library</h3>
            
            <form onSubmit={handleAddSongSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Track Title *</label>
                <input 
                  type="text"
                  required
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="e.g. Neon Horizon Spark"
                  className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Artist Name *</label>
                <input 
                  type="text"
                  required
                  value={songArtist}
                  onChange={(e) => setSongArtist(e.target.value)}
                  placeholder="e.g. Neon Horizon"
                  className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Genre</label>
                  <select 
                    value={songGenre}
                    onChange={(e) => setSongGenre(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl px-3 py-2 text-sm text-white cursor-pointer outline-none"
                  >
                    <option value="Synthwave">Synthwave</option>
                    <option value="Lofi">Lofi</option>
                    <option value="Electronic">Electronic</option>
                    <option value="Acoustic">Acoustic</option>
                    <option value="Ambient">Ambient</option>
                    <option value="Pop">Pop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Duration (seconds)</label>
                  <input 
                    type="number"
                    required
                    value={songDuration}
                    onChange={(e) => setSongDuration(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">MP3 Audio Stream URL *</label>
                <input 
                  type="url"
                  required
                  value={songAudioUrl}
                  onChange={(e) => setSongAudioUrl(e.target.value)}
                  placeholder="https://domain.com/track.mp3"
                  className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Artwork Cover Image URL *</label>
                <input 
                  type="url"
                  required
                  value={songCoverUrl}
                  onChange={(e) => setSongCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Lyrics (LRC Format)</label>
                <textarea 
                  value={songLyrics}
                  onChange={(e) => setSongLyrics(e.target.value)}
                  placeholder="[00:10.00] In the neon street..."
                  rows={4}
                  className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Plus size={15} />
                <span>Add Track to Catalog</span>
              </button>
            </form>
          </div>

          {/* Current Songs Grid list */}
          <div className="lg:col-span-2 bg-zinc-900/10 border border-zinc-900 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300">Current Songs Catalog</h3>
            
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-2" id="songs-catalog-list">
              {allSongs.map((song) => (
                <div 
                  key={song.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/30 border border-zinc-900"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={song.coverUrl} 
                      alt={song.title} 
                      className="w-10 h-10 rounded-lg object-cover bg-zinc-900"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate">{song.title}</h4>
                      <p className="text-[10px] text-zinc-400 truncate">{song.artistName} • {song.genre}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-zinc-500 font-mono">{(song.playsCount / 1000).toFixed(1)}k plays</span>
                    <button 
                      onClick={() => handleDeleteSong(song.id, song.title)}
                      className="p-1.5 text-zinc-400 hover:text-red-400 rounded hover:bg-red-950/20 cursor-pointer transition-colors"
                      title="Delete song permanently"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'homepage' && (
        <form onSubmit={handleSaveHomepage} className="space-y-6 max-w-xl" id="admin-homepage">
          <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300">Configure Landing Content</h3>
          <p className="text-zinc-500 text-xs">Update marketing copies and site-wide taglines cleanly.</p>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Hero Tagline</label>
            <input 
              type="text"
              required
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Global Announcement Banner</label>
            <textarea 
              required
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
            />
          </div>

          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold py-2.5 px-6 rounded-xl cursor-pointer transition-all active:scale-95"
          >
            Update Homepage Control
          </button>
        </form>
      )}

      {activeTab === 'ads' && (
        <form onSubmit={handleSaveAds} className="space-y-6 max-w-xl" id="admin-ads">
          <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300">Advertisement Integration Settings</h3>
          <p className="text-zinc-500 text-xs">Toggle ambient monetizations for non-subscriber audiophiles.</p>

          <div className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-900 rounded-xl">
            <div>
              <h4 className="text-sm font-semibold text-white">Enable Advertisements</h4>
              <p className="text-zinc-500 text-xs">Toggle global interstitial or audio ads.</p>
            </div>
            <input 
              type="checkbox"
              checked={adsEnabled}
              onChange={() => setAdsEnabled(!adsEnabled)}
              className="w-4 h-4 text-purple-600 bg-zinc-900 border-zinc-800 rounded focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Google AdMob Placement ID</label>
            <input 
              type="text"
              required
              disabled={!adsEnabled}
              value={admobId}
              onChange={(e) => setAdmobId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none disabled:opacity-50 font-mono text-xs"
            />
          </div>

          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold py-2.5 px-6 rounded-xl cursor-pointer transition-all active:scale-95"
          >
            Save Ad Settings
          </button>
        </form>
      )}

      {activeTab === 'security' && (
        <div className="space-y-8" id="admin-security">
          {/* Security Summary Cards */}
          <div className="p-5 bg-red-950/20 border border-red-900/30 text-red-400 rounded-2xl flex items-start gap-3.5">
            <AlertTriangle className="shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-bold">Relational Identity Audit</h4>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Super Admin configurations are fully protected. All data transfers use strict Zero-Trust Firestore Security validation helpers to verify identities, preventing shadow field additions.
              </p>
            </div>
          </div>

          {/* Audit Logs Trail */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300">User Activity Logs (Audit Trail)</h3>
              <button onClick={fetchAdminData} className="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer">Refresh Logs</button>
            </div>

            <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl overflow-hidden text-xs max-h-[350px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-black/40 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-zinc-300 font-sans">
                  {activityLogs.length > 0 ? (
                    activityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-900/20">
                        <td className="py-3 px-4 text-zinc-500 font-mono text-[10px]">{new Date(log.timestamp).toLocaleTimeString()} {new Date(log.timestamp).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-purple-400 font-semibold">{log.userEmail}</td>
                        <td className="py-3 px-4 uppercase text-[10px] font-bold"><span className="bg-zinc-900 px-2 py-0.5 rounded text-zinc-300">{log.action}</span></td>
                        <td className="py-3 px-4 text-zinc-400 max-w-xs truncate" title={log.details}>{log.details}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 px-4 text-center text-zinc-500 italic">No system log files found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
