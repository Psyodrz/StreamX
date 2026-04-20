import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import { BlurView } from '@react-native-community/blur';
import { usePlayerStore } from '@streamx/store';

export const MiniPlayer = () => {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const skipToNext = usePlayerStore((s) => s.skipToNext);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      <BlurView blurType="dark" blurAmount={15} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <View style={styles.left}>
          {/* Thumbnail */}
          <View style={styles.artworkContainer}>
            {currentTrack.artwork ? (
              <Image source={{ uri: currentTrack.artwork }} style={styles.artworkImage} />
            ) : (
              <View style={[styles.artworkImage, styles.artworkPlaceholder]} />
            )}
          </View>
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>
        </View>
        
        <View style={styles.controls}>
          <TouchableOpacity onPress={isPlaying ? pause : resume}>
            {isPlaying ? (
              <Pause color="#ffffff" fill="#ffffff" size={24} />
            ) : (
              <Play color="#ffffff" fill="#ffffff" size={24} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={skipToNext}>
            <SkipForward color="#ffffff" fill="#ffffff" size={24} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressCurrent, { width: `${progressPercent}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60, // Above bottom tabs
    left: 8,
    right: 8,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  artworkContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginRight: 12,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  artworkPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  info: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  artist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressBar: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  progressCurrent: {
    height: '100%',
    backgroundColor: '#7C3AED',
  },
});
