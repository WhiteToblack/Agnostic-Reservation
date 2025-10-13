import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CalendarMiniProps {
  date: Date;
  items: Array<{ time: string; title: string }>;
}

export const CalendarMini: React.FC<CalendarMiniProps> = ({ date, items }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>{date.toLocaleDateString()}</Text>
      {items.map((item) => (
        <View key={`${item.time}-${item.title}`} style={styles.item}>
          <Text style={styles.time}>{item.time}</Text>
          <Text style={styles.title}>{item.title}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontWeight: '500',
  },
  title: {
    flex: 1,
    textAlign: 'right',
  },
});
