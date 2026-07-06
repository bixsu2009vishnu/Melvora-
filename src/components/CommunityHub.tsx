import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  doc,
  updateDoc,
  increment,
  where,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  MessageSquare, 
  Send, 
  ThumbsUp, 
  MessageCircle, 
  Trophy, 
  Users, 
  Search, 
  Sparkles, 
  Crown, 
  Plus, 
  Trash2, 
  Heart,
  ChevronDown,
  Clock,
  Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, CommunityPost, CommunityComment, CommunityChatMessage } from '../types';

interface CommunityHubProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
}

// Global premium badge renderer helper
export function renderUserBadge(
  plan: 'free' | 'premium', 
  role: string, 
  preferredBadge?: 'crown' | 'badge' | 'none'
) {
  if (role === 'Owner') {
    return (
      <span className="inline-flex items-center gap-1 text-amber-300 font-extrabold bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded-md text-[10px] ml-1 shadow-md shadow-amber-500/10">
        👑 OWNER
      </span>
    );
  }
  if (plan === 'premium') {
    const option = preferredBadge || 'crown';
    if (option === 'crown') {
      return (
        <span className="inline-flex items-center gap-1 text-yellow-400 font-extrabold bg-yellow-400/10 border border-yellow-400/30 px-1.5 py-0.5 rounded-md text-[10px] ml-1 shadow-sm">
          👑 PREMIUM
        </span>
      );
    } else if (option === 'badge') {
      return (
        <span className="inline-flex items-center gap-1 text-purple-400 font-bold bg-purple-950/30 border border-purple-800/40 px-1.5 py-0.5 rounded-md text-[10px] ml-1">
          ✦ PREMIUM
        </span>
      );
    }
  }
  return null;
}

export default function CommunityHub({ userProfile, onOpenAuth }: CommunityHubProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'feed' | 'leaderboard' | 'search'>('chat');
  
  // Real-time chat messages states
  const [chatMessages, setChatMessages] = useState<CommunityChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Community feed states
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [postId: string]: CommunityComment[] }>({});
  const [newCommentText, setNewCommentText] = useState<{ [postId: string]: string }>({});

  // Leaderboard lists
  const [leaderboardUsers, setLeaderboardUsers] = useState<UserProfile[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Members search states
  const [membersSearchQuery, setMembersSearchQuery] = useState('');
  const [allMembers, setAllMembers] = useState<UserProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. CHATROOM EVENT LISTENERS (Real-time synchronization)
  useEffect(() => {
    if (activeTab !== 'chat') return;

    const chatQuery = query(
      collection(db, 'chat_messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommunityChatMessage[];
      
      // Reverse to show chronologically
      setChatMessages(msgs.reverse());
      setTimeout(scrollToBottom, 150);
    }, (error) => {
      console.error("Chat sync failed: ", error);
    });

    return () => unsubscribe();
  }, [activeTab]);

  // 2. POSTS FEED EVENT LISTENERS (Real-time updates)
  useEffect(() => {
    if (activeTab !== 'feed') return;

    const postsQuery = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommunityPost[];
      setPosts(fetchedPosts);
    }, (error) => {
      console.error("Posts sync failed: ", error);
    });

    return () => unsubscribe();
  }, [activeTab]);

  // 3. LISTEN TO COMMENTS FOR AN EXPANDED POST
  useEffect(() => {
    if (!expandedPostId) return;

    const commentsQuery = query(
      collection(db, 'comments'),
      where('postId', '==', expandedPostId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const postComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommunityComment[];
      
      setComments(prev => ({
        ...prev,
        [expandedPostId]: postComments
      }));
    }, (error) => {
      console.error("Comments sync failed: ", error);
    });

    return () => unsubscribe();
  }, [expandedPostId]);

  // 4. FETCH LEADERBOARD USERS
  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const q = query(collection(db, 'users'), limit(50));
      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map(d => d.data() as UserProfile);
      
      // Seed randomized listener stats for visual engagement
      // Owner and premium accounts rank highest
      const sorted = list.map(u => ({
        ...u,
        // Mock listener duration for leaderboard ranking
        listenMinutes: u.role === 'Owner' ? 12450 : u.plan === 'premium' ? Math.floor(Math.random() * 5000) + 4000 : Math.floor(Math.random() * 1500) + 50
      })).sort((a, b) => b.listenMinutes - a.listenMinutes);

      setLeaderboardUsers(sorted as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab]);

  // 5. FETCH ALL MEMBERS FOR SEARCH
  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const list = querySnapshot.docs.map(d => d.data() as UserProfile);
      setAllMembers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'search') {
      fetchMembers();
    }
  }, [activeTab]);

  // Send message to global chat
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      onOpenAuth();
      return;
    }
    if (!newChatMessage.trim()) return;

    try {
      const messageId = 'msg-' + Math.random().toString(36).substr(2, 9);
      const payload: CommunityChatMessage = {
        id: messageId,
        userId: userProfile.uid,
        userEmail: userProfile.email,
        userDisplayName: userProfile.displayName,
        userPhotoURL: userProfile.photoURL,
        userRole: userProfile.role,
        userPlan: userProfile.plan,
        userPreferredBadge: userProfile.preferredBadge || 'crown',
        content: newChatMessage.trim(),
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'chat_messages', messageId), payload);
      setNewChatMessage('');
    } catch (e) {
      console.error("Failed to post message:", e);
    }
  };

  // Create community feed post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      onOpenAuth();
      return;
    }
    if (!newPostContent.trim()) return;

    try {
      const postId = 'post-' + Math.random().toString(36).substr(2, 9);
      const payload: CommunityPost = {
        id: postId,
        userId: userProfile.uid,
        userEmail: userProfile.email,
        userDisplayName: userProfile.displayName,
        userPhotoURL: userProfile.photoURL,
        userRole: userProfile.role,
        userPlan: userProfile.plan,
        userPreferredBadge: userProfile.preferredBadge || 'crown',
        content: newPostContent.trim(),
        createdAt: new Date().toISOString(),
        likesCount: 0,
        likedByUsers: [],
        commentsCount: 0
      };

      await setDoc(doc(db, 'posts', postId), payload);
      setNewPostContent('');
    } catch (e) {
      console.error("Failed to create post:", e);
    }
  };

  // Toggle post like
  const handleLikePost = async (post: CommunityPost) => {
    if (!userProfile) {
      onOpenAuth();
      return;
    }

    try {
      const postRef = doc(db, 'posts', post.id);
      const likedBy = post.likedByUsers || [];
      const userIndex = likedBy.indexOf(userProfile.uid);
      
      let newLikedBy = [...likedBy];
      let diff = 0;
      
      if (userIndex > -1) {
        newLikedBy.splice(userIndex, 1);
        diff = -1;
      } else {
        newLikedBy.push(userProfile.uid);
        diff = 1;
      }

      await updateDoc(postRef, {
        likedByUsers: newLikedBy,
        likesCount: increment(diff)
      });
    } catch (e) {
      console.error("Could not complete like operation:", e);
    }
  };

  // Post comment under a post
  const handlePostComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!userProfile) {
      onOpenAuth();
      return;
    }
    const commentText = newCommentText[postId] || '';
    if (!commentText.trim()) return;

    try {
      const commentId = 'cmt-' + Math.random().toString(36).substr(2, 9);
      const payload: CommunityComment = {
        id: commentId,
        postId: postId,
        userId: userProfile.uid,
        userEmail: userProfile.email,
        userDisplayName: userProfile.displayName,
        userPhotoURL: userProfile.photoURL,
        userRole: userProfile.role,
        userPlan: userProfile.plan,
        userPreferredBadge: userProfile.preferredBadge || 'crown',
        content: commentText.trim(),
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'comments', commentId), payload);
      
      // Increment comment count on the post
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1)
      });

      setNewCommentText(prev => ({ ...prev, [postId]: '' }));
    } catch (e) {
      console.error("Could not publish comment:", e);
    }
  };

  // Delete message/post helper (Admins/Owners or self)
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Delete this community post?")) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (e) {
      console.error(e);
    }
  };

  const filteredMembers = allMembers.filter(m => 
    m.displayName.toLowerCase().includes(membersSearchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(membersSearchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-100 h-full overflow-hidden" id="community-hub-root">
      
      {/* Sub header for Tab Selection */}
      <div className="border-b border-zinc-900 bg-zinc-900/10 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-purple-400" />
            <span>Community Lounge</span>
          </h2>
          <p className="text-xs text-zinc-500">Hang out with other listeners, share reviews, and view leaderboards.</p>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center bg-zinc-900/60 p-1 rounded-xl border border-zinc-900 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'chat' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Lounge Chat
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'feed' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Discussions
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'leaderboard' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Leaderboards
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'search' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Members
          </button>
        </div>
      </div>

      {/* Main Tab Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        
        {/* TAB 1: LOUNGE CHAT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden" id="community-lounge-chat">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-28">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                  <MessageSquare size={32} className="text-zinc-700 mb-2.5 animate-pulse" />
                  <p className="text-sm font-medium">Lounge is quiet today.</p>
                  <p className="text-xs text-zinc-600 max-w-xs mt-1">Be the first to connect and drop a welcome message to Melvora listeners!</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex items-start gap-3 max-w-2xl ${msg.userId === userProfile?.uid ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    <img 
                      src={msg.userPhotoURL} 
                      alt={msg.userDisplayName} 
                      className="w-8 h-8 rounded-lg object-cover bg-zinc-900 border border-zinc-800 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      {/* Name + Badge */}
                      <div className={`flex items-center gap-1.5 mb-1 text-[11px] ${msg.userId === userProfile?.uid ? 'justify-end' : ''}`}>
                        <span className="font-semibold text-zinc-300">{msg.userDisplayName}</span>
                        {renderUserBadge(msg.userPlan, msg.userRole, msg.userPreferredBadge)}
                        <span className="text-[10px] text-zinc-600 ml-1.5">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {/* Message Content Bubble */}
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed break-words border ${
                        msg.userId === userProfile?.uid 
                          ? 'bg-purple-600 border-purple-500 text-white rounded-tr-none' 
                          : 'bg-zinc-900/60 border-zinc-900 text-zinc-200 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Sticky Chat Input */}
            <form 
              onSubmit={handleSendChatMessage}
              className="absolute bottom-0 left-0 right-0 p-4 bg-zinc-950 border-t border-zinc-900 flex items-center gap-3 z-10"
            >
              <input 
                type="text"
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                placeholder={userProfile ? "Say something beautiful in the lounge..." : "Connect your account to chat..."}
                disabled={!userProfile}
                className="flex-1 bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs outline-none text-white disabled:opacity-50 placeholder-zinc-500"
              />
              <button 
                type="submit"
                disabled={!userProfile || !newChatMessage.trim()}
                className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-40 disabled:hover:bg-purple-600 cursor-pointer transition-colors shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: DISCUSSIONS FEED */}
        {activeTab === 'feed' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-28" id="community-discussions">
            {/* Create Post Card */}
            {userProfile ? (
              <form onSubmit={handleCreatePost} className="bg-zinc-900/20 border border-zinc-900 p-4.5 rounded-2xl space-y-3">
                <div className="flex items-start gap-3">
                  <img 
                    src={userProfile.photoURL} 
                    alt={userProfile.displayName} 
                    className="w-9 h-9 rounded-xl object-cover bg-zinc-900 border border-zinc-800"
                    referrerPolicy="no-referrer"
                  />
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Write a song review, share custom aesthetic recommendations, or chat lofi tracks..."
                    rows={3}
                    maxLength={280}
                    className="flex-1 bg-transparent border-0 text-xs text-white placeholder-zinc-600 outline-none resize-none pt-1"
                  />
                </div>
                <div className="flex justify-between items-center border-t border-zinc-900/60 pt-3">
                  <span className="text-[10px] text-zinc-600 font-medium font-mono">{280 - newPostContent.length} chars remaining</span>
                  <button
                    type="submit"
                    disabled={!newPostContent.trim()}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-45 text-white font-semibold text-[11px] px-4.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Post Review</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-purple-950/15 border border-purple-900/30 p-5 rounded-2xl text-center space-y-3">
                <Sparkles size={24} className="text-purple-400 mx-auto animate-pulse" />
                <h4 className="text-sm font-semibold text-purple-300">Share Your Lofi Musings</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">Connect your Melvora listener profile to join track discussions, leave song reviews, and gain badges.</p>
                <button 
                  onClick={onOpenAuth}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Connect Profile
                </button>
              </div>
            )}

            {/* Discussions List */}
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-12 border border-zinc-900 bg-zinc-900/10 rounded-2xl text-zinc-500 text-xs">
                  No track discussions started yet. Be the first!
                </div>
              ) : (
                posts.map((post) => {
                  const isPostLiked = userProfile && post.likedByUsers?.includes(userProfile.uid);
                  const isExpanded = expandedPostId === post.id;
                  const canDelete = userProfile && (userProfile.uid === post.userId || userProfile.role === 'Owner' || userProfile.role === 'Admin');

                  return (
                    <div key={post.id} className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4.5 space-y-3">
                      {/* Post Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <img 
                            src={post.userPhotoURL} 
                            alt={post.userDisplayName} 
                            className="w-9 h-9 rounded-xl object-cover bg-zinc-900 border border-zinc-800"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center gap-1">
                              <h4 className="text-xs font-semibold text-white">{post.userDisplayName}</h4>
                              {renderUserBadge(post.userPlan, post.userRole, post.userPreferredBadge)}
                            </div>
                            <span className="text-[10px] text-zinc-500">{new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        {canDelete && (
                          <button 
                            onClick={() => handleDeletePost(post.id)}
                            className="text-zinc-600 hover:text-red-400 p-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Content */}
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans pr-2 whitespace-pre-wrap">{post.content}</p>

                      {/* Action buttons (Like, Comment counts) */}
                      <div className="flex items-center gap-4.5 border-t border-zinc-900/50 pt-3 text-[11px] font-semibold text-zinc-500">
                        <button 
                          onClick={() => handleLikePost(post)}
                          className={`flex items-center gap-1.5 cursor-pointer transition-colors ${isPostLiked ? 'text-red-400' : 'hover:text-zinc-300'}`}
                        >
                          <Heart size={14} className={isPostLiked ? 'fill-red-400 text-red-400' : ''} />
                          <span>{post.likesCount || 0} Likes</span>
                        </button>
                        <button 
                          onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                          className={`flex items-center gap-1.5 cursor-pointer hover:text-zinc-300 transition-colors ${isExpanded ? 'text-purple-400' : ''}`}
                        >
                          <MessageCircle size={14} />
                          <span>{post.commentsCount || 0} Comments</span>
                        </button>
                      </div>

                      {/* Expandable Comments Area */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-zinc-900/50 pt-3.5 mt-3 space-y-3"
                          >
                            {/* Comment Write Field */}
                            {userProfile && (
                              <form 
                                onSubmit={(e) => handlePostComment(e, post.id)}
                                className="flex gap-2.5 items-center"
                              >
                                <input 
                                  type="text"
                                  value={newCommentText[post.id] || ''}
                                  onChange={(e) => setNewCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  placeholder="Write a reply..."
                                  className="flex-1 bg-zinc-950 border border-zinc-900 focus:border-purple-500 rounded-xl px-3 py-2 text-xs outline-none text-white placeholder-zinc-600"
                                />
                                <button
                                  type="submit"
                                  disabled={!(newCommentText[post.id] || '').trim()}
                                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white px-3.5 py-2 rounded-xl text-xs cursor-pointer"
                                >
                                  Reply
                                </button>
                              </form>
                            )}

                            {/* Comment Feed list */}
                            <div className="space-y-3.5 pl-2">
                              {(comments[post.id] || []).length === 0 ? (
                                <p className="text-[10px] text-zinc-600 italic">No replies yet. Start the conversation!</p>
                              ) : (
                                comments[post.id].map((cmt) => (
                                  <div key={cmt.id} className="flex gap-2.5 items-start">
                                    <img 
                                      src={cmt.userPhotoURL} 
                                      alt={cmt.userDisplayName} 
                                      className="w-7 h-7 rounded-lg object-cover bg-zinc-900 border border-zinc-850 shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="flex-1 min-w-0 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900">
                                      <div className="flex flex-wrap items-center gap-1.5 mb-1 text-[10px]">
                                        <span className="font-semibold text-zinc-300">{cmt.userDisplayName}</span>
                                        {renderUserBadge(cmt.userPlan, cmt.userRole, cmt.userPreferredBadge)}
                                        <span className="text-[9px] text-zinc-600 ml-auto">{new Date(cmt.createdAt).toLocaleDateString()}</span>
                                      </div>
                                      <p className="text-xs text-zinc-400 leading-normal">{cmt.content}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-28" id="community-leaderboard">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trophy className="text-yellow-400 shrink-0" size={18} />
                <span>Top Listeners & Curators</span>
              </h3>
              <button 
                onClick={fetchLeaderboard}
                className="text-[10px] font-bold text-purple-400 hover:text-purple-300 cursor-pointer"
              >
                Refresh Rankings
              </button>
            </div>

            {loadingLeaderboard ? (
              <div className="flex items-center justify-center py-20 text-xs text-zinc-500">
                Evaluating audiophile listening data...
              </div>
            ) : (
              <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl overflow-hidden">
                <div className="divide-y divide-zinc-900">
                  {leaderboardUsers.map((user, idx) => {
                    const rank = idx + 1;
                    return (
                      <div 
                        key={user.uid} 
                        className={`p-4 flex items-center justify-between gap-4 hover:bg-zinc-900/20 transition-colors ${
                          user.uid === userProfile?.uid ? 'bg-purple-950/10 border-l-2 border-purple-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Rank badge */}
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            rank === 1 ? 'bg-amber-400/25 text-amber-300 border border-amber-500/30' :
                            rank === 2 ? 'bg-zinc-300/25 text-zinc-300 border border-zinc-400/30' :
                            rank === 3 ? 'bg-amber-700/25 text-amber-600 border border-amber-800/30' :
                            'text-zinc-650'
                          }`}>
                            {rank}
                          </div>

                          <img 
                            src={user.photoURL} 
                            alt={user.displayName} 
                            className="w-9 h-9 rounded-xl object-cover bg-zinc-900 border border-zinc-800"
                            referrerPolicy="no-referrer"
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <h4 className="text-xs font-bold text-white truncate">{user.displayName}</h4>
                              {renderUserBadge(user.plan, user.role, user.preferredBadge)}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">Listener node: #{user.uid.substring(0, 6)}</span>
                          </div>
                        </div>

                        {/* Listener stats */}
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-white font-mono flex items-center gap-1 justify-end">
                            <Clock size={12} className="text-purple-400" />
                            <span>{(user as any).listenMinutes?.toLocaleString()} min</span>
                          </div>
                          <span className="text-[9px] text-zinc-500 tracking-wider font-semibold uppercase">Listening Time</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MEMBER DIRECTORY SEARCH */}
        {activeTab === 'search' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-28" id="community-member-search">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"><Search size={16} /></span>
              <input 
                type="text"
                value={membersSearchQuery}
                onChange={(e) => setMembersSearchQuery(e.target.value)}
                placeholder="Search registered listeners on Melvora by name or email..."
                className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-2.5 pl-11 pr-4 text-xs outline-none placeholder-zinc-600 text-white"
              />
            </div>

            {loadingMembers ? (
              <div className="text-center py-20 text-xs text-zinc-500">
                Scanning listener indices...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredMembers.map((member) => (
                  <div 
                    key={member.uid}
                    className="p-4 rounded-2xl border border-zinc-900 bg-zinc-900/10 hover:bg-zinc-900/20 transition-all flex items-center gap-3.5"
                  >
                    <img 
                      src={member.photoURL} 
                      alt={member.displayName} 
                      className="w-11 h-11 rounded-xl object-cover bg-zinc-950 border border-zinc-800"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        <h4 className="text-xs font-bold text-white truncate">{member.displayName}</h4>
                        {renderUserBadge(member.plan, member.role, member.preferredBadge)}
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{member.email}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[9px] font-semibold tracking-wide text-zinc-500 font-mono uppercase">
                        <span>Joined: {new Date(member.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className={member.status === 'banned' ? 'text-red-500' : 'text-emerald-500'}>{member.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
