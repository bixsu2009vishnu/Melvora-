export type UserRole = 'User' | 'Moderator' | 'Admin' | 'Owner';
export type UserStatus = 'active' | 'banned';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  
  // Subscription parameters
  plan: 'free' | 'premium';
  subscriptionType?: 'monthly' | 'yearly' | 'lifetime' | null;
  subscriptionStatus?: 'active' | 'cancelled' | 'expired' | null;
  subscriptionExpiresAt?: string | null; // ISO Date-time string
  preferredBadge?: 'crown' | 'badge' | 'none';
}

export interface Song {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId?: string;
  albumName?: string;
  audioUrl: string;
  coverUrl: string;
  duration: number; // in seconds
  genre: string;
  playsCount: number;
  likesCount: number;
  lyrics?: string;
  isFeatured?: boolean;
  scheduledAt?: string; // ISO string for scheduled release
  createdAt: string;
}

export interface Album {
  id: string;
  name: string;
  artistId: string;
  artistName: string;
  coverUrl: string;
  genre: string;
  releaseYear: number;
  songsCount: number;
  createdAt: string;
}

export interface Artist {
  id: string;
  name: string;
  photoUrl: string;
  bio: string;
  monthlyListeners: number;
  verified: boolean;
  createdAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl: string;
  ownerId: string;
  ownerName: string;
  isPublic: boolean;
  songIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  songId: string;
  createdAt: string;
}

export interface HistoryRecord {
  id: string;
  userId: string;
  songId: string;
  playedAt: string;
  durationPlayed: number; // in seconds
}

export interface AdConfig {
  adsEnabled: boolean;
  admobId?: string;
  bannerAdsEnabled: boolean;
  interstitialAdsEnabled: boolean;
  rewardedAdsEnabled: boolean;
}

export interface HomepageConfig {
  bannerUrl: string;
  tagline: string;
  announcement: string;
  logoUrl: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  createdAt: string;
  read: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
}

export interface PaymentHistoryRecord {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'refunded';
  createdAt: string;
  invoiceUrl?: string;
}

export interface PricingCoupon {
  id: string;
  code: string;
  discountPercent: number;
  active: boolean;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  userPhotoURL: string;
  userRole: UserRole;
  userPlan: 'free' | 'premium';
  userPreferredBadge: 'crown' | 'badge' | 'none';
  content: string;
  createdAt: string;
  likesCount: number;
  likedByUsers?: string[];
  commentsCount: number;
}

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  userPhotoURL: string;
  userRole: UserRole;
  userPlan: 'free' | 'premium';
  userPreferredBadge: 'crown' | 'badge' | 'none';
  content: string;
  createdAt: string;
}

export interface CommunityChatMessage {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  userPhotoURL: string;
  userRole: UserRole;
  userPlan: 'free' | 'premium';
  userPreferredBadge: 'crown' | 'badge' | 'none';
  content: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface FeedbackSubmission {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  message: string;
  createdAt: string;
}

