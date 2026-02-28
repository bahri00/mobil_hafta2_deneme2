import { useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    ChevronRight,
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
} from 'lucide-react-native';
import { symptoms } from '@/mocks/symptoms';
import { Symptom } from '@/types';
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

function SymptomRow({ item, onPress }: { item: Symptom; onPress: () => void }) {
    const IconComponent = iconMap[item.icon] ?? AlertCircle;

    return (
        <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7} testID={`symptom-${item.id}`}>
            <View style={[styles.iconCircle, { backgroundColor: item.color + '18' }]}>
                <IconComponent size={22} color={item.color} />
            </View>
            <Text style={styles.rowTitle}>{item.title}</Text>
            <ChevronRight size={20} color={Colors.textLight} />
        </TouchableOpacity>
    );
}

export default function SymptomsScreen() {
    const router = useRouter();

    const handlePress = useCallback((id: string) => {
        router.push(`/symptom/${id}`);
    }, [router]);

    const renderItem = useCallback(({ item }: { item: Symptom }) => (
        <SymptomRow item={item} onPress={() => handlePress(item.id)} />
    ), [handlePress]);

    const keyExtractor = useCallback((item: Symptom) => item.id, []);

    return (
        <View style={styles.container}>
            <View style={styles.headerBar}>
                <Text style={styles.headerLabel}>Belirtinizi seçiniz</Text>
            </View>
            <FlatList
                data={symptoms}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.list}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    headerBar: {
        backgroundColor: Colors.white,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerLabel: {
        fontSize: 15,
        color: Colors.primary,
        fontWeight: '600' as const,
        textAlign: 'center',
    },
    list: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 14,
        gap: 14,
    },
    iconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500' as const,
        color: Colors.text,
    },
    separator: {
        height: 8,
    },
});
