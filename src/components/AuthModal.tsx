import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithPopup,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { auth, googleProvider, syncUserProfile } from '../firebase';
import { X, Mail, Lock, User, Chrome, ChevronRight, Music, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleResetState = () => {
    setError('');
    setMessage('');
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await syncUserProfile(result.user);
      if (profile.status === 'banned') {
        await auth.signOut();
        throw new Error('Your account has been banned by the administrator.');
      }
      onAuthSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        if (!email) throw new Error('Please enter your email address.');
        await sendPasswordResetEmail(auth, email);
        setMessage('A password reset link has been sent to your email.');
        setTimeout(() => {
          setIsForgotPassword(false);
          setError('');
          setMessage('');
        }, 4000);
      } else if (isSignUp) {
        if (!email || !password || !displayName) {
          throw new Error('Please fill in all fields.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        
        try {
          await sendEmailVerification(cred.user);
          setMessage('Account created! A verification email has been sent.');
        } catch (verifErr) {
          console.log("Could not send verification email", verifErr);
        }

        const profile = await syncUserProfile(cred.user);
        onAuthSuccess(profile);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        if (!email || !password) {
          throw new Error('Please enter both email and password.');
        }
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const profile = await syncUserProfile(cred.user);
        
        if (profile.status === 'banned') {
          await auth.signOut();
          throw new Error('Your account has been banned by the administrator.');
        }
        
        onAuthSuccess(profile);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errMsg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = 'An account with this email already exists.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          id="auth-backdrop"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl text-zinc-100"
          id="auth-modal"
        >
          {/* Glowing Top Ambient */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-purple-600/30 blur-xl rounded-full" />

          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            id="auth-close-btn"
          >
            <X size={20} />
          </button>

          {/* Logo Title */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-black flex items-center justify-center shadow-lg shadow-purple-600/30 border border-purple-500/20 mb-3">
              <svg viewBox="0 0 100 100" className="w-7 h-7 text-white drop-shadow-[0_0_6px_rgba(255,30,30,0.85)]" fill="currentColor">
                <path d="M15 80 L35 25 L50 45 L65 25 L85 80 L70 80 L57 42 L50 52 L43 42 L30 80 Z" />
                <path d="M50 63 L40 80 L60 80 Z" fill="#FF3B3B" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-display">
              {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              {isForgotPassword 
                ? 'Enter your email to receive a recovery link' 
                : isSignUp 
                  ? 'Join Melvora and feel every beat' 
                  : 'Log in to stream premium audio'
              }
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-400 text-sm flex items-start gap-2"
              id="auth-error-msg"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-purple-950/40 border border-purple-800/40 text-purple-300 text-sm"
              id="auth-success-msg"
            >
              {message}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && !isForgotPassword && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Display Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    <User size={18} />
                  </span>
                  <input 
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-all"
                    id="auth-display-name-input"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Mail size={18} />
                </span>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-all"
                  id="auth-email-input"
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</label>
                  {!isSignUp && (
                    <button 
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setError(''); setMessage(''); }}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      id="auth-forgot-pw-btn"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Lock size={18} />
                  </span>
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-all"
                    id="auth-password-input"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-purple-600/20 active:scale-95 transition-all text-sm flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              id="auth-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {isForgotPassword ? 'Send Recovery Link' : isSignUp ? 'Create Free Account' : 'Log In'}
                  </span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Separator */}
          {!isForgotPassword && (
            <>
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-zinc-800" />
                <span className="px-3 text-xs text-zinc-500 uppercase tracking-wider">or continue with</span>
                <div className="flex-1 border-t border-zinc-800" />
              </div>

              {/* Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:text-white transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                id="auth-google-btn"
              >
                <Chrome size={18} className="text-red-400" />
                <span>Google Account</span>
              </button>
            </>
          )}

          {/* Modal Footer Link toggles */}
          <div className="mt-6 text-center text-sm text-zinc-400">
            {isForgotPassword ? (
              <button 
                onClick={() => { setIsForgotPassword(false); handleResetState(); }}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                id="auth-back-to-login"
              >
                Back to Login
              </button>
            ) : isSignUp ? (
              <p>
                Already have an account?{' '}
                <button 
                  onClick={() => { setIsSignUp(false); handleResetState(); }}
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  id="auth-toggle-login"
                >
                  Log In
                </button>
              </p>
            ) : (
              <p>
                New to Melvora?{' '}
                <button 
                  onClick={() => { setIsSignUp(true); handleResetState(); }}
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  id="auth-toggle-signup"
                >
                  Create free account
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
