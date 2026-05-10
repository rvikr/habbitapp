import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { supabase } from "@/lib/supabase/client";
import { parseAuthCallbackUrl } from "@/lib/auth-redirect";

type Status = "loading" | "success" | "error";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finishAuth() {
      const url = await Linking.getInitialURL();
      if (!url) throw new Error("Missing authentication callback URL.");

      const parsed = parseAuthCallbackUrl(url);
      if (parsed.error) {
        throw new Error(parsed.errorDescription ?? parsed.error);
      }

      if (parsed.code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(parsed.code);
        if (exchangeError) throw exchangeError;
      } else if (parsed.accessToken && parsed.refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: parsed.accessToken,
          refresh_token: parsed.refreshToken,
        });
        if (sessionError) throw sessionError;
      }

      if (cancelled) return;

      if (parsed.type === "recovery") {
        router.replace("/reset-password" as never);
        return;
      }

      setStatus("success");
      setTimeout(() => {
        if (!cancelled) router.replace({ pathname: "/", params: { newUser: "1" } } as never);
      }, 2000);
    }

    finishAuth().catch((e) => {
      if (!cancelled) {
        setError(e instanceof Error ? e.message : "Could not complete authentication.");
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-d-background items-center justify-center px-margin-mobile">
      {status === "error" ? (
        <>
          <Text className="text-headline-md text-on-background dark:text-d-on-background font-bold text-center mb-sm">
            Link could not be opened
          </Text>
          <Text className="text-body-md text-on-surface-variant dark:text-d-on-surface-variant text-center">
            {error}
          </Text>
        </>
      ) : status === "success" ? (
        <>
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-lg">
            <Ionicons name="checkmark" size={40} color="#ffffff" />
          </View>
          <Text className="text-headline-md text-on-background dark:text-d-on-background font-bold text-center mb-sm">
            Email confirmed!
          </Text>
          <Text className="text-body-md text-on-surface-variant dark:text-d-on-surface-variant text-center">
            Welcome to Lagan. Taking you in…
          </Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#451ebb" />
          <Text className="text-body-md text-on-surface-variant dark:text-d-on-surface-variant mt-md">
            Finishing sign in...
          </Text>
        </>
      )}
    </SafeAreaView>
  );
}
