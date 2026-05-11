import { type ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLLM } from '@/hooks/useLLM';

export function ModelDownloadGate({ children }: { children: ReactNode }) {
  const { status, downloadProgress, errorMessage, loadFromUrl, loadFromLocalFile, modelSizeMB } =
    useLLM();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (status === 'ready') return <>{children}</>;

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: false,
    });
    if (!result.canceled && result.assets[0]) {
      await loadFromLocalFile(result.assets[0].uri);
    }
  };

  const progressMB = Math.round(downloadProgress * modelSizeMB);
  const isActive = status === 'downloading' || status === 'loading';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.logo, { color: colors.tint }]}>Vento</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Local AI · No cloud · No data sent
      </Text>

      {status === 'error' && (
        <Text style={styles.error}>{errorMessage}</Text>
      )}

      {isActive ? (
        <View style={styles.progressSection}>
          <Text style={[styles.progressLabel, { color: colors.text }]}>
            {status === 'loading'
              ? 'Loading model…'
              : `Downloading… ${progressMB} / ${modelSizeMB} MB`}
          </Text>
          <View style={[styles.track, { backgroundColor: colors.inputBorder }]}>
            <View
              style={[
                styles.fill,
                { backgroundColor: colors.tint, width: `${downloadProgress * 100}%` },
              ]}
            />
          </View>
          <Pressable onPress={handlePickFile}>
            <Text style={[styles.link, { color: colors.tint }]}>Use a local file instead…</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable
            style={[styles.primary, { backgroundColor: colors.tint }]}
            onPress={loadFromUrl}
          >
            <Text style={styles.primaryText}>
              Download Gemma 4 E2B ({(modelSizeMB / 1024).toFixed(1)} GB)
            </Text>
          </Pressable>
          <Pressable onPress={handlePickFile}>
            <Text style={[styles.link, { color: colors.tint }]}>Use a local file…</Text>
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
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
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
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    fontSize: 15,
    fontWeight: '500',
  },
  progressSection: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
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
