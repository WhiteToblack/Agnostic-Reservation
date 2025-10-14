import React from 'react';
import { View, StyleSheet } from 'react-native';

interface WidgetGridProps {
  columns?: number;
  children: React.ReactNode;
}

export const WidgetGrid: React.FC<WidgetGridProps> = ({ columns = 2, children }) => {
  const width = `${100 / columns}%`;
  return (
    <View style={styles.grid}>
      {React.Children.toArray(children).map((child, index) => (
        <View key={index} style={[styles.cell, { width }]}> 
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
