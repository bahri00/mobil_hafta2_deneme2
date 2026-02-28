import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '600' as const },
        headerBackTitle: "Geri",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="symptoms" options={{ title: "Belirtiler" }} />
      <Stack.Screen name="symptom/[id]" options={{ title: "Belirti Detayları" }} />
      <Stack.Screen name="experience" options={{ title: "Hasta Deneyimleri" }} />
      <Stack.Screen name="experience/[id]" options={{ title: "Deneyim Detayı" }} />
      <Stack.Screen name="add-experience" options={{ title: "Deneyim Paylaş" }} />
      <Stack.Screen name="symptom-calendar" options={{ title: "Belirti Takvimi" }} />
      <Stack.Screen name="ask-expert" options={{ title: "Uzmana Sor" }} />
      <Stack.Screen name="contact" options={{ title: "İletişim" }} />
      <Stack.Screen name="about" options={{ title: "Hakkında" }} />
      <Stack.Screen name="blood-test" options={{ title: "Kan Tahlili" }} />
      <Stack.Screen name="doctor-questions" options={{ title: "Hasta Soruları" }} />
      <Stack.Screen name="doctor-patients" options={{ title: "Hastalarım" }} />
      <Stack.Screen name="doctor-patient-profile" options={{ title: "Hasta Profili" }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
