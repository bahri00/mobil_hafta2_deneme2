import { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Animated,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ribbon, EyeOff, Eye, User } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

export default function LoginScreen() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [rememberMe, setRememberMe] = useState<boolean>(false);
    const { login, loginPending, loginError } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const buttonScale = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        Animated.spring(buttonScale, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    }, [buttonScale]);

    const handlePressOut = useCallback(() => {
        Animated.spring(buttonScale, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();
    }, [buttonScale]);

    const handleLogin = useCallback(async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Hata', 'Lütfen e-posta ve parola giriniz.');
            return;
        }
        try {
            await login({ email: email.trim(), password: password.trim() });
            router.replace('/home');
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Giriş başarısız';
            Alert.alert('Hata', msg);
        }
    }, [email, password, login, router]);

    return (
        <View style={[styles.container]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <View style={styles.ribbonRow}>
                            <Ribbon size={28} color={Colors.white} />
                            <Text style={styles.portalTitle}>Meme Sağlığı Portalı</Text>
                        </View>
                        <Text style={styles.title}>Giriş</Text>
                        <View style={styles.avatarCircle}>
                            <User size={32} color={Colors.textLight} />
                        </View>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="ornek@email.com"
                                placeholderTextColor={Colors.textLight}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                testID="login-email"
                            />
                        </View>

                        <Text style={styles.label}>Parola</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.input, styles.passwordInput]}
                                placeholder="••••••••"
                                placeholderTextColor={Colors.textLight}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                testID="login-password"
                            />
                            <TouchableOpacity
                                style={styles.eyeBtn}
                                onPress={() => setShowPassword(!showPassword)}
                                testID="toggle-password"
                            >
                                {showPassword ? (
                                    <Eye size={20} color={Colors.textSecondary} />
                                ) : (
                                    <EyeOff size={20} color={Colors.textSecondary} />
                                )}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.rememberRow}
                            onPress={() => setRememberMe(!rememberMe)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                                {rememberMe && <View style={styles.checkboxInner} />}
                            </View>
                            <Text style={styles.rememberText}>Beni Hatırla</Text>
                        </TouchableOpacity>

                        {loginError && (
                            <Text style={styles.errorText}>{loginError}</Text>
                        )}

                        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                            <TouchableOpacity
                                style={[styles.loginBtn, loginPending && styles.btnDisabled]}
                                onPress={handleLogin}
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                disabled={loginPending}
                                activeOpacity={0.85}
                                testID="login-button"
                            >
                                {loginPending ? (
                                    <ActivityIndicator color={Colors.white} />
                                ) : (
                                    <Text style={styles.loginBtnText}>Giriş Yap</Text>
                                )}
                            </TouchableOpacity>
                        </Animated.View>

                        <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
                            <Text style={styles.forgotText}>Şifremi Unuttum</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.registerBtn}
                            onPress={() => router.push('/register')}
                            activeOpacity={0.7}
                            testID="go-register"
                        >
                            <Text style={styles.registerBtnText}>Kayıt Ol</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 28,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    ribbonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    portalTitle: {
        fontSize: 18,
        fontWeight: '600' as const,
        color: Colors.white,
    },
    title: {
        fontSize: 36,
        fontWeight: '800' as const,
        color: Colors.white,
        marginBottom: 16,
    },
    avatarCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    form: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: Colors.white,
        marginBottom: 8,
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryDark,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    input: {
        flex: 1,
        height: 52,
        paddingHorizontal: 16,
        fontSize: 16,
        color: Colors.white,
    },
    passwordInput: {
        paddingRight: 50,
    },
    eyeBtn: {
        position: 'absolute' as const,
        right: 14,
        padding: 4,
    },
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 10,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: Colors.white,
    },
    checkboxInner: {
        width: 12,
        height: 12,
        borderRadius: 2,
        backgroundColor: Colors.primary,
    },
    rememberText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '500' as const,
    },
    errorText: {
        color: Colors.error,
        fontSize: 13,
        marginBottom: 12,
        textAlign: 'center',
    },
    loginBtn: {
        backgroundColor: Colors.primaryDark,
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    btnDisabled: {
        opacity: 0.7,
    },
    loginBtnText: {
        color: Colors.white,
        fontSize: 17,
        fontWeight: '700' as const,
    },
    forgotBtn: {
        alignItems: 'center',
        marginTop: 16,
    },
    forgotText: {
        color: Colors.accent,
        fontSize: 14,
        fontWeight: '600' as const,
    },
    registerBtn: {
        alignItems: 'center',
        marginTop: 20,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    registerBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700' as const,
    },
});
