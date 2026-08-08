import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

// TODO: verify M4A is accepted by sendMessageWithAudio on device; WAV PCM not available via MediaRecorder on Android
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

const normalizeAmplitude = (dBFS: number): number => {
  const min = -60;
  const max = 0;
  return Math.max(0, Math.min(1, (dBFS - min) / (max - min)));
};

export function useAudioRecorder(): {
  isRecording: boolean;
  amplitude: number;
  duration: number;
  startRecording: () => Promise<void>;
  stopAndGetChunk: () => Promise<string | null>;
  requestPermission: () => Promise<boolean>;
} {
  const [isRecording, setIsRecording] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [duration, setDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const { granted } = await Audio.requestPermissionsAsync();
    if (granted) {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    }
    return granted;
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync({
      ...RECORDING_OPTIONS,
      isMeteringEnabled: true,
    });
    recording.setOnRecordingStatusUpdate(status => {
      if (status.isRecording) {
        setAmplitude(status.metering != null ? normalizeAmplitude(status.metering) : 0);
        setDuration((status.durationMillis ?? 0) / 1000);
      }
    });
    recording.setProgressUpdateInterval(100);
    await recording.startAsync();
    recordingRef.current = recording;
    setIsRecording(true);
  }, []);

  const stopAndGetChunk = useCallback(async (): Promise<string | null> => {
    const recording = recordingRef.current;
    if (!recording) return null;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recordingRef.current = null;
    setIsRecording(false);
    setAmplitude(0);
    setDuration(0);
    return uri ?? null;
  }, []);

  useEffect(() => {
    return () => {
      const recording = recordingRef.current;
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, []);

  return { isRecording, amplitude, duration, startRecording, stopAndGetChunk, requestPermission };
}
