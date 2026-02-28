import { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User as UserIcon, Calendar, MapPin, Save, ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { apiPatch } from '@/services/api';
import { User } from '@/types';

export default function ProfileScreen() {
    const { user, updateProfile } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [birthDate, setBirthDate] = useState(user?.birthDate || '');
    const [city, setCity] = useState(user?.city || '');
    const [loading, setLoading] = useState(false);

    const handleBirthDateChange = (text: string) => {
        let cleaned = text.replace(/[^0-9]/g, '');

        if (cleaned.length >= 2) {
            let day = parseInt(cleaned.substring(0, 2), 10);
            if (day === 0) day = 1;
            if (day > 31) day = 31;
            cleaned = day.toString().padStart(2, '0') + cleaned.substring(2);
        }

        if (cleaned.length >= 4) {
            let month = parseInt(cleaned.substring(2, 4), 10);
            if (month === 0) month = 1;
            if (month > 12) month = 12;
            cleaned = cleaned.substring(0, 2) + month.toString().padStart(2, '0') + cleaned.substring(4);
        }

        if (cleaned.length >= 8) {
            let year = parseInt(cleaned.substring(4, 8), 10);
            const currentYear = new Date().getFullYear();
            const maxYear = currentYear - 18;

            if (year > maxYear) year = maxYear;
            if (year < 1900) year = 1900;

            cleaned = cleaned.substring(0, 4) + year.toString();
        }

        let formatted = cleaned;
        if (cleaned.length > 2) {
            formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
        }
        if (cleaned.length > 4) {
            formatted = formatted.slice(0, 5) + '/' + cleaned.slice(4, 8);
        }

        setBirthDate(formatted);
    };

    const handleSave = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiPatch<{ message: string; user: User }>('/api/auth/profile', {
                birthDate,
                city,
            });
            await updateProfile({ birthDate: res.user.birthDate, city: res.user.city });
            Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
            router.back();
        } catch (e: any) {
            Alert.alert('Hata', e.message || 'Profil güncellenemedi.');
        } finally {
            setLoading(false);
        }
    }, [birthDate, city, updateProfile, router]);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ArrowLeft color={Colors.white} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profilim</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <UserIcon size={50} color={Colors.white} />
                        </View>
                        <Text style={styles.userName}>{user?.name}</Text>
                        <Text style={styles.userEmail}>{user?.email}</Text>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Doğum Tarihi</Text>
                        <View style={styles.inputContainer}>
                            <Calendar size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="GG/AA/YYYY"
                                placeholderTextColor={Colors.textLight}
                                value={birthDate}
                                onChangeText={handleBirthDateChange}
                                keyboardType="numeric"
                                maxLength={10}
                            />
                        </View>

                        <Text style={styles.label}>Yaşadığınız Şehir</Text>
                        <View style={styles.inputContainer}>
                            <MapPin size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Örn: İstanbul"
                                placeholderTextColor={Colors.textLight}
                                value={city}
                                onChangeText={setCity}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <>
                                    <Save size={20} color={Colors.white} />
                                    <Text style={styles.saveBtnText}>Kaydet</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.white },
    content: { padding: 24 },

    avatarContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    userName: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 4 },
    userEmail: { fontSize: 16, color: Colors.textSecondary },

    form: { backgroundColor: Colors.white, borderRadius: 16, padding: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, height: 52, fontSize: 16, color: Colors.text },

    saveBtn: {
        backgroundColor: Colors.primary,
        height: 54,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        gap: 8,
    },
    saveBtnDisabled: { opacity: 0.7 },
    saveBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
