import { type ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLLM } from '@/hooks/useLLM';

export function ModelDownloadGate({ children }: { children: ReactNode }) {
  const { status, downloadProgress, errorMessage, modelFileExists, loadFromUrl, loadFromLocalFile, retryLoad, modelSizeMB, modelStoragePath } =
    useLLM();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const displayPath = modelStoragePath.replace('file://', '');

  if (status === 'ready') return <>{children}</>;

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });
      if (!result.canceled && result.assets[0]) {
        await loadFromLocalFile(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Document picker error:', err);
    }
  };

  const clampedProgress = Math.min(downloadProgress, 1);
  const progressMB = Math.round(clampedProgress * modelSizeMB);
  const isActive = status === 'downloading' || status === 'loading';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.logo}>Vento</Text>
      <Text style={styles.subtitle}>On-device Voice Transcription</Text>

      {status === 'error' && (
        <Text style={styles.error}>{errorMessage}</Text>
      )}

      {isActive ? (
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>
            {status === 'loading'
              ? 'Loading model…'
              : `Downloading… ${progressMB} / ${modelSizeMB} MB`}
          </Text>
          <View style={[styles.track, { backgroundColor: colors.surface }]}>
            <View
              style={[
                styles.fill,
                { backgroundColor: colors.tint, width: `${clampedProgress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.pathLabel} numberOfLines={3}>
            {displayPath}
          </Text>
          <Pressable onPress={handlePickFile}>
            <Text style={styles.link}>Use a local file instead…</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.actions}>
          {modelFileExists ? (
            <>
              <Pressable
                style={[styles.primary, styles.primaryGlow]}
                onPress={retryLoad}
              >
                <Text style={styles.primaryText}>Retry Loading</Text>
              </Pressable>
              <Pressable onPress={loadFromUrl}>
                <Text style={styles.link}>Re-download model…</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={[styles.primary, styles.primaryGlow]}
              onPress={loadFromUrl}
            >
              <Text style={styles.primaryText}>
                Download Gemma 4 E2B ({(modelSizeMB / 1024).toFixed(1)} GB)
              </Text>
            </Pressable>
          )}
          <Text style={styles.pathLabel} numberOfLines={3}>
            {displayPath}
          </Text>
          <Pressable onPress={handlePickFile}>
            <Text style={styles.link}>Use a local file…</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  logo: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
    color: Colors.light.neonCyan,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    color: Colors.light.textSecondary,
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  actions: {
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  primary: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
  },
  primaryGlow: {
    shadowColor: Colors.light.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 0.6,
    elevation: 8,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.tint,
  },
  pathLabel: {
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'monospace',
    color: Colors.light.textSecondary,
  },
  progressSection: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  track: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
