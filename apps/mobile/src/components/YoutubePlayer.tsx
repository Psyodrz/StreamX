import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { usePlayerStore } from '@streamx/store';
import type { PlayerMethods } from '@streamx/store';

/**
 * Generates the HTML page injected into the WebView.
 * This page loads the YouTube IFrame Player API and communicates
 * with React Native via `window.ReactNativeWebView.postMessage`.
 */
const generatePlayerHTML = (): string => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    * { margin: 0; padding: 0; }
    body { background: #000; overflow: hidden; }
    #player { width: 1px; height: 1px; position: absolute; top: -9999px; }
  </style>
</head>
<body>
  <div id="player"></div>
  <script>
    // ── YouTube IFrame API loader ──
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    var player;
    var progressInterval;

    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError,
        },
      });
    }

    function onPlayerReady(event) {
      sendMessage({ type: 'ready' });
    }

    function onPlayerStateChange(event) {
      var state = event.data;
      if (state === YT.PlayerState.PLAYING) {
        sendMessage({
          type: 'stateChange',
          state: 'playing',
          duration: player.getDuration(),
        });
        startProgressPolling();
      } else if (state === YT.PlayerState.PAUSED) {
        sendMessage({ type: 'stateChange', state: 'paused' });
        stopProgressPolling();
      } else if (state === YT.PlayerState.ENDED) {
        sendMessage({ type: 'stateChange', state: 'ended' });
        stopProgressPolling();
      } else if (state === YT.PlayerState.BUFFERING) {
        sendMessage({ type: 'stateChange', state: 'buffering' });
      }
    }

    function onPlayerError(event) {
      sendMessage({ type: 'error', code: event.data });
      stopProgressPolling();
    }

    function startProgressPolling() {
      stopProgressPolling();
      progressInterval = setInterval(function () {
        if (player && typeof player.getCurrentTime === 'function') {
          sendMessage({
            type: 'progress',
            currentTime: player.getCurrentTime(),
            duration: player.getDuration(),
          });
        }
      }, 500);
    }

    function stopProgressPolling() {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    }

    function sendMessage(msg) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
    }

    // ── Command handler (receives messages from React Native) ──
    // React Native injects JS via webViewRef.injectJavaScript(...)
    // We expose a global handler so the native side can call it.
    window.executeCommand = function (command, args) {
      if (!player) return;
      switch (command) {
        case 'loadVideo':
          player.loadVideoById(args.videoId);
          break;
        case 'play':
          player.playVideo();
          break;
        case 'pause':
          player.pauseVideo();
          break;
        case 'seekTo':
          player.seekTo(args.seconds, true);
          break;
        case 'setVolume':
          player.setVolume(args.volume);
          break;
        case 'stop':
          player.stopVideo();
          stopProgressPolling();
          break;
      }
    };
  </script>
</body>
</html>
`;

interface WebViewMessage {
  type: 'ready' | 'stateChange' | 'progress' | 'error';
  state?: 'playing' | 'paused' | 'ended' | 'buffering';
  currentTime?: number;
  duration?: number;
  code?: number;
}

/**
 * YoutubePlayer — an invisible WebView that plays YouTube audio
 * via the IFrame Player API.
 *
 * Mount this component once at the root of your navigation tree.
 * It reacts to `currentTrack.id` changes from @streamx/store.
 */
export const YoutubePlayer: React.FC = () => {
  const webViewRef = useRef<WebView>(null);
  const isReadyRef = useRef(false);
  const lastLoadedVideoRef = useRef<string | null>(null);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const setPlaybackState = usePlayerStore((s) => s.setPlaybackState);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setPlayerMethods = usePlayerStore((s) => s.setPlayerMethods);

  /** Safely inject a JS command into the WebView */
  const injectCommand = useCallback(
    (command: string, args: Record<string, unknown> = {}) => {
      if (!webViewRef.current) return;
      const js = `window.executeCommand('${command}', ${JSON.stringify(args)}); true;`;
      webViewRef.current.injectJavaScript(js);
    },
    [],
  );

  /** Register PlayerMethods once ready */
  const registerPlayerMethods = useCallback(() => {
    const methods: PlayerMethods = {
      play: () => injectCommand('play'),
      pause: () => injectCommand('pause'),
      seekTo: (seconds: number) => injectCommand('seekTo', { seconds }),
      setVolume: (vol: number) => injectCommand('setVolume', { volume: vol * 100 }),
    };
    setPlayerMethods(methods);
  }, [injectCommand, setPlayerMethods]);

  /** Handle messages from the WebView */
  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data: WebViewMessage = JSON.parse(event.nativeEvent.data);

        switch (data.type) {
          case 'ready':
            isReadyRef.current = true;
            registerPlayerMethods();
            // If a track was set before the WebView was ready, load it now
            if (currentTrack?.id) {
              injectCommand('loadVideo', { videoId: currentTrack.id });
              lastLoadedVideoRef.current = currentTrack.id;
            }
            break;

          case 'stateChange':
            if (data.state === 'playing') {
              setPlaybackState(true);
              if (data.duration) setDuration(data.duration);
            } else if (data.state === 'paused') {
              setPlaybackState(false);
            } else if (data.state === 'ended') {
              setPlaybackState(false);
              usePlayerStore.getState().skipToNext();
            }
            break;

          case 'progress':
            if (data.currentTime !== undefined) setProgress(data.currentTime);
            if (data.duration !== undefined) setDuration(data.duration);
            break;

          case 'error':
            console.error('[YoutubePlayer] Error code:', data.code);
            setPlaybackState(false);
            break;
        }
      } catch (err) {
        console.error('[YoutubePlayer] Failed to parse WebView message:', err);
      }
    },
    [currentTrack?.id, injectCommand, registerPlayerMethods, setPlaybackState, setProgress, setDuration],
  );

  /** React to track changes */
  useEffect(() => {
    if (isReadyRef.current && currentTrack?.id && currentTrack.id !== lastLoadedVideoRef.current) {
      injectCommand('loadVideo', { videoId: currentTrack.id });
      lastLoadedVideoRef.current = currentTrack.id;
    }
  }, [currentTrack?.id, injectCommand]);

  /** Cleanup on unmount */
  useEffect(() => {
    return () => {
      setPlayerMethods(null);
      isReadyRef.current = false;
    };
  }, [setPlayerMethods]);

  return (
    <View style={styles.container} pointerEvents="none">
      <WebView
        ref={webViewRef}
        source={{ html: generatePlayerHTML() }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        mixedContentMode="compatibility"
        originWhitelist={['*']}
        style={styles.webview}
        // Android: allow background audio
        {...(Platform.OS === 'android' && {
          androidLayerType: 'hardware',
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
    // Push off-screen
    top: -9999,
    left: -9999,
  },
  webview: {
    width: 1,
    height: 1,
    opacity: 0,
  },
});
