import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Song from './models/Song';

dotenv.config({ path: path.join(__dirname, '../.env') });

const sync = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Dropping existing Song indexes...');
    await Song.collection.dropIndexes();
    console.log('Syncing Song indexes...');
    await Song.syncIndexes();
    console.log('Successfully synced text indexes for MongoDB search!');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing indexes:', err);
    process.exit(1);
  }
};

sync();
