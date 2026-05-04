import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal } from "react-native";
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-d-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-center px-margin-mobile py-xxl">
            <View className="mb-xxl items-center">
              <View className="w-16 h-16 rounded-full bg-primary items-center justify-center mb-lg">
                <Text className="text-headline-lg text-on-primary">H</Text>
              </View>
              <Text className="text-headline-lg text-on-background dark:text-d-on-background font-bold">HabbitApp</Text>
              <Text className="text-body-md text-on-surface-variant dark:text-d-on-surface-variant mt-xs text-center">
                Build habits, track progress, earn badges.
              </Text>
            </View>

            <View className="gap-sm">
              <TextInput
                className="bg-surface-container dark:bg-d-surface-container text-on-surface dark:text-d-on-surface rounded-xl px-md py-sm text-body-md"
                placeholder="Email"
                placeholderTextColor="#797586"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
              />
              <TextInput
                className="bg-surface-container dark:bg-d-surface-container text-on-surface dark:text-d-on-surface rounded-xl px-md py-sm text-body-md"
                placeholder={mode === "signup" ? "Password (12+ chars, mixed case + number)" : "Password"}
                placeholderTextColor="#797586"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType={mode === "signup" ? "newPassword" : "password"}
              />

              {error && <Text className="text-error text-label-sm text-center">{error}</Text>}
              {message && <Text className="text-secondary text-label-sm text-center">{message}</Text>}

              <TouchableOpacity className="bg-primary rounded-full py-sm items-center mt-sm" onPress={handleSubmit} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-on-primary text-label-lg font-semibold">
                    {mode === "signin" ? "Sign in" : "Create account"}
                  </Text>
                )}
              </TouchableOpacity>

              {mode === "signin" && (
                <TouchableOpacity className="items-center mt-xs" onPress={() => setShowForgot(true)}>
                  <Text className="text-on-surface-variant dark:text-d-on-surface-variant text-label-sm">Forgot password?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity className="items-center mt-sm" onPress={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setMessage(null); }}>
                <Text className="text-primary text-label-lg">
                  {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </Text>
              </TouchableOpacity>
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
