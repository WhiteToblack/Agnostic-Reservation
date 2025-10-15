import type { FC } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeProvider';
import { useLocalization } from '../../../../shared/localization';
import type { RootStackParamList } from '../../navigation/types';

type OnboardingScreenProps = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const OnboardingScreen: FC<OnboardingScreenProps> = ({ navigation, route }) => {
  const { deviceId } = route.params;
  const { theme } = useTheme();
  const { t } = useLocalization();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.hero}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('onboarding.welcome', 'Rezervasyonlarınızı akıllı yönetin')}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
          {t('onboarding.subtitle', 'Tek platformda oda kullanımını, gelirlerinizi ve operasyonel akışı takip edin.')}
        </Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('onboarding.highlightsTitle', 'Neler sunuyoruz?')}</Text>
        <Text style={[styles.cardItem, { color: theme.colors.text }]}>{t('onboarding.highlight1', 'Gerçek zamanlı kullanım ve gelir grafikleri')}</Text>
        <Text style={[styles.cardItem, { color: theme.colors.text }]}>{t('onboarding.highlight2', 'Rol bazlı yönetim ekranları')}</Text>
        <Text style={[styles.cardItem, { color: theme.colors.text }]}>{t('onboarding.highlight3', 'Oda bazında düzenlenebilir rezervasyon akışı')}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('SignIn', { deviceId })}
        >
          <Text style={styles.primaryButtonText}>{t('onboarding.signIn', 'Giriş yap')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
          onPress={() => navigation.navigate('SignUp', { deviceId })}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>{t('onboarding.signUp', 'Hemen kayıt ol')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 24,
    justifyContent: 'space-between',
  },
  hero: {
    marginTop: 24,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardItem: {
    fontSize: 15,
  },
  actions: {
    gap: 16,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});

export default OnboardingScreen;
