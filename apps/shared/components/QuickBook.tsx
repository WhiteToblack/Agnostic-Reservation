import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface QuickBookProps {
  resources: Array<{ id: string; name: string }>;
  onSelect: (resourceId: string) => void;
}

export const QuickBook: React.FC<QuickBookProps> = ({ resources, onSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Quick Book</Text>
      <View style={styles.grid}>
        {resources.map((resource) => (
          <TouchableOpacity key={resource.id} style={styles.resource} onPress={() => onSelect(resource.id)}>
            <Text style={styles.resourceText}>{resource.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resource: {
    padding: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  resourceText: {
    fontWeight: '500',
  },
});
