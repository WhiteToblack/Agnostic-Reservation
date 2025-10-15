import { useEffect, useState, type FC } from 'react';
import { ScrollView, View, Text, StyleSheet, Switch, ActivityIndicator, TouchableOpacity } from 'react-native';
import { fetchParameters, invalidateCache, fetchAdminModules, type TenantParameter } from '../../services/api';
import { useTheme } from '../../theme/ThemeProvider';
import { useLocalization } from '../../../../shared/localization';
import { defaultTenantId } from '../../config/constants';
import { loadSession } from '../../storage/sessionStorage';
import type { AuthResult } from '../../../../shared/types/auth';
import type { AdminModule } from '../../../../shared/types/admin';

const AdminScreen: FC = () => {
  const { mode, setMode, theme } = useTheme();
  const { t } = useLocalization();
  const [parameters, setParameters] = useState<TenantParameter[]>([]);
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<AuthResult | null>(null);

  useEffect(() => {
    loadSession().then((stored) => {
      if (stored) {
        setSession(stored);
      }
    });
  }, []);

  const tenantId = session?.tenantId ?? defaultTenantId;
  const userId = session?.userId ?? 'demo-user';

  const load = async () => {
    setLoading(true);
    try {
      const [paramData, moduleData] = await Promise.all([
        fetchParameters(tenantId),
        fetchAdminModules(tenantId, userId),
      ]);
      setParameters(paramData);
      setModules(moduleData);
    } catch (error) {
      console.warn('Admin data fetch failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, userId]);

  const handleInvalidateCache = async () => {
    await invalidateCache(tenantId);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}> 
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('admin.theme.title', 'Tema')}</Text>
        <View style={styles.row}> 
          <Text style={[styles.label, { color: theme.colors.muted }]}>{t('admin.theme.darkModeLabel', 'Karanlık mod')}</Text>
          <Switch value={mode === 'dark'} onValueChange={(value) => setMode(value ? 'dark' : 'light')} />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}> 
        <View style={styles.cardHeader}> 
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('admin.modules.title', 'Yetkili olduğunuz ekranlar')}</Text>
          {loading && <ActivityIndicator color={theme.colors.primary} />}
        </View>
        <View style={styles.moduleGrid}> 
          {modules.map((module) => (
            <View key={module.id} style={[styles.moduleChip, { backgroundColor: theme.colors.surfaceMuted }]}> 
              <Text style={[styles.moduleTitle, { color: theme.colors.text }]}>{module.title}</Text>
              <Text style={[styles.moduleDescription, { color: theme.colors.muted }]}>{module.description}</Text>
            </View>
          ))}
          {modules.length === 0 && !loading && (
            <Text style={[styles.emptyText, { color: theme.colors.muted }]}>{t('admin.modules.empty', 'Henüz yetkili olduğunuz ekran bulunmuyor')}</Text>
          )}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}> 
        <View style={styles.cardHeader}> 
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('admin.parameters.title', 'Parametreler')}</Text>
          <TouchableOpacity style={[styles.refreshButton, { borderColor: theme.colors.border }]} onPress={load} disabled={loading}>
            <Text style={[styles.refreshText, { color: theme.colors.text }]}>{t('admin.parameters.refresh', 'Yenile')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.parameterList}> 
          {parameters.map((param) => (
            <View key={param.id} style={[styles.parameterRow, { borderBottomColor: theme.colors.surfaceMuted }]}> 
              <Text style={[styles.parameterKey, { color: theme.colors.text }]}>{param.key}</Text>
              <Text style={[styles.parameterValue, { color: theme.colors.muted }]}>{param.value}</Text>
            </View>
          ))}
          {parameters.length === 0 && !loading && (
            <Text style={[styles.emptyText, { color: theme.colors.muted }]}>{t('admin.parameters.empty', 'Parametre kaydı bulunmuyor')}</Text>
          )}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}> 
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('admin.cache.title', 'Önbellek')}</Text>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]} onPress={handleInvalidateCache}>
          <Text style={styles.primaryText}>{t('admin.cache.invalidate', 'Tenant önbelleğini temizle')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
  },
  moduleGrid: {
    gap: 12,
  },
  moduleChip: {
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  moduleDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  parameterList: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  parameterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  parameterKey: {
    fontWeight: '600',
    flex: 1,
  },
  parameterValue: {
    flex: 1,
    textAlign: 'right',
  },
  refreshButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  refreshText: {
    fontWeight: '600',
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 14,
  },
});

export default AdminScreen;
