import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play } from 'lucide-react-native';
import { GlassCard } from '../components/GlassCard';
import { StreamXAPI, Song } from '@streamx/shared';
import { usePlayerStore } from '@streamx/store';

export const HomeScreen = () => {
  const [trending, setTrending] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const play = usePlayerStore(state => state.play);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const songs = await StreamXAPI.getTrendingSongs();
        setTrending(songs);
      } catch (err) {
        console.error('Failed to fetch trending:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const handlePlay = (song: Song) => {
    play({
      id: song._id,
      title: song.title,
      artist: song.artist,
      artwork: song.albumArt || undefined,
      duration: song.duration,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading StreamX...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Play color="#ffffff" fill="#ffffff" size={16} />
          </View>
          <Text style={styles.headerTitle}>StreamX</Text>
        </View>

        {/* Featured Card */}
        {trending.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionSubtitle}>FEATURED ARTIST</Text>
            </View>
            <GlassCard blurAmount={15} style={styles.featuredCard}>
              <View style={styles.featuredContent}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>TRENDING NO. 1</Text>
                </View>
                <Text style={styles.featuredTitle}>{trending[0].title}</Text>
                <Text style={styles.featuredArtist}>{trending[0].artist} — {trending[0].playCount} Plays</Text>
                
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.playButton} onPress={() => handlePlay(trending[0])}>
                    <Play color="#ffffff" fill="#ffffff" size={16} />
                    <Text style={styles.playButtonText}>Play Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </GlassCard>
          </View>
        )}

        {/* Horizontal Scroll Row */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionSubtitle}>RECOMMENDED FOR YOU</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {trending.map((item) => (
              <TouchableOpacity key={item._id} onPress={() => handlePlay(item)}>
                <GlassCard blurAmount={10} style={styles.rowCard}>
                  <View style={styles.rowContent}>
                    {item.albumArt ? (
                      <Image source={{ uri: item.albumArt }} style={styles.rowImage} />
                    ) : (
                      <View style={styles.rowImagePlaceholder} />
                    )}
                    <View style={styles.rowTextContainer}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.rowArtist} numberOfLines={1}>{item.artist}</Text>
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Bottom padding for MiniPlayer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  featuredCard: {
    height: 240,
    justifyContent: 'flex-end',
  },
  featuredContent: {
    gap: 8,
  },
  badge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  featuredTitle: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
  },
  featuredArtist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  playButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  playButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  horizontalScroll: {
    gap: 12,
  },
  rowCard: {
    width: 280,
    padding: 0,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  rowImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  rowImagePlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    marginRight: 12,
  },
  rowTextContainer: {
    flex: 1,
  },
  rowTitle: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '600',
  },
  rowArtist: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  }
});
