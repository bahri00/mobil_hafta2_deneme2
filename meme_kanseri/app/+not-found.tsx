import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function NotFoundScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <AlertCircle size={56} color={Colors.textLight} />
            <Text style={styles.title}>Sayfa Bulunamadı</Text>
            <Text style={styles.desc}>Aradığınız sayfa mevcut değil.</Text>
            <TouchableOpacity style={styles.btn} onPress={() => router.replace('/home')} activeOpacity={0.8}>
                <Text style={styles.btnText}>Ana Sayfaya Dön</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: 20,
        gap: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    desc: {
        fontSize: 15,
        color: Colors.textSecondary,
        marginBottom: 12,
    },
    btn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 12,
    },
    btnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600' as const,
    },
});
