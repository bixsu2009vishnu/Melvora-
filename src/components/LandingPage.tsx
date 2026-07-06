import { useState } from 'react';
import { 
  Play, 
  Sparkles, 
  Music, 
  Volume2, 
  ShieldCheck, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  ArrowRight, 
  Tv, 
  CheckCircle2, 
  Twitter, 
  Instagram, 
  Github, 
  Heart 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Song, Artist, Album } from '../types';
import { SEED_SONGS, SEED_ARTISTS, SEED_ALBUMS } from '../firebase';

interface LandingPageProps {
  onPlaySong: (song: Song, songList: Song[]) => void;
  onNavigateToApp: () => void;
  onOpenAuth: () => void;
  userProfile: any;
}

export default function LandingPage({ onPlaySong, onNavigateToApp, onOpenAuth, userProfile }: LandingPageProps) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const faqs = [
    {
      q: "What is Melvora?",
      a: "Melvora is a premium, high-fidelity music streaming platform designed for true audiophiles. We focus on premium visual layouts, rich audio outputs, role-based controls, and seamless local playlist structures under a unique aesthetic identity."
    },
    {
      q: "Is it completely free to stream?",
      a: "Yes! Melvora offers a fully featured free tier supported by non-intrusive ambient ads (which can be toggled via the Owner Panel). Standard listeners enjoy full playback controls, playlist creations, and browsing catalogs."
    },
    {
      q: "Can I create and share my own playlists?",
      a: "Absolutely. Simply sign up for a free account, browse your favorite tracks, and click the '+' button to compile playlists. You can keep playlists fully private or toggle them to public so other audiophiles can stream them."
    },
    {
      q: "How does the Admin and Creator system work?",
      a: "Melvora enforces Role-Based Access Control (RBAC). Administrators and Owners have access to the Admin Dashboard to upload songs/albums, manage users, configure home banners, and analyze daily listening times."
    },
    {
      q: "Can I use Melvora on my phone?",
      a: "Yes! Melvora is engineered with fluid, modern responsive styling. It runs flawlessly on desktops, tablets, and mobile devices, and supports offline queue-loading for active listener sessions."
    }
  ];

  const features = [
    {
      icon: <Music className="text-purple-400" size={24} />,
      title: "Hi-Fi Audio Quality",
      desc: "Stream crisp, studio-grade lossless audio with dedicated volume management and persistent mini-players."
    },
    {
      icon: <Sparkles className="text-purple-400" size={24} />,
      title: "Dynamic Lyrics Sync",
      desc: "Sing along with synchronized lyric scrolling that matches your tracks beat-by-beat in real-time."
    },
    {
      icon: <Volume2 className="text-purple-400" size={24} />,
      title: "Seamless Local Queue",
      desc: "Manage custom queue playlists, toggle shuffle or repeat configurations, and customize listening histories."
    },
    {
      icon: <ShieldCheck className="text-purple-400" size={24} />,
      title: "Robust RBAC Architecture",
      desc: "Enjoy safe environments protected by strict Firestore rules and robust account role management workflows."
    }
  ];

  const genres = [
    { name: 'Synthwave', color: 'from-pink-600 to-purple-600', count: 'Retro Synths' },
    { name: 'Lofi', color: 'from-purple-600 to-indigo-600', count: 'Cozy Vinyl' },
    { name: 'Electronic', color: 'from-blue-600 to-cyan-600', count: 'Upbeat Tracks' },
    { name: 'Acoustic', color: 'from-amber-600 to-red-600', count: 'Warm Guitar' },
    { name: 'Ambient', color: 'from-teal-600 to-emerald-600', count: 'Deep Space' },
    { name: 'Pop', color: 'from-violet-600 to-pink-500', count: 'Melodic Rhythms' }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-purple-600 selection:text-white" id="landing-page-root">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-950/20 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-10 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 left-10 w-96 h-96 bg-purple-950/5 rounded-full blur-3xl pointer-events-none" />
      <div className="ambient-grid" />

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-zinc-950/80 border-b border-zinc-900" id="landing-navbar">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onNavigateToApp}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-black flex items-center justify-center shadow-lg shadow-purple-500/20 border border-purple-500/20 group-hover:scale-105 transition-all">
              <svg viewBox="0 0 100 100" className="w-6 h-6 text-white drop-shadow-[0_0_6px_rgba(255,30,30,0.8)]" fill="currentColor">
                <path d="M15 80 L35 25 L50 45 L65 25 L85 80 L70 80 L57 42 L50 52 L43 42 L30 80 Z" />
                <path d="M50 63 L40 80 L60 80 Z" fill="#FF3B3B" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-display">Melvora</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#trending" className="hover:text-purple-400 transition-colors">Trending</a>
            <a href="#genres" className="hover:text-purple-400 transition-colors">Genres</a>
            <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
            <a href="#faq" className="hover:text-purple-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            {userProfile ? (
              <button 
                onClick={onNavigateToApp}
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-5 py-2 rounded-full cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                id="navbar-dashboard-btn"
              >
                <span>Launch App</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <button 
                  onClick={onOpenAuth}
                  className="text-zinc-400 hover:text-white text-sm font-medium px-3 py-2 cursor-pointer transition-colors"
                  id="navbar-signin-btn"
                >
                  Sign In
                </button>
                <button 
                  onClick={onOpenAuth}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-5 py-2 rounded-full cursor-pointer active:scale-95 transition-all"
                  id="navbar-signup-btn"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 text-center flex flex-col items-center" id="hero-section">
        {/* Animated Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-purple-950/40 border border-purple-800/40 rounded-full px-4.5 py-1.5 text-xs text-purple-300 font-medium mb-6 backdrop-blur-sm"
          id="hero-badge"
        >
          <Sparkles size={14} className="text-purple-400 animate-pulse" />
          <span>High-Fidelity Royalty-Free Music Streamer</span>
        </motion.div>

        {/* Headings */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] mb-6 font-display"
          id="hero-title"
        >
          Feel Every <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-purple-600 drop-shadow-[0_0_15px_rgba(255,30,30,0.35)]">Beat</span>.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed font-sans"
          id="hero-desc"
        >
          Immerse yourself in high-fidelity sound, custom curated collections, and scrolling lyrics. Beautifully crafted for standard listeners and administrators alike.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
          id="hero-actions"
        >
          <button 
            onClick={userProfile ? onNavigateToApp : onOpenAuth}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-full active:scale-95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer neon-glow-btn shadow-lg"
            id="hero-cta-btn"
          >
            <span>Start Streaming Free</span>
            <ArrowRight size={16} />
          </button>
          <button 
            onClick={onNavigateToApp}
            className="bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-medium px-8 py-4 rounded-full active:scale-95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer backdrop-blur-sm"
            id="hero-catalog-btn"
          >
            <span>Browse Catalog</span>
          </button>
        </motion.div>
      </section>

      {/* Trending Music Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-zinc-900" id="trending">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Trending Tracks</h2>
            <p className="text-zinc-400 text-sm">Most played tracks this week on Melvora. Tap to play instantly.</p>
          </div>
          <button 
            onClick={onNavigateToApp}
            className="text-purple-400 hover:text-purple-300 font-semibold text-sm flex items-center gap-1 mt-4 md:mt-0 transition-colors"
          >
            <span>View All Tracks</span>
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="trending-grid">
          {SEED_SONGS.slice(0, 6).map((song) => (
            <div 
              key={song.id}
              onClick={() => onPlaySong(song, SEED_SONGS)}
              className="group relative flex items-center gap-4 bg-zinc-900/40 hover:bg-zinc-900/90 border border-zinc-900 hover:border-zinc-800 rounded-xl p-3 cursor-pointer transition-all hover:translate-y-[-2px]"
              id={`trending-card-${song.id}`}
            >
              <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden">
                <img 
                  src={song.coverUrl} 
                  alt={song.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <Play className="text-white fill-white" size={20} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate group-hover:text-purple-400 transition-colors">{song.title}</h3>
                <p className="text-xs text-zinc-400 truncate mt-0.5">{song.artistName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded uppercase font-semibold">{song.genre}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{(song.playsCount / 1000).toFixed(0)}K Plays</span>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onPlaySong(song, SEED_SONGS);
                }}
                className="w-9 h-9 rounded-full bg-purple-600/10 group-hover:bg-purple-600 text-purple-400 group-hover:text-white flex items-center justify-center transition-all scale-90 group-hover:scale-100"
              >
                <Play size={15} className="group-hover:fill-current" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Artists & Albums (Combined Side-By-Side) */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-zinc-900" id="catalog-highlights">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Artists */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Popular Artists</h2>
              <button onClick={onNavigateToApp} className="text-purple-400 hover:text-purple-300 text-xs font-semibold">Browse Artists</button>
            </div>
            <div className="space-y-4" id="artists-list">
              {SEED_ARTISTS.slice(0, 4).map((artist) => (
                <div 
                  key={artist.id}
                  onClick={onNavigateToApp}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <img 
                      src={artist.photoUrl} 
                      alt={artist.name} 
                      className="w-12 h-12 rounded-full object-cover border border-zinc-800"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <h4 className="text-sm font-semibold text-white">{artist.name}</h4>
                        {artist.verified && <CheckCircle2 className="text-purple-500 fill-purple-950" size={13} />}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{artist.bio.substring(0, 60)}...</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">{(artist.monthlyListeners / 1000).toFixed(0)}K monthly</span>
                </div>
              ))}
            </div>
          </div>

          {/* Albums */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Top Albums</h2>
              <button onClick={onNavigateToApp} className="text-purple-400 hover:text-purple-300 text-xs font-semibold">Browse Albums</button>
            </div>
            <div className="grid grid-cols-2 gap-4" id="albums-grid">
              {SEED_ALBUMS.slice(0, 4).map((album) => (
                <div 
                  key={album.id}
                  onClick={onNavigateToApp}
                  className="group relative bg-zinc-900/20 hover:bg-zinc-900/60 border border-zinc-900 hover:border-zinc-800 rounded-xl p-3 cursor-pointer transition-all"
                >
                  <div className="aspect-square w-full rounded-lg overflow-hidden bg-zinc-850 mb-3 relative">
                    <img 
                      src={album.coverUrl} 
                      alt={album.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                        <Play size={16} className="fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-white truncate">{album.name}</h4>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{album.artistName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-zinc-500 font-mono">{album.releaseYear}</span>
                    <span className="text-[10px] text-zinc-500 font-sans">• {album.genre}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Genres Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-zinc-900" id="genres">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white">Explore Genres</h2>
          <p className="text-zinc-400 text-sm mt-2">Find music fitted exactly for your mood and style.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" id="genres-grid">
          {genres.map((genre) => (
            <div 
              key={genre.name}
              onClick={onNavigateToApp}
              className={`relative h-28 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-600/5 group`}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${genre.color} opacity-70 group-hover:opacity-85 transition-opacity`} />
              {/* Overlay grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
                <Music size={18} className="text-white/60 group-hover:text-white transition-colors" />
                <div>
                  <h4 className="font-bold text-white tracking-tight">{genre.name}</h4>
                  <p className="text-[10px] text-zinc-200 mt-0.5">{genre.count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-zinc-900" id="features">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white">Designed For Audiophiles</h2>
          <p className="text-zinc-400 text-sm mt-2">Experience cutting-edge capabilities loaded with high-fidelity performance metrics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" id="features-grid">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="bg-zinc-900/30 border border-zinc-900 p-6 rounded-2xl flex flex-col gap-4 text-left hover:border-zinc-800 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-600/20 flex items-center justify-center">
                {feature.icon}
              </div>
              <div>
                <h4 className="text-base font-semibold text-white">{feature.title}</h4>
                <p className="text-zinc-400 text-xs mt-2 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>



      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-zinc-900" id="faq">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-zinc-400 text-sm mt-2 font-sans">Clear answers to common questions about Melvora.</p>
        </div>

        <div className="space-y-4" id="faq-accordion">
          {faqs.map((faq, idx) => {
            const isOpen = faqOpen === idx;
            return (
              <div 
                key={idx}
                className="border border-zinc-900 hover:border-zinc-800 rounded-xl bg-zinc-900/10 overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between text-white font-medium hover:text-purple-400 transition-colors"
                >
                  <span className="text-sm md:text-base">{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} className="text-purple-400" /> : <ChevronDown size={18} className="text-zinc-500" />}
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-5 pt-1 text-xs md:text-sm text-zinc-400 leading-relaxed border-t border-zinc-900/60">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black/40 py-12 px-6" id="landing-footer">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                <Music className="text-white fill-white/10" size={16} />
              </div>
              <span className="text-lg font-bold text-white">Melvora</span>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed">
              "Feel Every Beat." Melvora is a high-performance audio streaming client dedicated to providing custom soundscapes, robust local user playlist management, and clean roles-based system administration.
            </p>
            <div className="flex items-center gap-3 text-zinc-500">
              <a href="#" className="hover:text-purple-400 transition-colors"><Twitter size={16} /></a>
              <a href="#" className="hover:text-purple-400 transition-colors"><Instagram size={16} /></a>
              <a href="#" className="hover:text-purple-400 transition-colors"><Github size={16} /></a>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-4">Platform</h5>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li><a href="#trending" className="hover:text-white transition-colors">Trending Now</a></li>
              <li><a href="#genres" className="hover:text-white transition-colors">Browse Genres</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Features List</a></li>
              <li><a onClick={onNavigateToApp} className="hover:text-white transition-colors cursor-pointer">Live Player</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-4">Roles & RBAC</h5>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li><a onClick={onOpenAuth} className="hover:text-white transition-colors cursor-pointer">Register Free</a></li>
              <li><a onClick={onOpenAuth} className="hover:text-white transition-colors cursor-pointer">Creator Dashboard</a></li>
              <li><a onClick={onNavigateToApp} className="hover:text-white transition-colors cursor-pointer">Owner/SuperAdmin log</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-4">Legal & Support</h5>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Copyright Infringement</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Customer Support</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-zinc-900 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <p>© 2026 Melvora Inc. All Rights Reserved. Feel every beat with high-fidelity streams.</p>
          <div className="flex items-center gap-1">
            <span>Powered securely by</span>
            <span className="text-purple-600 font-semibold">Firebase Firestore</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
