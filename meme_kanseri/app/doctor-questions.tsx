import { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Mic, CheckCircle, Clock, Send, Play, Pause, Square, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiGet, getToken, BASE_URL } from '@/services/api';

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
    const token = await getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Sunucu hatası');
    return data as T;
}

interface DoctorQuestion {
    id: string;
    type: 'text' | 'voice' | 'video';
    question: string;
    audioBase64?: string;
    audioMimeType?: string;
    status: 'pending' | 'answered';
    answerType?: 'text' | 'voice';
    answer: string | null;
    answerAudioBase64?: string;
    answerAudioMimeType?: string;
    date: string;
    patient: { name: string; email: string };
}

// Format seconds as mm:ss
function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function DoctorQuestionsScreen() {
    const queryClient = useQueryClient();
    const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState('');
    const [replyMode, setReplyMode] = useState<'text' | 'voice'>('text');

    // General Playback state (For both reading patient questions & reviewing doctor answers)
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);

    // Voice recording state
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordingUri, setRecordingUri] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        return () => {
            if (sound) sound.unloadAsync();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [sound]);

    const { data: questions = [], isLoading, refetch } = useQuery<DoctorQuestion[]>({
        queryKey: ['doctorQuestions'],
        queryFn: () => apiGet<DoctorQuestion[]>('/api/expert-questions/all'),
    });

    const answerMutation = useMutation({
        mutationFn: async ({ id, answerType, answer, answerAudioBase64 }: { id: string, answerType: string, answer?: string, answerAudioBase64?: string }) => {
            return apiPatch<{ success: boolean }>(`/api/expert-questions/${id}/answer`, { answerType, answer, answerAudioBase64 });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctorQuestions'] });
            setSelectedQuestionId(null);
            setAnswerText('');
            discardRecording();
            Alert.alert('Başarılı', 'Cevabınız kaydedildi ve hastaya iletildi.');
        },
        onError: (err: Error) => Alert.alert('Hata', err.message),
    });

    const handleAnswerSubmit = async (id: string) => {
        if (replyMode === 'text') {
            if (!answerText.trim()) {
                Alert.alert('Hata', 'Cevap alanı boş bırakılamaz.');
                return;
            }
            answerMutation.mutate({ id, answerType: 'text', answer: answerText });
        } else {
            if (!recordingUri) {
                Alert.alert('Hata', 'Lütfen ses kaydı oluşturun.');
                return;
            }
            try {
                const answerAudioBase64 = await FileSystem.readAsStringAsync(recordingUri, { encoding: 'base64' as any });
                answerMutation.mutate({ id, answerType: 'voice', answerAudioBase64 });
            } catch (e) {
                Alert.alert('Hata', 'Ses dosyası okunamadı.');
            }
        }
    };

    const togglePlayback = async (id: string, base64Audio: string) => {
        if (playingId === id && sound) {
            await sound.stopAsync();
            setPlayingId(null);
            return;
        }

        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSound(null);
        }

        try {
            const uri = `data:audio/m4a;base64,${base64Audio}`;
            const { sound: newSound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });

            setSound(newSound);
            setPlayingId(id);

            newSound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded && status.didJustFinish) {
                    setPlayingId(null);
                }
            });
        } catch (e) {
            console.error('Ses çalınamadı', e);
            Alert.alert('Hata', 'Kayıt oynatılamadı.');
        }
    };

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
        if (sound && playingId === 'preview') {
            sound.unloadAsync();
            setSound(null);
            setPlayingId(null);
        }
    }, [sound, playingId]);

    const playPreview = async () => {
        if (!recordingUri) return;
        if (playingId === 'preview' && sound) {
            await sound.stopAsync();
            setPlayingId(null);
            return;
        }
        if (sound) { await sound.stopAsync(); await sound.unloadAsync(); }

        const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordingUri }, { shouldPlay: true });
        setSound(newSound);
        setPlayingId('preview');
        newSound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded && status.didJustFinish) setPlayingId(null);
        });
    };

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {questions.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>Henüz hiç hasta sorusu bulunmuyor.</Text>
                </View>
            ) : (
                <FlatList
                    data={questions}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    refreshing={isLoading}
                    onRefresh={refetch}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.patientInfo}>
                                    <View style={[styles.avatar, { backgroundColor: Colors.primary + '20' }]}>
                                        <Text style={styles.avatarText}>{item.patient.name.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.patientName}>{item.patient.name}</Text>
                                        <Text style={styles.dateText}>{item.date}</Text>
                                    </View>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: item.status === 'answered' ? Colors.success + '20' : Colors.warning + '20' }]}>
                                    {item.status === 'answered' ? <CheckCircle size={12} color={Colors.success} /> : <Clock size={12} color={Colors.warning} />}
                                    <Text style={[styles.statusText, { color: item.status === 'answered' ? Colors.success : Colors.warning }]}>
                                        {item.status === 'answered' ? 'Yanıtlandı' : 'Bekliyor'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.questionContent}>
                                <View style={styles.typeRow}>
                                    {item.type === 'voice' ? <Mic size={16} color="#10B981" /> : <MessageSquare size={16} color="#3B82F6" />}
                                    <Text style={styles.typeText}>{item.type === 'voice' ? 'Sesli Soru' : 'Yazılı Soru'}</Text>
                                </View>

                                {item.type === 'voice' ? (
                                    <View style={styles.voicePlayer}>
                                        <TouchableOpacity
                                            style={styles.playBtn}
                                            onPress={() => item.audioBase64 ? togglePlayback(`q-${item.id}`, item.audioBase64) : null}
                                            disabled={!item.audioBase64}
                                        >
                                            {playingId === `q-${item.id}` ? <Pause size={20} color={Colors.white} /> : <Play size={20} color={Colors.white} />}
                                            <Text style={styles.playBtnText}>{playingId === `q-${item.id}` ? 'Durdur' : 'Dinle'}</Text>
                                        </TouchableOpacity>
                                        {!item.audioBase64 && <Text style={styles.errorText}>Ses verisi eksik</Text>}
                                    </View>
                                ) : (
                                    <Text style={styles.questionText}>{item.question}</Text>
                                )}
                            </View>

                            {item.status === 'answered' ? (
                                <View style={styles.answerBox}>
                                    <Text style={styles.answerLabel}>Sizin Yanıtınız:</Text>
                                    {item.answerType === 'voice' && item.answerAudioBase64 ? (
                                        <View style={[styles.voicePlayer, { marginTop: 8 }]}>
                                            <TouchableOpacity
                                                style={styles.playBtn}
                                                onPress={() => togglePlayback(`a-${item.id}`, item.answerAudioBase64!)}
                                            >
                                                {playingId === `a-${item.id}` ? <Pause size={20} color={Colors.white} /> : <Play size={20} color={Colors.white} />}
                                                <Text style={styles.playBtnText}>{playingId === `a-${item.id}` ? 'Durdur' : 'Kaydı Dinle'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <Text style={styles.answerText}>{item.answer}</Text>
                                    )}
                                </View>
                            ) : (
                                selectedQuestionId === item.id ? (
                                    <View style={styles.replyBox}>
                                        <View style={styles.replyTabs}>
                                            <TouchableOpacity
                                                style={[styles.replyTab, replyMode === 'text' && styles.replyTabActive]}
                                                onPress={() => setReplyMode('text')}
                                            >
                                                <MessageSquare size={16} color={replyMode === 'text' ? Colors.white : Colors.textSecondary} />
                                                <Text style={[styles.replyTabText, replyMode === 'text' && styles.replyTabTextActive]}>Yazılı Cevap</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.replyTab, replyMode === 'voice' && styles.replyTabVoiceActive]}
                                                onPress={() => setReplyMode('voice')}
                                            >
                                                <Mic size={16} color={replyMode === 'voice' ? Colors.white : Colors.textSecondary} />
                                                <Text style={[styles.replyTabText, replyMode === 'voice' && styles.replyTabTextActive]}>Sesli Cevap</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {replyMode === 'text' ? (
                                            <TextInput
                                                style={styles.replyInput}
                                                placeholder="Cevabınızı yazın..."
                                                placeholderTextColor={Colors.textLight}
                                                multiline
                                                value={answerText}
                                                onChangeText={setAnswerText}
                                                autoFocus
                                            />
                                        ) : (
                                            <View style={styles.recordingArea}>
                                                {!recordingUri ? (
                                                    <View style={styles.recordingControls}>
                                                        {isRecording && <Text style={styles.recordingTimer}>{formatTime(recordingSeconds)}</Text>}
                                                        <TouchableOpacity
                                                            style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
                                                            onPress={isRecording ? stopRecording : startRecording}
                                                            activeOpacity={0.8}
                                                        >
                                                            {isRecording ? <Square size={24} color="#fff" fill="#fff" /> : <Mic size={24} color="#fff" />}
                                                        </TouchableOpacity>
                                                        <Text style={styles.recordLabel}>{isRecording ? 'Kaydı Durdur' : 'Yanıtı Kaydet'}</Text>
                                                    </View>
                                                ) : (
                                                    <View style={styles.recordedControls}>
                                                        <View style={styles.playbackRow}>
                                                            <TouchableOpacity style={styles.previewBtn} onPress={playPreview}>
                                                                {playingId === 'preview' ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" />}
                                                                <Text style={styles.previewBtnText}>{playingId === 'preview' ? 'Durdur' : 'Dinle'}</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity style={styles.deleteBtn} onPress={discardRecording}>
                                                                <Trash2 size={18} color={Colors.error} />
                                                            </TouchableOpacity>
                                                        </View>
                                                        <Text style={styles.recordingDoneText}>Ses kaydı hazır ({formatTime(recordingSeconds)})</Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}

                                        <View style={styles.replyActions}>
                                            <TouchableOpacity
                                                style={styles.cancelBtn}
                                                onPress={() => { setSelectedQuestionId(null); setAnswerText(''); discardRecording(); setReplyMode('text'); }}
                                            >
                                                <Text style={styles.cancelBtnText}>İptal</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.sendBtn, answerMutation.isPending && { opacity: 0.5 }]}
                                                onPress={() => handleAnswerSubmit(item.id)}
                                                disabled={answerMutation.isPending}
                                            >
                                                {answerMutation.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Send size={16} color="#fff" />}
                                                <Text style={styles.sendBtnText}>Gönder</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.openReplyBtn}
                                        onPress={() => { setSelectedQuestionId(item.id); setAnswerText(''); setReplyMode('text'); discardRecording(); }}
                                    >
                                        <Text style={styles.openReplyBtnText}>Cevap Yaz</Text>
                                    </TouchableOpacity>
                                )
                            )}
                        </View>
                    )}
                />
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyText: { fontSize: 16, color: Colors.textSecondary },
    listContainer: { padding: 16, paddingBottom: 40 },
    card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    patientInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 16, fontWeight: '700' as const, color: Colors.primary },
    patientName: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
    dateText: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: '600' as const },
    questionContent: { marginBottom: 12, backgroundColor: Colors.background, padding: 12, borderRadius: 12 },
    typeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    typeText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
    questionText: { fontSize: 15, color: Colors.text, lineHeight: 22 },
    voicePlayer: { flexDirection: 'row', alignItems: 'center' },
    playBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    playBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' as const },
    errorText: { color: Colors.error, fontSize: 12, marginLeft: 10 },
    answerBox: { backgroundColor: Colors.success + '10', padding: 12, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: Colors.success },
    answerLabel: { fontSize: 12, fontWeight: '700' as const, color: Colors.success, marginBottom: 4 },
    answerText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
    openReplyBtn: { backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    openReplyBtnText: { color: Colors.white, fontSize: 15, fontWeight: '600' as const },
    replyBox: { marginTop: 8 },
    replyTabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    replyTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.background },
    replyTabActive: { backgroundColor: Colors.primary },
    replyTabVoiceActive: { backgroundColor: '#10B981' },
    replyTabText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
    replyTabTextActive: { color: Colors.white },
    replyInput: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, minHeight: 100, textAlignVertical: 'top', fontSize: 15, color: Colors.text, marginBottom: 12 },
    recordingArea: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 12 },
    recordingControls: { alignItems: 'center' },
    recordingTimer: { fontSize: 24, fontWeight: '700' as const, color: Colors.error, letterSpacing: 1, marginBottom: 12 },
    recordBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', elevation: 2 },
    recordBtnActive: { backgroundColor: Colors.error },
    recordLabel: { marginTop: 8, fontSize: 13, color: Colors.textSecondary, fontWeight: '500' as const },
    recordedControls: { alignItems: 'center', gap: 12 },
    playbackRow: { flexDirection: 'row', gap: 12 },
    previewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    previewBtnText: { color: '#fff', fontWeight: '600' as const },
    deleteBtn: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.error, justifyContent: 'center', alignItems: 'center' },
    recordingDoneText: { fontSize: 13, color: Colors.success, fontWeight: '600' as const },
    replyActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.background },
    cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' as const },
    sendBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    sendBtnText: { color: Colors.white, fontWeight: '600' as const },
});
