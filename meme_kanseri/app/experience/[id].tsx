import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { BookOpen, User, Calendar, AlertCircle } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { PatientExperience } from '@/types';
import Colors from '@/constants/colors';
import { apiGet } from '@/services/api';

export default function ExperienceDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const { data: experiences, isLoading, isError } = useQuery({
        queryKey: ['experiences'],
        queryFn: () => apiGet<PatientExperience[]>('/api/experiences', false),
    });

    if (isLoading) {
        return (
            <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (isError) {
        return (
            <View style={styles.emptyContainer}>
                <AlertCircle size={48} color={Colors.error} />
                <Text style={styles.emptyText}>Deneyim yüklenemedi</Text>
            </View>
        );
    }

    const experience = experiences?.find((e) => String(e.id) === String(id));

    if (!experience) {
        return (
            <View style={styles.emptyContainer}>
                <AlertCircle size={48} color={Colors.textLight} />
                <Text style={styles.emptyText}>Deneyim bulunamadı</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Hasta Deneyimi' }} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                    <View style={styles.iconCircle}>
                        <BookOpen size={28} color={Colors.primary} />
                    </View>
                    <Text style={styles.heroTitle}>{experience.title}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <User size={14} color={Colors.textSecondary} />
                            <Text style={styles.metaText}>{experience.author}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Calendar size={14} color={Colors.textSecondary} />
                            <Text style={styles.metaText}>{experience.date}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.contentCard}>
                    {experience.content.split('\n\n').map((paragraph, index) => (
                        <Text key={index} style={styles.paragraph}>{paragraph}</Text>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { padding: 20 },
    heroCard: {
        backgroundColor: Colors.white, borderRadius: 18, padding: 24, alignItems: 'center',
        marginBottom: 16, elevation: 2, shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
    },
    iconCircle: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: Colors.primary + '14',
        justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    },
    heroTitle: {
        fontSize: 18, fontWeight: '700' as const, color: Colors.text,
        textAlign: 'center', marginBottom: 12, lineHeight: 24,
    },
    metaRow: { flexDirection: 'row', gap: 20 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, color: Colors.textSecondary },
    contentCard: {
        backgroundColor: Colors.white, borderRadius: 18, padding: 20,
        elevation: 2, shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
    },
    paragraph: { fontSize: 15, color: Colors.text, lineHeight: 24, marginBottom: 16 },
    emptyContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: Colors.background, gap: 12,
    },
    emptyText: { fontSize: 16, color: Colors.textSecondary },
});
