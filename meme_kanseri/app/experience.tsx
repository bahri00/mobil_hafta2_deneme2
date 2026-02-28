import { useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, BookOpen, Plus, AlertCircle } from 'lucide-react-native';
import { PatientExperience } from '@/types';
import Colors from '@/constants/colors';
import { apiGet } from '@/services/api';

function ExperienceCard({ item, onPress }: { item: PatientExperience; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7} testID={`exp-${item.id}`}>
            <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                    <BookOpen size={20} color={Colors.primary} />
                </View>
                <View style={styles.cardMeta}>
                    <Text style={styles.cardAuthor}>{item.author}</Text>
                    <Text style={styles.cardDate}>{item.date}</Text>
                </View>
                <ChevronRight size={20} color={Colors.textLight} />
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardSummary} numberOfLines={2}>{item.summary}</Text>
        </TouchableOpacity>
    );
}

export default function ExperiencesScreen() {
    const router = useRouter();

    const { data: experiences, isLoading, isError, refetch, isRefetching } = useQuery({
        queryKey: ['experiences'],
        queryFn: () => apiGet<PatientExperience[]>('/api/experiences', false),
    });

    const handlePress = useCallback((id: string) => {
        router.push(`/experience/${id}`);
    }, [router]);

    const handleAddPress = useCallback(() => {
        router.push('/add-experience');
    }, [router]);

    const renderItem = useCallback(({ item }: { item: PatientExperience }) => (
        <ExperienceCard item={item} onPress={() => handlePress(item.id)} />
    ), [handlePress]);

    const keyExtractor = useCallback((item: PatientExperience) => String(item.id), []);

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.centerText}>Deneyimler yükleniyor...</Text>
            </View>
        );
    }

    if (isError) {
        return (
            <View style={styles.centerContainer}>
                <AlertCircle size={48} color={Colors.error} />
                <Text style={styles.errorText}>Deneyimler yüklenemedi.</Text>
                <Text style={styles.errorSubText}>Backend sunucusunun çalıştığını kontrol edin.</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                    <Text style={styles.retryBtnText}>Tekrar Dene</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={experiences ?? []}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.list}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <BookOpen size={48} color={Colors.textLight} />
                        <Text style={styles.emptyText}>Henüz deneyim paylaşılmamış</Text>
                    </View>
                }
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />
                }
            />
            <TouchableOpacity style={styles.fab} onPress={handleAddPress} testID="add-experience-btn">
                <Plus size={24} color={Colors.white} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    list: { padding: 16, flexGrow: 1, paddingBottom: 90 },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 18,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconCircle: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: Colors.primary + '14',
        justifyContent: 'center', alignItems: 'center',
    },
    cardMeta: { flex: 1, marginLeft: 12 },
    cardAuthor: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
    cardDate: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
    cardTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.text, marginBottom: 6, lineHeight: 22 },
    cardSummary: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
    separator: { height: 12 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { fontSize: 16, color: Colors.textSecondary },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
    centerText: { fontSize: 15, color: Colors.textSecondary },
    errorText: { fontSize: 17, fontWeight: '600' as const, color: Colors.error, textAlign: 'center' },
    errorSubText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
    retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
    retryBtnText: { color: Colors.white, fontSize: 15, fontWeight: '600' as const },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
});
