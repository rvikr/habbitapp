import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase/client";
import { parseAuthCallbackUrl } from "@/lib/auth-redirect";

export default function AuthCallbackScreen() {
  const router = useRouter();
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
      router.replace((parsed.type === "recovery" ? "/reset-password" : "/") as never);
    }

    finishAuth().catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : "Could not complete authentication.");
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-d-background items-center justify-center px-margin-mobile">
      {error ? (
        <>
          <Text className="text-headline-md text-on-background dark:text-d-on-background font-bold text-center mb-sm">
            Link could not be opened
          </Text>
          <Text className="text-body-md text-on-surface-variant dark:text-d-on-surface-variant text-center">
            {error}
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
