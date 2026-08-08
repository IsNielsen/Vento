import React, { useEffect } from 'react';
import { Pressable, ActivityIndicator, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

const { neonPink, tint, primaryLight } = Colors.light;

interface RecordButtonProps {
  isRecording: boolean;
  isLoading: boolean;
  onPress: () => void;
  amplitude: number;
  style?: ViewStyle;
}

export default function RecordButton({
  isRecording,
  isLoading,
  onPress,
  amplitude,
  style,
}: RecordButtonProps): React.ReactElement {
  const glowRadius = useSharedValue(0);
  const pulseProgress = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      glowRadius.value = withSpring(8 + amplitude * 24, { damping: 10, stiffness: 100 });
    } else {
      glowRadius.value = withTiming(0, { duration: 300 });
    }
  }, [isRecording, amplitude]);

  useEffect(() => {
    if (isRecording) {
      pulseProgress.value = withRepeat(
        withSequence(withTiming(1, { duration: 800 }), withTiming(0, { duration: 800 })),
        -1,
        false,
      );
    } else {
      pulseProgress.value = withTiming(0, { duration: 300 });
    }
  }, [isRecording]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowRadius: glowRadius.value,
    shadowOpacity: glowRadius.value > 0 ? 0.8 : 0,
    elevation: glowRadius.value * 2,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulseProgress.value, [0, 1], [1, 1.3]) }],
    opacity: interpolate(pulseProgress.value, [0, 1], [0, 0.6]),
  }));

  return (
    <Animated.View
      style={[
        glowStyle,
        {
          alignItems: 'center',
          justifyContent: 'center',
          width: 120,
          height: 120,
          borderRadius: 60,
          shadowColor: neonPink,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          pulseStyle,
          {
            position: 'absolute',
            width: 118,
            height: 118,
            borderRadius: 59,
            borderWidth: 2,
            borderColor: tint,
          },
        ]}
      />
      <Pressable
        onPress={onPress}
        disabled={isLoading}
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: tint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        android_ripple={{ color: primaryLight, radius: 48, borderless: true }}
      >
        {isLoading ? (
          <ActivityIndicator color="white" size="large" />
        ) : isRecording ? (
          <FontAwesome name="stop" size={24} color="white" />
        ) : (
          <FontAwesome name="microphone" size={32} color="white" />
        )}
      </Pressable>
    </Animated.View>
  );
}
