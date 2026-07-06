import React, { useState, useEffect } from 'react';
import { updateProfile } from 'firebase/auth';
import { 
  doc, 
  updateDoc, 
  collection, 
  query, 
  getDocs, 
  where, 
  setDoc, 
  addDoc,
  getDoc,
  orderBy
} from 'firebase/firestore';
import { auth, db, logUserActivity } from '../firebase';
import { 
  User, 
  Settings, 
  Bell, 
  Clock, 
  Heart, 
  ListMusic, 
  Compass, 
  Save, 
  CheckCircle2, 
  ShieldAlert, 
  Info, 
  Tag, 
  Lock, 
  Database,
  CreditCard,
  Sparkles,
  Receipt,
  ShieldCheck,
  XCircle,
  Gift,
  Award,
  FileText,
  RefreshCw,
  X,
  Printer,
  Crown,
  Mail,
  Copy,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, NotificationItem, Song, PaymentHistoryRecord, PricingCoupon } from '../types';
import { renderUserBadge } from './CommunityHub';

interface DashboardProps {
  userProfile: UserProfile | null;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
  likedSongIds: string[];
  playlistsCount: number;
  historySongIds: string[];
  allSongs: Song[];
}

export default function Dashboard({ 
  userProfile, 
  onProfileUpdate, 
  likedSongIds, 
  playlistsCount,
  historySongIds,
  allSongs
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'settings' | 'notifications'>('profile');
  
  // Settings States
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [avatarSeed, setAvatarSeed] = useState(userProfile?.photoURL || '');
  const [preferredBadge, setPreferredBadge] = useState<'crown' | 'badge' | 'none'>(userProfile?.preferredBadge || 'crown');
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [hifiStreaming, setHifiStreaming] = useState(true);

  // Support & Feedback States
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [copiedStatus, setCopiedStatus] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Subscription Checkout states
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [checkoutStep, setCheckoutStep] = useState<'plans' | 'pay'>('plans');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0); // percent
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Payment receipts & invoice records
  const [payments, setPayments] = useState<PaymentHistoryRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentHistoryRecord | null>(null);

  const curatedAvatars = [
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=jimi',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=wolfgang',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=bob',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=elvis',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=david',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=luna',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=retro',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=synth'
  ];

  // Dynamic Event-Driven Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Prices
  const PLAN_PRICES = {
    monthly: 9.99,
    yearly: 79.99,
    lifetime: 149.99
  };

  useEffect(() => {
    if (!userProfile) return;
    const list: NotificationItem[] = [];
    
    // Account creation event
    if (userProfile.createdAt) {
      list.push({
        id: 'notif-joined',
        title: 'Account Registered',
        message: `Your Melvora account was successfully created on ${new Date(userProfile.createdAt).toLocaleDateString()} with the ${userProfile.role} role.`,
        type: 'success',
        createdAt: userProfile.createdAt,
        read: true
      });
    }

    // Role assignment event
    if (userProfile.role === 'Owner') {
      list.push({
        id: 'notif-role',
        title: 'Owner Credentials Activated',
        message: 'Owner (Super Admin) rights have been verified and enabled. Use the Admin panel in the top navigation to add new tracks, view system logs, or adjust catalog.',
        type: 'alert',
        createdAt: new Date().toISOString(),
        read: false
      });
    }

    // Subscription status notifications
    if (userProfile.plan === 'premium') {
      list.push({
        id: 'notif-premium-tier',
        title: 'Premium Soundstream Online',
        message: 'Your high-fidelity Melvora Premium subscription is active! Unlimited AI usage, ad-free tracks, and exclusive creator tools are ready.',
        type: 'success',
        createdAt: new Date().toISOString(),
        read: false
      });
    }

    // Playlist compiler event
    if (playlistsCount > 0) {
      list.push({
        id: 'notif-playlists',
        title: 'Playlists Synchronized',
        message: `Your ${playlistsCount} custom playlists are safely synchronized with Melvora's cloud Firestore.`,
        type: 'success',
        createdAt: new Date().toISOString(),
        read: false
      });
    }

    // Liked songs event
    if (likedSongIds.length > 0) {
      list.push({
        id: 'notif-likes',
        title: 'Favorites Loaded',
        message: `Successfully loaded your ${likedSongIds.length} liked tracks. They are queued up in your active library.`,
        type: 'success',
        createdAt: new Date().toISOString(),
        read: false
      });
    }

    // Play history log event
    if (historySongIds && historySongIds.length > 0) {
      list.push({
        id: 'notif-history',
        title: 'Listening History Recovered',
        message: `Restored ${historySongIds.length} tracks from your private play logs. Your listening metrics are now fully live.`,
        type: 'info',
        createdAt: new Date().toISOString(),
        read: true
      });
    }

    setNotifications(list);
  }, [userProfile, playlistsCount, likedSongIds, historySongIds]);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName);
      setAvatarSeed(userProfile.photoURL);
      setPreferredBadge(userProfile.preferredBadge || 'crown');
    }
  }, [userProfile]);

  // Fetch payment records for user
  const fetchUserPayments = async () => {
    if (!userProfile) return;
    setLoadingPayments(true);
    try {
      const q = query(collection(db, 'payments'), where('userId', '==', userProfile.uid), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => doc.data() as PaymentHistoryRecord);
      setPayments(list);
    } catch (e) {
      console.error("Could not fetch payments:", e);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'subscription') {
      fetchUserPayments();
    }
  }, [activeTab, userProfile]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !auth.currentUser) return;
    
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // Update Firebase Auth user profile
      await updateProfile(auth.currentUser, {
        displayName: displayName,
        photoURL: avatarSeed
      });

      // Update Firestore user document
      const userRef = doc(db, 'users', userProfile.uid);
      const updatedProfile = {
        ...userProfile,
        displayName,
        photoURL: avatarSeed,
        preferredBadge,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(userRef, {
        displayName,
        photoURL: avatarSeed,
        preferredBadge,
        updatedAt: new Date().toISOString()
      });

      onProfileUpdate(updatedProfile);
      setSuccessMsg('Profile settings updated successfully!');
      
      await logUserActivity(userProfile.uid, userProfile.email, 'Update Settings', `User updated display name to "${displayName}" and preferred badge to "${preferredBadge}".`);

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to update settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('melvorasupport.team@gmail.com');
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 3000);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) {
      setFeedbackError('Feedback message cannot be empty.');
      return;
    }
    if (!userProfile) {
      setFeedbackError('You must be signed in to submit feedback.');
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackError('');
    setFeedbackSuccess('');

    try {
      const feedbackId = 'fdb-' + Math.random().toString(36).substring(2, 11);
      const feedbackData = {
        id: feedbackId,
        userId: userProfile.uid,
        userEmail: userProfile.email,
        userDisplayName: userProfile.displayName || 'Anonymous User',
        message: feedbackMessage.trim(),
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'feedback', feedbackId), feedbackData);
      
      setFeedbackSuccess('Thank you for your feedback! We appreciate your suggestions and bug reports. Your input helps us improve Melvora for everyone.');
      setFeedbackMessage('');

      // Log user activity
      await logUserActivity(userProfile.uid, userProfile.email, 'Submit Feedback', `Submitted user feedback: "${feedbackData.message.substring(0, 40)}..."`);
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setFeedbackError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Validate coupon input
  const handleApplyCoupon = async () => {
    setCouponError('');
    setCouponSuccess('');
    if (!couponInput.trim()) return;

    try {
      const couponRef = doc(db, 'coupons', couponInput.trim().toUpperCase());
      const snap = await getDoc(couponRef);
      if (snap.exists() && snap.data().active) {
        const disc = snap.data().discountPercent;
        setAppliedDiscount(disc);
        setCouponSuccess(`Coupon "${couponInput.toUpperCase()}" applied! ${disc}% discount activated.`);
      } else {
        setCouponError('Invalid or expired coupon code.');
        setAppliedDiscount(0);
      }
    } catch (e) {
      setCouponError('Error verifying coupon.');
    }
  };

  // Process subscription purchase simulation
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    if (!cardNumber || !cardExpiry || !cardCvv) {
      setErrorMsg('Please enter all payment card credentials.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Calculate amount after coupon
      const basePrice = PLAN_PRICES[selectedPlan];
      const discountedAmount = Number((basePrice * (1 - appliedDiscount / 100)).toFixed(2));
      const payId = 'pay-' + Math.random().toString(36).substr(2, 9);

      // Create Payment history record
      const paymentPayload: PaymentHistoryRecord = {
        id: payId,
        userId: userProfile.uid,
        userEmail: userProfile.email,
        userDisplayName: userProfile.displayName,
        planId: selectedPlan,
        planName: `Melvora Premium - ${selectedPlan.toUpperCase()}`,
        amount: discountedAmount,
        currency: 'USD',
        status: 'succeeded',
        createdAt: new Date().toISOString(),
        invoiceUrl: `https://melvora-invoices.web.app/${payId}`
      };

      await setDoc(doc(db, 'payments', payId), paymentPayload);

      // Calculate expiration date
      let expiresAt: string | null = null;
      if (selectedPlan === 'monthly') {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        expiresAt = d.toISOString();
      } else if (selectedPlan === 'yearly') {
        const d = new Date();
        d.setDate(d.getDate() + 365);
        expiresAt = d.toISOString();
      }

      // Update User profile document in Firestore
      const userRef = doc(db, 'users', userProfile.uid);
      const updatedProfile: UserProfile = {
        ...userProfile,
        plan: 'premium',
        subscriptionType: selectedPlan,
        subscriptionStatus: 'active',
        subscriptionExpiresAt: expiresAt,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(userRef, {
        plan: 'premium',
        subscriptionType: selectedPlan,
        subscriptionStatus: 'active',
        subscriptionExpiresAt: expiresAt,
        updatedAt: new Date().toISOString()
      });

      onProfileUpdate(updatedProfile);
      setSuccessMsg(`Congratulations! You are now a Melvora Premium member. Enjoy unlimited lossless audiophile decoders!`);
      
      // Log event
      await logUserActivity(userProfile.uid, userProfile.email, 'Subscribe Upgrade', `Upgraded to Premium ${selectedPlan} plan. Amount: $${discountedAmount}`);
      
      // Reset forms
      setCheckoutStep('plans');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCouponInput('');
      setAppliedDiscount(0);
      setCouponSuccess('');
      fetchUserPayments();

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Payment processing failed.');
    } finally {
      setLoading(false);
    }
  };

  // Cancel subscription action (remains active until expiration, then reverts to free)
  const handleCancelSubscription = async () => {
    if (!userProfile) return;
    if (!window.confirm("Are you sure you want to cancel your recurring subscription? Your premium access will continue until your current billing period ends.")) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', userProfile.uid);
      const updatedProfile: UserProfile = {
        ...userProfile,
        subscriptionStatus: 'cancelled',
        updatedAt: new Date().toISOString()
      };

      await updateDoc(userRef, {
        subscriptionStatus: 'cancelled',
        updatedAt: new Date().toISOString()
      });

      onProfileUpdate(updatedProfile);
      setSuccessMsg("Subscription cancellation processed. You will revert to Free once your billing term completes.");
      await logUserActivity(userProfile.uid, userProfile.email, 'Cancel Subscription', 'Cancelled auto-renewal of Premium billing.');
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to cancel subscription.");
    } finally {
      setLoading(false);
    }
  };

  // Restore subscriptions manually
  const handleRestorePurchases = async () => {
    if (!userProfile) return;
    setLoading(true);
    setSuccessMsg('');
    try {
      const q = query(
        collection(db, 'payments'), 
        where('userId', '==', userProfile.uid), 
        where('status', '==', 'succeeded')
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setErrorMsg("No active premium payment sessions found for this user account node.");
      } else {
        // Find most recent payment
        const paymentsList = snap.docs.map(d => d.data() as PaymentHistoryRecord)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const latest = paymentsList[0];

        // Determine if still valid
        let expiresAt: string | null = null;
        let isExpired = false;
        
        if (latest.planId === 'monthly') {
          const d = new Date(latest.createdAt);
          d.setDate(d.getDate() + 30);
          expiresAt = d.toISOString();
          isExpired = d < new Date();
        } else if (latest.planId === 'yearly') {
          const d = new Date(latest.createdAt);
          d.setDate(d.getDate() + 365);
          expiresAt = d.toISOString();
          isExpired = d < new Date();
        }

        if (isExpired) {
          setErrorMsg("Found previous subscriptions but they have elapsed. Re-checkout to renew.");
        } else {
          // Restore
          const userRef = doc(db, 'users', userProfile.uid);
          const restoredProfile: UserProfile = {
            ...userProfile,
            plan: 'premium',
            subscriptionType: latest.planId as any,
            subscriptionStatus: 'active',
            subscriptionExpiresAt: expiresAt,
            updatedAt: new Date().toISOString()
          };

          await updateDoc(userRef, {
            plan: 'premium',
            subscriptionType: latest.planId,
            subscriptionStatus: 'active',
            subscriptionExpiresAt: expiresAt,
            updatedAt: new Date().toISOString()
          });

          onProfileUpdate(restoredProfile);
          setSuccessMsg("Subscription status successfully recovered and restored from historical payment logs!");
          await logUserActivity(userProfile.uid, userProfile.email, 'Restore Subscription', 'Restored previous premium subscription from logs.');
        }
      }
    } catch (e: any) {
      setErrorMsg("Error querying purchase records.");
    } finally {
      setLoading(false);
    }
  };

  // Print/Trigger invoice dialog
  const handlePrintInvoice = () => {
    window.print();
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // Calculate actual statistics from listening history
  const historySongs = allSongs.filter(s => historySongIds && historySongIds.includes(s.id));
  const totalDurationSeconds = historySongs.reduce((sum, s) => sum + (s.duration || 180), 0); // fallback to 180s
  const totalMinutes = Math.floor(totalDurationSeconds / 60);
  
  // Format listening duration
  let durationText = '0 min';
  if (totalMinutes > 0) {
    if (totalMinutes < 60) {
      durationText = `${totalMinutes} min`;
    } else {
      durationText = `${(totalMinutes / 60).toFixed(1)} hours`;
    }
  }

  // Calculate favorite genre
  let favoriteGenre = 'None yet';
  if (historySongs.length > 0) {
    const genreCounts: { [key: string]: number } = {};
    historySongs.forEach(s => {
      if (s.genre) {
        genreCounts[s.genre] = (genreCounts[s.genre] || 0) + 1;
      }
    });
    let maxCount = 0;
    let bestGenre = '';
    Object.entries(genreCounts).forEach(([genre, count]) => {
      if (count > maxCount) {
        maxCount = count;
        bestGenre = genre;
      }
    });
    if (bestGenre) {
      favoriteGenre = bestGenre;
    }
  }

  if (!userProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-zinc-950 text-zinc-100">
        <div className="w-16 h-16 rounded-full bg-purple-600/10 flex items-center justify-center text-purple-400 mb-4 border border-purple-600/20">
          <User size={30} />
        </div>
        <h3 className="text-xl font-bold">Sign In Required</h3>
        <p className="text-zinc-400 text-sm mt-2 max-w-sm">Please log in to your account using the navigation buttons to unlock your profile stats, listening logs, and settings.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-zinc-950 text-zinc-100 pb-28 font-sans" id="dashboard-root">
      
      {/* Top Banner Header Card */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-900 bg-gradient-to-r from-purple-950/40 to-zinc-900 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 mb-8">
        <div className="absolute top-0 right-0 w-64 h-full bg-[radial-gradient(#7C3AED15_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <img 
          src={userProfile.photoURL} 
          alt={userProfile.displayName} 
          className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover bg-zinc-900 border border-purple-500/20 shadow-xl"
          referrerPolicy="no-referrer"
        />
        <div className="text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-1.5 justify-center">
              <span>{userProfile.displayName}</span>
              {renderUserBadge(userProfile.plan, userProfile.role, userProfile.preferredBadge)}
            </h1>
            <span className="bg-purple-600/25 border border-purple-500/40 text-purple-300 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full mt-1 md:mt-0 font-mono">
              {userProfile.role}
            </span>
          </div>
          <p className="text-zinc-400 text-xs mt-1.5 font-sans">{userProfile.email}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-xs text-zinc-500 font-sans justify-center md:justify-start">
            <span className="flex items-center gap-1"><Clock size={13} /> Joined {new Date(userProfile.createdAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={13} /> Account Verified</span>
          </div>
        </div>
      </div>

      {/* Tabs list navigation */}
      <div className="flex flex-wrap border-b border-zinc-900 mb-8 gap-4 sm:gap-6 text-sm font-medium text-zinc-400">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`pb-3 relative cursor-pointer flex items-center gap-2 ${activeTab === 'profile' ? 'text-purple-400 font-bold' : 'hover:text-white'}`}
          id="tab-btn-profile"
        >
          <span>Listening Overview</span>
          {activeTab === 'profile' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded" />}
        </button>
        <button 
          onClick={() => setActiveTab('subscription')}
          className={`pb-3 relative cursor-pointer flex items-center gap-2 ${activeTab === 'subscription' ? 'text-purple-400 font-bold' : 'hover:text-white'}`}
          id="tab-btn-subscription"
        >
          <CreditCard size={15} />
          <span>Membership & Subscriptions</span>
          {activeTab === 'subscription' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded" />}
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`pb-3 relative cursor-pointer ${activeTab === 'settings' ? 'text-purple-400 font-bold' : 'hover:text-white'}`}
          id="tab-btn-settings"
        >
          <span>Profile Settings</span>
          {activeTab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded" />}
        </button>
        <button 
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 relative cursor-pointer flex items-center gap-2 ${activeTab === 'notifications' ? 'text-purple-400 font-bold' : 'hover:text-white'}`}
          id="tab-btn-notifications"
        >
          <span>Notifications</span>
          {notifications.some(n => !n.read) && <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
          {activeTab === 'notifications' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded" />}
        </button>
      </div>

      {/* Alerts */}
      {successMsg && <div className="p-4.5 bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 rounded-xl text-xs mb-6 max-w-xl animate-fade-in">{successMsg}</div>}
      {errorMsg && <div className="p-4.5 bg-red-950/50 border border-red-800/60 text-red-400 rounded-xl text-xs mb-6 max-w-xl animate-fade-in">{errorMsg}</div>}

      {/* CONTENT SWITCHER */}
      {activeTab === 'profile' && (
        <div className="space-y-8" id="dashboard-overview-tab">
          {/* Listening Stats Bento Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Listening Time</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-extrabold text-white">{durationText}</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1"><Clock size={11} /> Real-time active listener time</p>
            </div>
            
            <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Liked Songs</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-extrabold text-white">{likedSongIds.length}</span>
                <span className="text-xs text-zinc-400">tracks</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1"><Heart size={11} className="text-purple-500 fill-purple-500/20" /> Added to your Favorites</p>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Playlists Compiled</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-extrabold text-white">{playlistsCount}</span>
                <span className="text-xs text-zinc-400">playlists</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1"><ListMusic size={11} /> Cloud persisted</p>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Favorite Genre</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-extrabold text-white">{favoriteGenre}</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1"><Compass size={11} /> Based on listening logs</p>
            </div>
          </div>

          {/* Subscription Tier Details summary */}
          <div className="bg-zinc-900/20 border border-zinc-900 p-6 rounded-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-1.5">
              <span>Subscription Plan: {userProfile.role === 'Owner' ? 'Permanent App Owner' : userProfile.plan === 'premium' ? 'Melvora Premium' : 'Free Listener'}</span>
              {renderUserBadge(userProfile.plan, userProfile.role, userProfile.preferredBadge)}
            </h3>
            
            {userProfile.role === 'Owner' ? (
              <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">
                You have permanent, lifetime Owner status with permanent access to every Premium features. No payments required. Protected by server-side authorization.
              </p>
            ) : userProfile.plan === 'premium' ? (
              <div className="space-y-2">
                <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">
                  Your Melvora Premium subscription is active with access to unlimited AI recommendations, faster decoders, zero ads, exclusive themes, and priority support.
                </p>
                {userProfile.subscriptionExpiresAt && (
                  <p className="text-[10px] text-purple-400 font-bold uppercase font-mono">
                    Renewal/Expiration: {new Date(userProfile.subscriptionExpiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">
                You are currently on the Melvora Free plan. Upgrade to unlock unlimited AI recommended tracks, exclusive custom styling, ad-free listening, and priority help desk channels.
              </p>
            )}

            <div className="flex items-center gap-3.5 mt-5">
              {userProfile.role !== 'Owner' && (
                <button 
                  onClick={() => setActiveTab('subscription')}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  {userProfile.plan === 'premium' ? 'Manage Subscription' : 'Upgrade to Premium'}
                </button>
              )}
              <span className="text-[10px] text-zinc-500 font-mono">Plan Billing: <strong className="text-white">{userProfile.role === 'Owner' ? 'Free/Permanent' : userProfile.plan === 'premium' ? `$${PLAN_PRICES[userProfile.subscriptionType || 'monthly']}/${userProfile.subscriptionType === 'lifetime' ? 'one-time' : userProfile.subscriptionType === 'yearly' ? 'yr' : 'mo'}` : '$0.00/mo'}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERSHIP & SUBSCRIPTION PLANS / PORTAL */}
      {activeTab === 'subscription' && (
        <div className="space-y-8" id="dashboard-subscription-tab">
          
          {/* SUBSCRIPTION MANAGEMENT AND PLANS CHECKOUT */}
          {userProfile.role === 'Owner' ? (
            <div className="bg-zinc-900/30 border border-zinc-900 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="text-yellow-400" size={20} />
                <span>Permanent App Owner Privilege</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                As the permanent application Owner, your node bypasses all standard checkout billing rules. You have permanent premium access across all platforms.
              </p>
            </div>
          ) : userProfile.plan === 'premium' && checkoutStep === 'plans' ? (
            /* ACTIVE SUBSCRIPTION CONTROL PANEL */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Plan info */}
              <div className="bg-zinc-900/30 border border-zinc-900 p-6 rounded-2xl md:col-span-2 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] bg-purple-600/20 text-purple-300 font-bold px-3 py-1 rounded-full border border-purple-500/20 uppercase tracking-widest font-mono">Premium Member</span>
                    <h3 className="text-xl font-bold text-white mt-2">Active Plan: Melvora {userProfile.subscriptionType?.toUpperCase()}</h3>
                    <p className="text-xs text-zinc-500 mt-1">Billing frequency: {userProfile.subscriptionType}</p>
                  </div>
                  <Crown className="text-yellow-400 shrink-0" size={32} />
                </div>

                <div className="border-t border-zinc-900/60 pt-4 grid grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <span className="text-zinc-500">Subscription Status</span>
                    <p className="text-white font-bold mt-1 uppercase flex items-center gap-1">
                      <ShieldCheck size={14} className="text-emerald-400" />
                      <span className={userProfile.subscriptionStatus === 'cancelled' ? 'text-orange-400' : 'text-emerald-400'}>
                        {userProfile.subscriptionStatus || 'active'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Renewal/Expiration Date</span>
                    <p className="text-white font-mono font-bold mt-1">
                      {userProfile.subscriptionExpiresAt ? new Date(userProfile.subscriptionExpiresAt).toLocaleDateString() : 'Lifetime Permanent'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-zinc-900/60 pt-4 flex gap-3.5">
                  {userProfile.subscriptionStatus !== 'cancelled' && userProfile.subscriptionType !== 'lifetime' ? (
                    <button
                      onClick={handleCancelSubscription}
                      className="bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 text-xs font-semibold px-4.5 py-2.5 rounded-xl cursor-pointer transition-colors"
                    >
                      Cancel Auto-Renewal
                    </button>
                  ) : userProfile.subscriptionType !== 'lifetime' ? (
                    <button
                      onClick={() => setCheckoutStep('plans')}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl cursor-pointer transition-colors"
                    >
                      Renew Subscription Plan
                    </button>
                  ) : null}

                  {userProfile.subscriptionType === 'monthly' && (
                    <button
                      onClick={() => { setSelectedPlan('yearly'); setCheckoutStep('pay'); }}
                      className="bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-800 text-xs font-semibold px-4.5 py-2.5 rounded-xl cursor-pointer transition-colors"
                    >
                      Upgrade to Yearly Plan (Save 33%)
                    </button>
                  )}
                </div>
              </div>

              {/* Restore details */}
              <div className="bg-zinc-900/30 border border-zinc-900 p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Device Synchronization</h4>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                    Melvora subscriptions sync automatically across all logged-in platforms. If you upgraded elsewhere, restore the sync here.
                  </p>
                </div>
                <button
                  onClick={handleRestorePurchases}
                  className="w-full mt-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs py-2.5 rounded-xl border border-zinc-800 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={13} />
                  <span>Restore Purchase Logs</span>
                </button>
              </div>

            </div>
          ) : checkoutStep === 'plans' ? (
            /* PREMIUM PLAN OFFER GRID FOR FREE USERS */
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                  <Sparkles size={24} className="text-yellow-400" />
                  <span>Upgrade to Melvora Premium</span>
                </h3>
                <p className="text-xs text-zinc-400">Join our music community lounge, disable audio ads permanently, and get full decoders for Kevin MacLeod tracks.</p>
              </div>

              {/* Three Plans Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Monthly */}
                <div className="bg-zinc-900/30 border border-zinc-900 p-6 rounded-2xl relative flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-400 uppercase font-mono">Monthly plan</h4>
                    <div className="flex items-baseline mt-2.5">
                      <span className="text-3xl font-extrabold text-white">$9.99</span>
                      <span className="text-xs text-zinc-500 font-mono">/mo</span>
                    </div>
                    <ul className="space-y-2 text-xs text-zinc-400 mt-5 font-sans">
                      <li className="flex items-center gap-2">✓ Unlimited AI recomendations</li>
                      <li className="flex items-center gap-2">✓ Synced premium decoders</li>
                      <li className="flex items-center gap-2">✓ Ad-free audio stream</li>
                      <li className="flex items-center gap-2">✓ Choose custom crown/badge</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => { setSelectedPlan('monthly'); setCheckoutStep('pay'); }}
                    className="w-full mt-6 bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs py-3 rounded-xl cursor-pointer border border-zinc-800"
                  >
                    Select Monthly
                  </button>
                </div>

                {/* Yearly */}
                <div className="bg-purple-950/20 border-2 border-purple-500 p-6 rounded-2xl relative flex flex-col justify-between shadow-lg shadow-purple-600/10">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white font-black text-[9px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md shadow-purple-500/25">
                    Best Value (Save 33%)
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-purple-400 uppercase font-mono mt-1.5">Yearly plan</h4>
                    <div className="flex items-baseline mt-2.5">
                      <span className="text-3xl font-extrabold text-white">$79.99</span>
                      <span className="text-xs text-zinc-500 font-mono">/yr</span>
                    </div>
                    <p className="text-[10px] text-purple-400 mt-1 font-mono">Saves $40 yearly versus monthly</p>
                    <ul className="space-y-2 text-xs text-zinc-300 mt-5 font-sans">
                      <li className="flex items-center gap-2">✓ Everything in Monthly</li>
                      <li className="flex items-center gap-2">✓ Priority help desk channel</li>
                      <li className="flex items-center gap-2">✓ Early access to album drops</li>
                      <li className="flex items-center gap-2">✓ Gold exclusive crown badges</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => { setSelectedPlan('yearly'); setCheckoutStep('pay'); }}
                    className="w-full mt-6 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-3 rounded-xl cursor-pointer transition-all"
                  >
                    Select Yearly
                  </button>
                </div>

                {/* Lifetime */}
                <div className="bg-zinc-900/30 border border-zinc-900 p-6 rounded-2xl relative flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-400 uppercase font-mono">Lifetime plan</h4>
                    <div className="flex items-baseline mt-2.5">
                      <span className="text-3xl font-extrabold text-white">$149.99</span>
                      <span className="text-xs text-zinc-500 font-mono">/once</span>
                    </div>
                    <ul className="space-y-2 text-xs text-zinc-400 mt-5 font-sans">
                      <li className="flex items-center gap-2">✓ Permanent lifetime access</li>
                      <li className="flex items-center gap-2">✓ Never requires renewals</li>
                      <li className="flex items-center gap-2">✓ Custom VIP aesthetic themes</li>
                      <li className="flex items-center gap-2">✓ Immortal premium badge</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => { setSelectedPlan('lifetime'); setCheckoutStep('pay'); }}
                    className="w-full mt-6 bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs py-3 rounded-xl cursor-pointer border border-zinc-800"
                  >
                    Select Lifetime
                  </button>
                </div>

              </div>

              {/* Restore purchases cta */}
              <div className="text-center pt-4">
                <button
                  onClick={handleRestorePurchases}
                  className="text-xs text-zinc-500 hover:text-white underline cursor-pointer"
                >
                  Already subscribed elsewhere? Restore purchase syncing.
                </button>
              </div>
            </div>
          ) : (
            /* PAYMENT CHECKOUT PORTAL */
            <div className="max-w-xl mx-auto bg-zinc-900/20 border border-zinc-900 p-6 rounded-2xl space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
                <div>
                  <h3 className="text-base font-bold text-white">Simulated Payment Gateway Checkout</h3>
                  <p className="text-xs text-zinc-500">Secure regional sandbox integration</p>
                </div>
                <button 
                  onClick={() => { setCheckoutStep('plans'); setAppliedDiscount(0); setCouponSuccess(''); }}
                  className="text-xs text-zinc-500 hover:text-white cursor-pointer"
                >
                  Change plan
                </button>
              </div>

              <div className="bg-zinc-900/40 p-4 rounded-xl space-y-2.5 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Selected: Melvora Premium - {selectedPlan.toUpperCase()}</span>
                  <span>${PLAN_PRICES[selectedPlan]}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-purple-400 font-semibold font-mono">
                    <span>Promo Coupon Discount ({appliedDiscount}%)</span>
                    <span>-${(PLAN_PRICES[selectedPlan] * (appliedDiscount / 100)).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold text-sm border-t border-zinc-900 pt-2.5">
                  <span>Total Amount Due</span>
                  <span className="font-mono">${(PLAN_PRICES[selectedPlan] * (1 - appliedDiscount / 100)).toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                
                {/* Coupon discount input */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Coupon Code</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="ENTER PROMO COUPON"
                      className="flex-1 bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white uppercase outline-none font-mono"
                    />
                    <button 
                      type="button"
                      onClick={handleApplyCoupon}
                      className="bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-800 text-xs px-4 rounded-xl cursor-pointer transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] text-red-400 font-semibold">{couponError}</p>}
                  {couponSuccess && <p className="text-[10px] text-emerald-400 font-semibold">{couponSuccess}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Cardholder Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"><CreditCard size={15} /></span>
                    <input 
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4000 1234 5678 9010"
                      className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Expiry Date</label>
                    <input 
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl py-2.5 px-4 text-xs text-white outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">CVV Code</label>
                    <input 
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl py-2.5 px-4 text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-3 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 mt-2"
                >
                  <CreditCard size={14} />
                  <span>{loading ? 'Processing Sandbox Purchase...' : 'Confirm Sandbox Payment'}</span>
                </button>
              </form>
            </div>
          )}

          {/* PAYMENT HISTORY & INVOICE RECEIPTS GENERATION */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt size={16} className="text-purple-400" />
              <span>Billing Invoice History & Receipts</span>
            </h3>

            {loadingPayments ? (
              <p className="text-xs text-zinc-500">Querying payment ledger...</p>
            ) : payments.length === 0 ? (
              <div className="text-center py-10 border border-zinc-900 bg-zinc-900/10 rounded-2xl text-zinc-500 text-xs">
                No billing transactions recorded on this account node.
              </div>
            ) : (
              <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl overflow-hidden">
                <div className="divide-y divide-zinc-900 text-xs">
                  {payments.map((p) => (
                    <div key={p.id} className="p-4.5 flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <h4 className="font-bold text-white">{p.planName}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono">Invoice Node: #{p.id} • {new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-4.5">
                        <span className="font-bold text-white font-mono">${p.amount?.toFixed(2)} {p.currency}</span>
                        <span className="inline-flex px-2.5 py-1 rounded-full text-[9px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/20 uppercase">
                          {p.status}
                        </span>
                        <button
                          onClick={() => setSelectedInvoice(p)}
                          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-2 rounded-xl text-zinc-300 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                        >
                          <FileText size={12} />
                          <span>View Invoice</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PROFILE SETTINGS */}
      {activeTab === 'settings' && (
        <>
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl" id="dashboard-settings-tab">
          
          {/* Display Name Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Profile Nickname</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"><User size={16} /></span>
              <input 
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="My Name"
                className="w-full bg-zinc-900/60 border border-zinc-900 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none"
              />
            </div>
          </div>

          {/* PREFERRED PREMIUM BADGE SELECTOR (Only for Premium or Owner accounts) */}
          {(userProfile.plan === 'premium' || userProfile.role === 'Owner') && (
            <div className="bg-purple-950/10 border border-purple-900/20 p-4.5 rounded-2xl space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                  <Award size={15} className="text-yellow-400" />
                  <span>Choose Your Community Badge</span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1">Select the verified premium status insignia to display beside your nickname on chatrooms and discussions.</p>
              </div>

              {userProfile.role === 'Owner' ? (
                <div className="p-3 bg-red-950/25 border border-red-900/30 text-red-400 font-mono text-[10px] font-bold uppercase rounded-xl flex items-center gap-1.5">
                  <span>👑 OWNER Crown is permanently activated for this account node</span>
                </div>
              ) : (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-zinc-300 hover:text-white">
                    <input 
                      type="radio" 
                      name="badge-opt"
                      checked={preferredBadge === 'crown'}
                      onChange={() => setPreferredBadge('crown')}
                      className="text-purple-600 focus:ring-purple-500 focus:ring-0"
                    />
                    <span>👑 Premium Crown</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-zinc-300 hover:text-white">
                    <input 
                      type="radio" 
                      name="badge-opt"
                      checked={preferredBadge === 'badge'}
                      onChange={() => setPreferredBadge('badge')}
                      className="text-purple-600 focus:ring-purple-500 focus:ring-0"
                    />
                    <span>✦ Premium Badge</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-zinc-300 hover:text-white">
                    <input 
                      type="radio" 
                      name="badge-opt"
                      checked={preferredBadge === 'none'}
                      onChange={() => setPreferredBadge('none')}
                      className="text-purple-600 focus:ring-purple-500 focus:ring-0"
                    />
                    <span>Hide Status Badge</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Curated avatar seed selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Select Curated Avatar</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3" id="avatars-picker-grid">
              {curatedAvatars.map((url, index) => {
                const isSelected = avatarSeed === url;
                return (
                  <div 
                    key={index}
                    onClick={() => setAvatarSeed(url)}
                    className={`aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all p-0.5 ${
                      isSelected ? 'border-purple-500 scale-105 shadow-md shadow-purple-600/20' : 'border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    <img 
                      src={url} 
                      alt={`avatar ${index}`} 
                      className="w-full h-full object-cover bg-zinc-900 rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preference controls */}
          <div className="border-t border-zinc-900 pt-6 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Playback & System Preferences</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Lossless Hi-Fi Audio</h4>
                <p className="text-zinc-500 text-xs">Enable high-performance audio decoders when streaming.</p>
              </div>
              <input 
                type="checkbox" 
                checked={hifiStreaming}
                onChange={() => setHifiStreaming(!hifiStreaming)}
                className="w-4 h-4 text-purple-600 bg-zinc-900 rounded border-zinc-800 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Feature Announcements</h4>
                <p className="text-zinc-500 text-xs">Receive platform announcements and playlist releases.</p>
              </div>
              <input 
                type="checkbox" 
                checked={marketingEmails}
                onChange={() => setMarketingEmails(!marketingEmails)}
                className="w-4 h-4 text-purple-600 bg-zinc-900 rounded border-zinc-800 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Save button */}
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <Save size={16} />
            <span>{loading ? 'Saving Profile...' : 'Save Settings'}</span>
          </button>
        </form>

        {/* Support & Feedback Section */}
        <div className="border-t border-zinc-900 pt-8 mt-8 space-y-6 max-w-xl" id="support-feedback-section">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Support & Feedback</h3>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Support Card */}
            <div className="bg-zinc-900/30 border border-zinc-900/60 p-5 rounded-2xl space-y-4" id="support-card">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-950/40 text-purple-400 border border-purple-800/20 shrink-0">
                  <Mail size={16} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">Support</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Need help? Contact the Melvora Support Team for assistance, bug reports, account issues, or general inquiries. We'll respond as soon as possible.
                  </p>
                </div>
              </div>

              <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <span className="text-xs font-mono text-zinc-300 select-all break-all">melvorasupport.team@gmail.com</span>
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:text-white transition-all cursor-pointer"
                    title="Copy Support Email Address"
                  >
                    <Copy size={13} />
                    <span>{copiedStatus ? 'Copied!' : 'Copy Email'}</span>
                  </button>
                  <a
                    href="mailto:melvorasupport.team@gmail.com"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer"
                    title="Open default email application"
                  >
                    <Send size={13} />
                    <span>Send Email</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Feedback Card */}
            <div className="bg-zinc-900/30 border border-zinc-900/60 p-5 rounded-2xl space-y-4" id="feedback-card">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-950/40 text-purple-400 border border-purple-800/20 shrink-0">
                  <Mail size={16} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">Feedback</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Write feedback, report bugs, or suggest features. We highly value your opinion.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div>
                  <textarea
                    value={feedbackMessage}
                    onChange={(e) => {
                      setFeedbackMessage(e.target.value);
                      if (feedbackError) setFeedbackError('');
                    }}
                    placeholder="Write your feedback, report a bug, or suggest a feature here..."
                    rows={4}
                    className="w-full bg-zinc-900/60 border border-zinc-900 focus:border-purple-500 rounded-xl py-2.5 px-4 text-xs text-white outline-none placeholder-zinc-500 resize-none leading-relaxed"
                  />
                </div>

                {feedbackError && (
                  <div className="p-3 bg-red-950/30 border border-red-900/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                    <XCircle size={15} className="shrink-0" />
                    <span>{feedbackError}</span>
                  </div>
                )}

                {feedbackSuccess && (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-900/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 size={15} className="shrink-0" />
                    <span>{feedbackSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={feedbackSubmitting}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {feedbackSubmitting ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  <span>{feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
        </>
      )}

      {/* TAB 4: ACTIVITY NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-4 max-w-2xl" id="dashboard-notifications-tab">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Activity Center Log</h3>
            <button 
              onClick={handleMarkAllRead}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
            >
              Mark all as read
            </button>
          </div>

          <div className="space-y-3" id="notifications-list">
            {notifications.length === 0 ? (
              <div className="text-center py-10 border border-zinc-900 rounded-xl bg-zinc-900/10 text-zinc-500 text-xs">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                    notif.read 
                      ? 'bg-zinc-900/10 border-zinc-900 text-zinc-400' 
                      : 'bg-zinc-900/40 border-purple-900/20 text-zinc-200 shadow-md shadow-purple-600/2'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${
                    notif.type === 'success' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/20' :
                    notif.type === 'alert' ? 'bg-purple-950/40 text-purple-400 border border-purple-800/20' :
                    'bg-zinc-800 text-zinc-300'
                  }`}>
                    {notif.type === 'alert' ? <ShieldAlert size={15} /> : <Info size={15} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs md:text-sm font-semibold ${notif.read ? 'text-zinc-300' : 'text-white'}`}>{notif.title}</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-zinc-500 font-mono mt-2.5 block">{new Date(notif.createdAt).toLocaleTimeString()} • {new Date(notif.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PRINTABLE INVOICE / RECEIPT MODAL DRAWER */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans"
            id="invoice-modal-overlay"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white text-zinc-900 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl p-6 md:p-8 relative"
              id="invoice-modal-content"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 p-2 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer print:hidden"
              >
                <X size={18} />
              </button>

              {/* Printable Invoice Header */}
              <div className="space-y-6">
                
                {/* Brand Logo & Invoice title */}
                <div className="flex justify-between items-start border-b border-zinc-200 pb-5">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-purple-600">MELVORA SOUND INC</h2>
                    <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">https://melvora-developer.web.app</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-zinc-800 uppercase font-mono tracking-widest block">PAYMENT RECEIPT</span>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-1">Invoice Reference: #{selectedInvoice.id}</span>
                  </div>
                </div>

                {/* Details layout */}
                <div className="grid grid-cols-2 gap-6 text-xs border-b border-zinc-100 pb-5 font-sans">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Billed To</span>
                    <h4 className="font-extrabold text-zinc-850 mt-1">{selectedInvoice.userDisplayName}</h4>
                    <p className="text-zinc-500 font-mono text-[10px] mt-0.5">{selectedInvoice.userEmail}</p>
                    <p className="text-zinc-500 font-mono text-[10px]">Subscriber node: #{selectedInvoice.userId.substring(0, 10)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Billing Date</span>
                    <p className="font-mono text-zinc-700 mt-1">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                    <p className="font-mono text-zinc-700 text-[10px]">{new Date(selectedInvoice.createdAt).toLocaleTimeString()}</p>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 mt-2 uppercase">
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>

                {/* Line Item Table */}
                <table className="w-full text-left text-xs border-b border-zinc-200 pb-5 font-sans">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5">Description</th>
                      <th className="py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-4 font-bold text-zinc-800">
                        {selectedInvoice.planName}
                        <p className="text-[10px] text-zinc-400 font-normal mt-0.5">Lossless audio decoders, premium badge, zero ads, priority help desk.</p>
                      </td>
                      <td className="py-4 text-right font-mono text-zinc-800 font-bold">
                        ${selectedInvoice.amount?.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Total section */}
                <div className="flex flex-col items-end gap-1.5 font-sans">
                  <div className="flex justify-between w-48 text-xs text-zinc-500">
                    <span>Tax (0% VAT):</span>
                    <span className="font-mono">$0.00</span>
                  </div>
                  <div className="flex justify-between w-48 text-xs text-zinc-500 border-b border-zinc-100 pb-1.5">
                    <span>Discount applied:</span>
                    <span className="font-mono">-$0.00</span>
                  </div>
                  <div className="flex justify-between w-48 text-sm font-black text-zinc-850">
                    <span>Grand Total:</span>
                    <span className="font-mono">${selectedInvoice.amount?.toFixed(2)} USD</span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex gap-3 pt-4 border-t border-zinc-200 print:hidden">
                  <button
                    onClick={handlePrintInvoice}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <Printer size={13} />
                    <span>Print Invoice</span>
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold text-xs py-2.5 px-6 rounded-xl cursor-pointer transition-colors"
                  >
                    Dismiss
                  </button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
