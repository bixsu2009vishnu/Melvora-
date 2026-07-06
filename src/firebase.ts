import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDoc, 
  getDocFromServer,
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment,
  writeBatch
} from 'firebase/firestore';
import { UserProfile, Song, Artist, Album, Playlist, Favorite, HistoryRecord, AdConfig, HomepageConfig, UserRole } from './types';

// Load values directly from the applet configuration to ensure proper linkage
const firebaseConfig = {
  projectId: "fine-axle-qn50x",
  appId: "1:523791499495:web:263a6f35854f293b362242",
  apiKey: "AIzaSyBi2xRHg9jV20_lMHTlpZi5uYP9r-40eFw",
  authDomain: "fine-axle-qn50x.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-dc7d8b8c-138f-4a5d-a0eb-541960d3a734",
  storageBucket: "fine-axle-qn50x.firebasestorage.app",
  messagingSenderId: "523791499495",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with the custom database ID provisioned as the third parameter
export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId || '(default)');

// Initial seed data definition
export const SEED_ARTISTS: Artist[] = [
  {
    id: 'art-1',
    name: 'Kevin MacLeod',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    bio: 'Kevin MacLeod is an American composer and music producer. He has composed over 2,000 royalty-free library music pieces, licensed under Creative Commons, making his work exceptionally famous in gaming, cinema, and digital media.',
    monthlyListeners: 1500000,
    verified: true,
    createdAt: new Date().toISOString()
  }
];

export const SEED_ALBUMS: Album[] = [
  {
    id: 'alb-1',
    name: 'Comical & Playful Works',
    artistId: 'art-1',
    artistName: 'Kevin MacLeod',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
    genre: 'Instrumental',
    releaseYear: 2014,
    songsCount: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'alb-2',
    name: 'Cinematic & Mystery Compositions',
    artistId: 'art-1',
    artistName: 'Kevin MacLeod',
    coverUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=400&q=80',
    genre: 'Cinematic',
    releaseYear: 2015,
    songsCount: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'alb-3',
    name: 'Electronic Soundscapes',
    artistId: 'art-1',
    artistName: 'Kevin MacLeod',
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80',
    genre: 'Electronic',
    releaseYear: 2016,
    songsCount: 2,
    createdAt: new Date().toISOString()
  }
];

export const SEED_SONGS: Song[] = [
  {
    id: 'sng-1',
    title: 'Monkeys Spinning Monkeys',
    artistId: 'art-1',
    artistName: 'Kevin MacLeod',
    albumId: 'alb-1',
    albumName: 'Comical & Playful Works',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Kevin_MacLeod_-_Monkeys_Spinning_Monkeys.ogg',
    coverUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
    duration: 125,
    genre: 'Instrumental',
    playsCount: 8940500,
    likesCount: 450900,
    isFeatured: true,
    lyrics: `[00:01.00] (Bright playful synthesizer melodies start)\n[00:15.00] (Whimsical woodwind instrumentation enters)\n[00:30.00] (A bouncy pizzicato string bassline joins)\n[00:45.00] (Flutes play a cheerful call-and-response)\n[01:00.00] (Xylophone and percussion accent the rhythm)\n[01:15.00] (Melodic line climbs with energetic bounce)\n[01:30.00] (Glockenspiel chime highlights the playful groove)\n[01:45.00] (Instrumentation scales back to core woodwinds)\n[02:00.00] (Fades out with a lingering cheerful tone)`,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sng-2',
    title: 'Scheming Weasel (Faster)',
    artistId: 'art-1',
    artistName: 'Kevin MacLeod',
    albumId: 'alb-1',
    albumName: 'Comical & Playful Works',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Kevin_MacLeod_-_Scheming_Weasel_%28faster_version%29.ogg',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&q=80',
    duration: 90,
    genre: 'Cinematic',
    playsCount: 6542100,
    likesCount: 320400,
    isFeatured: true,
    lyrics: `[00:01.00] (Fast pizzicato strings start)\n[00:12.00] (Playful oboe introduces the scheming main theme)\n[00:25.00] (Woodwinds double down on the fast-paced motif)\n[00:38.00] (Snare rolls build tension in a comical march)\n[00:50.00] (Strings take the lead with rapid rising runs)\n[01:05.00] (The full ensemble joins for a crescendo)\n[01:18.00] (Pizzicato fades back to a solo clarinet theme)\n[01:28.00] (Ending with a final bright comic sting)`,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sng-3',
    title: 'Carefree',
    artistId: 'art-1',
    artistName: 'Kevin MacLeod',
    albumId: 'alb-2',
    albumName: 'Cinematic & Mystery Compositions',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Kevin_MacLeod_-_Carefree.ogg',
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80',
    duration: 182,
    genre: 'Acoustic',
    playsCount: 4210300,
    likesCount: 215400,
    isFeatured: true,
    lyrics: `[00:01.00] (Light, airy acoustic picking starts)\n[00:15.00] (Uplifting acoustic guitar strumming enters)\n[00:35.00] (Bright whistling and woodblock percussion join)\n[00:55.00] (A gentle string bass keeps the carefree tempo)\n[01:15.00] (Warm accordion accents in the background)\n[01:35.00] (Guitar solo plays the sweet folk melody)\n[02:00.00] (Whistling theme returns with playful harmony)\n[02:25.00] (Soft, relaxed acoustic notes slow down)\n[02:50.00] (Fades out into a cozy, warm acoustic resonance)`,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sng-4',
    title: 'Sneaky Snitch',
    artistId: 'art-1',
    artistName: 'Kevin MacLeod',
    albumId: 'alb-2',
    albumName: 'Cinematic & Mystery Compositions',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Kevin_MacLeod_-_Sneaky_Snitch.ogg',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
    duration: 135,
    genre: 'Cinematic',
    playsCount: 7421800,
    likesCount: 412500,
    isFeatured: false,
    lyrics: `[00:01.00] (Mysterious, light pizzicato strings start)\n[00:15.00] (A sneaky bassoon plays the sly theme)\n[00:30.00] (Tiptoeing woodwinds and triangle stings join)\n[00:45.00] (Rhythm builds with a subtle xylophone bounce)\n[01:00.00] (Full comical woodwind harmony enters)\n[01:15.00] (Sneaky pizzicato strings resume their march)\n[01:35.00] (A quiet oboe staccato plays alone)\n[01:55.00] (The piece stings abruptly on a single note)\n[02:10.00] (Echoing pizzicato fades into shadows)`,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sng-5',
    title: 'Cipher',
    artistId: 'art-1',
    artistName: 'Kevin MacLeod',
    albumId: 'alb-3',
    albumName: 'Electronic Soundscapes',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Kevin_MacLeod_-_Cipher.ogg',
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80',
    duration: 231,
    genre: 'Electronic',
    playsCount: 3120500,
    likesCount: 165000,
    isFeatured: false,
    lyrics: `[00:01.00] (Deep ambient electronic pads start)\n[00:20.00] (Subtle rhythmic drum machine pattern enters)\n[00:40.00] (Dreamy futuristic synthesizer lead begins)\n[01:00.00] (A warm electric bassline grooves along)\n[01:25.00] (Spacey glitch and echoing sound effects)\n[01:50.00] (Smooth synth solo takes over the soundscape)\n[02:15.00] (Lofi electronic beats relax and space out)\n[02:45.00] (Main digital theme plays one final cycle)\n[03:15.00] (Beat drops out leaving long ambient trails)\n[03:45.00] (Deep synthesizer chords fade out slowly)`,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sng-6',
    title: 'Spazzmatica Polka',
    artistId: 'art-1',
    artistName: 'Kevin MacLeod',
    albumId: 'alb-3',
    albumName: 'Electronic Soundscapes',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Kevin_MacLeod_-_Spazzmatica_Polka.ogg',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
    duration: 95,
    genre: 'Electronic',
    playsCount: 2941000,
    likesCount: 125000,
    isFeatured: false,
    lyrics: `[00:01.00] (Fast, frantic 8-bit digital synth bleeps start)\n[00:10.00] (High-speed upbeat polka rhythm enters)\n[00:25.00] (Catchy synth brass melody plays the main loop)\n[00:40.00] (Rapid percussive hits build energetic drive)\n[00:55.00] (A whimsical solo synthesizer breakdowns the groove)\n[01:10.00] (Polka beat kicks back in at full speed)\n[01:25.00] (Fast scale run builds to a high pitch)\n[01:32.00] (Ending with a sudden digital bleep)`,
    createdAt: new Date().toISOString()
  }
];

// Automatically seeds the database if collections are empty or contains outdated SoundHelix songs. Run once on boot!
export async function seedDatabaseIfEmpty() {
  try {
    const songsCol = collection(db, 'songs');
    const songSnap = await getDocs(query(songsCol, limit(1)));
    
    let needsUpgrade = false;
    if (!songSnap.empty) {
      const firstDoc = songSnap.docs[0].data() as Song;
      if (firstDoc.audioUrl && firstDoc.audioUrl.includes('soundhelix.com')) {
        needsUpgrade = true;
      }
    }

    if (songSnap.empty || needsUpgrade) {
      // Check if we are signed in before seeding, to avoid permission errors
      if (!auth.currentUser) {
        console.log("No songs found or database needs upgrade, but no user signed in. Seeding skipped until an authorized user logs in.");
        return;
      }
      
      console.log(needsUpgrade 
        ? "Outdated SoundHelix files found. Upgrading database with production-ready royalty-free tracks..." 
        : "No songs found in Firestore. Seeding default data...");
      
      // If upgrading, clean up old keys that won't be overwritten
      if (needsUpgrade) {
        console.log("Upgrading outdated dummy database collections...");
        const oldArtistIds = ['art-2', 'art-3', 'art-4', 'art-5'];
        const oldAlbumIds = ['alb-4', 'alb-5'];
        
        for (const id of oldArtistIds) {
          try { await deleteDoc(doc(db, 'artists', id)); } catch(e) {}
        }
        for (const id of oldAlbumIds) {
          try { await deleteDoc(doc(db, 'albums', id)); } catch(e) {}
        }
      }

      // Seed Artists
      for (const artist of SEED_ARTISTS) {
        await setDoc(doc(db, 'artists', artist.id), artist);
      }
      
      // Seed Albums
      for (const album of SEED_ALBUMS) {
        await setDoc(doc(db, 'albums', album.id), album);
      }
      
      // Seed Songs
      for (const song of SEED_SONGS) {
        await setDoc(doc(db, 'songs', song.id), song);
      }

      // Seed Default Ad Config
      const adConf: AdConfig = {
        adsEnabled: false,
        bannerAdsEnabled: false,
        interstitialAdsEnabled: false,
        rewardedAdsEnabled: false,
        admobId: 'ca-pub-3940256099942544'
      };
      await setDoc(doc(db, 'adConfig', 'global'), adConf);

      // Seed Default Homepage Config
      const homeConf: HomepageConfig = {
        bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
        tagline: 'Feel Every Beat.',
        announcement: 'Welcome to Melvora! Experience high-fidelity royalty-free audio streams featuring the legendary compositions of Kevin MacLeod.',
        logoUrl: ''
      };
      await setDoc(doc(db, 'homepageConfig', 'global'), homeConf);

      console.log("Database seeded/upgraded successfully with artists, albums, songs, and system configs.");
    } else {
      console.log("Songs already exist and are up to date in Firestore. Skipping seed.");
    }
  } catch (error) {
    console.error("Error checking or seeding Firestore database:", error);
  }
}

// User profiles synchronization in Firestore
export async function syncUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);

  const isOwnerEmail = user.email === 'mr.vishnu4321@gmail.com';
  
  if (docSnap.exists()) {
    const data = docSnap.data() as UserProfile;
    let needsUpdate = false;
    const updated = { ...data };

    // Enforce permanent Owner privileges and immunities
    if (isOwnerEmail) {
      if (updated.role !== 'Owner') {
        updated.role = 'Owner';
        needsUpdate = true;
      }
      if (updated.plan !== 'premium') {
        updated.plan = 'premium';
        needsUpdate = true;
      }
      if (updated.status !== 'active') {
        updated.status = 'active';
        needsUpdate = true;
      }
    }

    // Set default fields if missing
    if (updated.plan === undefined) {
      updated.plan = isOwnerEmail ? 'premium' : 'free';
      needsUpdate = true;
    }
    if (!updated.preferredBadge) {
      updated.preferredBadge = 'crown';
      needsUpdate = true;
    }

    // Handle automated subscription expiration check
    if (!isOwnerEmail && updated.plan === 'premium' && updated.subscriptionExpiresAt) {
      const expirationDate = new Date(updated.subscriptionExpiresAt);
      if (expirationDate < new Date()) {
        updated.plan = 'free';
        updated.subscriptionStatus = 'expired';
        needsUpdate = true;
        await logUserActivity(user.uid, user.email || '', 'Subscription Expired', 'Subscription duration elapsed. Plan reverted to Free.');
      }
    }

    if (needsUpdate) {
      updated.updatedAt = new Date().toISOString();
      await updateDoc(userRef, { 
        role: updated.role,
        plan: updated.plan,
        status: updated.status,
        preferredBadge: updated.preferredBadge,
        subscriptionStatus: updated.subscriptionStatus || null,
        updatedAt: updated.updatedAt
      });
    }

    return updated;
  } else {
    // Determine the role - Owner role for mr.vishnu4321@gmail.com, otherwise standard User
    const role: UserRole = isOwnerEmail ? 'Owner' : 'User';
    const plan = isOwnerEmail ? 'premium' : 'free';
    
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Melvora Listener',
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`,
      role,
      status: 'active',
      plan,
      preferredBadge: 'crown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(userRef, newProfile);
    
    // Log user creation
    await logUserActivity(newProfile.uid, newProfile.email, 'Register', `User registered and logged in with role: ${role}`);
    
    return newProfile;
  }
}

// Log activities for the Admin audit trail
export async function logUserActivity(userId: string, email: string, action: string, details: string) {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      userId,
      userEmail: email,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Could not write activity log:", e);
  }
}

// Trigger automatic seed on load
seedDatabaseIfEmpty();
