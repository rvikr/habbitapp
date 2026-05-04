import "../global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { CelebrationProvider } from "@/components/celebration";
import ErrorBoundary from "@/components/error-boundary";
import { supabase } from "@/lib/supabase/client";
import { initSentry, setUser as setSentryUser } from "@/lib/sentry";
import { initAnalytics, identify as identifyAnalytics } from "@/lib/analytics";

function AuthGuard() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const inAuthGroup = segments[0] === "login";
      if (!session && !inAuthGroup) {
        router.replace("/login");
      } else if (session && inAuthGroup) {
        router.replace("/");
      }
      if (session?.user) {
        setSentryUser({ id: session.user.id, email: session.user.email });
        identifyAnalytics(session.user.id, { email: session.user.email });
      } else {
        setSentryUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [segments, router]);

  return null;
}

function RootLayoutContent() {
  const { colorScheme } = useTheme();
  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="habits/new" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="habits/[id]/index" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="habits/[id]/edit" options={{ headerShown: false, presentation: "card" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    initSentry();
    initAnalytics();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <CelebrationProvider>
            <RootLayoutContent />
          </CelebrationProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
