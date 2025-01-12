import React, { useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface NumberInputProps {
  value: number;
  onChange: (newValue: number) => void;
  label?: string;
  min?: number;
  max?: number;
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  label = 'Cafe Pat /day',
  min = 0,
  max = 100,
}) => {
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentValueRef = useRef(value);

  // Keep the ref in sync with the prop
  currentValueRef.current = value;

  const clearAllTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (speedIntervalRef.current) {
      clearInterval(speedIntervalRef.current);
      speedIntervalRef.current = null;
    }
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    setSpeed(1);
  }, []);

  const startAcceleration = useCallback((increment: boolean) => {
    clearAllTimers();

    // Start with immediate first change
    const newValue = value + (increment ? 1 : -1);
    if (newValue <= max && newValue >= min) {
      onChange(newValue);
    }

    // Set up continuous updates
    intervalRef.current = setInterval(() => {
      const nextValue = currentValueRef.current + (increment ? speed : -speed);
      if (nextValue <= max && nextValue >= min) {
        onChange(nextValue);
      } else {
        clearAllTimers();
      }
    }, 100);

    // Gradually increase speed
    speedIntervalRef.current = setInterval(() => {
      setSpeed((prevSpeed) => {
        const newSpeed = prevSpeed * 1.5;
        return newSpeed > 10 ? 10 : newSpeed;
      });
    }, 500);
  }, [value, min, max, onChange, speed, clearAllTimers]);

  const handleLongPress = useCallback((increment: boolean) => {
    // Add a small delay before starting acceleration to prevent accidental triggers
    longPressTimeoutRef.current = setTimeout(() => {
      startAcceleration(increment);
    }, 200);
  }, [startAcceleration]);

  const increment = useCallback(() => {
    if (value < max) {
      onChange(value + 1);
    }
  }, [value, max, onChange]);

  const decrement = useCallback(() => {
    if (value > min) {
      onChange(value - 1);
    }
  }, [value, min, onChange]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <TouchableOpacity 
          onPress={decrement}
          onLongPress={() => handleLongPress(false)}
          onPressOut={clearAllTimers}
          delayLongPress={200}
          style={styles.button}
        >
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>
        
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
        </View>
        
        <TouchableOpacity 
          onPress={increment}
          onLongPress={() => handleLongPress(true)}
          onPressOut={clearAllTimers}
          delayLongPress={200}
          style={styles.button}
        >
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#404040',
    borderRadius: 8,
    overflow: 'hidden',
  },
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#404040',
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '400',
  },
  valueContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#404040',
  },
  value: {
    fontSize: 16,
    color: '#fff',
  },
  label: {
    color: '#fff',
    marginLeft: 12,
    fontSize: 16,
  },
});

export default NumberInput;