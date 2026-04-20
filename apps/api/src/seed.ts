import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Song from './models/Song';

dotenv.config();

const SEED_SONGS = [
  // English — Pop / R&B
  {
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_Blinding_Lights.png',
    duration: 200,
    language: 'English',
    genre: ['Pop', 'Synthwave'],
    youtubeVideoId: '4NRXx6U8ABQ',
    playCount: 4200000000,
    releaseDate: new Date('2019-11-29'),
    isPublished: true,
  },
  {
    title: 'Starboy',
    artist: 'The Weeknd',
    album: 'Starboy',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/3/39/The_Weeknd_-_Starboy.png',
    duration: 230,
    language: 'English',
    genre: ['Pop', 'R&B'],
    youtubeVideoId: '34Na4j8AVgA',
    playCount: 3100000000,
    releaseDate: new Date('2016-09-22'),
    isPublished: true,
  },
  {
    title: 'Save Your Tears',
    artist: 'The Weeknd',
    album: 'After Hours',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_Blinding_Lights.png',
    duration: 215,
    language: 'English',
    genre: ['Pop', 'Synth-pop'],
    youtubeVideoId: 'XXYlFuWEuKI',
    playCount: 2800000000,
    releaseDate: new Date('2020-08-09'),
    isPublished: true,
  },
  {
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Shape_Of_You_%28Official_Single_Cover%29_by_Ed_Sheeran.png',
    duration: 234,
    language: 'English',
    genre: ['Pop', 'Dancehall'],
    youtubeVideoId: 'JGwWNGJdvx8',
    playCount: 6500000000,
    releaseDate: new Date('2017-01-06'),
    isPublished: true,
  },
  {
    title: 'Someone Like You',
    artist: 'Adele',
    album: '21',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/1/1b/Adele_-_21.png',
    duration: 285,
    language: 'English',
    genre: ['Pop', 'Soul'],
    youtubeVideoId: 'hLQl3WQQoQ0',
    playCount: 2900000000,
    releaseDate: new Date('2011-01-24'),
    isPublished: true,
  },
  {
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/4/4d/Queen_A_Night_At_The_Opera.png',
    duration: 354,
    language: 'English',
    genre: ['Rock', 'Progressive Rock'],
    youtubeVideoId: 'fJ9rUzIMcZQ',
    playCount: 2100000000,
    releaseDate: new Date('1975-10-31'),
    isPublished: true,
  },
  {
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/f/f5/Dua_Lipa_-_Future_Nostalgia_%28Official_Album_Cover%29.png',
    duration: 203,
    language: 'English',
    genre: ['Pop', 'Disco'],
    youtubeVideoId: 'TUVcZfQe-Kw',
    playCount: 1800000000,
    releaseDate: new Date('2020-03-27'),
    isPublished: true,
  },
  {
    title: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    album: 'F*ck Love 3: Over You',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/0/0c/The_Kid_Laroi_and_Justin_Bieber_-_Stay.png',
    duration: 141,
    language: 'English',
    genre: ['Pop', 'Dance Pop'],
    youtubeVideoId: 'kTJczUoc26U',
    playCount: 2500000000,
    releaseDate: new Date('2021-07-09'),
    isPublished: true,
  },

  // Hindi
  {
    title: 'Tum Hi Ho',
    artist: 'Arijit Singh',
    album: 'Aashiqui 2',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/9/97/Aashiqui_2.jpg',
    duration: 262,
    language: 'Hindi',
    genre: ['Bollywood', 'Romance'],
    youtubeVideoId: 'IJq0yyWug1k',
    playCount: 1500000000,
    releaseDate: new Date('2013-04-16'),
    isPublished: true,
  },
  {
    title: 'Kesariya',
    artist: 'Arijit Singh',
    album: 'Brahmastra',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/9/95/Kesariya_cover.jpg',
    duration: 268,
    language: 'Hindi',
    genre: ['Bollywood', 'Pop'],
    youtubeVideoId: 'BddP6PYo2gs',
    playCount: 900000000,
    releaseDate: new Date('2022-07-17'),
    isPublished: true,
  },
  {
    title: 'Channa Mereya',
    artist: 'Arijit Singh',
    album: 'Ae Dil Hai Mushkil',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/e/e8/Ae_Dil_Hai_Mushkil_poster.jpg',
    duration: 289,
    language: 'Hindi',
    genre: ['Bollywood', 'Romantic'],
    youtubeVideoId: 'bzSTpdcs-EI',
    playCount: 1200000000,
    releaseDate: new Date('2016-10-28'),
    isPublished: true,
  },
  {
    title: 'Apna Bana Le',
    artist: 'Arijit Singh',
    album: 'Bhediya',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/b/b7/Bhediya_film_poster.jpg',
    duration: 275,
    language: 'Hindi',
    genre: ['Bollywood', 'Romantic'],
    youtubeVideoId: 'rlqFPjJGjXA',
    playCount: 700000000,
    releaseDate: new Date('2022-11-25'),
    isPublished: true,
  },

  // Punjabi
  {
    title: 'Excuses',
    artist: 'AP Dhillon',
    album: 'Hidden Gems',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/5/5c/Hidden_Gems_AP_Dhillon.png',
    duration: 210,
    language: 'Punjabi',
    genre: ['Punjabi Pop', 'Hip-Hop'],
    youtubeVideoId: 'VFpBLOwUfMg',
    playCount: 600000000,
    releaseDate: new Date('2021-05-07'),
    isPublished: true,
  },
  {
    title: 'Brown Munde',
    artist: 'AP Dhillon',
    album: 'Brown Munde',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/5/5c/Hidden_Gems_AP_Dhillon.png',
    duration: 195,
    language: 'Punjabi',
    genre: ['Punjabi Pop', 'Trap'],
    youtubeVideoId: 'VNs_cCtdbPc',
    playCount: 1100000000,
    releaseDate: new Date('2020-12-15'),
    isPublished: true,
  },

  // Tamil
  {
    title: 'Why This Kolaveri Di',
    artist: 'Dhanush',
    album: '3 (Moonu)',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/f/fe/Three_poster.jpg',
    duration: 234,
    language: 'Tamil',
    genre: ['Tamil', 'Pop'],
    youtubeVideoId: 'YR12Z8f1Dh8',
    playCount: 450000000,
    releaseDate: new Date('2011-11-16'),
    isPublished: true,
  },
  {
    title: 'Vaathi Coming',
    artist: 'Anirudh Ravichander',
    album: 'Master',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/2/2c/Master_%28film%29.jpg',
    duration: 216,
    language: 'Tamil',
    genre: ['Tamil', 'Dance'],
    youtubeVideoId: 'hEHjnSRVIXE',
    playCount: 350000000,
    releaseDate: new Date('2021-01-13'),
    isPublished: true,
  },

  // Telugu
  {
    title: 'Naatu Naatu',
    artist: 'Rahul Sipligunj & Kaala Bhairava',
    album: 'RRR',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/d/d7/RRR_film_poster.jpg',
    duration: 273,
    language: 'Telugu',
    genre: ['Telugu', 'Dance'],
    youtubeVideoId: 'OsU0CGZoV8E',
    playCount: 500000000,
    releaseDate: new Date('2021-11-10'),
    isPublished: true,
  },

  // Hip-Hop / Rap
  {
    title: 'HUMBLE.',
    artist: 'Kendrick Lamar',
    album: 'DAMN.',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/5/51/Kendrick_Lamar_-_Damn.png',
    duration: 177,
    language: 'English',
    genre: ['Hip-Hop', 'Rap'],
    youtubeVideoId: 'tvTRZJ-4EyI',
    playCount: 2200000000,
    releaseDate: new Date('2017-03-30'),
    isPublished: true,
  },
  {
    title: 'God\'s Plan',
    artist: 'Drake',
    album: 'Scorpion',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/9/90/Scorpion_by_Drake.jpg',
    duration: 199,
    language: 'English',
    genre: ['Hip-Hop', 'Pop Rap'],
    youtubeVideoId: 'xpVfcZ0ZcFM',
    playCount: 2600000000,
    releaseDate: new Date('2018-01-19'),
    isPublished: true,
  },

  // K-Pop
  {
    title: 'Dynamite',
    artist: 'BTS',
    album: 'BE',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/d/d2/BTS_-_Dynamite_%28official_cover%29.png',
    duration: 199,
    language: 'English',
    genre: ['K-Pop', 'Disco Pop'],
    youtubeVideoId: 'gdZLi9oWNZg',
    playCount: 1900000000,
    releaseDate: new Date('2020-08-21'),
    isPublished: true,
  },

  // Latin
  {
    title: 'Despacito',
    artist: 'Luis Fonsi ft. Daddy Yankee',
    album: 'Vida',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/c/c8/Luis_Fonsi_-_Despacito_%28audio%29.jpg',
    duration: 282,
    language: 'Spanish',
    genre: ['Latin Pop', 'Reggaeton'],
    youtubeVideoId: 'kJQP7kiw5Fk',
    playCount: 8300000000,
    releaseDate: new Date('2017-01-12'),
    isPublished: true,
  },

  // Electronic
  {
    title: 'Faded',
    artist: 'Alan Walker',
    album: 'Different World',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/6/6c/Alan_Walker_-_Faded.png',
    duration: 212,
    language: 'English',
    genre: ['Electronic', 'EDM'],
    youtubeVideoId: '60ItHLz5WEA',
    playCount: 3500000000,
    releaseDate: new Date('2015-12-03'),
    isPublished: true,
  },
  {
    title: 'Lean On',
    artist: 'Major Lazer & DJ Snake ft. MØ',
    album: 'Peace Is the Mission',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/8/80/Major_Lazer_-_Lean_On.png',
    duration: 176,
    language: 'English',
    genre: ['Electronic', 'Moombahton'],
    youtubeVideoId: 'YqeW9_5kURI',
    playCount: 3400000000,
    releaseDate: new Date('2015-03-02'),
    isPublished: true,
  },

  // Additional Hindi Hits
  {
    title: 'Tera Ban Jaunga',
    artist: 'Akhil Sachdeva & Tulsi Kumar',
    album: 'Kabir Singh',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/d/dc/Kabir_Singh.jpg',
    duration: 235,
    language: 'Hindi',
    genre: ['Bollywood', 'Romantic'],
    youtubeVideoId: 'EXSO4VNz4S0',
    playCount: 800000000,
    releaseDate: new Date('2019-06-21'),
    isPublished: true,
  },
  {
    title: 'Raataan Lambiyan',
    artist: 'Jubin Nautiyal & Asees Kaur',
    album: 'Shershaah',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/6/64/Shershaah_film_poster.jpg',
    duration: 240,
    language: 'Hindi',
    genre: ['Bollywood', 'Romantic'],
    youtubeVideoId: 'gvBjmLu7YMc',
    playCount: 1000000000,
    releaseDate: new Date('2021-07-22'),
    isPublished: true,
  },

  // Rock Classics
  {
    title: 'Hotel California',
    artist: 'Eagles',
    album: 'Hotel California',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/4/49/HotelCalifornia.jpg',
    duration: 391,
    language: 'English',
    genre: ['Rock', 'Classic Rock'],
    youtubeVideoId: 'EqPtz5qN7HM',
    playCount: 1100000000,
    releaseDate: new Date('1977-02-22'),
    isPublished: true,
  },
  {
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    album: 'Led Zeppelin IV',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/2/26/Led_Zeppelin_-_Led_Zeppelin_IV.jpg',
    duration: 482,
    language: 'English',
    genre: ['Rock', 'Hard Rock'],
    youtubeVideoId: 'QkF3oxziUI4',
    playCount: 950000000,
    releaseDate: new Date('1971-11-08'),
    isPublished: true,
  },

  // Modern Pop Hits
  {
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/d/d5/Harry_Styles_-_Harry%27s_House.png',
    duration: 167,
    language: 'English',
    genre: ['Pop', 'Synth-pop'],
    youtubeVideoId: 'H5v3kku4y6Q',
    playCount: 3200000000,
    releaseDate: new Date('2022-04-01'),
    isPublished: true,
  },
  {
    title: 'Anti-Hero',
    artist: 'Taylor Swift',
    album: 'Midnights',
    albumArt: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Midnights_-_Taylor_Swift.png',
    duration: 200,
    language: 'English',
    genre: ['Pop', 'Electropop'],
    youtubeVideoId: 'b1kbLwvqugk',
    playCount: 1600000000,
    releaseDate: new Date('2022-10-21'),
    isPublished: true,
  },
];

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set in .env');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Drop existing songs for a clean seed
    await Song.deleteMany({});
    console.log('🗑️  Cleared existing songs');

    // Insert seed data
    const inserted = await Song.insertMany(SEED_SONGS);
    console.log(`🎵 Seeded ${inserted.length} songs across ${new Set(SEED_SONGS.map(s => s.language)).size} languages`);

    // Print a summary
    const languageCounts: Record<string, number> = {};
    for (const song of SEED_SONGS) {
      languageCounts[song.language] = (languageCounts[song.language] || 0) + 1;
    }
    console.log('\n📊 Song Distribution:');
    for (const [lang, count] of Object.entries(languageCounts)) {
      console.log(`   ${lang}: ${count} songs`);
    }

    console.log('\n✨ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seed();
