import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { User, ChevronRight, Calendar } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiGet } from '@/services/api';

interface PatientListItem {
    id: string;
    name: string;
    email: string;
    joinDate: string;
}

export default function DoctorPatientsScreen() {
    const router = useRouter();

    const { data: patients = [], isLoading } = useQuery<PatientListItem[]>({
        queryKey: ['doctorPatients'],
        queryFn: () => apiGet<PatientListItem[]>('/api/patients'),
    });

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {patients.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>Henüz kayıtlı hasta bulunmuyor.</Text>
                </View>
            ) : (
                <FlatList
                    data={patients}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            activeOpacity={0.7}
                            onPress={() => router.push({ pathname: '/doctor-patient-profile', params: { id: item.id } })}
                        >
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={styles.infoContainer}>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.email}>{item.email}</Text>
                                <View style={styles.dateRow}>
                                    <Calendar size={12} color={Colors.textLight} />
                                    <Text style={styles.dateText}>Kayıt: {item.joinDate}</Text>
                                </View>
                            </View>
                            <ChevronRight size={20} color={Colors.textLight} />
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: Colors.textSecondary },
    listContainer: { padding: 16 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, padding: 16, borderRadius: 16, marginBottom: 12, elevation: 1 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primary + '18', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    avatarText: { fontSize: 20, fontWeight: '700' as const, color: Colors.primary },
    infoContainer: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600' as const, color: Colors.text, marginBottom: 4 },
    email: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dateText: { fontSize: 12, color: Colors.textLight },
});
