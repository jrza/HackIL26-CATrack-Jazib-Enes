import { Audio } from 'expo-av';
import { useCallback, useRef, useState } from 'react';

interface UseVoiceReturn {
  isRecording: boolean;
  /** Audio URI of the recorded clip. Actual transcription is done server-side. */
  transcript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string>;
  clearTranscript: () => void;
}

export function useVoice(): UseVoiceReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Microphone permission denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      setError(`Failed to start recording: ${(err as Error).message}`);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    if (!recordingRef.current) {
      setError('No active recording');
      return '';
    }
    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recordingRef.current.getURI() ?? '';
      recordingRef.current = null;
      setIsRecording(false);
      // Store the audio URI in `transcript`; server-side transcription converts it to text.
      setTranscript(uri);
      return uri;
    } catch (err) {
      setError(`Failed to stop recording: ${(err as Error).message}`);
      setIsRecording(false);
      return '';
    }
  }, []);

  const clearTranscript = useCallback((): void => {
    setTranscript('');
  }, []);

  return { isRecording, transcript, error, startRecording, stopRecording, clearTranscript };
}
