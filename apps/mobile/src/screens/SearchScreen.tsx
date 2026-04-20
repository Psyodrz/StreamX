import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Play } from 'lucide-react-native';
import { GlassCard } from '../components/GlassCard';
import { StreamXAPI, Song } from '@streamx/shared';
import { usePlayerStore } from '@streamx/store';

export const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const play = usePlayerStore(state => state.play);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const songs = await StreamXAPI.searchSongs(query);
        setResults(songs);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handlePlay = (song: Song) => {
    play({
      id: song._id,
      title: song.title,
      artist: song.artist,
      artwork: song.albumArt || undefined,
      duration: song.duration,
    });
  };

  const renderResult = ({ item }: { item: Song }) => (
    <TouchableOpacity onPress={() => handlePlay(item)} style={styles.resultRow}>
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.resultArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <Text style={styles.resultDuration}>
        {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <GlassCard blurAmount={20} style={styles.searchBarContainer}>
          <Search color="rgba(255,255,255,0.4)" size={20} />
          <TextInput
            style={styles.input}
            placeholder="Search artists, songs, lyrics..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={query}
            onChangeText={setQuery}
          />
        </GlassCard>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
         <View style={[styles.chip, styles.activeChip]}>
            <Text style={styles.activeChipText}>All</Text>
         </View>
         <View style={styles.chip}>
            <Text style={styles.chipText}>Songs</Text>
         </View>
         <View style={styles.chip}>
            <Text style={styles.chipText}>Artists</Text>
         </View>
      </View>

      {/* Results */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{query ? 'Search Results' : 'Recent Searches'}</Text>
        
        {isSearching ? (
          <ActivityIndicator size="small" color="#7C3AED" style={{ marginTop: 20 }} />
        ) : query === '' ? (
          <Text style={styles.emptyText}>Start typing to search StreamX.</Text>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item._id}
            renderItem={renderResult}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        ) : (
          <Text style={styles.emptyText}>No results found for "{query}".</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    padding: 16,
  },
  searchBarContainer: {
    padding: 0,
    borderRadius: 24,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeChip: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: '#7C3AED',
  },
  chipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeChipText: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  resultInfo: {
    flex: 1,
    marginRight: 16,
  },
  resultTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  resultArtist: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
  },
  resultDuration: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
  }
});
