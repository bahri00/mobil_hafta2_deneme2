import { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Animated,
    ActivityIndicator,
    TextInput,
    FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import { Camera, Upload, CheckCircle, X, FileImage, Calendar, ClipboardList } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { apiPost, apiGet, getToken } from '@/services/api';

interface BloodTestRecord {
    id: string;
    fileName: string;
    note: string;
    date: string;
}

export default function BloodTestScreen() {
    const queryClient = useQueryClient();
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
    const [note, setNote] = useState<string>('');
    const [showImage, setShowImage] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
    const btnScale = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start();
    }, [btnScale]);

    const handlePressOut = useCallback(() => {
        Animated.spring(btnScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    }, [btnScale]);

    // Load upload history
    const { data: history = [], isLoading: historyLoading, refetch: refetchHistory } = useQuery<BloodTestRecord[]>({
        queryKey: ['bloodTests'],
        queryFn: async () => {
            const token = await getToken();
            if (!token) return [];
            return apiGet<BloodTestRecord[]>('/api/blood-tests');
        },
    });

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!imageUri) throw new Error('Lütfen önce bir resim seçin');
            const token = await getToken();
            if (!token) throw new Error('Yüklemek için giriş yapmanız gerekiyor');

            // Read file as base64 string literal (EncodingType may be undefined in some versions)
            const base64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: 'base64' as any,
            });

            const fileName = imageUri.split('/').pop() ?? 'blood-test.jpg';

            return apiPost('/api/blood-tests', {
                imageBase64: base64,
                imageMimeType,
                fileName,
                note,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bloodTests'] });
            Alert.alert(
                '✅ Yüklendi',
                'Kan tahlili görüntünüz MongoDB veritabanına başarıyla kaydedildi.',
                [{ text: 'Tamam', onPress: handleReset }]
            );
        },
        onError: (err: Error) => Alert.alert('Hata', err.message),
    });

    const pickImage = useCallback(async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.6, // compress a bit to keep base64 size manageable
                allowsEditing: false,
            });
            if (!result.canceled && result.assets[0]) {
                setImageUri(result.assets[0].uri);
                setImageMimeType(result.assets[0].mimeType ?? 'image/jpeg');
                setShowImage(true);
            }
        } catch (e) {
            Alert.alert('Hata', 'Resim seçilirken bir hata oluştu.');
        }
    }, []);

    const handleReset = useCallback(() => {
        setImageUri(null);
        setNote('');
        setShowImage(true);
    }, []);

    return (
        <View style={styles.container}>
            {/* Tab bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'upload' && styles.tabActive]}
                    onPress={() => setActiveTab('upload')}
                >
                    <Text style={[styles.tabText, activeTab === 'upload' && styles.tabTextActive]}>Yükle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'history' && styles.tabActive]}
                    onPress={() => { setActiveTab('history'); refetchHistory(); }}
                >
                    <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                        Geçmiş {history.length > 0 ? `(${history.length})` : ''}
                    </Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'upload' ? (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                    {/* Image area */}
                    {imageUri && showImage ? (
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: imageUri }}
                                style={styles.previewImage}
                                contentFit="contain"
                            />
                            <TouchableOpacity style={styles.removeBtn} onPress={handleReset}>
                                <X size={18} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                    ) : !imageUri ? (
                        <TouchableOpacity style={styles.emptyImageContainer} onPress={pickImage} activeOpacity={0.7}>
                            <FileImage size={56} color={Colors.textLight} />
                            <Text style={styles.emptyImageText}>Galeriden fotoğraf seçmek için tıklayın</Text>
                        </TouchableOpacity>
                    ) : null}

                    {/* Note */}
                    {imageUri && (
                        <View style={styles.noteSection}>
                            <Text style={styles.noteLabel}>Not (isteğe bağlı)</Text>
                            <TextInput
                                style={styles.noteInput}
                                placeholder="Bu tahlil hakkında not ekleyin..."
                                placeholderTextColor={Colors.textLight}
                                value={note}
                                onChangeText={setNote}
                                multiline
                            />
                        </View>
                    )}

                    {/* Action buttons */}
                    <View style={styles.actionRow}>
                        {imageUri && (
                            <TouchableOpacity
                                style={styles.toggleBtn}
                                onPress={() => setShowImage(!showImage)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.toggleBtnText}>
                                    {showImage ? 'Gizle' : 'Göster'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <View style={{ flex: 1 }} />
                        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                            <TouchableOpacity
                                style={[styles.uploadBtn, (!imageUri || uploadMutation.isPending) && styles.btnDisabled]}
                                onPress={() => uploadMutation.mutate()}
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                disabled={!imageUri || uploadMutation.isPending}
                                activeOpacity={0.85}
                                testID="upload-btn"
                            >
                                {uploadMutation.isPending
                                    ? <ActivityIndicator color={Colors.white} size="small" />
                                    : <><Upload size={18} color={Colors.white} /><Text style={styles.uploadBtnText}>Veritabanına Kaydet</Text></>
                                }
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    {/* Pick image button */}
                    <TouchableOpacity style={styles.pickBtn} onPress={pickImage} activeOpacity={0.8} testID="pick-image">
                        <Camera size={22} color={Colors.primary} />
                        <Text style={styles.pickBtnText}>{imageUri ? 'Farklı Resim Seç' : 'Galeriden Seç'}</Text>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                /* History tab */
                <View style={{ flex: 1 }}>
                    {historyLoading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator color={Colors.primary} size="large" />
                        </View>
                    ) : history.length === 0 ? (
                        <View style={styles.centerContainer}>
                            <ClipboardList size={48} color={Colors.textLight} />
                            <Text style={styles.centerText}>Henüz yüklenmiş tahlil yok.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={history}
                            keyExtractor={item => String(item.id)}
                            contentContainerStyle={{ padding: 16 }}
                            renderItem={({ item }) => (
                                <View style={styles.historyCard}>
                                    <View style={styles.historyHeader}>
                                        <View style={styles.historyIconCircle}>
                                            <FileImage size={20} color={Colors.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.historyFileName}>{item.fileName}</Text>
                                            <View style={styles.historyDateRow}>
                                                <Calendar size={12} color={Colors.textLight} />
                                                <Text style={styles.historyDate}>{item.date}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.savedBadge}>
                                            <CheckCircle size={14} color={Colors.success} />
                                            <Text style={styles.savedBadgeText}>Kaydedildi</Text>
                                        </View>
                                    </View>
                                    {item.note ? (
                                        <Text style={styles.historyNote}>{item.note}</Text>
                                    ) : null}
                                </View>
                            )}
                            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                        />
                    )}
                </View>
            )}
        </View>
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
    emptyImageContainer: { backgroundColor: Colors.white, borderRadius: 16, padding: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed' },
    emptyImageText: { fontSize: 14, color: Colors.textLight, marginTop: 12, textAlign: 'center' },
    imageContainer: { backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
    previewImage: { width: '100%', height: 280 },
    removeBtn: { position: 'absolute' as const, top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    noteSection: { marginBottom: 16 },
    noteLabel: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 8 },
    noteInput: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border, minHeight: 80, textAlignVertical: 'top' },
    actionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
    toggleBtn: { backgroundColor: Colors.primary + '18', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    toggleBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '600' as const },
    uploadBtn: { flexDirection: 'row', backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, alignItems: 'center', gap: 8 },
    btnDisabled: { opacity: 0.5 },
    uploadBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' as const },
    pickBtn: { flexDirection: 'row', backgroundColor: Colors.white, height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.primary, gap: 10 },
    pickBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '600' as const },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 40 },
    centerText: { fontSize: 15, color: Colors.textSecondary },
    historyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3 },
    historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    historyIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + '14', justifyContent: 'center', alignItems: 'center' },
    historyFileName: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 3 },
    historyDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    historyDate: { fontSize: 12, color: Colors.textLight },
    savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.success + '18', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    savedBadgeText: { fontSize: 11, color: Colors.success, fontWeight: '600' as const },
    historyNote: { marginTop: 10, fontSize: 13, color: Colors.textSecondary, lineHeight: 18, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
});
