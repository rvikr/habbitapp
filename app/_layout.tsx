import "../global.css";
import { useEffect } from "react";
import { Platform, Text, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { CelebrationProvider } from "@/components/celebration";
import ErrorBoundary from "@/components/error-boundary";
import NotificationScheduler from "@/components/notification-scheduler";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { initSentry, setUser as setSentryUser } from "@/lib/sentry";
import { initAnalytics } from "@/lib/analytics";

function AuthGuard() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const publicRoute = ["login", "auth", "reset-password", "account-deletion"].includes(String(segments[0] ?? ""));
      if (!session && !publicRoute) {
        router.replace("/login");
      } else if (session && segments[0] === "login") {
        router.replace("/");
      }
      if (session?.user) {
        setSentryUser(null);
      } else {
        setSentryUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [segments, router]);

  return null;
}

function ConfigurationError() {
  return (
    <View className="flex-1 bg-background dark:bg-d-background items-center justify-center px-margin-mobile">
      <View className="w-16 h-16 rounded-full bg-error-container items-center justify-center mb-lg">
        <Text className="text-headline-lg text-on-error-container">!</Text>
      </View>
      <Text className="text-headline-md text-on-background dark:text-d-on-background font-bold mb-sm text-center">
        Configuration error
      </Text>
      <Text className="text-body-md text-on-surface-variant dark:text-d-on-surface-variant text-center">
        Supabase is not configured. Set{"\n"}EXPO_PUBLIC_SUPABASE_URL and{"\n"}EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local.
      </Text>
    </View>
  );
}

function RootLayoutContent() {
  const { colorScheme } = useTheme();

  if (!isSupabaseConfigured()) {
    return (
      <>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <ConfigurationError />
      </>
    );
  }

  const stack = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="account-deletion" options={{ headerShown: false }} />
      <Stack.Screen name="habits/new" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="habits/[id]/index" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="habits/[id]/edit" options={{ headerShown: false, presentation: "card" }} />
    </Stack>
  );

  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <AuthGuard />
      <NotificationScheduler />
      {Platform.OS === "web" ? <WebFrame>{stack}</WebFrame> : stack}
    </>
  );
}

// Web-only: constrain the app to a phone-shaped column on desktop browsers.
// On mobile widths it fills the viewport; on tablet+ it caps at 480px and centres.
function WebFrame({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        maxWidth: 480,
        marginLeft: "auto",
        marginRight: "auto",
        alignSelf: "center",
      }}
    >
      {children}
    </View>
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
