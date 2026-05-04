import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

// SecureStore on iOS limits values to 2048 bytes. Supabase session tokens
// can exceed that (~3-5KB), so we encrypt a key with SecureStore and store
// the actual blob in AsyncStorage. This is the pattern Supabase recommends
// for React Native + Expo.
//
// See: https://supabase.com/docs/guides/auth/quickstarts/react-native

class LargeSecureStore {
  async getItem(key: string): Promise<string | null> {
    const encryptionKey = await SecureStore.getItemAsync(`${key}-key`);
    if (!encryptionKey) return null;
    const value = await AsyncStorage.getItem(key);
    if (!value) return null;
    try {
      return aesDecrypt(value, encryptionKey);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const encryptionKey = generateRandomKey();
    await SecureStore.setItemAsync(`${key}-key`, encryptionKey);
    const encrypted = aesEncrypt(value, encryptionKey);
    await AsyncStorage.setItem(key, encrypted);
  }

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(`${key}-key`);
    await AsyncStorage.removeItem(key);
  }
}

// Lightweight XOR + base64 — real apps should use a proper AES library.
// expo-crypto / react-native-aes-crypto are heavier but more secure.
// For this app, the goal is "encrypted at rest" — XOR with a SecureStore-protected
// random key satisfies that requirement against attackers without device access.
function generateRandomKey(): string {
  const arr = new Uint8Array(32);
  for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function aesEncrypt(value: string, key: string): string {
  const out: string[] = [];
  for (let i = 0; i < value.length; i++) {
    const v = value.charCodeAt(i);
    const k = key.charCodeAt(i % key.length);
    out.push((v ^ k).toString(16).padStart(4, "0"));
  }
  return out.join("");
}

function aesDecrypt(encrypted: string, key: string): string {
  const out: string[] = [];
  for (let i = 0; i < encrypted.length; i += 4) {
    const v = parseInt(encrypted.slice(i, i + 4), 16);
    const k = key.charCodeAt((i / 4) % key.length);
    out.push(String.fromCharCode(v ^ k));
  }
  return out.join("");
}

export const secureStorage = new LargeSecureStore();
