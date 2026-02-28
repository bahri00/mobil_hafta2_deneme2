import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Audio } from 'expo-av';
import { CalendarDays, TestTube, Activity, User as UserIcon, MessageSquare, Mic, CheckCircle, Clock, Play, Pause } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiGet } from '@/services/api';

interface PatientProfile {
    id: string;
    name: string;
    email: string;
    birthDate?: string;
    city?: string;
    joinDate: string;
    symptomEntries: Record<string, { symptoms: Array<{ label: string, severity: number, _id?: string }>; note?: string }>;
    bloodTests: Array<{
        id: string;
        testDate: string;
        hemoglobin?: number;
        wbc?: number;
        platelets?: number;
        neutrophils?: number;
        notes?: string;
        imageBase64?: string;
        imageMimeType?: string;
    }>;
    questions: Array<{
        id: string;
        type: 'text' | 'voice' | 'video';
        question: string;
        audioBase64?: string;
        audioMimeType?: string;
        status: 'pending' | 'answered';
        answerType?: 'text' | 'voice';
        answer: string | null;
        answerAudioBase64?: string;
        date: string;
    }>;
}

export default function DoctorPatientProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (sound) sound.unloadAsync();
        };
    }, [sound]);

    const togglePlayback = useCallback(async (base64Audio: string, trackId: string) => {
        if (playingId === trackId && sound) {
            await sound.stopAsync();
            setPlayingId(null);
            return;
        }

        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
        }

        try {
            const uri = `data:audio/m4a;base64,${base64Audio}`;
            const { sound: newSound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });

            setSound(newSound);
            setPlayingId(trackId);

            newSound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded && status.didJustFinish) {
                    setPlayingId(null);
                }
            });
        } catch (e) {
            console.error('Ses çalınamadı', e);
        }
    }, [sound, playingId]);

    const { data: profile, isLoading } = useQuery<PatientProfile>({
        queryKey: ['doctorPatientProfile', id],
        queryFn: () => apiGet<PatientProfile>(`/api/patients/${id}/profile`),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>Profil bulunamadı.</Text>
            </View>
        );
    }

    const symptomDates = Object.keys(profile.symptomEntries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header / Basic Info */}
            <View style={styles.headerCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.email}>{profile.email}</Text>
                {profile.birthDate && profile.birthDate !== 'Bilinmiyor' && (
                    <Text style={styles.joinDate}>Doğum Tarihi: {profile.birthDate}</Text>
                )}
                {profile.city && profile.city !== 'Bilinmiyor' && (
                    <Text style={styles.joinDate}>Şehir: {profile.city}</Text>
                )}
                <Text style={styles.joinDate}>Kayıt Tarihi: {profile.joinDate}</Text>
            </View>

            {/* Blood Tests */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <TestTube size={20} color={Colors.primary} />
                    <Text style={styles.sectionTitle}>Kan Tahlilleri</Text>
                </View>
                {profile.bloodTests.length === 0 ? (
                    <Text style={styles.noDataText}>Hiç kan tahlili girişi yok.</Text>
                ) : (
                    profile.bloodTests.map(test => (
                        <View key={test.id} style={styles.card}>
                            <Text style={styles.cardDate}>{test.testDate}</Text>
                            {test.imageBase64 && (
                                <Image
                                    source={{ uri: `data:${test.imageMimeType || 'image/jpeg'};base64,${test.imageBase64}` }}
                                    style={{ width: '100%', height: 250, borderRadius: 10, marginTop: 10, backgroundColor: Colors.border }}
                                    resizeMode="cover"
                                />
                            )}
                            {test.notes ? <Text style={styles.notesText}>Not: {test.notes}</Text> : null}
                        </View>
                    ))
                )}
            </View>

            {/* Symptom Calendar */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <CalendarDays size={20} color={Colors.primary} />
                    <Text style={styles.sectionTitle}>Belirti Takvimi</Text>
                </View>
                {symptomDates.length === 0 ? (
                    <Text style={styles.noDataText}>Hiç belirti girişi yok.</Text>
                ) : (
                    symptomDates.map(date => {
                        const entry = profile.symptomEntries[date];
                        return (
                            <View key={date} style={styles.card}>
                                <Text style={styles.cardDate}>{date}</Text>
                                <View style={styles.tagsContainer}>
                                    {entry.symptoms.map((sym, index) => (
                                        <View key={sym._id || index} style={styles.tag}>
                                            <Activity size={12} color={Colors.primary} />
                                            <Text style={styles.tagText}>
                                                {sym.label} {sym.severity ? `(Seviye ${sym.severity})` : ''}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                                {entry.note ? <Text style={styles.notesText}>Not: {entry.note}</Text> : null}
                            </View>
                        );
                    })
                )}
            </View>

            {/* Questions List */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <MessageSquare size={20} color={Colors.primary} />
                    <Text style={styles.sectionTitle}>Sorulan Sorular</Text>
                </View>
                {!profile.questions || profile.questions.length === 0 ? (
                    <Text style={styles.noDataText}>Hastanın henüz bir sorusu bulunmuyor.</Text>
                ) : (
                    profile.questions.map(q => (
                        <View key={q.id} style={styles.questionCard}>
                            <View style={styles.qHeader}>
                                <View style={styles.qTypeRow}>
                                    {q.type === 'voice' ? <Mic size={14} color="#10B981" /> : <MessageSquare size={14} color="#3B82F6" />}
                                    <Text style={styles.qTypeText}>{q.type === 'voice' ? 'Sesli Soru' : 'Yazılı Soru'}</Text>
                                </View>
                                <Text style={styles.qDate}>{q.date}</Text>
                            </View>

                            {q.type === 'voice' && q.audioBase64 ? (
                                <TouchableOpacity
                                    style={styles.playBtn}
                                    onPress={() => togglePlayback(q.audioBase64!, `q-${q.id}`)}
                                >
                                    {playingId === `q-${q.id}` ? <Pause size={18} color={Colors.white} /> : <Play size={18} color={Colors.white} />}
                                    <Text style={styles.playBtnText}>{playingId === `q-${q.id}` ? 'Durdur' : 'Soruyu Dinle'}</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.qText}>{q.question}</Text>
                            )}

                            {/* Answer Section */}
                            <View style={[styles.qStatusBox, { backgroundColor: q.status === 'answered' ? Colors.success + '1A' : Colors.warning + '1A' }]}>
                                <View style={styles.qStatusHeader}>
                                    {q.status === 'answered' ? <CheckCircle size={14} color={Colors.success} /> : <Clock size={14} color={Colors.warning} />}
                                    <Text style={[styles.qStatusTitle, { color: q.status === 'answered' ? Colors.success : Colors.warning }]}>
                                        {q.status === 'answered' ? 'Yanıtlandı' : 'Bekliyor'}
                                    </Text>
                                </View>
                                {q.status === 'answered' && (
                                    <View style={{ marginTop: 6 }}>
                                        {q.answerType === 'voice' && q.answerAudioBase64 ? (
                                            <TouchableOpacity
                                                style={[styles.playBtn, { marginTop: 4 }]}
                                                onPress={() => togglePlayback(q.answerAudioBase64!, `a-${q.id}`)}
                                            >
                                                {playingId === `a-${q.id}` ? <Pause size={18} color={Colors.white} /> : <Play size={18} color={Colors.white} />}
                                                <Text style={styles.playBtnText}>{playingId === `a-${q.id}` ? 'Durdur' : 'Sesli Yanıtı Dinle'}</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <Text style={styles.qAnswerText}>{q.answer}</Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: 16, paddingBottom: 40 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: Colors.textSecondary },
    headerCard: { alignItems: 'center', backgroundColor: Colors.white, padding: 24, borderRadius: 20, marginBottom: 24, elevation: 1 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 32, fontWeight: '700' as const, color: Colors.primary },
    name: { fontSize: 20, fontWeight: '700' as const, color: Colors.text, marginBottom: 6 },
    email: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
    joinDate: { fontSize: 12, color: Colors.textLight },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
    noDataText: { fontSize: 14, color: Colors.textSecondary, fontStyle: 'italic', marginLeft: 4 },
    card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    cardDate: { fontSize: 14, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 12 },
    statsRow: { flexDirection: 'row', gap: 12 },
    statBox: { flex: 1, backgroundColor: Colors.background, padding: 10, borderRadius: 10, alignItems: 'center' },
    statLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
    statVal: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
    notesText: { marginTop: 12, fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic', backgroundColor: Colors.background, padding: 10, borderRadius: 8 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    tagText: { fontSize: 13, color: Colors.primary, fontWeight: '500' as const },
    questionCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    qTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    qTypeText: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },
    qDate: { fontSize: 12, color: Colors.textLight },
    qText: { fontSize: 15, color: Colors.text, lineHeight: 22, paddingBottom: 10 },
    playBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 10 },
    playBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' as const },
    qStatusBox: { padding: 12, borderRadius: 10, marginTop: 4 },
    qStatusHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    qStatusTitle: { fontSize: 12, fontWeight: '700' as const },
    qAnswerText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
});
