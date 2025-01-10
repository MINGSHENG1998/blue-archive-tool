import React, { useRef, useState } from 'react';
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const speedIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearIntervals = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (speedIntervalRef.current) {
      clearInterval(speedIntervalRef.current);
      speedIntervalRef.current = null;
    }
    setSpeed(1);
  };

  const startAcceleration = (increment: boolean) => {
    console.log("nigga")
    clearIntervals();

    // Update value at current speed
    intervalRef.current = setInterval(() => {
      const newValue = value + (increment ? speed : -speed);
      if (newValue <= max && newValue >= min) {
        console.log(newValue)
        onChange(newValue);
      } else {
        clearIntervals();
      }
    }, 100);

    // Increase speed over time
    speedIntervalRef.current = setInterval(() => {
      setSpeed(prevSpeed => Math.min(prevSpeed + 1, 10));
    }, 500);
  };

  const increment = () => value < max && onChange(value + 1);
  const decrement = () => value > min && onChange(value - 1);

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <TouchableOpacity 
          onPress={decrement}
          onLongPress={() => startAcceleration(false)}
          onPressOut={clearIntervals}
          style={styles.button}
        >
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>
        
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
        </View>
        
        <TouchableOpacity 
          onPress={increment}
          onLongPress={() => startAcceleration(true)}
          onPressOut={clearIntervals}
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