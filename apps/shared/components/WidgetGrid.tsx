import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';

interface WidgetGridProps {
  columns?: number;
  children: React.ReactNode;
}

export const WidgetGrid: React.FC<WidgetGridProps> = ({ columns = 2, children }) => {
  const width: `${number}%` = `${100 / columns}%`;
  const cellWidthStyle: ViewStyle = { width };
  return (
    <View style={styles.grid}>
      {React.Children.toArray(children).map((child, index) => (
        <View key={index} style={[styles.cell, cellWidthStyle]}>
          {child}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  cell: {
    flexGrow: 1,
  },
});
