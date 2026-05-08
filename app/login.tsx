import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { signIn, signUp, resetPassword } from "@/lib/actions";
import { validatePassword } from "@/lib/password";

type Mode = "signin" | "signup";

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (mode === "signup") {
      const pwError = validatePassword(password);
      if (pwError) { setError(pwError); return; }
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signin") {
        const { error: e } = await signIn(email, password);
        if (e) setError(e.message);
      } else {
        const { error: e } = await signUp(email, password);
        if (e) setError(e.message);
        else setMessage("Check your email to confirm your account, then sign in.");
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-d-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-margin-mobile py-xxl">

            {/* Header */}
            <View className="items-center mb-xxl">
              <View className="w-16 h-16 rounded-full bg-primary items-center justify-center mb-lg">
                <Ionicons name="sunny" size={28} color="#ffffff" />
              </View>
              <Text className="text-headline-lg text-on-background dark:text-d-on-background font-bold">Lagan लगन</Text>
              <Text className="text-headline-md text-primary font-semibold mt-xs">
                {mode === "signin" ? "Welcome back" : "Create account"}
              </Text>
              <Text className="text-body-md text-on-surface-variant dark:text-d-on-surface-variant mt-xs text-center">
                {mode === "signin"
                  ? "Let's keep the momentum going and start your day with intention."
                  : "Start building better habits today."}
              </Text>
            </View>

            {/* Form */}
            <View className="gap-md">
              <View className="gap-xs">
                <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant font-semibold">Email</Text>
                <TextInput
                  className="bg-surface-container dark:bg-d-surface-container text-on-surface dark:text-d-on-surface rounded-xl px-md py-sm text-body-md"
                  placeholder="you@example.com"
                  placeholderTextColor="#797586"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                />
              </View>

              <View className="gap-xs">
                <View className="flex-row justify-between items-center">
                  <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant font-semibold">Password</Text>
                  {mode === "signin" && (
                    <TouchableOpacity onPress={() => setShowForgot(true)}>
                      <Text className="text-primary text-label-sm font-semibold">Forgot password?</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  className="bg-surface-container dark:bg-d-surface-container text-on-surface dark:text-d-on-surface rounded-xl px-md py-sm text-body-md"
                  placeholder={mode === "signup" ? "12+ chars, mixed case + number" : "••••••••"}
                  placeholderTextColor="#797586"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textContentType={mode === "signup" ? "newPassword" : "password"}
                />
              </View>

              {error && (
                <View className="bg-error-container rounded-xl px-md py-sm">
                  <Text className="text-on-error-container text-label-sm">{error}</Text>
                </View>
              )}
              {message && (
                <View className="bg-secondary-container rounded-xl px-md py-sm">
                  <Text className="text-on-secondary-container text-label-sm">{message}</Text>
                </View>
              )}

              <TouchableOpacity
                className="bg-primary rounded-full py-md items-center mt-xs"
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-on-primary text-label-lg font-semibold">
                    {mode === "signin" ? "Sign in" : "Create account"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="items-center py-sm"
                onPress={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setMessage(null); }}
              >
                <Text className="text-on-surface-variant dark:text-d-on-surface-variant text-label-lg">
                  {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
                  <Text className="text-primary font-semibold">
                    {mode === "signin" ? "Sign up" : "Sign in"}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View className="mt-xxl items-center gap-sm">
              <View className="flex-row items-center gap-md">
                {process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ? (
                  <TouchableOpacity onPress={() => Linking.openURL(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL!)}>
                    <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">Privacy Policy</Text>
                  </TouchableOpacity>
                ) : null}
                <Text className="text-label-sm text-outline">·</Text>
                <Text className="text-label-sm text-outline">© 2025 Lagan</Text>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ForgotPasswordModal visible={showForgot} onDismiss={() => setShowForgot(false)} initialEmail={email} />
    </SafeAreaView>
  );
}

function ForgotPasswordModal({ visible, onDismiss, initialEmail }: { visible: boolean; onDismiss: () => void; initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "error" | "success" } | null>(null);

  async function send() {
    if (!email) { setFeedback({ text: "Email is required.", type: "error" }); return; }
    setSending(true);
    const { error } = await resetPassword(email);
    setSending(false);
    if (error) setFeedback({ text: error.message, type: "error" });
    else setFeedback({ text: "Reset link sent. Check your email.", type: "success" });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-surface-lowest dark:bg-d-surface-lowest rounded-t-3xl p-lg gap-sm">
          <Text className="text-headline-md text-on-surface dark:text-d-on-surface font-bold">Reset password</Text>
          <Text className="text-body-md text-on-surface-variant dark:text-d-on-surface-variant">
            We'll email you a link to set a new password.
          </Text>
          <TextInput
            className="bg-surface-container dark:bg-d-surface-container text-on-surface dark:text-d-on-surface rounded-xl px-md py-sm text-body-md"
            placeholder="Email"
            placeholderTextColor="#797586"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {feedback && (
            <Text className={`text-label-sm ${feedback.type === "error" ? "text-error" : "text-secondary"}`}>{feedback.text}</Text>
          )}
          <TouchableOpacity className="bg-primary rounded-full py-sm items-center mt-sm" onPress={send} disabled={sending}>
            {sending ? <ActivityIndicator color="#fff" /> : <Text className="text-on-primary text-label-lg font-semibold">Send reset link</Text>}
          </TouchableOpacity>
          <TouchableOpacity className="items-center py-sm" onPress={onDismiss}>
            <Text className="text-on-surface-variant dark:text-d-on-surface-variant">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
