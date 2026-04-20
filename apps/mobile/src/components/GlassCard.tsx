import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { BlurView, BlurViewProps } from '@react-native-community/blur';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  blurType?: BlurViewProps['blurType'];
  blurAmount?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, blurType = 'dark', blurAmount = 10 }) => {
  return (
    <View style={[styles.container, style]}>
      <BlurView blurAmount={blurAmount} blurType={blurType} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  content: {
    padding: 16,
  }
});
