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
import { EyeOff, Eye, CheckCircle, Stethoscope, User as UserIcon } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

const SPECIALTIES = [
    'Onkoloji', 'Cerrahi Onkoloji', 'Radyoloji', 'Radyasyon Onkolojisi',
    'İç Hastalıkları', 'Genel Cerrahi', 'Patoloji', 'Nükleer Tıp', 'Diğer',
];

export default function RegisterScreen() {
    // Ortak alanlar
    const [role, setRole] = useState<'patient' | 'doctor'>('patient');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    // Doktor alanları
    const [specialty, setSpecialty] = useState('');
    const [hospital, setHospital] = useState('');
    const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);
    // Hasta alanları
    const [birthDate, setBirthDate] = useState('');
    const [city, setCity] = useState('');

    const { register, registerPending, registerError } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const buttonScale = useRef(new Animated.Value(1)).current;

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

    const handlePressIn = useCallback(() => {
        Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start();
    }, [buttonScale]);
    const handlePressOut = useCallback(() => {
        Animated.spring(buttonScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    }, [buttonScale]);

    const handleRegister = useCallback(async () => {
        if (!name.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurunuz.');
            return;
        }
        if (role === 'doctor' && !specialty) {
            Alert.alert('Hata', 'Lütfen uzmanlık alanınızı seçiniz.');
            return;
        }
        try {
            const result = await register({
                name: name.trim(),
                email: email.trim(),
                password: password.trim(),
                role,
                specialty: role === 'doctor' ? specialty : undefined,
                hospital: role === 'doctor' ? hospital.trim() : undefined,
                birthDate: role === 'patient' ? birthDate.trim() : undefined,
                city: role === 'patient' ? city.trim() : undefined,
            });

            if (result.pending) {
                Alert.alert(
                    '✅ Başvurunuz Alındı',
                    'Uzman kaydınız admin onayına gönderildi. Onaylandıktan sonra giriş yapabilirsiniz.',
                    [{ text: 'Tamam', onPress: () => router.replace('/login') }]
                );
            } else {
                router.replace('/home');
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Kayıt başarısız';
            Alert.alert('Hata', msg);
        }
    }, [name, email, password, role, specialty, hospital, birthDate, city, register, router]);

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Başlık ── */}
                    <View style={styles.welcomeBanner}>
                        <View style={styles.welcomeContent}>
                            <Text style={styles.welcomeTitle}>Hesap Oluştur</Text>
                            <Text style={styles.welcomeSub}>Kaydınızı tamamlayın</Text>
                        </View>
                        <CheckCircle size={28} color={Colors.primary} />
                    </View>

                    {/* ── Hasta / Uzman Toggle ── */}
                    <View style={styles.roleToggle}>
                        <TouchableOpacity
                            style={[styles.roleBtn, role === 'patient' && styles.roleBtnActive]}
                            onPress={() => setRole('patient')}
                            activeOpacity={0.8}
                        >
                            <UserIcon size={16} color={role === 'patient' ? '#fff' : Colors.textSecondary} />
                            <Text style={[styles.roleBtnText, role === 'patient' && styles.roleBtnTextActive]}>
                                Hasta Kaydı
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.roleBtn, role === 'doctor' && styles.roleBtnActiveDoctor]}
                            onPress={() => setRole('doctor')}
                            activeOpacity={0.8}
                        >
                            <Stethoscope size={16} color={role === 'doctor' ? '#fff' : Colors.textSecondary} />
                            <Text style={[styles.roleBtnText, role === 'doctor' && styles.roleBtnTextActive]}>
                                Uzman Kaydı
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {role === 'doctor' && (
                        <View style={styles.doctorNotice}>
                            <Text style={styles.doctorNoticeText}>
                                🔐 Uzman kayıtları admin onayı gerektirir. Onaylandıktan sonra giriş yapabilirsiniz.
                            </Text>
                        </View>
                    )}

                    <View style={styles.form}>
                        {/* Ad Soyad */}
                        <Text style={styles.label}>Ad Soyad</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Adınız Soyadınız"
                                placeholderTextColor={Colors.textLight}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                testID="register-name"
                            />
                        </View>

                        {/* E-posta */}
                        <Text style={styles.label}>E-posta</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="ornek@email.com"
                                placeholderTextColor={Colors.textLight}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                testID="register-email"
                            />
                        </View>

                        {/* Parola */}
                        <Text style={styles.label}>Parola</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.input, styles.passwordInput]}
                                placeholder="••••••••"
                                placeholderTextColor={Colors.textLight}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                testID="register-password"
                            />
                            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                                {showPassword
                                    ? <Eye size={20} color={Colors.textSecondary} />
                                    : <EyeOff size={20} color={Colors.textSecondary} />}
                            </TouchableOpacity>
                        </View>

                        {/* ── Hastaya özgü alanlar ── */}
                        {role === 'patient' && (
                            <>
                                <Text style={styles.label}>Doğum Tarihi</Text>
                                <View style={styles.inputContainer}>
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
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Örn: İstanbul"
                                        placeholderTextColor={Colors.textLight}
                                        value={city}
                                        onChangeText={setCity}
                                    />
                                </View>
                            </>
                        )}

                        {/* ── Doktora özgü alanlar ── */}
                        {role === 'doctor' && (
                            <>
                                <Text style={styles.label}>Uzmanlık Alanı *</Text>
                                <TouchableOpacity
                                    style={[styles.inputContainer, styles.pickerBtn]}
                                    onPress={() => setShowSpecialtyPicker(!showSpecialtyPicker)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.input, !specialty && { color: Colors.textLight }]}>
                                        {specialty || 'Uzmanlık alanı seçin'}
                                    </Text>
                                    <Text style={styles.pickerArrow}>{showSpecialtyPicker ? '▲' : '▼'}</Text>
                                </TouchableOpacity>

                                {showSpecialtyPicker && (
                                    <View style={styles.specialtyDropdown}>
                                        {SPECIALTIES.map(s => (
                                            <TouchableOpacity
                                                key={s}
                                                style={[styles.specialtyItem, specialty === s && styles.specialtyItemSelected]}
                                                onPress={() => { setSpecialty(s); setShowSpecialtyPicker(false); }}
                                            >
                                                <Text style={[styles.specialtyItemText, specialty === s && styles.specialtyItemTextSelected]}>
                                                    {s}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                <Text style={styles.label}>Hastane / Klinik</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Çalıştığınız hastane veya klinik"
                                        placeholderTextColor={Colors.textLight}
                                        value={hospital}
                                        onChangeText={setHospital}
                                        autoCapitalize="words"
                                    />
                                </View>
                            </>
                        )}

                        {registerError && <Text style={styles.errorText}>{registerError}</Text>}

                        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                            <TouchableOpacity
                                style={[
                                    role === 'doctor' ? styles.registerBtnDoctor : styles.registerBtn,
                                    registerPending && styles.btnDisabled,
                                ]}
                                onPress={handleRegister}
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                disabled={registerPending}
                                activeOpacity={0.85}
                                testID="register-button"
                            >
                                {registerPending ? (
                                    <ActivityIndicator color={Colors.white} />
                                ) : (
                                    <Text style={styles.registerBtnText}>
                                        {role === 'doctor' ? 'Uzman Başvurusu Gönder' : 'Hesap Oluştur'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </Animated.View>

                        <TouchableOpacity
                            style={styles.loginLink}
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.loginLinkText}>
                                Zaten hesabınız var mı? <Text style={styles.loginLinkBold}>Giriş Yap</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { flexGrow: 1, paddingHorizontal: 28 },

    welcomeBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#E8ECF4', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 16,
        marginBottom: 20, borderLeftWidth: 4, borderLeftColor: Colors.primary,
    },
    welcomeContent: { flex: 1 },
    welcomeTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
    welcomeSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },

    // Role toggle
    roleToggle: {
        flexDirection: 'row', backgroundColor: Colors.primaryDark,
        borderRadius: 12, padding: 4, marginBottom: 16, gap: 4,
    },
    roleBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 10, borderRadius: 10,
    },
    roleBtnActive: { backgroundColor: Colors.primary },
    roleBtnActiveDoctor: { backgroundColor: '#0f766e' },
    roleBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
    roleBtnTextActive: { color: '#fff' },

    doctorNotice: {
        backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12,
        marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#16a34a',
    },
    doctorNoticeText: { fontSize: 13, color: '#166534', lineHeight: 18 },

    form: { flex: 1 },
    label: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 8, marginTop: 4 },

    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.primaryDark, borderRadius: 12, marginBottom: 16,
    },
    input: { flex: 1, height: 52, paddingHorizontal: 16, fontSize: 16, color: Colors.white },
    passwordInput: { paddingRight: 50 },
    eyeBtn: { position: 'absolute' as const, right: 14, padding: 4 },

    // Specialty picker
    pickerBtn: { justifyContent: 'space-between' },
    pickerArrow: { color: Colors.textSecondary, paddingRight: 14, fontSize: 12 },
    specialtyDropdown: {
        backgroundColor: Colors.white, borderRadius: 12, marginBottom: 16, overflow: 'hidden',
        borderWidth: 1, borderColor: Colors.border,
    },
    specialtyItem: { paddingVertical: 12, paddingHorizontal: 16 },
    specialtyItemSelected: { backgroundColor: Colors.primary + '18' },
    specialtyItemText: { fontSize: 14, color: Colors.text },
    specialtyItemTextSelected: { color: Colors.primary, fontWeight: '700' as const },

    errorText: { color: Colors.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },

    registerBtn: {
        backgroundColor: Colors.primary, height: 54, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center', marginTop: 8,
    },
    registerBtnDoctor: {
        backgroundColor: '#0f766e', height: 54, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center', marginTop: 8,
    },
    btnDisabled: { opacity: 0.7 },
    registerBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' as const },

    loginLink: { alignItems: 'center', marginTop: 24 },
    loginLinkText: { color: Colors.textSecondary, fontSize: 14 },
    loginLinkBold: { color: Colors.primary, fontWeight: '700' as const },
});
