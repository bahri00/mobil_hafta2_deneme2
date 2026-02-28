import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    Plus,
    Thermometer,
    Droplets,
    Battery,
    Frown,
    Wind,
    CheckCircle2,
    XCircle,
    Save,
    AlertCircle,
    ClipboardList,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiGet, apiPut, getToken } from '@/services/api';

// Stable empty reference — do NOT inline {} inside the component (causes infinite loop)
const EMPTY_ENTRIES: EntriesMap = {};

const MONTHS_TR = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const DAYS_TR = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

interface LoggedSymptom {
    id: string;
    label: string;
    severity: 1 | 2 | 3;
}

interface DayEntry {
    symptoms: LoggedSymptom[];
    note: string;
}

type EntriesMap = Record<string, DayEntry>;

const SYMPTOM_OPTIONS = [
    { id: 'nausea', label: 'Bulantı', icon: Droplets, color: '#3B82F6' },
    { id: 'fatigue', label: 'Yorgunluk', icon: Battery, color: '#F59E0B' },
    { id: 'pain', label: 'Ağrı', icon: Thermometer, color: '#EF4444' },
    { id: 'mood', label: 'Duygu Durumu', icon: Frown, color: '#8B5CF6' },
    { id: 'breath', label: 'Nefes Darlığı', icon: Wind, color: '#06B6D4' },
];

const SEVERITY_LABELS: Record<number, string> = { 1: 'Hafif', 2: 'Orta', 3: 'Şiddetli' };
const SEVERITY_COLORS: Record<number, string> = { 1: '#10B981', 2: '#F59E0B', 3: '#EF4444' };

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    const d = new Date(year, month, 1).getDay();
    return (d + 6) % 7;
}

function toDateStr(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function SymptomCalendarScreen() {
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
    const [addingSymptom, setAddingSymptom] = useState(false);
    const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([]);
    const [selectedSeverity, setSelectedSeverity] = useState<1 | 2 | 3>(1);
    const [note, setNote] = useState('');
    const [localSymptoms, setLocalSymptoms] = useState<LoggedSymptom[]>([]);
    const [activeTab, setActiveTab] = useState<'calendar' | 'history'>('calendar');
    // Tracks whether we already seeded local state from the initial API load
    const initializedRef = useRef(false);

    // Load all entries from API — gracefully falls back to empty if no auth
    const { data: entries = EMPTY_ENTRIES, isLoading, isError } = useQuery<EntriesMap>({
        queryKey: ['symptomEntries'],
        queryFn: async () => {
            const token = await getToken();
            if (!token) return EMPTY_ENTRIES;
            return apiGet<EntriesMap>('/api/symptom-entries');
        },
        retry: false,
    });

    const dateKey = useMemo(
        () => (selectedDay ? toDateStr(year, month, selectedDay) : null),
        [selectedDay, year, month]
    );

    const currentEntry: DayEntry = useMemo(
        () => (dateKey ? (entries[dateKey] ?? { symptoms: [], note: '' }) : { symptoms: [], note: '' }),
        [dateKey, entries]
    );

    // Sync local state ONLY when the user navigates to a different day
    useEffect(() => {
        const entry = dateKey ? (entries[dateKey] ?? { symptoms: [], note: '' }) : { symptoms: [], note: '' };
        setLocalSymptoms(entry.symptoms ?? []);
        setNote(entry.note ?? '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateKey]); // ⚠️ intentionally omit 'entries' — including it causes infinite re-render

    // One-shot sync: when API data first arrives, update the current day's local state
    useEffect(() => {
        if (!isLoading && !initializedRef.current && dateKey) {
            initializedRef.current = true;
            const entry = entries[dateKey] ?? { symptoms: [], note: '' };
            setLocalSymptoms(entry.symptoms ?? []);
            setNote(entry.note ?? '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading]);

    const saveMutation = useMutation({
        mutationFn: async (payload: { date: string; symptoms: LoggedSymptom[]; note: string }) => {
            const token = await getToken();
            if (!token) throw new Error('Kayıt için giriş yapmanız gerekiyor');
            return apiPut(`/api/symptom-entries/${payload.date}`, {
                symptoms: payload.symptoms,
                note: payload.note,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['symptomEntries'] });
            Alert.alert('✅ Kaydedildi', 'Belirti kaydınız veritabanına eklendi.');
        },
        onError: (err: Error) => Alert.alert('Hata', err.message),
    });

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const goToPrevMonth = useCallback(() => {
        setSelectedDay(null);
        setMonth(m => { if (m === 0) { setYear(y => y - 1); return 11; } return m - 1; });
    }, []);

    const goToNextMonth = useCallback(() => {
        setSelectedDay(null);
        setMonth(m => { if (m === 11) { setYear(y => y + 1); return 0; } return m + 1; });
    }, []);

    const getDotColor = (d: number): string | null => {
        const k = toDateStr(year, month, d);
        const e = entries[k];
        if (!e || !e.symptoms || e.symptoms.length === 0) return null;
        const maxSev = Math.max(...e.symptoms.map(s => s.severity)) as 1 | 2 | 3;
        return SEVERITY_COLORS[maxSev];
    };

    const handleSave = useCallback(() => {
        if (!dateKey) return;
        if (localSymptoms.length === 0) {
            Alert.alert('Belirti Gerekli', 'Kaydetmeden önce en az bir belirti eklemelisiniz.');
            return;
        }
        saveMutation.mutate({ date: dateKey, symptoms: localSymptoms, note });
    }, [dateKey, localSymptoms, note, saveMutation]);

    const handleAddSymptom = useCallback(() => {
        if (selectedSymptomIds.length === 0) return;
        const newSymptoms: LoggedSymptom[] = selectedSymptomIds.map((id, i) => {
            const option = SYMPTOM_OPTIONS.find(o => o.id === id)!;
            return {
                id: `${Date.now()}-${i}`,
                label: option.label,
                severity: selectedSeverity,
            };
        });
        setLocalSymptoms(prev => [...prev, ...newSymptoms]);
        setAddingSymptom(false);
        setSelectedSymptomIds([]);
        setSelectedSeverity(1);
    }, [selectedSymptomIds, selectedSeverity]);

    const handleRemoveSymptom = useCallback((symptomId: string) => {
        setLocalSymptoms(prev => prev.filter(s => s.id !== symptomId));
    }, []);

    // Build calendar grid
    const calendarCells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) calendarCells.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
    while (calendarCells.length % 7 !== 0) calendarCells.push(null);

    const isToday = (d: number) =>
        d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    // Saved entries sorted newest-first for the history tab
    const savedEntries = useMemo(() => {
        return Object.entries(entries)
            .filter(([, e]) => e.symptoms.length > 0 || e.note)
            .sort(([a], [b]) => b.localeCompare(a));
    }, [entries]);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Belirti Takvimi' }} />

            {/* Tab bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'calendar' && styles.tabActive]}
                    onPress={() => setActiveTab('calendar')}
                >
                    <CalendarDays size={15} color={activeTab === 'calendar' ? Colors.primary : Colors.textSecondary} />
                    <Text style={[styles.tabText, activeTab === 'calendar' && styles.tabTextActive]}>Takvim</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'history' && styles.tabActive]}
                    onPress={() => setActiveTab('history')}
                >
                    <ClipboardList size={15} color={activeTab === 'history' ? Colors.primary : Colors.textSecondary} />
                    <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                        Kayıtlar {savedEntries.length > 0 ? `(${savedEntries.length})` : ''}
                    </Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'calendar' ? (
                <ScrollView
                    contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Loading / Error banners */}
                    {isLoading && (
                        <View style={styles.infoBanner}>
                            <ActivityIndicator color={Colors.primary} size="small" />
                            <Text style={styles.infoBannerText}>Kayıtlar yükleniyor...</Text>
                        </View>
                    )}
                    {isError && (
                        <View style={styles.warnBanner}>
                            <AlertCircle size={16} color="#B45309" />
                            <Text style={styles.warnBannerText}>Sunucuya bağlanılamadı — veriler geçici olarak kaydedilmeyecek.</Text>
                        </View>
                    )}

                    {/* Month Navigator */}
                    <View style={styles.monthNav}>
                        <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
                            <ChevronLeft size={22} color={Colors.primary} />
                        </TouchableOpacity>
                        <View style={styles.monthLabelRow}>
                            <CalendarDays size={18} color={Colors.primary} />
                            <Text style={styles.monthLabel}>{MONTHS_TR[month]} {year}</Text>
                        </View>
                        <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
                            <ChevronRight size={22} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Calendar Grid */}
                    <View style={styles.calendarCard}>
                        <View style={styles.dayHeaderRow}>
                            {DAYS_TR.map(d => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
                        </View>
                        {Array.from({ length: calendarCells.length / 7 }, (_, row) => (
                            <View key={row} style={styles.weekRow}>
                                {calendarCells.slice(row * 7, row * 7 + 7).map((day, col) => {
                                    const dotColor = day ? getDotColor(day) : null;
                                    const isSel = day === selectedDay;
                                    return (
                                        <TouchableOpacity
                                            key={col}
                                            style={[styles.dayCell, isSel ? styles.dayCellSelected : undefined, (!isSel && day && isToday(day)) ? styles.dayCellToday : undefined]}
                                            onPress={() => day && setSelectedDay(day)}
                                            disabled={!day}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[
                                                styles.dayCellText,
                                                isSel ? styles.dayCellTextSelected : undefined,
                                                (!isSel && day && isToday(day)) ? styles.dayCellTextToday : undefined,
                                                !day ? styles.dayCellEmpty : undefined,
                                            ]}>
                                                {day ?? ''}
                                            </Text>
                                            {dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>

                    {/* Legend */}
                    <View style={styles.legendRow}>
                        {[1, 2, 3].map(sev => (
                            <View key={sev} style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: SEVERITY_COLORS[sev] }]} />
                                <Text style={styles.legendText}>{SEVERITY_LABELS[sev]}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Day Detail Panel */}
                    {selectedDay && (
                        <View style={styles.detailCard}>
                            <Text style={styles.detailDate}>{selectedDay} {MONTHS_TR[month]} {year}</Text>

                            {/* Symptoms Section */}
                            <Text style={styles.sectionLabel}>Belirtiler</Text>
                            {localSymptoms.length === 0 && !addingSymptom && (
                                <Text style={styles.emptyText}>Bu gün için belirti eklenmemiş.</Text>
                            )}
                            {localSymptoms.map(s => (
                                <View key={s.id} style={styles.symptomRow}>
                                    <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[s.severity] + '22' }]}>
                                        <Text style={[styles.severityText, { color: SEVERITY_COLORS[s.severity] }]}>
                                            {SEVERITY_LABELS[s.severity]}
                                        </Text>
                                    </View>
                                    <Text style={styles.symptomLabel}>{s.label}</Text>
                                    <TouchableOpacity onPress={() => handleRemoveSymptom(s.id)} style={styles.removeBtn}>
                                        <XCircle size={18} color={Colors.error} />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {/* Add Symptom Panel */}
                            {addingSymptom ? (
                                <View style={styles.addPanel}>
                                    <Text style={styles.addPanelLabel}>Belirti Seç</Text>
                                    <View style={styles.optionRow}>
                                        {SYMPTOM_OPTIONS.map(o => {
                                            const Icon = o.icon;
                                            const isSelected = selectedSymptomIds.includes(o.id);
                                            return (
                                                <TouchableOpacity
                                                    key={o.id}
                                                    style={[styles.optionChip, isSelected ? { borderColor: o.color, backgroundColor: o.color + '18' } : undefined]}
                                                    onPress={() => setSelectedSymptomIds(prev =>
                                                        prev.includes(o.id) ? prev.filter(id => id !== o.id) : [...prev, o.id]
                                                    )}
                                                    activeOpacity={0.7}
                                                >
                                                    <Icon size={14} color={isSelected ? o.color : Colors.textSecondary} />
                                                    <Text style={[styles.optionLabel, isSelected ? { color: o.color } : undefined]}>{o.label}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    <Text style={styles.addPanelLabel}>Şiddet</Text>
                                    <View style={styles.optionRow}>
                                        {([1, 2, 3] as const).map(sev => (
                                            <TouchableOpacity
                                                key={sev}
                                                style={[styles.severityChip, selectedSeverity === sev && { backgroundColor: SEVERITY_COLORS[sev] }]}
                                                onPress={() => setSelectedSeverity(sev)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.severityChipText, selectedSeverity === sev && { color: '#fff' }]}>
                                                    {SEVERITY_LABELS[sev]}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View style={styles.addActions}>
                                        <TouchableOpacity style={styles.cancelBtn} onPress={() => { setAddingSymptom(false); setSelectedSymptomIds([]); setSelectedSeverity(1); }}>
                                            <Text style={styles.cancelBtnText}>İptal</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.confirmBtn, selectedSymptomIds.length === 0 ? styles.confirmBtnDisabled : undefined]}
                                            onPress={handleAddSymptom}
                                            disabled={selectedSymptomIds.length === 0}
                                        >
                                            <CheckCircle2 size={16} color="#fff" />
                                            <Text style={styles.confirmBtnText}>Ekle</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.addBtn} onPress={() => setAddingSymptom(true)}>
                                    <Plus size={16} color={Colors.primary} />
                                    <Text style={styles.addBtnText}>Belirti Ekle</Text>
                                </TouchableOpacity>
                            )}

                            {/* Note */}
                            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Not</Text>
                            <TextInput
                                style={styles.noteInput}
                                placeholder="Bu gün için notunuzu yazın..."
                                placeholderTextColor={Colors.textLight}
                                multiline
                                value={note}
                                onChangeText={setNote}
                            />
                            <TouchableOpacity
                                style={[styles.saveBtn, saveMutation.isPending && styles.saveBtnDisabled]}
                                onPress={handleSave}
                                disabled={saveMutation.isPending}
                            >
                                {saveMutation.isPending
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <><Save size={16} color="#fff" /><Text style={styles.saveBtnText}>Kaydet</Text></>
                                }
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            ) : (
                /* History / Kayıtlar Tab */
                isLoading ? (
                    <View style={styles.historyCenter}>
                        <ActivityIndicator color={Colors.primary} size="large" />
                    </View>
                ) : savedEntries.length === 0 ? (
                    <View style={styles.historyCenter}>
                        <ClipboardList size={48} color={Colors.textLight} />
                        <Text style={styles.historyEmptyText}>Henüz kayıtlı belirti yok.</Text>
                        <Text style={styles.historyEmptySubText}>Takvim sekmesinden bir gün seçip kaydedebilirsiniz.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={savedEntries}
                        keyExtractor={([date]) => date}
                        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
                        renderItem={({ item: [date, entry] }) => {
                            const [y, m, d] = date.split('-').map(Number);
                            const dateLabel = `${d} ${MONTHS_TR[m - 1]} ${y}`;
                            return (
                                <View style={styles.historyCard}>
                                    <View style={styles.historyCardHeader}>
                                        <CalendarDays size={16} color={Colors.primary} />
                                        <Text style={styles.historyCardDate}>{dateLabel}</Text>
                                        <View style={styles.historyBadge}>
                                            <Text style={styles.historyBadgeText}>{entry.symptoms.length} belirti</Text>
                                        </View>
                                    </View>
                                    {entry.symptoms.map((s, i) => (
                                        <View key={i} style={styles.historySymptomRow}>
                                            <View style={[styles.historySevDot, { backgroundColor: SEVERITY_COLORS[s.severity] }]} />
                                            <Text style={styles.historySymptomLabel}>{s.label}</Text>
                                            <Text style={[styles.historySevText, { color: SEVERITY_COLORS[s.severity] }]}>
                                                {SEVERITY_LABELS[s.severity]}
                                            </Text>
                                        </View>
                                    ))}
                                    {!!entry.note && (
                                        <Text style={styles.historyNote} numberOfLines={2}>📝 {entry.note}</Text>
                                    )}
                                </View>
                            );
                        }}
                        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    />
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    // Tab bar
    tabBar: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
    tab: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
    tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' as const },
    tabTextActive: { color: Colors.primary, fontWeight: '700' as const },
    // Calendar tab
    scroll: { padding: 16 },
    infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, justifyContent: 'center', marginBottom: 8 },
    infoBannerText: { fontSize: 13, color: Colors.textSecondary },
    warnBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, backgroundColor: '#FEF3C7', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#F59E0B', marginBottom: 10 },
    warnBannerText: { flex: 1, fontSize: 13, color: '#92400E' },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, backgroundColor: Colors.white, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
    navBtn: { padding: 6 },
    monthLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    monthLabel: { fontSize: 17, fontWeight: '700' as const, color: Colors.primary },
    calendarCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
    dayHeaderRow: { flexDirection: 'row', marginBottom: 6 },
    dayHeader: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700' as const, color: Colors.textSecondary },
    weekRow: { flexDirection: 'row' },
    dayCell: { flex: 1, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10, margin: 1, position: 'relative' },
    dayCellSelected: { backgroundColor: Colors.primary },
    dayCellToday: { borderWidth: 1.5, borderColor: Colors.primary },
    dayCellEmpty: { color: 'transparent' },
    dayCellText: { fontSize: 14, color: Colors.text, fontWeight: '500' as const },
    dayCellTextSelected: { color: Colors.white, fontWeight: '700' as const },
    dayCellTextToday: { color: Colors.primary, fontWeight: '700' as const },
    dot: { width: 5, height: 5, borderRadius: 3, position: 'absolute', bottom: 4 },
    legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 14 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, color: Colors.textSecondary },
    // Detail card
    detailCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
    detailDate: { fontSize: 17, fontWeight: '700' as const, color: Colors.primary, marginBottom: 16 },
    sectionLabel: { fontSize: 14, fontWeight: '700' as const, color: Colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    emptyText: { color: Colors.textLight, fontStyle: 'italic', fontSize: 14, marginBottom: 10 },
    symptomRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, backgroundColor: Colors.background, borderRadius: 10, padding: 10 },
    severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    severityText: { fontSize: 12, fontWeight: '600' as const },
    symptomLabel: { flex: 1, fontSize: 14, color: Colors.text },
    removeBtn: { padding: 2 },
    addPanel: { backgroundColor: Colors.background, borderRadius: 14, padding: 14, marginVertical: 10 },
    addPanelLabel: { fontSize: 13, fontWeight: '700' as const, color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    optionChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
    optionLabel: { fontSize: 13, color: Colors.textSecondary },
    severityChip: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center' },
    severityChipText: { color: Colors.textSecondary, fontWeight: '600' as const },
    addActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
    cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' as const },
    confirmBtn: { flex: 1, flexDirection: 'row', paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', gap: 6 },
    confirmBtnDisabled: { opacity: 0.5 },
    confirmBtnText: { color: Colors.white, fontWeight: '700' as const },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed', marginTop: 10, justifyContent: 'center' },
    addBtnText: { color: Colors.primary, fontWeight: '600' as const },
    noteInput: { borderRadius: 12, padding: 14, fontSize: 14, color: Colors.text, minHeight: 80, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background, textAlignVertical: 'top', marginBottom: 14 },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12 },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: Colors.white, fontWeight: '700' as const, fontSize: 15 },
    // History tab
    historyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 40 },
    historyEmptyText: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' as const },
    historyEmptySubText: { fontSize: 13, color: Colors.textLight, textAlign: 'center' },
    historyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3 },
    historyCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    historyCardDate: { flex: 1, fontSize: 15, fontWeight: '700' as const, color: Colors.text },
    historyBadge: { backgroundColor: Colors.primary + '18', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    historyBadgeText: { fontSize: 12, color: Colors.primary, fontWeight: '600' as const },
    historySymptomRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5, borderTopWidth: 1, borderTopColor: Colors.border },
    historySevDot: { width: 8, height: 8, borderRadius: 4 },
    historySymptomLabel: { flex: 1, fontSize: 14, color: Colors.text },
    historySevText: { fontSize: 13, fontWeight: '600' as const },
    historyNote: { marginTop: 10, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
});
