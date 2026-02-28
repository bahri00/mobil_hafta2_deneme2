import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQuery } from '@tanstack/react-query';
import { User } from '@/types';
import { apiPost, apiGet, setToken, getToken, removeToken } from '@/services/api';

const USER_KEY = 'auth_user';

export const [AuthProvider, useAuth] = createContextHook(() => {
    const [user, setUser] = useState<User | null>(null);

    // On startup, load user from AsyncStorage (cached)
    const userQuery = useQuery({
        queryKey: ['auth_user'],
        queryFn: async () => {
            const stored = await AsyncStorage.getItem(USER_KEY);
            return stored ? (JSON.parse(stored) as User) : null;
        },
    });

    useEffect(() => {
        if (userQuery.data !== undefined) {
            setUser(userQuery.data);
        }
    }, [userQuery.data]);

    const loginMutation = useMutation({
        mutationFn: async ({ email, password }: { email: string; password: string }) => {
            const res = await apiPost<{ token: string; user: { id: string; name: string; email: string; role?: string; status?: string; birthDate?: string; city?: string } }>(
                '/api/auth/login',
                { email, password },
                false
            );
            await setToken(res.token);
            const loggedInUser: User = {
                id: res.user.id,
                name: res.user.name,
                email: res.user.email,
                role: res.user.role as User['role'],
                status: res.user.status as User['status'],
                birthDate: res.user.birthDate,
                city: res.user.city,
            };
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
            return loggedInUser;
        },
        onSuccess: (data) => setUser(data),
    });

    const registerMutation = useMutation({
        mutationFn: async ({
            name, email, password, role, specialty, hospital, birthDate, city,
        }: {
            name: string;
            email: string;
            password: string;
            role?: 'patient' | 'doctor';
            specialty?: string;
            hospital?: string;
            birthDate?: string;
            city?: string;
        }) => {
            const res = await apiPost<
                | { token: string; user: { id: string; name: string; email: string; role?: string; status?: string; birthDate?: string; city?: string } }
                | { pending: true; message: string }
            >(
                '/api/auth/register',
                { name, email, password, role: role ?? 'patient', specialty, hospital, birthDate, city },
                false
            );

            // Doktor kaydı — onay bekliyor, token döndürülmez
            if ('pending' in res && res.pending) {
                return { pending: true as const, message: res.message };
            }

            const r = res as { token: string; user: { id: string; name: string; email: string; role?: string; status?: string; birthDate?: string; city?: string } };
            await setToken(r.token);
            const newUser: User = {
                id: r.user.id,
                name: r.user.name,
                email: r.user.email,
                role: r.user.role as User['role'],
                status: r.user.status as User['status'],
                birthDate: r.user.birthDate,
                city: r.user.city,
            };
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
            return { pending: false as const, user: newUser };
        },
        onSuccess: (data) => {
            if (!data.pending) setUser(data.user);
        },
    });

    const logout = useCallback(async () => {
        await removeToken();
        await AsyncStorage.removeItem(USER_KEY);
        setUser(null);
    }, []);

    const updateProfile = useCallback(async (updates: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }, [user]);

    return {
        user,
        isLoading: userQuery.isLoading,
        login: loginMutation.mutateAsync,
        loginPending: loginMutation.isPending,
        loginError: loginMutation.error?.message ?? null,
        register: registerMutation.mutateAsync,
        registerPending: registerMutation.isPending,
        registerError: registerMutation.error?.message ?? null,
        logout,
        updateProfile,
    };
});
