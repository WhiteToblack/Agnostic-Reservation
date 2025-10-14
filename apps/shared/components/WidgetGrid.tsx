import { Children, type FC, type ReactNode } from 'react';
import { View, StyleSheet, type DimensionValue } from 'react-native';

export type WidgetGridProps = {
  columns?: number;
  children: ReactNode;
};

export const WidgetGrid: FC<WidgetGridProps> = ({ columns = 2, children }) => {
  const normalizedColumns = Math.max(1, Math.floor(columns));
  const widthPercentage = `${(100 / normalizedColumns).toFixed(2)}%` as DimensionValue;
  const childArray = Children.toArray(children);

  return (
    <View style={styles.grid}>
      {childArray.map((child, index) => (
        <View key={index} style={[styles.cell, { width: widthPercentage }]}>
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
