import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

interface WaveformVisualizerProps {
  amplitude: number;
  isActive: boolean;
  style?: ViewStyle;
}

const BAR_COUNT = 13;
const BAR_WIDTH = 3;
const BAR_GAP = 4;
const COLORS = ['#8B5CF6', '#A78BFA', '#00F5FF', '#A78BFA', '#8B5CF6'];
const TOTAL_WIDTH = BAR_WIDTH * BAR_COUNT + BAR_GAP * (BAR_COUNT - 1);

const BAR_META = Array.from({ length: BAR_COUNT }, (_, i) => ({
  sineEnvelope: Math.sin((i / 12) * Math.PI),
  color: COLORS[i % 5],
}));

interface AnimatedBarProps {
  targetHeight: number;
  color: string;
  index: number;
  isActive: boolean;
}

function AnimatedBar({ targetHeight, color, index, isActive }: AnimatedBarProps) {
  const height = useSharedValue(4);

  useEffect(() => {
    if (isActive) {
      height.value = withSpring(targetHeight, { damping: 8, stiffness: 120 });
    } else {
      height.value = withRepeat(
        withSequence(
          withTiming(8, { duration: 750 + index * 50 }),
          withTiming(4, { duration: 750 + index * 50 }),
        ),
        -1,
        true,
      );
    }
  }, [isActive, targetHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: BAR_WIDTH,
          borderRadius: 1.5,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function WaveformVisualizer({
  amplitude,
  isActive,
  style,
}: WaveformVisualizerProps): React.ReactElement {
  return (
    <View
      style={[
        {
          width: TOTAL_WIDTH,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: BAR_GAP,
          height: 60,
          alignSelf: 'center',
        },
        style,
      ]}
    >
      {BAR_META.map(({ sineEnvelope, color }, i) => (
        <AnimatedBar
          key={i}
          targetHeight={4 + amplitude * 56 * sineEnvelope}
          color={color}
          index={i}
          isActive={isActive}
        />
      ))}
    </View>
  );
}
