import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import { Play, Pause, SkipForward, SkipBack, ChevronDown, Heart, Shuffle, Repeat } from 'lucide-react-native';
import { usePlayerStore } from '@streamx/store';

const { width } = Dimensions.get('window');

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const NowPlaying = ({ onClose }: { onClose: () => void }) => {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const seek = usePlayerStore((s) => s.seek);
  const skipToNext = usePlayerStore((s) => s.skipToNext);
  const skipToPrevious = usePlayerStore((s) => s.skipToPrevious);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const remaining = duration > 0 ? duration - progress : 0;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Image source={{ uri: currentTrack.artwork }} style={StyleSheet.absoluteFill} blurRadius={80} />
      <BlurView blurType="dark" blurAmount={30} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <ChevronDown color="#ffffff" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Now Playing</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.artworkContainer}>
          {currentTrack.artwork ? (
            <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} />
          ) : (
            <View style={[styles.artwork, styles.artworkPlaceholder]} />
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
            </View>
            <TouchableOpacity>
              <Heart color="rgba(255,255,255,0.6)" size={24} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(progress)}</Text>
              <Text style={styles.timeText}>-{formatTime(remaining)}</Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity>
              <Shuffle color="rgba(255,255,255,0.4)" size={24} />
            </TouchableOpacity>
            
            <View style={styles.mainControls}>
              <TouchableOpacity onPress={skipToPrevious}>
                <SkipBack color="#ffffff" fill="#ffffff" size={32} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.playPauseButton} 
                onPress={isPlaying ? pause : resume}>
                {isPlaying ? (
                  <Pause color="#ffffff" fill="#ffffff" size={32} />
                ) : (
                  <Play color="#ffffff" fill="#ffffff" size={32} />
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={skipToNext}>
                <SkipForward color="#ffffff" fill="#ffffff" size={32} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity>
              <Repeat color="rgba(255,255,255,0.4)" size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  artworkContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artwork: {
    width: width - 48,
    height: width - 48,
    borderRadius: 8,
  },
  artworkPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  infoContainer: {
    paddingBottom: 48,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  artist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  playPauseButton: {
    width: 64,
    height: 64,
    backgroundColor: '#7C3AED',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
