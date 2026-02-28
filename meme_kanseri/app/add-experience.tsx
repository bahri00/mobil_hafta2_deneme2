import { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiPost } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { PatientExperience } from '@/types';

export default function AddExperienceScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [author, setAuthor] = useState(user?.name ?? '');
    const [success, setSuccess] = useState(false);

    const createMutation = useMutation({
        mutationFn: () =>
            apiPost<PatientExperience>('/api/experiences', { title, summary, content, author }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['experiences'] });
            setSuccess(true);
        },
        onError: (err: Error) => {
            Alert.alert('Hata', err.message);
        },
    });

    const handleSubmit = useCallback(() => {
        if (!title.trim()) { Alert.alert('Uyarı', 'Başlık gereklidir'); return; }
        if (!summary.trim()) { Alert.alert('Uyarı', 'Özet gereklidir'); return; }
        if (!content.trim()) { Alert.alert('Uyarı', 'Deneyim içeriği gereklidir'); return; }
        if (!author.trim()) { Alert.alert('Uyarı', 'Yazar adı gereklidir'); return; }
        createMutation.mutate();
    }, [title, summary, content, author, createMutation]);

    if (success) {
        return (
            <View style={styles.successContainer}>
                <Stack.Screen options={{ title: 'Deneyim Paylaş' }} />
                <View style={styles.successCard}>
                    <CheckCircle size={56} color={Colors.success} />
                    <Text style={styles.successTitle}>Deneyiminiz Paylaşıldı!</Text>
                    <Text style={styles.successDesc}>
                        Deneyiminiz başarıyla veritabanına kaydedildi ve diğer hastalar tarafından görülebilir.
                    </Text>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Text style={styles.backBtnText}>Listeye Dön</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Stack.Screen options={{ title: 'Deneyim Paylaş' }} />
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.banner}>
                    <Text style={styles.bannerText}>
                        Deneyimlerinizi paylaşarak diğer hastalara ilham olabilirsiniz.
                    </Text>
                </View>

                {[
                    { label: 'Başlık *', value: title, onChange: setTitle, placeholder: 'Deneyiminize bir başlık verin...', multiline: false },
                    { label: 'Kısa Özet *', value: summary, onChange: setSummary, placeholder: 'Deneyiminizi kısaca özetleyin...', multiline: false },
                    { label: 'Yazar Adı *', value: author, onChange: setAuthor, placeholder: 'Adınız (takma ad kullanabilirsiniz)', multiline: false },
                ].map((field) => (
                    <View key={field.label} style={styles.fieldGroup}>
                        <Text style={styles.label}>{field.label}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={field.placeholder}
                            placeholderTextColor={Colors.textLight}
                            value={field.value}
                            onChangeText={field.onChange}
                            multiline={field.multiline}
                        />
                    </View>
                ))}

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Deneyiminiz *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Hastalık sürecinizi, tedavinizi ve öğrendiklerinizi anlatın..."
                        placeholderTextColor={Colors.textLight}
                        value={content}
                        onChangeText={setContent}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, createMutation.isPending && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={createMutation.isPending}
                    activeOpacity={0.85}
                >
                    {createMutation.isPending ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <>
                            <Send size={18} color={Colors.white} />
                            <Text style={styles.submitBtnText}>Deneyimi Paylaş</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: 20, paddingBottom: 40 },
    banner: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, marginBottom: 20 },
    bannerText: { fontSize: 14, color: Colors.white, textAlign: 'center', lineHeight: 20 },
    fieldGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 8 },
    input: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    textArea: { minHeight: 160, textAlignVertical: 'top' },
    submitBtn: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        gap: 10,
    },
    submitBtnDisabled: { backgroundColor: Colors.textLight },
    submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' as const },
    successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 20 },
    successCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 36, alignItems: 'center', width: '100%', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
    successTitle: { fontSize: 22, fontWeight: '700' as const, color: Colors.text, marginTop: 16, marginBottom: 8 },
    successDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    backBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
    backBtnText: { color: Colors.white, fontSize: 16, fontWeight: '600' as const },
});
