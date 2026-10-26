import { Audio, AVPlaybackStatus } from 'expo-av';
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

export type PlaybackListener = (status: {
  messageId: string | null;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
}) => void;

class AudioPlayerService {
  private currentSound: Audio.Sound | null = null;
  private currentMessageId: string | null = null;
  private isPlaying = false;
  private positionMillis = 0;
  private durationMillis = 0;
  private listeners: Set<PlaybackListener> = new Set();

  private notify() {
    const state = {
      messageId: this.currentMessageId,
      isPlaying: this.isPlaying,
      positionMillis: this.positionMillis,
      durationMillis: this.durationMillis,
    };
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (e) {
        console.error('[AudioPlayer] Listener error:', e);
      }
    });
  }

  subscribe(listener: PlaybackListener) {
    this.listeners.add(listener);
    // Notify immediately with current state
    listener({
      messageId: this.currentMessageId,
      isPlaying: this.isPlaying,
      positionMillis: this.positionMillis,
      durationMillis: this.durationMillis,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  getCurrentState() {
    return {
      messageId: this.currentMessageId,
      isPlaying: this.isPlaying,
      positionMillis: this.positionMillis,
      durationMillis: this.durationMillis,
    };
  }

  /**
   * Resolves audio URI from base64 string or file URI, caching to local filesystem on native.
   */
  async resolveAudioUri(messageId: string, audioData: string): Promise<string> {
    if (!audioData) return '';

    // If it's already a local file or http URL, return it
    if (
      audioData.startsWith('file://') ||
      audioData.startsWith('http://') ||
      audioData.startsWith('https://')
    ) {
      return audioData;
    }

    // On native platforms, cache base64 to a local m4a file for performance & stability
    if (Platform.OS !== 'web') {
      try {
        const cleanBase64 =
          (audioData.includes('base64,') ? audioData.split('base64,')[1] : audioData) || '';

        const safeId = messageId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const file = new File(Paths.cache, `voice_${safeId}.m4a`);

        if (!file.exists) {
          file.create();
          file.write(cleanBase64, { encoding: 'base64' });
        }
        return file.uri;
      } catch (err) {
        console.warn('[AudioPlayer] Failed caching audio file, using data URI fallback:', err);
      }
    }

    // Fallback: use data URI
    return audioData.startsWith('data:') ? audioData : `data:audio/m4a;base64,${audioData}`;
  }

  async play(messageId: string, audioData: string) {
    try {
      // If the same message is already playing, toggle pause
      if (this.currentMessageId === messageId && this.currentSound) {
        if (this.isPlaying) {
          await this.currentSound.pauseAsync();
          this.isPlaying = false;
          this.notify();
          return;
        } else {
          await this.currentSound.playAsync();
          this.isPlaying = true;
          this.notify();
          return;
        }
      }

      // If a different sound is playing, stop and unload it first
      await this.stop();

      const uri = await this.resolveAudioUri(messageId, audioData);
      if (!uri) return;

      // Ensure playback audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      this.currentMessageId = messageId;
      this.positionMillis = 0;
      this.durationMillis = 0;
      this.isPlaying = true;
      this.notify();

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        this.onPlaybackStatusUpdate,
      );

      this.currentSound = sound;
    } catch (err) {
      console.error('[AudioPlayer] play error:', err);
      await this.stop();
    }
  }

  private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('[AudioPlayer] playback error:', status.error);
        this.stop();
      }
      return;
    }

    this.isPlaying = status.isPlaying;
    this.positionMillis = status.positionMillis;
    this.durationMillis = status.durationMillis || this.durationMillis;

    if (status.didJustFinish) {
      this.stop();
      return;
    }

    this.notify();
  };

  async pause() {
    if (this.currentSound && this.isPlaying) {
      try {
        await this.currentSound.pauseAsync();
        this.isPlaying = false;
        this.notify();
      } catch (e) {
        console.error('[AudioPlayer] pause error:', e);
      }
    }
  }

  async stop() {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch (e) {
        console.error('[AudioPlayer] stop error:', e);
      }
      this.currentSound = null;
    }
    this.currentMessageId = null;
    this.isPlaying = false;
    this.positionMillis = 0;
    this.durationMillis = 0;
    this.notify();
  }
}

export const audioPlayerService = new AudioPlayerService();
