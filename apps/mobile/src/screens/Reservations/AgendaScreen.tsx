import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Agenda, AgendaEntry, AgendaSchedule } from 'react-native-calendars';

const AgendaScreen: React.FC = () => {
  const [items] = useState<AgendaSchedule>({
    [new Date().toISOString().split('T')[0]]: [
      { name: 'Room A - Standup', height: 80 } as AgendaEntry,
      { name: 'Room B - Planning', height: 80 } as AgendaEntry,
    ],
  });

  return (
    <View style={styles.container}>
      <Agenda
        items={items}
        selected={new Date().toISOString().split('T')[0]}
        renderItem={(item) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  item: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    marginTop: 16,
  },
  itemText: {
    color: '#fff',
  },
});

export default AgendaScreen;
