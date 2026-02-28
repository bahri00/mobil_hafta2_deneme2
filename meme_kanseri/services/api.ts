import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ DEĞİŞTİR: Bilgisayarınızın yerel ağ IP adresini buraya yazın
// Örn: 'http://192.168.1.42:3001'
// Not: localhost veya 127.0.0.1 çalışmaz (Expo Go fiziksel cihazda bağlanamaz)
export const BASE_URL = 'http://192.168.0.18:3001';

const TOKEN_KEY = 'auth_token';

export async function getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
}

async function buildHeaders(authenticated = false): Promise<Record<string, string>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authenticated) {
        const token = await getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export async function apiGet<T>(path: string, authenticated = true): Promise<T> {
    const headers = await buildHeaders(authenticated);
    const res = await fetch(`${BASE_URL}${path}`, { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Sunucu hatası');
    return data as T;
}

export async function apiPost<T>(path: string, body: unknown, authenticated = true): Promise<T> {
    const headers = await buildHeaders(authenticated);
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Sunucu hatası');
    return data as T;
}

export async function apiPut<T>(path: string, body: unknown, authenticated = true): Promise<T> {
    const headers = await buildHeaders(authenticated);
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Sunucu hatası');
    return data as T;
}

export async function apiPatch<T>(path: string, body: unknown, authenticated = true): Promise<T> {
    const headers = await buildHeaders(authenticated);
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Sunucu hatası');
    return data as T;
}
