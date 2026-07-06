import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  addDoc 
} from 'firebase/firestore';
import { db, logUserActivity } from '../firebase';
import { 
  FolderHeart, 
  Plus, 
  Trash2, 
  Edit, 
  Play, 
  FileEdit, 
  X, 
  Music, 
  FolderPlus, 
  Check,
  Disc 
} from 'lucide-react';
import { Playlist, Song, UserProfile } from '../types';

interface PlaylistManagerProps {
  userProfile: UserProfile | null;
  allSongs: Song[];
  onPlaySong: (song: Song, songList: Song[]) => void;
  playlists: Playlist[];
  onRefreshPlaylists: () => void;
}

export default function PlaylistManager({ 
  userProfile, 
  allSongs, 
  onPlaySong, 
  playlists, 
  onRefreshPlaylists 
}: PlaylistManagerProps) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  const [loading, setLoading] = useState(false);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    if (!name.trim()) return;

    setLoading(true);
    try {
      const playlistId = 'pl-' + Math.random().toString(36).substr(2, 9);
      const defaultCover = coverUrl.trim() || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80';
      
      const newPlaylist: Playlist = {
        id: playlistId,
        name,
        description,
        coverUrl: defaultCover,
        ownerId: userProfile.uid,
        ownerName: userProfile.displayName,
        isPublic: true,
        songIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'playlists', playlistId), newPlaylist);
      await logUserActivity(userProfile.uid, userProfile.email, 'Create Playlist', `Created custom playlist: "${name}".`);
      
      setIsCreating(false);
      setName('');
      setDescription('');
      setCoverUrl('');
      
      onRefreshPlaylists();
    } catch (e) {
      console.error(e);
      alert("Error creating playlist.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string, playlistName: string) => {
    if (!userProfile) return;
    if (!window.confirm(`Are you sure you want to delete the playlist "${playlistName}" permanently?`)) return;

    try {
      await deleteDoc(doc(db, 'playlists', playlistId));
      await logUserActivity(userProfile.uid, userProfile.email, 'Delete Playlist', `Deleted playlist: "${playlistName}".`);
      
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null);
      }
      onRefreshPlaylists();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveSongFromPlaylist = async (playlist: Playlist, songId: string) => {
    if (!userProfile) return;
    const updatedSongIds = playlist.songIds.filter(id => id !== songId);
    
    try {
      const playlistRef = doc(db, 'playlists', playlist.id);
      await updateDoc(playlistRef, { 
        songIds: updatedSongIds,
        updatedAt: new Date().toISOString() 
      });
      
      const updatedPlaylist = { ...playlist, songIds: updatedSongIds };
      setSelectedPlaylist(updatedPlaylist);
      onRefreshPlaylists();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    const playlistSongs = allSongs.filter(s => playlist.songIds.includes(s.id));
    if (playlistSongs.length > 0) {
      onPlaySong(playlistSongs[0], playlistSongs);
    } else {
      alert("This playlist has no songs yet. Go to Search or Browse to add tracks!");
    }
  };

  // Get songs inside currently selected playlist
  const currentPlaylistSongs = selectedPlaylist 
    ? allSongs.filter(s => selectedPlaylist.songIds.includes(s.id))
    : [];

  if (!userProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-zinc-950 text-zinc-100">
        <div className="w-16 h-16 rounded-full bg-purple-600/10 flex items-center justify-center text-purple-400 mb-4 border border-purple-600/20">
          <FolderHeart size={30} />
        </div>
        <h3 className="text-xl font-bold">Sign In Required</h3>
        <p className="text-zinc-400 text-sm mt-2 max-w-sm">Please sign in to view, create, and manage your custom music playlists.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-zinc-950 text-zinc-100 pb-28 font-sans" id="playlists-root">
      
      {/* Detail view of a playlist */}
      {selectedPlaylist ? (
        <div className="space-y-6" id="playlist-details-view">
          <button 
            onClick={() => setSelectedPlaylist(null)}
            className="text-zinc-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            ← Back to All Playlists
          </button>

          {/* Playlist Header card */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden shadow-2xl bg-zinc-900 shrink-0 border border-zinc-800">
              <img 
                src={selectedPlaylist.coverUrl} 
                alt={selectedPlaylist.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-center sm:text-left min-w-0 flex-1">
              <span className="text-[10px] text-purple-400 uppercase font-bold tracking-widest font-mono">Custom Playlist</span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mt-1">{selectedPlaylist.name}</h1>
              <p className="text-zinc-400 text-sm mt-2 leading-relaxed font-sans">{selectedPlaylist.description || 'No description provided.'}</p>
              
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-6 flex-wrap">
                <button 
                  onClick={() => handlePlayPlaylist(selectedPlaylist)}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-6 py-2.5 rounded-full flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
                  id="playlist-play-btn"
                >
                  <Play size={15} className="fill-current" />
                  <span>Play Playlist</span>
                </button>
                <button 
                  onClick={() => handleDeletePlaylist(selectedPlaylist.id, selectedPlaylist.name)}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-red-900/40 text-zinc-400 hover:text-red-400 text-xs font-bold px-4 py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-colors"
                  id="playlist-delete-btn"
                >
                  <Trash2 size={13} />
                  <span>Delete Playlist</span>
                </button>
              </div>
            </div>
          </div>

          {/* Songs inside selected playlist */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Tracks inside playlist</h3>
            
            <div className="space-y-2" id="playlist-songs-list">
              {currentPlaylistSongs.length > 0 ? (
                currentPlaylistSongs.map((song, index) => (
                  <div 
                    key={song.id}
                    onClick={() => onPlaySong(song, currentPlaylistSongs)}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/10 hover:bg-zinc-900/40 border border-zinc-900 hover:border-zinc-850 cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-xs font-mono text-zinc-600 w-4 text-center">{index + 1}</span>
                      <img 
                        src={song.coverUrl} 
                        alt={song.title} 
                        className="w-10 h-10 rounded-lg object-cover bg-zinc-900 border border-zinc-800 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs md:text-sm font-semibold text-white truncate group-hover:text-purple-400 transition-colors">{song.title}</h4>
                        <p className="text-[10px] md:text-xs text-zinc-400 truncate">{song.artistName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSongFromPlaylist(selectedPlaylist, song.id);
                        }}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg cursor-pointer transition-all"
                        title="Remove from playlist"
                        id={`playlist-remove-track-${song.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 border border-zinc-900 rounded-xl text-center flex flex-col items-center justify-center bg-zinc-900/10 p-6">
                  <Music className="text-zinc-600 mb-2" size={24} />
                  <p className="text-sm text-zinc-400">This playlist is currently empty.</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs">To add songs, go to the Home stream or Search tab, and click the "+" button on any track.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8" id="playlists-grid-view">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-white">Custom Playlists</h1>
              <p className="text-zinc-400 text-xs mt-1">Compile custom soundtracks for different sessions.</p>
            </div>
            
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/15"
              id="create-playlist-trigger"
            >
              <Plus size={15} />
              <span>Create Playlist</span>
            </button>
          </div>

          {/* Form Modal overlay for creating playlist */}
          {isCreating && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCreating(false)} />
              <div className="relative bg-zinc-950 border border-zinc-900 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-white flex items-center gap-2"><FolderPlus size={18} className="text-purple-400" /> New Custom Playlist</h3>
                  <button onClick={() => setIsCreating(false)} className="text-zinc-400 hover:text-white"><X size={18} /></button>
                </div>

                <form onSubmit={handleCreatePlaylist} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Playlist Name *</label>
                    <input 
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Late Night Hack Sessions"
                      className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Dreamy beats, cybernetic hums, and cozy synthwaves."
                      rows={3}
                      className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Cover Image URL (Optional)</label>
                    <input 
                      type="url"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-zinc-900 border border-zinc-900 focus:border-purple-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={15} /><span>Create Playlist</span></>}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Grid of custom playlists */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" id="playlists-grid">
            {playlists.length > 0 ? (
              playlists.map((playlist) => (
                <div 
                  key={playlist.id}
                  onClick={() => setSelectedPlaylist(playlist)}
                  className="group relative bg-zinc-900/20 hover:bg-zinc-900/50 border border-zinc-900 hover:border-zinc-850 rounded-xl p-3.5 cursor-pointer transition-all"
                  id={`playlist-card-${playlist.id}`}
                >
                  <div className="aspect-square w-full rounded-lg overflow-hidden bg-zinc-850 relative mb-3">
                    <img 
                      src={playlist.coverUrl} 
                      alt={playlist.name} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <Play size={16} className="fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-white truncate">{playlist.name}</h3>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">{playlist.songIds.length} tracks • By {playlist.ownerName}</p>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 border border-zinc-900 rounded-2xl text-center flex flex-col items-center justify-center bg-zinc-900/10 p-6">
                <Disc className="text-zinc-600 mb-2 animate-pulse" size={28} />
                <p className="text-sm text-zinc-400">No playlists available.</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">Compile custom tracks by pressing the "Create Playlist" button on top.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
