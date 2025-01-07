import React from 'react';
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
  const increment = () => value < max && onChange(value + 1);
  const decrement = () => value > min && onChange(value - 1);

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <TouchableOpacity onPress={decrement} style={styles.button}>
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>
        
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
        </View>
        
        <TouchableOpacity onPress={increment} style={styles.button}>
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