import { useState, useCallback, useRef, useEffect } from 'react';
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
    FlatList,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { MessageSquare, Mic, Video, Send, CheckCircle, Clock, MessageCircle, Square, Play, Pause, Trash2 } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { apiPost, apiGet, getToken } from '@/services/api';

type QuestionType = 'text' | 'voice' | 'video';

interface ExpertQuestion {
    id: string;
    type: QuestionType;
    question: string;
    status: 'pending' | 'answered';
    answerType?: 'text' | 'voice';
    answer: string | null;
    answerAudioBase64?: string;
    date: string;
}

const typeOptions = [
    { type: 'text' as QuestionType, title: 'Yazılı', description: 'Konusuna uzmanından yazılı destek alın.', color: '#3B82F6' },
    { type: 'voice' as QuestionType, title: 'Sesli', description: 'Sorunuzu sesli kaydederek uzmana iletin.', color: '#10B981' },
    { type: 'video' as QuestionType, title: 'Görüntülü', description: 'Hafta içi saatlerde canlı uzman görüşmesi.', color: '#8B5CF6' },
];

// Stable values at module level — not inside hooks
const dot1 = new Animated.Value(1);
const dot2 = new Animated.Value(1);
const dot3 = new Animated.Value(1);

function RecordingDots() {
    useEffect(() => {
        const makePulse = (val: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(val, { toValue: 1.8, duration: 350, useNativeDriver: true }),
                    Animated.timing(val, { toValue: 1, duration: 350, useNativeDriver: true }),
                ])
            );
        const a1 = makePulse(dot1, 0);
        const a2 = makePulse(dot2, 200);
        const a3 = makePulse(dot3, 400);
        a1.start(); a2.start(); a3.start();
        return () => { a1.stop(); a2.stop(); a3.stop(); };
    }, []);

    return (
        <View style={styles.dotsRow}>
            {[dot1, dot2, dot3].map((dot, i) => (
                <Animated.View key={i} style={[styles.dot, { transform: [{ scale: dot }] }]} />
            ))}
        </View>
    );
}

// Format seconds as mm:ss
function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function AskExpertScreen() {
    const queryClient = useQueryClient();
    const [selectedType, setSelectedType] = useState<QuestionType | null>(null);
    const [question, setQuestion] = useState('');
    const [sent, setSent] = useState(false);
    const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

    // Voice recording state
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordingUri, setRecordingUri] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null); // To track which audio is playing (either 'new' or a question ID)
    const [isPlaying, setIsPlaying] = useState(false);

    // Clean up sound on unmount
    useEffect(() => {
        return () => {
            sound?.unloadAsync();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [sound]);

    // Load question history
    const { data: questions = [], isLoading: historyLoading } = useQuery<ExpertQuestion[]>({
        queryKey: ['expertQuestions'],
        queryFn: async () => {
            const token = await getToken();
            if (!token) return [];
            return apiGet<ExpertQuestion[]>('/api/expert-questions');
        },
    });

    const sendMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            if (!token) throw new Error('Soru göndermek için önce giriş yapmanız gerekiyor');

            if (selectedType === 'text') {
                if (!question.trim()) throw new Error('Lütfen sorunuzu yazınız');
                return apiPost<ExpertQuestion>('/api/expert-questions', { type: 'text', question });
            }

            if (selectedType === 'voice') {
                if (!recordingUri) throw new Error('Lütfen önce ses kaydı yapınız');
                const audioBase64 = await FileSystem.readAsStringAsync(recordingUri, { encoding: 'base64' as any });
                return apiPost<ExpertQuestion>('/api/expert-questions', {
                    type: 'voice',
                    question: '(Sesli Soru)',
                    audioBase64,
                    audioMimeType: 'audio/m4a',
                });
            }

            throw new Error('Bu özellik henüz aktif değil');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expertQuestions'] });
            setSent(true);
        },
        onError: (err: Error) => Alert.alert('Hata', err.message),
    });

    // --- Recording functions ---
    const startRecording = useCallback(async () => {
        try {
            const { granted } = await Audio.requestPermissionsAsync();
            if (!granted) { Alert.alert('İzin Gerekli', 'Mikrofon erişimi için izin veriniz.'); return; }
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording: rec } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(rec);
            setIsRecording(true);
            setRecordingSeconds(0);
            timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
        } catch (e) {
            Alert.alert('Hata', 'Ses kaydı başlatılamadı.');
        }
    }, []);

    const stopRecording = useCallback(async () => {
        if (!recording) return;
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        setRecordingUri(uri ?? null);
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    }, [recording]);

    const discardRecording = useCallback(() => {
        setRecordingUri(null);
        setRecordingSeconds(0);
        sound?.unloadAsync();
        setSound(null);
        setIsPlaying(false);
    }, [sound]);

    const togglePlayback = useCallback(async (base64String?: string, id?: string) => {
        const audioId = id || 'new';

        // Stop current if any
        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSound(null);
            setIsPlaying(false);
            if (playingId === audioId) {
                setPlayingId(null);
                return; // User tapped stop on the same track
            }
        }

        // Play new track
        let uriToPlay = recordingUri;
        if (base64String) {
            uriToPlay = `data:audio/m4a;base64,${base64String}`;
        }

        if (!uriToPlay) return;

        const { sound: newSound } = await Audio.Sound.createAsync({ uri: uriToPlay }, { shouldPlay: true });
        setSound(newSound);
        setIsPlaying(true);
        setPlayingId(audioId);

        newSound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded && status.didJustFinish) {
                setIsPlaying(false);
                setPlayingId(null);
            }
        });
    }, [recordingUri, sound, playingId]);

    const handleReset = useCallback(() => {
        setSent(false);
        setSelectedType(null);
        setQuestion('');
        discardRecording();
    }, [discardRecording]);

    if (sent) {
        return (
            <View style={styles.successContainer}>
                <View style={styles.successCard}>
                    <CheckCircle size={56} color={Colors.success} />
                    <Text style={styles.successTitle}>Sorunuz Gönderildi</Text>
                    <Text style={styles.successDesc}>Uzmanımız en kısa sürede sorunuzu yanıtlayacaktır.</Text>
                    <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
                        <Text style={styles.resetBtnText}>Yeni Soru Sor</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.resetBtn, styles.resetBtnSecondary]}
                        onPress={() => { handleReset(); setActiveTab('history'); }}>
                        <Text style={[styles.resetBtnText, { color: Colors.primary }]}>Geçmişe Bak</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {/* Tab bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity style={[styles.tab, activeTab === 'new' && styles.tabActive]} onPress={() => setActiveTab('new')}>
                    <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>Yeni Soru</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'history' && styles.tabActive]} onPress={() => setActiveTab('history')}>
                    <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                        Sorularım {questions.length > 0 ? `(${questions.length})` : ''}
                    </Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'new' ? (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <View style={styles.banner}>
                        <Text style={styles.bannerText}>Sormak istediğiniz soru türünü seçiniz.</Text>
                    </View>

                    {/* Type selection */}
                    {typeOptions.map((option) => (
                        <TouchableOpacity
                            key={option.type}
                            style={[styles.typeCard, selectedType === option.type && { borderColor: option.color, borderWidth: 2 }]}
                            onPress={() => { setSelectedType(option.type); discardRecording(); setQuestion(''); }}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.typeIcon, { backgroundColor: option.color + '18' }]}>
                                {option.type === 'text' && <MessageSquare size={24} color={option.color} />}
                                {option.type === 'voice' && <Mic size={24} color={option.color} />}
                                {option.type === 'video' && <Video size={24} color={option.color} />}
                            </View>
                            <View style={styles.typeContent}>
                                <Text style={styles.typeTitle}>{option.title}</Text>
                                <Text style={styles.typeDesc}>{option.description}</Text>
                            </View>
                            {selectedType === option.type && (
                                <View style={[styles.selectedDot, { backgroundColor: option.color }]} />
                            )}
                        </TouchableOpacity>
                    ))}

                    {/* Text question input */}
                    {selectedType === 'text' && (
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Sorunuz</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Sorunuzu buraya yazınız..."
                                placeholderTextColor={Colors.textLight}
                                value={question}
                                onChangeText={setQuestion}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                            />
                        </View>
                    )}

                    {/* Voice recording UI */}
                    {selectedType === 'voice' && (
                        <View style={styles.recordingCard}>
                            {!recordingUri ? (
                                <>
                                    <Text style={styles.recordingHint}>
                                        {isRecording ? 'Kayıt devam ediyor...' : 'Sorunuzu kaydetmek için butona basın'}
                                    </Text>
                                    {isRecording && (
                                        <View style={styles.recordingStatus}>
                                            <RecordingDots />
                                            <Text style={styles.recordingTimer}>{formatTime(recordingSeconds)}</Text>
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
                                        onPress={isRecording ? stopRecording : startRecording}
                                        activeOpacity={0.8}
                                    >
                                        {isRecording
                                            ? <Square size={28} color="#fff" fill="#fff" />
                                            : <Mic size={28} color="#fff" />
                                        }
                                    </TouchableOpacity>
                                    <Text style={styles.recordBtnLabel}>{isRecording ? 'Durdur' : 'Kaydet'}</Text>
                                </>
                            ) : (
                                <>
                                    <View style={styles.recordingDoneRow}>
                                        <CheckCircle size={22} color={Colors.success} />
                                        <Text style={styles.recordingDoneText}>Ses kaydı hazır ({formatTime(recordingSeconds)})</Text>
                                    </View>
                                    <View style={styles.playbackRow}>
                                        <TouchableOpacity style={styles.playBtn} onPress={() => togglePlayback()} activeOpacity={0.8}>
                                            {isPlaying && playingId === 'new'
                                                ? <Pause size={20} color={Colors.white} />
                                                : <Play size={20} color={Colors.white} />
                                            }
                                            <Text style={styles.playBtnText}>{isPlaying && playingId === 'new' ? 'Durdur' : 'Dinle'}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.discardBtn} onPress={discardRecording} activeOpacity={0.8}>
                                            <Trash2 size={18} color={Colors.error} />
                                            <Text style={styles.discardBtnText}>Sil</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    {/* Video placeholder */}
                    {selectedType === 'video' && (
                        <View style={styles.videoPlaceholder}>
                            <Video size={36} color={Colors.textLight} />
                            <Text style={styles.videoPlaceholderText}>Görüntülü görüşme özelliği yakında aktif olacak.</Text>
                        </View>
                    )}

                    {/* Send button */}
                    {selectedType && selectedType !== 'video' && (
                        <TouchableOpacity
                            style={[styles.sendBtn, sendMutation.isPending && { opacity: 0.6 }]}
                            onPress={() => sendMutation.mutate()}
                            activeOpacity={0.85}
                            disabled={sendMutation.isPending}
                        >
                            {sendMutation.isPending
                                ? <ActivityIndicator color={Colors.white} />
                                : <><Send size={20} color={Colors.white} /><Text style={styles.sendBtnText}>Gönder</Text></>
                            }
                        </TouchableOpacity>
                    )}
                </ScrollView>
            ) : (
                /* History tab */
                <View style={{ flex: 1 }}>
                    {historyLoading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator color={Colors.primary} />
                        </View>
                    ) : questions.length === 0 ? (
                        <View style={styles.centerContainer}>
                            <MessageCircle size={48} color={Colors.textLight} />
                            <Text style={styles.centerText}>Henüz soru göndermediniz.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={questions}
                            keyExtractor={q => String(q.id)}
                            contentContainerStyle={{ padding: 16 }}
                            renderItem={({ item }) => (
                                <View style={styles.historyCard}>
                                    <View style={styles.historyHeader}>
                                        <View style={[styles.typeBadge, { backgroundColor: item.type === 'voice' ? '#10B98120' : '#3B82F620' }]}>
                                            {item.type === 'voice'
                                                ? <Mic size={13} color="#10B981" />
                                                : <MessageSquare size={13} color="#3B82F6" />
                                            }
                                            <Text style={[styles.typeBadgeText, { color: item.type === 'voice' ? '#10B981' : '#3B82F6' }]}>
                                                {item.type === 'voice' ? 'Sesli' : 'Yazılı'}
                                            </Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: item.status === 'answered' ? Colors.success + '20' : Colors.warning + '20' }]}>
                                            {item.status === 'answered'
                                                ? <CheckCircle size={13} color={Colors.success} />
                                                : <Clock size={13} color={Colors.warning} />
                                            }
                                            <Text style={[styles.statusText, { color: item.status === 'answered' ? Colors.success : Colors.warning }]}>
                                                {item.status === 'answered' ? 'Yanıtlandı' : 'Beklemede'}
                                            </Text>
                                        </View>
                                        <Text style={styles.historyDate}>{item.date}</Text>
                                    </View>
                                    {item.question && item.question !== '(Sesli Soru)' && (
                                        <Text style={styles.historyQuestion}>{item.question}</Text>
                                    )}
                                    {item.type === 'voice' && <Text style={styles.voiceNote}>🎙️ Ses kaydı gönderildi</Text>}
                                    {item.status === 'answered' && (
                                        <View style={styles.answerBox}>
                                            <Text style={styles.answerLabel}>Uzman Yanıtı:</Text>
                                            {item.answerType === 'voice' && item.answerAudioBase64 ? (
                                                <TouchableOpacity
                                                    style={[styles.playBtn, { marginTop: 8, paddingHorizontal: 16 }]}
                                                    onPress={() => togglePlayback(item.answerAudioBase64, item.id)}
                                                >
                                                    {isPlaying && playingId === item.id
                                                        ? <Pause size={20} color={Colors.white} />
                                                        : <Play size={20} color={Colors.white} />
                                                    }
                                                    <Text style={styles.playBtnText}>
                                                        {isPlaying && playingId === item.id ? 'Durdur' : 'Sesli Yanıtı Dinle'}
                                                    </Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <Text style={styles.answerText}>{item.answer}</Text>
                                            )}
                                        </View>
                                    )}
                                </View>
                            )}
                            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                        />
                    )}
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    tabBar: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
    tabText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' as const },
    tabTextActive: { color: Colors.primary, fontWeight: '700' as const },
    scrollContent: { padding: 20 },
    banner: { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 16, marginBottom: 20 },
    bannerText: { fontSize: 15, fontWeight: '600' as const, color: Colors.white, textAlign: 'center', lineHeight: 22 },
    typeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, elevation: 1 },
    typeIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    typeContent: { flex: 1 },
    typeTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginBottom: 3 },
    typeDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
    selectedDot: { width: 10, height: 10, borderRadius: 5 },
    inputSection: { marginBottom: 8 },
    inputLabel: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 8 },
    textArea: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, fontSize: 15, color: Colors.text, minHeight: 120, borderWidth: 1, borderColor: Colors.border, lineHeight: 22 },
    // Voice recording
    recordingCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 28, alignItems: 'center', marginBottom: 16, elevation: 2 },
    recordingHint: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 20 },
    recordingStatus: { alignItems: 'center', marginBottom: 16 },
    recordingTimer: { fontSize: 28, fontWeight: '700' as const, color: Colors.error, letterSpacing: 2, marginTop: 8 },
    dotsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.error },
    recordBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
    recordBtnActive: { backgroundColor: Colors.error },
    recordBtnLabel: { marginTop: 10, fontSize: 14, color: Colors.textSecondary, fontWeight: '500' as const },
    recordingDoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    recordingDoneText: { fontSize: 15, color: Colors.success, fontWeight: '600' as const },
    playbackRow: { flexDirection: 'row', gap: 14 },
    playBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    playBtnText: { color: Colors.white, fontWeight: '600' as const, fontSize: 14 },
    discardBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.error },
    discardBtnText: { color: Colors.error, fontWeight: '600' as const, fontSize: 14 },
    videoPlaceholder: { alignItems: 'center', padding: 32, backgroundColor: Colors.white, borderRadius: 18, marginBottom: 16 },
    videoPlaceholderText: { marginTop: 12, fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
    sendBtn: { flexDirection: 'row', backgroundColor: Colors.primary, height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8, gap: 10 },
    sendBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' as const },
    // Success
    successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 20 },
    successCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 36, alignItems: 'center', width: '100%' },
    successTitle: { fontSize: 22, fontWeight: '700' as const, color: Colors.text, marginTop: 16, marginBottom: 8 },
    successDesc: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    resetBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 10 },
    resetBtnSecondary: { backgroundColor: Colors.background },
    resetBtnText: { color: Colors.white, fontSize: 16, fontWeight: '600' as const },
    // History
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 40 },
    centerText: { fontSize: 15, color: Colors.textSecondary },
    historyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, elevation: 1 },
    historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' as const },
    typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    typeBadgeText: { fontSize: 12, fontWeight: '600' as const },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 12, fontWeight: '600' as const },
    historyDate: { fontSize: 12, color: Colors.textLight, marginLeft: 'auto' as any },
    historyQuestion: { fontSize: 15, color: Colors.text, lineHeight: 22 },
    voiceNote: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
    answerBox: { marginTop: 12, padding: 12, backgroundColor: Colors.success + '0D', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: Colors.success },
    answerLabel: { fontSize: 12, fontWeight: '700' as const, color: Colors.success, marginBottom: 4 },
    answerText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
});
