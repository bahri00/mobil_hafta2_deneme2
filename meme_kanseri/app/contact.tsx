import { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Send, CheckCircle } from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';
import Colors from '@/constants/colors';

export default function ContactScreen() {
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [sent, setSent] = useState<boolean>(false);
    const btnScale = useRef(new Animated.Value(1)).current;

    const sendMutation = useMutation({
        mutationFn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return true;
        },
        onSuccess: () => {
            setSent(true);
        },
    });

    const handlePressIn = useCallback(() => {
        Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start();
    }, [btnScale]);

    const handlePressOut = useCallback(() => {
        Animated.spring(btnScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    }, [btnScale]);

    const handleSend = useCallback(() => {
        if (!name.trim() || !email.trim() || !message.trim()) {
            Alert.alert('Uyarı', 'Lütfen isim, e-posta ve mesaj alanlarını doldurunuz.');
            return;
        }
        sendMutation.mutate();
    }, [name, email, message, sendMutation]);

    const handleReset = useCallback(() => {
        setSent(false);
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
    }, []);

    if (sent) {
        return (
            <View style={styles.successContainer}>
                <View style={styles.successCard}>
                    <CheckCircle size={56} color={Colors.success} />
                    <Text style={styles.successTitle}>Mesajınız Gönderildi</Text>
                    <Text style={styles.successDesc}>
                        En kısa sürede sizinle iletişime geçeceğiz.
                    </Text>
                    <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
                        <Text style={styles.resetBtnText}>Yeni Mesaj</Text>
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
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.label}>İsim Soyisim</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Adınız Soyadınız"
                    placeholderTextColor={Colors.textLight}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    testID="contact-name"
                />

                <Text style={styles.label}>E-mail</Text>
                <TextInput
                    style={styles.input}
                    placeholder="ornek@email.com"
                    placeholderTextColor={Colors.textLight}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    testID="contact-email"
                />

                <Text style={styles.label}>Telefon</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0555 555 55 55"
                    placeholderTextColor={Colors.textLight}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    testID="contact-phone"
                />

                <Text style={styles.label}>Mesajınız</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Mesajınızı yazınız..."
                    placeholderTextColor={Colors.textLight}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    testID="contact-message"
                />

                <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                    <TouchableOpacity
                        style={[styles.sendBtn, sendMutation.isPending && styles.btnDisabled]}
                        onPress={handleSend}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        disabled={sendMutation.isPending}
                        activeOpacity={0.85}
                        testID="contact-send"
                    >
                        {sendMutation.isPending ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <>
                                <Send size={20} color={Colors.white} />
                                <Text style={styles.sendBtnText}>Gönder</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
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
    label: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: Colors.text,
        marginBottom: 8,
        marginTop: 4,
    },
    input: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 16,
    },
    textArea: {
        minHeight: 120,
        lineHeight: 22,
    },
    sendBtn: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        gap: 10,
    },
    btnDisabled: {
        opacity: 0.7,
    },
    sendBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700' as const,
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: 20,
    },
    successCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 36,
        alignItems: 'center',
        width: '100%',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '700' as const,
        color: Colors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    successDesc: {
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    resetBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
    },
    resetBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600' as const,
    },
});
