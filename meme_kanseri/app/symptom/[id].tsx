import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import {
  ShieldAlert,
  Droplets,
  Zap,
  Wind,
  Droplet,
  Frown,
  UtensilsCrossed,
  Battery,
  Hand,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';
import { symptoms } from '@/mocks/symptoms';
import Colors from '@/constants/colors';

const iconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  ShieldAlert,
  Droplets,
  Zap,
  Wind,
  Droplet,
  Frown,
  UtensilsCrossed,
  Battery,
  Hand,
  AlertCircle,
};

export default function SymptomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const symptom = useMemo(() => symptoms.find((s) => s.id === id), [id]);

  if (!symptom) {
    return (
      <View style={styles.emptyContainer}>
        <AlertCircle size={48} color={Colors.textLight} />
        <Text style={styles.emptyText}>Belirti bulunamadı</Text>
      </View>
    );
  }

  const IconComponent = iconMap[symptom.icon] ?? AlertCircle;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: symptom.title }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { borderLeftColor: symptom.color }]}>
          <View style={[styles.heroIcon, { backgroundColor: symptom.color + '18' }]}>
            <IconComponent size={36} color={symptom.color} />
          </View>
          <Text style={styles.heroTitle}>{symptom.title}</Text>
          <Text style={styles.heroDesc}>{symptom.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Öneriler</Text>
          {symptom.recommendations.map((rec, index) => (
            <View key={index} style={styles.recRow}>
              <CheckCircle2 size={18} color={Colors.success} />
              <Text style={styles.recText}>{rec}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderLeftWidth: 5,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  heroDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 16,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  recText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
