import { useRef } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { PanGestureHandler, State, GestureHandlerStateChangeEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';

interface Action {
  label: string;
  color: string;
  onPress: () => void;
  icon?: string;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  rightActions?: Action[];
  onDelete?: () => void;
}

const ACTION_WIDTH = 75;

export function SwipeableRow({ children, rightActions, onDelete }: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const actions = rightActions ?? (onDelete ? [{ label: 'Delete', color: '#DC2626', onPress: onDelete, icon: '🗑️' }] : []);
  const totalWidth = actions.length * ACTION_WIDTH;

  function onGestureEvent(event: { nativeEvent: PanGestureHandlerEventPayload }) {
    const x = Math.min(0, Math.max(-totalWidth, event.nativeEvent.translationX));
    translateX.setValue(x);
  }

  function onHandlerStateChange(event: GestureHandlerStateChangeEvent) {
    if (event.nativeEvent.state === State.END) {
      const x = (event.nativeEvent as PanGestureHandlerEventPayload).translationX;
      if (x < -totalWidth / 2) {
        Animated.spring(translateX, { toValue: -totalWidth, useNativeDriver: true }).start();
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      }
    }
  }

  function close() {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
  }

  return (
    <View style={styles.container}>
      <View style={[styles.actionsContainer, { right: 0, width: totalWidth }]}>
        {actions.map((action, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.action, { backgroundColor: action.color, width: ACTION_WIDTH }]}
            onPress={() => { close(); action.onPress(); }}
          >
            {action.icon && <Text style={styles.actionIcon}>{action.icon}</Text>}
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View style={{ transform: [{ translateX }] }}>
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  actionIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  actionLabel: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
});
