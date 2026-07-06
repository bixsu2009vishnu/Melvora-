import { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Shuffle, 
  Repeat, 
  Volume2, 
  VolumeX, 
  ListMusic, 
  AlignLeft, 
  Maximize2, 
  Minimize2, 
  Heart, 
  ChevronDown, 
  Music, 
  CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Song } from '../types';

interface MusicPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextSong: () => void;
  onPrevSong: () => void;
  shuffleActive: boolean;
  onToggleShuffle: () => void;
  repeatMode: 'off' | 'all' | 'one';
  onToggleRepeat: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  progress: number;
  duration: number;
  onSeek: (seconds: number) => void;
  likedSongIds: string[];
  onToggleLike: (songId: string) => void;
  queue: Song[];
  queueIndex: number;
  onPlayFromQueue: (index: number) => void;
  lyricsOpen: boolean;
  setLyricsOpen: (open: boolean) => void;
  queueOpen: boolean;
  setQueueOpen: (open: boolean) => void;
}

export default function MusicPlayer({
  currentSong,
  isPlaying,
  onTogglePlay,
  onNextSong,
  onPrevSong,
  shuffleActive,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
  volume,
  onVolumeChange,
  progress,
  duration,
  onSeek,
  likedSongIds,
  onToggleLike,
  queue,
  queueIndex,
  onPlayFromQueue,
  lyricsOpen,
  setLyricsOpen,
  queueOpen,
  setQueueOpen
}: MusicPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.5);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleVolumeIconClick = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      onVolumeChange(0);
    } else {
      onVolumeChange(prevVolume);
    }
  };

  const isLiked = currentSong ? likedSongIds.includes(currentSong.id) : false;

  // Sync lyrics parsing
  const parseLyrics = (lyricText?: string) => {
    if (!lyricText) return [];
    return lyricText.split('\n').map(line => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
      if (match) {
        const min = parseInt(match[1]);
        const sec = parseInt(match[2]);
        const totalSec = min * 60 + sec;
        return { time: totalSec, text: match[4].trim() };
      }
      return { time: -1, text: line };
    });
  };

  const lyricsLines = currentSong ? parseLyrics(currentSong.lyrics) : [];

  if (!currentSong) return null;

  return (
    <>
      {/* PERSISTENT BOTTOM PLAYER */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-900 px-4 md:px-6 py-3 backdrop-blur-md text-zinc-100 shadow-2xl h-18 md:h-22 flex items-center justify-between"
        id="persistent-music-player"
      >
        {/* Track Details */}
        <div className="flex items-center gap-3 w-1/3 min-w-0" id="player-track-details">
          <div 
            onClick={() => setIsFullscreen(true)}
            className="w-10 h-10 md:w-14 md:h-14 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-zinc-800 cursor-pointer group relative"
          >
            <img 
              src={currentSong.coverUrl} 
              alt={currentSong.title} 
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
              <Maximize2 size={12} className="text-white" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h4 
              onClick={() => setIsFullscreen(true)}
              className="text-xs md:text-sm font-semibold text-white truncate cursor-pointer hover:text-purple-400 transition-colors"
            >
              {currentSong.title}
            </h4>
            <p className="text-[10px] md:text-xs text-zinc-400 truncate mt-0.5">{currentSong.artistName}</p>
          </div>
          <button
            onClick={() => onToggleLike(currentSong.id)}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isLiked ? 'text-purple-500 hover:text-purple-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            id="player-like-btn"
          >
            <Heart size={16} className={isLiked ? 'fill-current' : ''} />
          </button>
        </div>

        {/* Playback Controls & Progress */}
        <div className="flex flex-col items-center w-1/3" id="player-main-controls">
          <div className="flex items-center gap-4.5 md:gap-6">
            <button 
              onClick={onToggleShuffle}
              className={`text-xs p-1 rounded-full transition-colors cursor-pointer ${
                shuffleActive ? 'text-purple-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Shuffle"
              id="player-shuffle-btn"
            >
              <Shuffle size={14} />
            </button>
            <button 
              onClick={onPrevSong}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Previous Song"
              id="player-prev-btn"
            >
              <SkipBack size={18} />
            </button>
            <button 
              onClick={onTogglePlay}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-500 hover:scale-105 active:scale-95 transition-all shadow-md shadow-purple-600/20 cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
              id="player-play-btn"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>
            <button 
              onClick={onNextSong}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Next Song"
              id="player-next-btn"
            >
              <SkipForward size={18} />
            </button>
            <button 
              onClick={onToggleRepeat}
              className={`relative p-1 rounded-full transition-colors cursor-pointer ${
                repeatMode !== 'off' ? 'text-purple-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title={`Repeat: ${repeatMode}`}
              id="player-repeat-btn"
            >
              <Repeat size={14} />
              {repeatMode === 'one' && (
                <span className="absolute -top-1 -right-1.5 bg-purple-600 text-white text-[7px] font-bold px-0.5 rounded-full min-w-3 text-center">1</span>
              )}
            </button>
          </div>

          {/* Seek Bar */}
          <div className="hidden md:flex items-center gap-3 w-full max-w-md mt-2 text-[10px] text-zinc-500 font-mono">
            <span>{formatTime(progress)}</span>
            <input 
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-600 hover:accent-purple-500 outline-none"
              id="player-seek-slider"
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Action Toggles & Volume */}
        <div className="flex items-center justify-end gap-3.5 w-1/3" id="player-utility-controls">
          <button 
            onClick={() => setLyricsOpen(!lyricsOpen)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              lyricsOpen ? 'text-purple-400 bg-purple-950/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
            title="Lyrics"
            id="player-lyrics-toggle"
          >
            <AlignLeft size={16} />
          </button>
          <button 
            onClick={() => setQueueOpen(!queueOpen)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              queueOpen ? 'text-purple-400 bg-purple-950/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
            title="Queue"
            id="player-queue-toggle"
          >
            <ListMusic size={16} />
          </button>

          {/* Volume controls */}
          <div className="hidden md:flex items-center gap-2 text-zinc-400" id="player-volume-container">
            <button 
              onClick={handleVolumeIconClick}
              className="p-1 hover:text-white transition-colors cursor-pointer"
            >
              {volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <input 
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-16 lg:w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-600 outline-none"
              id="player-volume-slider"
            />
          </div>

          <button 
            onClick={() => setIsFullscreen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/40 cursor-pointer"
            title="Full Screen View"
            id="player-fullscreen-toggle"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* FULL-SCREEN OVERLAY PLAYER */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="fixed inset-0 z-50 bg-zinc-950 text-white flex flex-col p-6 overflow-hidden select-none"
            id="fullscreen-player-overlay"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-center z-10">
              <button 
                onClick={() => setIsFullscreen(false)}
                className="p-3 bg-zinc-900 hover:bg-zinc-850 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
                id="fullscreen-close-btn"
              >
                <ChevronDown size={20} />
              </button>
              <div className="text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold font-sans">Now Streaming</p>
                <p className="text-xs text-purple-400 font-semibold mt-0.5 flex items-center justify-center gap-1">
                  <Music size={10} />
                  <span>Melvora premium audio</span>
                </p>
              </div>
              <div className="w-10 h-10" /> {/* Spacer */}
            </div>

            {/* Main Center content (Splits into artwork and lyrics if lyrics are open) */}
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 max-w-5xl mx-auto w-full overflow-hidden mt-6 pb-6">
              
              {/* Artwork */}
              <div className="flex flex-col items-center justify-center max-w-sm w-full shrink-0">
                <div className="aspect-square w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-2xl shadow-purple-600/30 border border-purple-500/20 bg-zinc-900 relative group">
                  <img 
                    src={currentSong.coverUrl} 
                    alt={currentSong.title} 
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isPlaying ? 'animate-[spin_40s_linear_infinite]' : ''}`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <span className="text-[10px] font-semibold text-purple-300 font-mono tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-purple-500/20 shadow-red-glow-soft">MELVORA HIFI</span>
                  </div>
                </div>

                <div className="text-center mt-6 w-full px-4">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate font-display">{currentSong.title}</h2>
                  <p className="text-sm text-purple-400 font-medium truncate mt-1">{currentSong.artistName}</p>
                  
                  {/* Animated Waveform Visualizer */}
                  <div className="flex items-center justify-center gap-1.5 h-12 mt-4" id="waveform-visualizer">
                    {[...Array(14)].map((_, i) => (
                      <div 
                        key={i}
                        className={`w-1 rounded-full bg-gradient-to-t from-purple-700 via-purple-500 to-purple-300 transition-all duration-300 ${
                          isPlaying ? 'wave-bar' : 'h-1.5 opacity-60'
                        }`}
                        style={{
                          animationDelay: `${i * 0.08}s`,
                          height: isPlaying ? undefined : '6px'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Lyrics Panel in Fullscreen (scrollable, interactive) */}
              <div className="flex-1 w-full max-h-[300px] md:max-h-[420px] overflow-y-auto pr-2 space-y-4 text-center md:text-left border-t md:border-t-0 md:border-l border-zinc-900 pt-6 md:pt-0 md:pl-8 scrollbar-thin" id="fullscreen-lyrics-pane">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Track Lyrics</h3>
                {lyricsLines.length > 0 ? (
                  lyricsLines.map((line, index) => {
                    const isPassed = progress >= line.time;
                    const isNext = index < lyricsLines.length - 1 ? progress < lyricsLines[index + 1].time : false;
                    const isActive = isPassed && (index === lyricsLines.length - 1 || progress < lyricsLines[index + 1].time);

                    return (
                      <p 
                        key={index}
                        onClick={() => line.time >= 0 && onSeek(line.time)}
                        className={`text-sm md:text-lg font-bold transition-all duration-300 cursor-pointer ${
                          isActive 
                            ? 'text-purple-400 scale-102 font-extrabold' 
                            : isPassed 
                              ? 'text-zinc-500' 
                              : 'text-zinc-600 hover:text-zinc-300'
                        }`}
                      >
                        {line.text}
                      </p>
                    );
                  })
                ) : (
                  <p className="text-sm text-zinc-500 italic">Lyrics not available for this song. Complete Admin setup to add lyrics.</p>
                )}
              </div>

            </div>

            {/* Bottom Controls */}
            <div className="mt-auto max-w-3xl mx-auto w-full pb-8 z-10 flex flex-col gap-6">
              
              {/* Seek Slider */}
              <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                <span>{formatTime(progress)}</span>
                <input 
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={progress}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-600 hover:accent-purple-500 outline-none"
                />
                <span>{formatTime(duration)}</span>
              </div>

              {/* Primary Buttons */}
              <div className="flex items-center justify-between px-6">
                <button
                  onClick={() => onToggleLike(currentSong.id)}
                  className={`p-3 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 transition-colors ${
                    isLiked ? 'text-purple-500' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Heart size={18} className={isLiked ? 'fill-current' : ''} />
                </button>

                <div className="flex items-center gap-6">
                  <button 
                    onClick={onToggleShuffle}
                    className={`p-2 rounded-full transition-colors ${
                      shuffleActive ? 'text-purple-400' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    <Shuffle size={18} />
                  </button>
                  <button 
                    onClick={onPrevSong}
                    className="p-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-full text-zinc-300 hover:text-white transition-all active:scale-95"
                  >
                    <SkipBack size={20} />
                  </button>
                  <button 
                    onClick={onTogglePlay}
                    className="w-16 h-16 rounded-full bg-purple-600 text-white flex items-center justify-center transition-all active:scale-95 shadow-red-glow-strong neon-glow-btn border border-purple-400"
                  >
                    {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                  </button>
                  <button 
                    onClick={onNextSong}
                    className="p-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-full text-zinc-300 hover:text-white transition-all active:scale-95"
                  >
                    <SkipForward size={20} />
                  </button>
                  <button 
                    onClick={onToggleRepeat}
                    className={`p-2 rounded-full transition-colors ${
                      repeatMode !== 'off' ? 'text-purple-400' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    <Repeat size={18} />
                  </button>
                </div>

                {/* Speaker Volume toggle */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleVolumeIconClick}
                    className="p-3 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
                  >
                    {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <input 
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-600 outline-none"
                  />
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
