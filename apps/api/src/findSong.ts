import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Song from './models/Song';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function findSong() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const song = await Song.findOne({ title: /Despacito/i });
    console.log('SONG_ID:', song?._id.toString());
    process.exit(0);
}

findSong();
