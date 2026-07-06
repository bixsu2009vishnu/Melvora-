import { Home, Search, Library, User, ShieldAlert, Music, LogOut, Settings, MessageSquare } from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  userProfile: UserProfile | null;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export default function Sidebar({ currentTab, onChangeTab, userProfile, onLogout, onOpenAuth }: SidebarProps) {
  const isAdminOrOwner = userProfile?.role === 'Admin' || userProfile?.role === 'Owner';

  const menuItems = [
    { id: 'home', label: 'Home', icon: <Home size={18} /> },
    { id: 'search', label: 'Search', icon: <Search size={18} /> },
    { id: 'library', label: 'My Library', icon: <Library size={18} /> },
    { id: 'community', label: 'Community Lounge', icon: <MessageSquare size={18} /> },
    { id: 'profile', label: 'Account Profile', icon: <User size={18} /> },
  ];

  if (isAdminOrOwner) {
    menuItems.push({ id: 'admin', label: 'Owner Panel', icon: <ShieldAlert size={18} className="text-purple-400" /> });
  }

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside 
        className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-900 text-zinc-300 p-6 shrink-0"
        id="desktop-sidebar"
      >
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8 cursor-pointer group" onClick={() => onChangeTab('home')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-black flex items-center justify-center shadow-lg shadow-purple-600/30 border border-purple-500/20 relative group-hover:scale-105 transition-all">
            <svg viewBox="0 0 100 100" className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,30,30,0.85)]" fill="currentColor">
              <path d="M15 80 L35 25 L50 45 L65 25 L85 80 L70 80 L57 42 L50 52 L43 42 L30 80 Z" />
              <path d="M50 63 L40 80 L60 80 Z" fill="#FF3B3B" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-display">Melvora</span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1.5" id="desktop-sidebar-nav">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 mb-3 font-display">Discover</p>
          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-250 cursor-pointer ${
                  isActive 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-semibold border border-purple-400/20 active-tab-glow' 
                    : 'hover:bg-zinc-900/60 hover:text-white text-zinc-400'
                }`}
                id={`sidebar-item-${item.id}`}
              >
                <div className={isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white'}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Footer Profile Status */}
        <div className="mt-auto border-t border-zinc-900 pt-5 space-y-3" id="sidebar-footer">
          {userProfile ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-1">
                <img 
                  src={userProfile.photoURL} 
                  alt={userProfile.displayName} 
                  className="w-10 h-10 rounded-xl object-cover bg-zinc-900 border border-zinc-800"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-white truncate">{userProfile.displayName}</h4>
                  <p className="text-[10px] text-purple-400 font-mono tracking-wide uppercase font-bold mt-0.5">{userProfile.role}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer"
                id="sidebar-logout-btn"
              >
                <LogOut size={14} />
                <span>Sign Out Account</span>
              </button>
            </div>
          ) : (
            <div className="p-3 bg-purple-950/20 border border-purple-900/30 rounded-xl">
              <h4 className="text-xs font-bold text-purple-300 font-display">Unlock Premium Audio</h4>
              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">Sign in to sync liked tracks, compile custom playlists, and access dashboard metrics.</p>
              <button 
                onClick={onOpenAuth}
                className="w-full mt-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold py-2.5 rounded-lg cursor-pointer transition-all neon-glow-btn"
                id="sidebar-signin-cta"
              >
                Connect Now
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE BOTTOM TAB NAVIGATION */}
      <nav 
        className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-900 backdrop-blur-md px-2 py-1.5 flex justify-around items-center text-zinc-400"
        id="mobile-bottom-tabs"
      >
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl cursor-pointer relative transition-all ${
                isActive ? 'text-white' : 'hover:text-white'
              }`}
              id={`mobile-tab-item-${item.id}`}
            >
              <div className={isActive ? 'scale-110 text-purple-400 transition-all drop-shadow-[0_0_10px_rgba(255,30,30,0.8)]' : 'text-zinc-500'}>
                {item.icon}
              </div>
              <span className={`text-[9px] mt-1 tracking-tight font-display ${isActive ? 'text-purple-400 font-semibold' : 'text-zinc-500'}`}>{item.label.split(' ')[0]}</span>
              {isActive && (
                <div className="absolute top-0 w-8 h-[2px] bg-purple-500 rounded-full shadow-[0_0_8px_#FF1E1E]" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
