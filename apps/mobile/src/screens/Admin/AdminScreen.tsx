import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Button, StyleSheet, Switch } from 'react-native';
import { fetchParameters, invalidateCache } from '../../services/api';
import { useTheme } from '../../theme/ThemeProvider';
import { useLocalization } from '../../../../shared/localization';

const AdminScreen: React.FC = () => {
  const tenantId = 'demo-tenant';
  const { mode, setMode } = useTheme();
  const [parameters, setParameters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useLocalization();

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchParameters(tenantId);
      setParameters(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('admin.theme.title', 'Theme')}</Text>
        <View style={styles.row}>
          <Text>{t('admin.theme.darkModeLabel', 'Dark mode')}</Text>
          <Switch value={mode === 'dark'} onValueChange={(value) => setMode(value ? 'dark' : 'light')} />
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('admin.parameters.title', 'Parameters')}</Text>
        {parameters.map((param) => (
          <View key={param.id} style={styles.row}>
            <Text>{param.key}</Text>
            <Text>{param.value}</Text>
          </View>
        ))}
        <Button
          title={loading ? t('admin.parameters.loading', 'Refreshing...') : t('admin.parameters.refresh', 'Refresh')}
          onPress={load}
          disabled={loading}
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('admin.cache.title', 'Cache')}</Text>
        <Button title={t('admin.cache.invalidate', 'Invalidate Tenant Cache')} onPress={() => invalidateCache(tenantId)} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default AdminScreen;
