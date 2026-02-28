import {
    View,
    Text,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { Ribbon, Heart, Shield, Users } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function AboutScreen() {
    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                    <View style={styles.ribbonCircle}>
                        <Ribbon size={36} color={Colors.primary} />
                    </View>
                    <Text style={styles.appName}>Meme Sağlığı Portalı</Text>
                    <Text style={styles.version}>Versiyon 1.0.0</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hakkımızda</Text>
                    <Text style={styles.paragraph}>
                        Meme Sağlığı Portalı, meme kanseri tanısı almış hastaların tedavi sürecinde
                        ihtiyaç duydukları bilgi ve desteğe kolayca ulaşmalarını sağlamak amacıyla
                        geliştirilmiştir.
                    </Text>
                    <Text style={styles.paragraph}>
                        Uygulamamız, hastaların tedavi sürecinde karşılaşabilecekleri belirtileri
                        yönetmelerine, uzmanlarla iletişim kurmalarına ve diğer hastaların
                        deneyimlerinden faydalanmalarına yardımcı olur.
                    </Text>
                </View>

                <View style={styles.featuresGrid}>
                    <View style={styles.featureCard}>
                        <Heart size={24} color="#EF4444" />
                        <Text style={styles.featureTitle}>Hasta Odaklı</Text>
                        <Text style={styles.featureDesc}>Hastalarımızın ihtiyaçları merkezli</Text>
                    </View>
                    <View style={styles.featureCard}>
                        <Shield size={24} color="#3B82F6" />
                        <Text style={styles.featureTitle}>Güvenilir</Text>
                        <Text style={styles.featureDesc}>Uzman onaylı bilgi ve öneriler</Text>
                    </View>
                    <View style={styles.featureCard}>
                        <Users size={24} color="#10B981" />
                        <Text style={styles.featureTitle}>Topluluk</Text>
                        <Text style={styles.featureDesc}>Hasta deneyimleri ve destek</Text>
                    </View>
                </View>

                <View style={styles.disclaimerCard}>
                    <Text style={styles.disclaimerTitle}>Önemli Not</Text>
                    <Text style={styles.disclaimerText}>
                        Bu uygulama yalnızca bilgilendirme amaçlıdır ve tıbbi tavsiye yerine geçmez.
                        Sağlık sorunlarınız için mutlaka doktorunuza danışınız.
                    </Text>
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
    scrollContent: {
        padding: 20,
    },
    heroCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    ribbonCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primary + '14',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    appName: {
        fontSize: 22,
        fontWeight: '800' as const,
        color: Colors.text,
        marginBottom: 4,
    },
    version: {
        fontSize: 14,
        color: Colors.textLight,
    },
    section: {
        backgroundColor: Colors.white,
        borderRadius: 18,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: Colors.primary,
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 24,
        marginBottom: 12,
    },
    featuresGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    featureCard: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    featureTitle: {
        fontSize: 13,
        fontWeight: '700' as const,
        color: Colors.text,
        marginTop: 8,
        textAlign: 'center',
    },
    featureDesc: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginTop: 4,
        textAlign: 'center',
        lineHeight: 16,
    },
    disclaimerCard: {
        backgroundColor: '#FEF3C7',
        borderRadius: 14,
        padding: 18,
        borderLeftWidth: 4,
        borderLeftColor: Colors.warning,
    },
    disclaimerTitle: {
        fontSize: 14,
        fontWeight: '700' as const,
        color: '#92400E',
        marginBottom: 6,
    },
    disclaimerText: {
        fontSize: 13,
        color: '#92400E',
        lineHeight: 20,
    },
});
