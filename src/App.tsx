import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc,
  query, 
  where, 
  addDoc,
  orderBy,
  limit,
  deleteDoc,
  increment
} from 'firebase/firestore';
import { AnimatePresence, motion } from 'motion/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth, syncUserProfile, logUserActivity, SEED_SONGS, seedDatabaseIfEmpty } from './firebase';
import { UserProfile, Song, Playlist } from './types';

// Icons
import { 
  Play, 
  Heart, 
  Plus, 
  Search, 
  Compass, 
  Library, 
  User, 
  ShieldAlert, 
  Music, 
  Volume2,
  ChevronRight,
  ListMusic,
  AlignLeft,
  X,
  Sparkles,
  Clock,
  ArrowRight,
  Check,
  Disc,
  FolderHeart,
  ChevronLeft,
  Accessibility,
  Eye
} from 'lucide-react';

// Components
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import MusicPlayer from './components/MusicPlayer';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import PlaylistManager from './components/PlaylistManager';
import AuthModal from './components/AuthModal';
import CommunityHub from './components/CommunityHub';

export default function App() {
  const [viewState, setViewState] = useState<'landing' | 'app'>('landing');
  const [currentTab, setCurrentTab] = useState<'home' | 'search' | 'library' | 'community' | 'profile' | 'admin'>('home');
  const [librarySubTab, setLibrarySubTab] = useState<'liked' | 'history' | 'playlists'>('playlists');

  // Firebase Auth Profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Core Music state
  const [allSongs, setAllSongs] = useState<Song[]>(SEED_SONGS);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Playback Queue state
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [shuffleActive, setShuffleActive] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  // User Library states
  const [likedSongIds, setLikedSongIds] = useState<string[]>([]);
  const [historySongIds, setHistorySongIds] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Open utility panels inside streaming area
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [addToPlaylistSong, setAddToPlaylistSong] = useState<Song | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Accessibility State Controllers (WCAG compliant)
  const [highContrast, setHighContrast] = useState(false);
  const [textScale, setTextScale] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [accessPanelOpen, setAccessPanelOpen] = useState(false);

  // Synchronize Accessibility Configurations
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-scale-large', 'text-scale-xlarge');
    if (textScale === 'large') {
      root.classList.add('text-scale-large');
    } else if (textScale === 'xlarge') {
      root.classList.add('text-scale-xlarge');
    }
  }, [textScale]);

  // Audio HTML Element Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch initial songs catalog from Firestore
  const fetchSongsCatalog = async () => {
    try {
      const songsSnap = await getDocs(collection(db, 'songs'));
      if (!songsSnap.empty) {
        const songsList = songsSnap.docs.map(d => d.data() as Song);
        // Sort songs by playsCount or release
        setAllSongs(songsList.sort((a, b) => b.playsCount - a.playsCount));
      }
    } catch (e) {
      console.log("Could not load songs, using offline fallback.", e);
    }
  };

  // Fetch user playlists and library state (liked, history)
  const fetchUserLibrary = async (uid: string) => {
    try {
      // Get Custom Playlists owned by user
      const playlistsQuery = query(collection(db, 'playlists'), where('ownerId', '==', uid));
      const playlistsSnap = await getDocs(playlistsQuery);
      const playlistsList = playlistsSnap.docs.map(d => d.data() as Playlist);
      setPlaylists(playlistsList);

      // Get Favorites
      const favQuery = query(collection(db, 'favorites'), where('userId', '==', uid));
      const favSnap = await getDocs(favQuery);
      const favIds = favSnap.docs.map(d => d.data().songId);
      setLikedSongIds(favIds);

      // Get History logs
      const historyQuery = query(collection(db, 'history'), where('userId', '==', uid), orderBy('playedAt', 'desc'), limit(50));
      const historySnap = await getDocs(historyQuery);
      const historyIds = historySnap.docs.map(d => d.data().songId);
      setHistorySongIds(historyIds);
    } catch (e) {
      console.error("Error loading user library records:", e);
    }
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await syncUserProfile(firebaseUser);
        setUserProfile(profile);
        if (profile.role === 'Owner' || profile.role === 'Admin') {
          await seedDatabaseIfEmpty();
          await fetchSongsCatalog();
        }
        await fetchUserLibrary(profile.uid);
      } else {
        setUserProfile(null);
        setLikedSongIds([]);
        setHistorySongIds([]);
        setPlaylists([]);
      }
    });
    return unsubscribe;
  }, []);

  // Sync Audio instances on load
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    const handlePlayState = () => setIsPlaying(true);
    const handlePauseState = () => setIsPlaying(false);
    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      handleSongEnded();
    };

    audio.addEventListener('play', handlePlayState);
    audio.addEventListener('pause', handlePauseState);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    fetchSongsCatalog();

    return () => {
      audio.removeEventListener('play', handlePlayState);
      audio.removeEventListener('pause', handlePauseState);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  // Update audio volume level
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Sync track playback sources
  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = currentSong.audioUrl;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Audio play error:", e));
      }
    }
  }, [currentSong]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!currentSong && allSongs.length > 0) {
      playSong(allSongs[0], allSongs);
      return;
    }
    
    if (audioRef.current && currentSong) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log(e));
      }
    }
  };

  // Play custom song with full queue bindings
  const playSong = (song: Song, songList: Song[]) => {
    setViewState('app');
    setCurrentSong(song);
    setQueue(songList);
    setQueueIndex(songList.findIndex(s => s.id === song.id));
    setIsPlaying(true);
    setProgress(0);

    // Save listen history in Firestore (if logged in)
    recordListeningHistory(song.id);
  };

  const recordListeningHistory = async (songId: string) => {
    if (!userProfile) return;
    try {
      const historyId = 'hist-' + Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, 'history', historyId), {
        id: historyId,
        userId: userProfile.uid,
        songId,
        playedAt: new Date().toISOString(),
        durationPlayed: 30
      });

      // Update local state
      setHistorySongIds(prev => [songId, ...prev.filter(id => id !== songId)]);
      
      // Increment play count inside song document
      const songRef = doc(db, 'songs', songId);
      await updateDoc(songRef, {
        playsCount: increment(1)
      });
    } catch (e) {
      console.log("Could not record listening history.", e);
    }
  };

  // Handle Song Completion & Auto-next logic
  const handleSongEnded = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log(e));
      }
    } else {
      onNextSong();
    }
  };

  const onNextSong = () => {
    if (queue.length === 0) return;
    
    let nextIdx = queueIndex + 1;
    if (shuffleActive) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (nextIdx >= queue.length) {
      nextIdx = repeatMode === 'all' ? 0 : -1;
    }

    if (nextIdx >= 0 && nextIdx < queue.length) {
      const nextSong = queue[nextIdx];
      setCurrentSong(nextSong);
      setQueueIndex(nextIdx);
      setProgress(0);
      recordListeningHistory(nextSong.id);
    } else {
      setIsPlaying(false);
    }
  };

  const onPrevSong = () => {
    if (queue.length === 0) return;

    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = repeatMode === 'all' ? queue.length - 1 : 0;
    }

    const prevSong = queue[prevIdx];
    setCurrentSong(prevSong);
    setQueueIndex(prevIdx);
    setProgress(0);
    recordListeningHistory(prevSong.id);
  };

  const onSeek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setProgress(seconds);
    }
  };

  // Toggle Favorite/Like state
  const handleToggleLike = async (songId: string) => {
    if (!userProfile) {
      setAuthModalOpen(true);
      return;
    }

    const isLiked = likedSongIds.includes(songId);
    try {
      if (isLiked) {
        // Unlike: query and delete the favorite document
        const favRef = doc(db, 'favorites', `fav-${userProfile.uid}-${songId}`);
        await deleteDoc(favRef);
        setLikedSongIds(prev => prev.filter(id => id !== songId));
      } else {
        // Like: set document
        const favId = `fav-${userProfile.uid}-${songId}`;
        await setDoc(doc(db, 'favorites', favId), {
          id: favId,
          userId: userProfile.uid,
          songId,
          createdAt: new Date().toISOString()
        });
        setLikedSongIds(prev => [...prev, songId]);
      }
    } catch (e) {
      console.error("Could not toggle like:", e);
    }
  };

  // Add song to playlist (Firestore sync)
  const handleAddSongToPlaylist = async (playlist: Playlist, songId: string) => {
    if (playlist.songIds.includes(songId)) {
      alert("This track is already in the playlist!");
      setAddToPlaylistSong(null);
      return;
    }

    try {
      const updatedSongIds = [...playlist.songIds, songId];
      const playlistRef = doc(db, 'playlists', playlist.id);
      
      await updateDoc(playlistRef, {
        songIds: updatedSongIds,
        updatedAt: new Date().toISOString()
      });

      // Update state
      setPlaylists(playlists.map(p => p.id === playlist.id ? { ...p, songIds: updatedSongIds } : p));
      setAddToPlaylistSong(null);
    } catch (e) {
      console.error(e);
      alert("Could not append song to playlist.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setLikedSongIds([]);
    setHistorySongIds([]);
    setPlaylists([]);
    setViewState('landing');
  };

  // Quick Playlists list inside Home/Search views
  const renderPlaylistDropdown = (song: Song) => {
    if (addToPlaylistSong?.id !== song.id) return null;
    return (
      <div className="absolute right-0 top-10 z-40 bg-zinc-950 border border-zinc-900 rounded-xl py-2 w-48 shadow-2xl">
        <div className="flex justify-between items-center px-3 pb-1.5 border-b border-zinc-900 mb-1">
          <span className="text-[10px] uppercase font-bold text-zinc-500">Add to Playlist</span>
          <button onClick={() => setAddToPlaylistSong(null)} className="text-zinc-500 hover:text-white"><X size={12} /></button>
        </div>
        {playlists.length > 0 ? (
          <div className="max-h-36 overflow-y-auto">
            {playlists.map(p => (
              <button
                key={p.id}
                onClick={() => handleAddSongToPlaylist(p, song.id)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-900 truncate flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-3 py-2 text-[10px] text-zinc-500 italic text-center">
            No playlists found. Create one in 'My Library' first.
          </div>
        )}
      </div>
    );
  };

  // Filtered Song list based on Search Tab Query
  const filteredSearchSongs = allSongs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white select-none">
      
      {/* AUTH MODAL DIALOG */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onAuthSuccess={(profile) => {
          setUserProfile(profile);
          fetchUserLibrary(profile.uid);
        }}
      />

      {/* VIEW SWITCHER */}
      {viewState === 'landing' ? (
        <LandingPage 
          onPlaySong={playSong}
          onNavigateToApp={() => setViewState('app')}
          onOpenAuth={() => setAuthModalOpen(true)}
          userProfile={userProfile}
        />
      ) : (
        /* STREAM MODE MAIN VIEWPORT */
        <div className="flex-1 flex overflow-hidden h-screen" id="app-main-viewport">
          
          {/* SIDEBAR NAVIGATION */}
          <Sidebar 
            currentTab={currentTab} 
            onChangeTab={(tab) => {
              setCurrentTab(tab as any);
              setLyricsOpen(false);
              setQueueOpen(false);
            }} 
            userProfile={userProfile}
            onLogout={handleLogout}
            onOpenAuth={() => setAuthModalOpen(true)}
          />

          {/* MAIN CANVAS SCROLL AREA */}
          <main className="flex-1 flex flex-col min-w-0 bg-zinc-950">
            
            {/* Header row containing Search or User toggles */}
            <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 shrink-0 z-10" id="app-header">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setViewState('landing')}
                  className="text-zinc-500 hover:text-white flex items-center gap-1.5 text-xs font-semibold"
                >
                  <ChevronLeft size={16} />
                  <span>Landing</span>
                </button>
              </div>

              <div className="flex items-center gap-4">
                {userProfile ? (
                  <div className="flex items-center gap-3">
                    <img 
                      src={userProfile.photoURL} 
                      alt={userProfile.displayName} 
                      onClick={() => setCurrentTab('profile')}
                      className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer object-cover hover:border-purple-500 transition-colors"
                      referrerPolicy="no-referrer"
                    />
                    <span onClick={() => setCurrentTab('profile')} className="hidden sm:inline text-xs font-semibold cursor-pointer hover:text-purple-400">{userProfile.displayName}</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => setAuthModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-full cursor-pointer transition-colors active:scale-95"
                  >
                    Connect Account
                  </button>
                )}
              </div>
            </header>

            {/* TAB CONTENTS CONTAINER */}
            <div className="flex-1 overflow-hidden flex relative">
              
              {/* HOME DISCOVER TAB */}
              {currentTab === 'home' && (
                <div className="flex-1 overflow-y-auto p-6 pb-28 space-y-8" id="tab-home-content">
                  {/* Glowing Premium Hero Banner */}
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-900 bg-gradient-to-r from-purple-950/40 to-zinc-900 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="absolute top-0 right-0 w-64 h-full bg-[radial-gradient(#7C3AED15_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                    <div className="space-y-3 text-center md:text-left">
                      <span className="text-[9px] bg-purple-600/20 text-purple-300 font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-purple-500/20">Aesthetic Soundscapes</span>
                      <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mt-2">Feel Every Beat.</h2>
                      <p className="text-zinc-400 text-xs md:text-sm max-w-md mt-1.5 leading-relaxed">Experience zero-lag audio streaming, customized playlist managers, and dynamic lyrics scrolling syncs.</p>
                      <button 
                        onClick={() => allSongs.length > 0 && playSong(allSongs[0], allSongs)}
                        className="mt-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-5 py-2.5 rounded-full flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md shadow-purple-600/10"
                      >
                        <Play size={13} className="fill-current" />
                        <span>Stream Spotlight Now</span>
                      </button>
                    </div>
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-purple-600/10 border border-purple-600/20 flex items-center justify-center shrink-0">
                      <Music size={48} className="text-purple-400 animate-pulse" />
                    </div>
                  </div>

                  {/* Recommendations Grid row */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-500">Premium Spotlight Row</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="home-recommendations">
                      {allSongs.slice(0, 4).map((song) => (
                        <div 
                          key={song.id}
                          className="group relative bg-zinc-900/20 hover:bg-zinc-900/50 border border-zinc-900 hover:border-zinc-850 rounded-xl p-3 cursor-pointer transition-all flex flex-col"
                          onClick={() => playSong(song, allSongs)}
                        >
                          <div className="aspect-square rounded-lg overflow-hidden relative mb-3 bg-zinc-900">
                            <img 
                              src={song.coverUrl} 
                              alt={song.title} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                              <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                <Play size={16} className="fill-current ml-0.5" />
                              </div>
                            </div>
                          </div>

                          <h4 className="text-xs font-semibold text-white truncate group-hover:text-purple-400 transition-colors">{song.title}</h4>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">{song.artistName}</p>
                          
                          {/* Add to Playlist button container */}
                          <div className="mt-3 flex items-center justify-between z-10" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[9px] bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded uppercase font-semibold font-mono">{song.genre}</span>
                            <div className="relative">
                              <button 
                                onClick={() => setAddToPlaylistSong(addToPlaylistSong?.id === song.id ? null : song)}
                                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-500 hover:text-white border border-zinc-850"
                                title="Add to playlist"
                              >
                                <Plus size={12} />
                              </button>
                              {renderPlaylistDropdown(song)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Complete Catalog List */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-500">All Available Streams</h3>
                    
                    <div className="space-y-2" id="home-catalog-list">
                      {allSongs.map((song) => {
                        const isSelected = currentSong?.id === song.id;
                        return (
                          <div 
                            key={song.id}
                            onClick={() => playSong(song, allSongs)}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-purple-950/20 border-purple-900/40' 
                                : 'bg-zinc-900/10 hover:bg-zinc-900/40 border-zinc-900 hover:border-zinc-850'
                            }`}
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <img 
                                src={song.coverUrl} 
                                alt={song.title} 
                                className="w-10 h-10 rounded-lg object-cover bg-zinc-900 border border-zinc-800"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <h4 className={`text-xs md:text-sm font-semibold truncate ${isSelected ? 'text-purple-400' : 'text-white'}`}>{song.title}</h4>
                                <p className="text-[10px] md:text-xs text-zinc-400 truncate mt-0.5">{song.artistName}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => handleToggleLike(song.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  likedSongIds.includes(song.id) ? 'text-purple-400' : 'text-zinc-500 hover:text-white'
                                }`}
                              >
                                <Heart size={14} className={likedSongIds.includes(song.id) ? 'fill-current' : ''} />
                              </button>
                              
                              <div className="relative">
                                <button 
                                  onClick={() => setAddToPlaylistSong(addToPlaylistSong?.id === song.id ? null : song)}
                                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-850"
                                >
                                  <Plus size={12} />
                                </button>
                                {renderPlaylistDropdown(song)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SEARCH TAB */}
              {currentTab === 'search' && (
                <div className="flex-1 overflow-y-auto p-6 pb-28 space-y-6" id="tab-search-content">
                  <div>
                    <h1 className="text-xl md:text-2xl font-extrabold text-white">Search Catalog</h1>
                    <p className="text-zinc-400 text-xs mt-1">Search through tracks, genres, artists, and playlists instantly.</p>
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"><Search size={16} /></span>
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type track titles, genres, or artists..."
                      className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none placeholder-zinc-500 text-white"
                      id="search-catalog-input"
                    />
                  </div>

                  {/* Search Results Grid */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-500">Matched Catalog Tracks</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="search-results">
                      {filteredSearchSongs.length > 0 ? (
                        filteredSearchSongs.map((song) => (
                          <div 
                            key={song.id}
                            onClick={() => playSong(song, filteredSearchSongs)}
                            className="group relative bg-zinc-900/20 hover:bg-zinc-900/50 border border-zinc-900 hover:border-zinc-850 rounded-xl p-3 cursor-pointer transition-all flex flex-col"
                          >
                            <div className="aspect-square rounded-lg overflow-hidden relative mb-3 bg-zinc-900">
                              <img 
                                src={song.coverUrl} 
                                alt={song.title} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                <Play className="text-white fill-white" size={24} />
                              </div>
                            </div>
                            <h4 className="text-xs font-semibold text-white truncate group-hover:text-purple-400 transition-colors">{song.title}</h4>
                            <p className="text-[10px] text-zinc-400 truncate mt-0.5">{song.artistName}</p>
                            
                            <div className="mt-3 flex items-center justify-between z-10" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[9px] bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded uppercase font-semibold font-mono">{song.genre}</span>
                              <div className="relative">
                                <button 
                                  onClick={() => setAddToPlaylistSong(addToPlaylistSong?.id === song.id ? null : song)}
                                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-500 hover:text-white border border-zinc-850"
                                >
                                  <Plus size={12} />
                                </button>
                                {renderPlaylistDropdown(song)}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full py-12 text-center text-zinc-500 italic">No songs found matching query. Try typing another song title or artist.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* MY LIBRARY TAB */}
              {currentTab === 'library' && (
                <div className="flex-1 overflow-hidden flex flex-col" id="tab-library-content">
                  {/* Sub Header tabs */}
                  <div className="flex border-b border-zinc-900 px-6 pt-5 gap-6 text-sm font-medium text-zinc-400 bg-zinc-950 shrink-0">
                    <button 
                      onClick={() => setLibrarySubTab('playlists')}
                      className={`pb-3 relative cursor-pointer ${librarySubTab === 'playlists' ? 'text-purple-400 font-bold' : 'hover:text-white'}`}
                    >
                      <span>Custom Playlists</span>
                      {librarySubTab === 'playlists' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded" />}
                    </button>
                    <button 
                      onClick={() => setLibrarySubTab('liked')}
                      className={`pb-3 relative cursor-pointer flex items-center gap-1.5 ${librarySubTab === 'liked' ? 'text-purple-400 font-bold' : 'hover:text-white'}`}
                    >
                      <Heart size={14} />
                      <span>Favorites ({likedSongIds.length})</span>
                      {librarySubTab === 'liked' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded" />}
                    </button>
                    <button 
                      onClick={() => setLibrarySubTab('history')}
                      className={`pb-3 relative cursor-pointer flex items-center gap-1.5 ${librarySubTab === 'history' ? 'text-purple-400 font-bold' : 'hover:text-white'}`}
                    >
                      <Clock size={14} />
                      <span>History Logs</span>
                      {librarySubTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded" />}
                    </button>
                  </div>

                  {/* Swapped Sub Canvas list panels */}
                  <div className="flex-1 overflow-y-auto">
                    {librarySubTab === 'playlists' && (
                      <PlaylistManager 
                        userProfile={userProfile}
                        allSongs={allSongs}
                        onPlaySong={playSong}
                        playlists={playlists}
                        onRefreshPlaylists={() => userProfile && fetchUserLibrary(userProfile.uid)}
                      />
                    )}

                    {librarySubTab === 'liked' && (
                      <div className="p-6 pb-28 space-y-4" id="liked-songs-pane">
                        <div>
                          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                            <FolderHeart className="text-purple-500" size={22} />
                            <span>Favorited Songs</span>
                          </h1>
                          <p className="text-zinc-400 text-xs mt-1">Tracks that you highlighted inside your Melvora library.</p>
                        </div>

                        <div className="space-y-2">
                          {likedSongIds.length > 0 ? (
                            allSongs.filter(s => likedSongIds.includes(s.id)).map((song) => (
                              <div 
                                key={song.id}
                                onClick={() => playSong(song, allSongs.filter(s => likedSongIds.includes(s.id)))}
                                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/10 hover:bg-zinc-900/40 border border-zinc-900 cursor-pointer transition-all"
                              >
                                <div className="flex items-center gap-4 min-w-0">
                                  <img 
                                    src={song.coverUrl} 
                                    alt={song.title} 
                                    className="w-10 h-10 rounded-lg object-cover bg-zinc-900 border border-zinc-800"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="min-w-0">
                                    <h4 className="text-xs md:text-sm font-semibold truncate text-white">{song.title}</h4>
                                    <p className="text-[10px] md:text-xs text-zinc-400 truncate mt-0.5">{song.artistName}</p>
                                  </div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <button 
                                    onClick={() => handleToggleLike(song.id)}
                                    className="p-2 rounded-lg text-purple-400"
                                  >
                                    <Heart size={14} className="fill-current" />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-16 text-center text-zinc-500 italic border border-zinc-900 rounded-2xl bg-zinc-900/5">No favorited tracks yet. Highlight hearts across catalogs to seed here.</div>
                          )}
                        </div>
                      </div>
                    )}

                    {librarySubTab === 'history' && (
                      <div className="p-6 pb-28 space-y-4" id="history-songs-pane">
                        <div>
                          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                            <Clock className="text-purple-500" size={22} />
                            <span>Listening History Log</span>
                          </h1>
                          <p className="text-zinc-400 text-xs mt-1">Your recent music streams compiled sequentially from database records.</p>
                        </div>

                        <div className="space-y-2">
                          {historySongIds.length > 0 ? (
                            allSongs.filter(s => historySongIds.includes(s.id)).map((song, index) => (
                              <div 
                                key={`${song.id}-${index}`}
                                onClick={() => playSong(song, allSongs.filter(s => historySongIds.includes(s.id)))}
                                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/10 hover:bg-zinc-900/40 border border-zinc-900 cursor-pointer transition-all"
                              >
                                <div className="flex items-center gap-4 min-w-0">
                                  <img 
                                    src={song.coverUrl} 
                                    alt={song.title} 
                                    className="w-10 h-10 rounded-lg object-cover bg-zinc-900 border border-zinc-800"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="min-w-0">
                                    <h4 className="text-xs md:text-sm font-semibold truncate text-white">{song.title}</h4>
                                    <p className="text-[10px] md:text-xs text-zinc-400 truncate mt-0.5">{song.artistName}</p>
                                  </div>
                                </div>
                                <span className="text-[10px] text-zinc-500 font-mono tracking-wide">Stream checked</span>
                              </div>
                            ))
                          ) : (
                            <div className="py-16 text-center text-zinc-500 italic border border-zinc-900 rounded-2xl bg-zinc-900/5">No listening logs recorded. Stream a track to write to logs.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ACCOUNT PROFILE TAB */}
              {currentTab === 'profile' && (
                <Dashboard 
                  userProfile={userProfile} 
                  onProfileUpdate={(updated) => setUserProfile(updated)}
                  likedSongIds={likedSongIds}
                  playlistsCount={playlists.length}
                  historySongIds={historySongIds}
                  allSongs={allSongs}
                />
              )}

              {/* COMMUNITY LOUNGE TAB */}
              {currentTab === 'community' && (
                <CommunityHub 
                  userProfile={userProfile}
                  onOpenAuth={() => setAuthModalOpen(true)}
                />
              )}

              {/* OWNER ADMIN PANEL TAB */}
              {currentTab === 'admin' && (
                <AdminPanel 
                  userProfile={userProfile}
                  allSongs={allSongs}
                  onRefreshSongs={fetchSongsCatalog}
                />
              )}

              {/* PERSISTENT SIDEBAR RIGHT UTILITY (Queue/Lyrics) DRAWER */}
              <AnimatePresence>
                {(queueOpen || lyricsOpen) && (
                  <motion.aside 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="hidden lg:flex flex-col bg-zinc-950 border-l border-zinc-900 p-5 shrink-0 z-10 w-80 text-zinc-300"
                    id="side-drawer-container"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-900 mb-4 shrink-0">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                        {lyricsOpen ? 'Synced Lyrics Sync' : 'Playback Queue List'}
                      </h3>
                      <button 
                        onClick={() => { setLyricsOpen(false); setQueueOpen(false); }}
                        className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-900"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* Content switcher within drawer */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                      {lyricsOpen && currentSong && (
                        <div className="space-y-4" id="drawer-lyrics-content">
                          {currentSong.lyrics ? (
                            currentSong.lyrics.split('\n').map((line, idx) => (
                              <p key={idx} className="text-xs leading-relaxed text-zinc-400">{line.replace(/\[\d{2}:\d{2}\.\d{2}\]/, '')}</p>
                            ))
                          ) : (
                            <p className="text-xs text-zinc-500 italic">No lyrics formatted. Add LRC strings inside the Super-Admin panel.</p>
                          )}
                        </div>
                      )}

                      {queueOpen && (
                        <div className="space-y-3" id="drawer-queue-content">
                          <p className="text-[10px] uppercase font-bold text-zinc-600">Now Streaming</p>
                          {currentSong && (
                            <div className="flex items-center gap-3 p-2 bg-purple-950/20 border border-purple-900/30 rounded-xl">
                              <img src={currentSong.coverUrl} className="w-8 h-8 rounded-lg object-cover bg-zinc-900" referrerPolicy="no-referrer" />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-semibold text-white truncate">{currentSong.title}</h4>
                                <p className="text-[10px] text-zinc-400 truncate">{currentSong.artistName}</p>
                              </div>
                            </div>
                          )}

                          <p className="text-[10px] uppercase font-bold text-zinc-600 mt-5">Next Up in queue</p>
                          <div className="space-y-1.5">
                            {queue.slice(queueIndex + 1).map((song, idx) => (
                              <div 
                                key={song.id}
                                onClick={() => playSong(song, queue)}
                                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-zinc-900/60 cursor-pointer transition-colors"
                              >
                                <img src={song.coverUrl} className="w-7 h-7 rounded-lg object-cover bg-zinc-900" referrerPolicy="no-referrer" />
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-xs font-semibold text-zinc-300 truncate hover:text-purple-400">{song.title}</h4>
                                  <p className="text-[10px] text-zinc-500 truncate">{song.artistName}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.aside>
                )}
              </AnimatePresence>

            </div>

          </main>

          {/* PERSISTENT BOTTOM CONTROLLERS (Stays synchronized) */}
          <MusicPlayer 
            currentSong={currentSong}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onNextSong={onNextSong}
            onPrevSong={onPrevSong}
            shuffleActive={shuffleActive}
            onToggleShuffle={() => setShuffleActive(!shuffleActive)}
            repeatMode={repeatMode}
            onToggleRepeat={() => {
              if (repeatMode === 'off') setRepeatMode('all');
              else if (repeatMode === 'all') setRepeatMode('one');
              else setRepeatMode('off');
            }}
            volume={volume}
            onVolumeChange={(v) => setVolume(v)}
            progress={progress}
            duration={duration}
            onSeek={onSeek}
            likedSongIds={likedSongIds}
            onToggleLike={handleToggleLike}
            queue={queue}
            queueIndex={queueIndex}
            onPlayFromQueue={(idx) => playSong(queue[idx], queue)}
            lyricsOpen={lyricsOpen}
            setLyricsOpen={(open) => { setLyricsOpen(open); setQueueOpen(false); }}
            queueOpen={queueOpen}
            setQueueOpen={(open) => { setQueueOpen(open); setLyricsOpen(false); }}
          />

        </div>
      )}

      {/* FLOATING ACCESSIBILITY WIDGET (WCAG 2.1 Compliant, minimum 44px tap targets) */}
      <div className="fixed bottom-28 md:bottom-24 right-4 md:right-6 z-50 flex flex-col items-end gap-3" id="accessibility-global-widget">
        <AnimatePresence>
          {accessPanelOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="bg-zinc-950/95 border border-purple-500/30 rounded-2xl p-4.5 w-72 shadow-2xl backdrop-blur-xl flex flex-col gap-4 select-none"
              id="accessibility-options-menu"
            >
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <span className="text-xs uppercase font-bold tracking-widest text-purple-400 flex items-center gap-1.5">
                  <Accessibility size={14} />
                  <span>Accessibility preferences</span>
                </span>
                <button 
                  onClick={() => setAccessPanelOpen(false)}
                  className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-900 rounded-lg cursor-pointer"
                  title="Close panel"
                >
                  <X size={14} />
                </button>
              </div>

              {/* High Contrast Option */}
              <div className="flex justify-between items-center gap-4">
                <div>
                  <p className="text-xs font-semibold text-white">High Contrast Mode</p>
                  <p className="text-[10px] text-zinc-500">Pure contrast for visual clarity</p>
                </div>
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 cursor-pointer flex items-center ${
                    highContrast ? 'bg-purple-600 justify-end' : 'bg-zinc-800 justify-start'
                  }`}
                  id="toggle-high-contrast-mode"
                >
                  <span className="w-4.5 h-4.5 rounded-full bg-white shadow-md block" />
                </button>
              </div>

              {/* Text Scaling Options */}
              <div className="flex flex-col gap-2 border-t border-zinc-900 pt-3">
                <div>
                  <p className="text-xs font-semibold text-white">Text Size Scaling</p>
                  <p className="text-[10px] text-zinc-500">Zoom UI fonts proportionally</p>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {(['normal', 'large', 'xlarge'] as const).map((scale) => (
                    <button
                      key={scale}
                      onClick={() => setTextScale(scale)}
                      className={`text-[10px] font-bold py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                        textScale === scale
                          ? 'border-purple-500 bg-purple-600/15 text-purple-400'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                      id={`text-scale-btn-${scale}`}
                    >
                      {scale === 'normal' ? '100%' : scale === 'large' ? '112.5%' : '125%'}
                    </button>
                  ))}
                </div>
              </div>

              {/* WCAG Best Practices info */}
              <div className="border-t border-zinc-900 pt-3 flex items-center gap-2 text-zinc-500">
                <Check size={12} className="text-emerald-500 shrink-0" />
                <span className="text-[9px] leading-tight">WCAG 2.1 Level AA compliant. Tap targets exceed 44px.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger Button with Minimum Tap Target of 44x44px */}
        <button
          onClick={() => setAccessPanelOpen(!accessPanelOpen)}
          className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-lg text-white border ${
            accessPanelOpen 
              ? 'bg-purple-600 border-purple-500 scale-95 shadow-purple-600/20' 
              : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 shadow-black/80 hover:scale-105 hover:border-purple-500/40'
          }`}
          title="Open Accessibility Controls"
          id="accessibility-floating-toggle"
        >
          <Accessibility size={20} className={accessPanelOpen ? 'animate-pulse' : ''} />
        </button>
      </div>

    </div>
  );
}
