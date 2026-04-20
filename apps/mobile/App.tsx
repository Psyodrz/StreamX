import React, { useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, Library, User } from 'lucide-react-native';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Modal } from 'react-native';

import { HomeScreen } from './src/screens/HomeScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { NowPlaying } from './src/screens/NowPlaying';
import { MiniPlayer } from './src/components/MiniPlayer';
import { YoutubePlayer } from './src/components/YoutubePlayer';
import { usePlayerStore } from '@streamx/store';

const Tab = createBottomTabNavigator();

const StreamXTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#050508', // Void Black
    card: 'rgba(13, 13, 20, 0.95)',
    text: '#FFFFFF',
    primary: '#7C3AED',
  },
};

const Placeholder = ({ name }: { name: string }) => (
  <View style={styles.container}>
    <Text style={styles.text}>{name} Screen</Text>
  </View>
);

export default function App() {
  const [isNowPlayingVisible, setIsNowPlayingVisible] = useState(false);
  
  const currentTrack = usePlayerStore(state => state.currentTrack);

  return (
    <View style={styles.appWrapper}>
      {/* Hidden YouTube audio player (WebView) */}
      <YoutubePlayer />

      {/* Ambient Orbs Placeholder */}
      <View style={styles.orbPurple} />
      <View style={styles.orbPink} />

      <NavigationContainer theme={StreamXTheme}>
        <StatusBar barStyle="light-content" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#A78BFA',
            tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
            tabBarStyle: {
              backgroundColor: 'rgba(5, 5, 8, 0.85)',
              borderTopWidth: 0,
              paddingTop: 8,
              position: 'absolute',
              elevation: 0,
            },
            tabBarIcon: ({ color, size }) => {
              if (route.name === 'Home') return <Home color={color} size={size} />;
              if (route.name === 'Search') return <Search color={color} size={size} />;
              if (route.name === 'Library') return <Library color={color} size={size} />;
              if (route.name === 'Profile') return <User color={color} size={size} />;
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Search" component={SearchScreen} />
          <Tab.Screen name="Library">
            {() => <Placeholder name="Library" />}
          </Tab.Screen>
          <Tab.Screen name="Profile">
            {() => <Placeholder name="Profile" />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>

      {/* Persistent Mini Player */}
      {currentTrack && (
        <TouchableOpacity style={styles.miniPlayerWrapper} activeOpacity={0.95} onPress={() => setIsNowPlayingVisible(true)}>
          <MiniPlayer />
        </TouchableOpacity>
      )}

      {/* Full Screen Modal for Now Playing */}
      <Modal visible={isNowPlayingVisible} animationType="slide" presentationStyle="pageSheet">
        <NowPlaying onClose={() => setIsNowPlayingVisible(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  appWrapper: {
    flex: 1,
    backgroundColor: '#050508',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  orbPurple: {
    position: 'absolute',
    top: '10%',
    left: '50%',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(124, 58, 237, 0.4)',
    transform: [{ translateX: -110 }],
    opacity: 0.5,
  },
  orbPink: {
    position: 'absolute',
    top: '40%',
    right: '-10%',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(236, 72, 153, 0.3)',
  },
  miniPlayerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  }
});
