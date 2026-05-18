import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import { useLLM } from '@/hooks/useLLM';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useTranscription } from '@/hooks/useTranscription';
import WaveformVisualizer from '@/components/WaveformVisualizer';
import RecordButton from '@/components/RecordButton';

type ScreenState = 'idle' | 'waiting-model' | 'recording' | 'stopped';

export default function HomeScreen() {
  const { status, transcribeAudio, loadFromUrl } = useLLM();
  const { amplitude, duration, startRecording, stopAndGetChunk, requestPermission } = useAudioRecorder();
  const { transcript, isTranscribing, setIsTranscribing, appendTranscript, setTranscript } = useTranscription();

  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [copied, setCopied] = useState(false);

  const isRecordingRef = useRef(false);
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const transcribeChunk = useCallback(async (chunkPath: string) => {
    setIsTranscribing(true);
    try {
      const text = await transcribeAudio(chunkPath);
      appendTranscript(text);
    } catch (err) {
      console.warn('Chunk transcription failed:', err);
    } finally {
      setIsTranscribing(false);
    }
  }, [transcribeAudio, appendTranscript, setIsTranscribing]);

  const runChunkCycle = useCallback(async () => {
    if (!isRecordingRef.current) return;

    const chunkPath = await stopAndGetChunk();

    if (isRecordingRef.current) {
      await startRecording();
    }

    if (chunkPath && isRecordingRef.current) {
      await transcribeChunk(chunkPath);
    }

    if (isRecordingRef.current) {
      chunkTimerRef.current = setTimeout(runChunkCycle, 3500);
    }
  }, [stopAndGetChunk, startRecording, transcribeChunk]);

  const beginRecording = useCallback(async () => {
    await startRecording();
    isRecordingRef.current = true;
    setScreenState('recording');
    chunkTimerRef.current = setTimeout(runChunkCycle, 3500);
  }, [startRecording, runChunkCycle]);

  const handleRecordPress = useCallback(async () => {
    if (screenState === 'recording') {
      isRecordingRef.current = false;
      if (chunkTimerRef.current) clearTimeout(chunkTimerRef.current);
      const finalChunk = await stopAndGetChunk();
      if (finalChunk) await transcribeChunk(finalChunk);
      setScreenState('stopped');
      return;
    }

    if (status !== 'ready') {
      setScreenState('waiting-model');
      loadFromUrl();
      return;
    }

    const granted = await requestPermission();
    if (!granted) return;
    await beginRecording();
  }, [screenState, status, loadFromUrl, requestPermission, stopAndGetChunk, transcribeChunk, beginRecording]);

  useEffect(() => {
    if (status === 'ready' && screenState === 'waiting-model') {
      (async () => {
        const granted = await requestPermission();
        if (!granted) { setScreenState('idle'); return; }
        await beginRecording();
      })();
    }
  }, [status, screenState, requestPermission, beginRecording]);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [transcript]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0D0720' }}>
      <StatusBar style="light" />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16 }}>
        <Text style={{ color: '#00F5FF', fontSize: 24, fontWeight: '700', letterSpacing: 2 }}>VENTO</Text>
        {transcript.length > 0 && (
          <Pressable onPress={handleCopy} style={{ padding: 8 }}>
            <Text style={{ color: copied ? '#00F5FF' : '#A78BFA', fontSize: 14, fontWeight: '600' }}>
              {copied ? 'Copied!' : 'Copy'}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 32 }}>
        <WaveformVisualizer amplitude={amplitude} isActive={screenState === 'recording'} />
        <RecordButton
          isRecording={screenState === 'recording'}
          isLoading={status === 'loading' || status === 'downloading' || screenState === 'waiting-model' || isTranscribing}
          onPress={handleRecordPress}
          amplitude={amplitude}
        />
        {screenState === 'recording' && (
          <Text style={{ color: '#94A3B8', fontSize: 13 }}>
            {Math.floor(duration / 60).toString().padStart(2, '0')}:{Math.floor(duration % 60).toString().padStart(2, '0')}
          </Text>
        )}
        {screenState === 'idle' && (
          <Text style={{ color: '#94A3B8', fontSize: 14, letterSpacing: 1 }}>TAP TO TRANSCRIBE</Text>
        )}
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 32, maxHeight: '40%' }}>
        <TextInput
          multiline
          value={transcript}
          onChangeText={setTranscript}
          placeholder="Your transcription will appear here..."
          placeholderTextColor="#4B5563"
          style={{
            color: '#F8FAFC',
            fontSize: 16,
            lineHeight: 24,
            minHeight: 80,
            maxHeight: 200,
            padding: 16,
            backgroundColor: '#1A0B4B',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isTranscribing ? '#00F5FF' : '#2D1B69',
            textAlignVertical: 'top',
          }}
        />
      </View>
    </SafeAreaView>
  );
}
