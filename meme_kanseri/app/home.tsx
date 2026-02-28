import { useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Animated,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Ribbon,
    Activity,
    MessageCircleQuestion,
    Users,
    CalendarDays,
    TestTube,
    Info,
    Phone,
    LogOut,
    User as UserIcon,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

interface MenuItemData {
    id: string;
    title: string;
    icon: React.ReactNode;
    color: string;
    route: string;
}

const PATIENT_MENU_ITEMS: MenuItemData[] = [
    { id: '1', title: 'Belirti\nYönetimi', icon: <Activity size={28} color="#FFFFFF" />, color: '#EF4444', route: '/symptoms' },
    { id: '2', title: 'Uzmana\nSor', icon: <MessageCircleQuestion size={28} color="#FFFFFF" />, color: '#3B82F6', route: '/ask-expert' },
    { id: '3', title: 'Hasta\nDeneyimi', icon: <Users size={28} color="#FFFFFF" />, color: '#10B981', route: '/experience' },
    { id: '4', title: 'Belirti\nTakvimi', icon: <CalendarDays size={28} color="#FFFFFF" />, color: '#8B5CF6', route: '/symptom-calendar' },
    { id: '5', title: 'Kan\nTahlili', icon: <TestTube size={28} color="#FFFFFF" />, color: '#F59E0B', route: '/blood-test' },
    { id: 'profile', title: 'Profilim', icon: <UserIcon size={28} color="#FFFFFF" />, color: '#8B5CF6', route: '/profile' },
    { id: '6', title: 'Hakkında', icon: <Info size={28} color="#FFFFFF" />, color: '#06B6D4', route: '/about' },
    { id: '7', title: 'İletişim', icon: <Phone size={28} color="#FFFFFF" />, color: '#EC4899', route: '/contact' },
];

const DOCTOR_MENU_ITEMS: MenuItemData[] = [
    { id: 'd1', title: 'Hasta\nSoruları', icon: <MessageCircleQuestion size={28} color="#FFFFFF" />, color: '#3B82F6', route: '/doctor-questions' },
    { id: 'd2', title: 'Hastalarım', icon: <Users size={28} color="#FFFFFF" />, color: '#10B981', route: '/doctor-patients' },
];

function MenuCard({ item, onPress }: { item: MenuItemData; onPress: () => void }) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start();
    }, [scale]);

    const handlePressOut = useCallback(() => {
        Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    }, [scale]);

    return (
        <Animated.View style={[styles.menuCardWrapper, { transform: [{ scale }] }]}>
            <TouchableOpacity
                style={[styles.menuCard, { backgroundColor: item.color }]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
                testID={`menu-${item.id}`}
            >
                <View style={styles.menuIconContainer}>
                    {item.icon}
                </View>
                <Text style={styles.menuCardTitle}>{item.title}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function HomeScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleLogout = useCallback(() => {
        Alert.alert(
            'Çıkış',
            'Çıkış yapmak istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/login');
                    },
                },
            ]
        );
    }, [logout, router]);

    const handleMenuPress = useCallback((route: string) => {
        router.push(route as never);
    }, [router]);

    return (
        <View style={styles.container}>
            <View style={[styles.headerBg, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <Ribbon size={24} color={Colors.white} />
                        <Text style={styles.headerTitle}>Meme Kanseri Destek Mobil</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} testID="logout-btn">
                        <LogOut size={22} color={Colors.white} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.greeting}>Hoş geldiniz, {user?.name ?? 'Kullanıcı'}</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.gridContainer, { paddingBottom: insets.bottom + 24 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.grid}>
                    {(user?.role === 'doctor' ? DOCTOR_MENU_ITEMS : PATIENT_MENU_ITEMS).map((item) => (
                        <MenuCard
                            key={item.id}
                            item={item}
                            onPress={() => handleMenuPress(item.route)}
                        />
                    ))}
                    <Animated.View style={styles.menuCardWrapper}>
                        <TouchableOpacity
                            style={[styles.menuCard, { backgroundColor: '#64748B' }]}
                            onPress={handleLogout}
                            activeOpacity={0.85}
                            testID="menu-logout"
                        >
                            <View style={styles.menuIconContainer}>
                                <LogOut size={28} color="#FFFFFF" />
                            </View>
                            <Text style={styles.menuCardTitle}>{'Çıkış\nYap'}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    headerBg: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700' as const,
        color: Colors.white,
    },
    logoutBtn: {
        padding: 8,
    },
    greeting: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 10,
    },
    scrollView: {
        flex: 1,
    },
    gridContainer: {
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    menuCardWrapper: {
        width: '48%',
        marginBottom: 14,
    },
    menuCard: {
        borderRadius: 18,
        paddingVertical: 22,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 130,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
    },
    menuIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    menuCardTitle: {
        fontSize: 14,
        fontWeight: '700' as const,
        color: Colors.white,
        textAlign: 'center',
        lineHeight: 18,
    },
});
