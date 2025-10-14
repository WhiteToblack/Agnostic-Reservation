import { useState, type FC } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Agenda, AgendaEntry, AgendaSchedule } from 'react-native-calendars';
import { useLocalization } from '../../../../shared/localization';

const AgendaScreen: FC = () => {
  const { t } = useLocalization();
  const [items] = useState<AgendaSchedule>({
    [new Date().toISOString().split('T')[0]]: [
      {
        name: `${t('resources.roomA', 'Room A')} - ${t('events.standup', 'Standup')}`,
        height: 80,
      } as AgendaEntry,
      {
        name: `${t('resources.roomB', 'Room B')} - ${t('events.planning', 'Planning')}`,
        height: 80,
      } as AgendaEntry,
    ],
  });

  return (
    <View style={styles.container}>
      <Agenda
        items={items}
        selected={new Date().toISOString().split('T')[0]}
        renderItem={(item: AgendaEntry) => (
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
