import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useVoice } from '../hooks/useVoice';

interface VoiceInputProps {
  onTranscript: (transcript: string, audioUri: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onTranscript, disabled = false }: VoiceInputProps) {
  const { isRecording, transcript, error, startRecording, stopRecording, clearTranscript } =
    useVoice();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [isRecording, pulseAnim]);

  const handlePress = async () => {
    if (disabled) return;
    if (isRecording) {
      const uri = await stopRecording();
      if (uri) {
        // Pass a placeholder transcript label; actual transcription happens server-side.
        onTranscript('[Audio recorded — pending transcription]', uri);
      }
    } else {
      clearTranscript();
      await startRecording();
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={[
            styles.button,
            isRecording && styles.buttonRecording,
            disabled && styles.buttonDisabled,
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
          disabled={disabled}
        >
          <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎙'}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.statusText}>
        {isRecording ? 'Recording… tap to stop' : 'Tap to record voice description'}
      </Text>

      {!!transcript && !isRecording && (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptLabel}>Audio captured:</Text>
          <Text style={styles.transcriptText} numberOfLines={2}>
            {transcript}
          </Text>
        </View>
      )}

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  pulseRing: {
    borderRadius: 50,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonRecording: {
    backgroundColor: '#ef4444',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  micIcon: {
    fontSize: 32,
  },
  statusText: {
    fontSize: 14,
    color: '#475569',
  },
  transcriptBox: {
    width: '100%',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
  },
  transcriptLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 13,
    color: '#1e293b',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
  },
});
