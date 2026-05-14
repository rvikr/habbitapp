import { Platform } from "react-native";
import { Pedometer } from "expo-sensors";
import type { StepPermissionStatus, StepSubscription } from "./steps";

function normalizePermissionStatus(status: string): StepPermissionStatus {
  if (status === "granted" || status === "denied") return status;
  return "undetermined";
}

function normalizeSteps(value: number): number {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

export async function isStepTrackingAvailable(): Promise<boolean> {
  try {
    return await Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function getStepPermissionStatus(): Promise<StepPermissionStatus> {
  try {
    const permission = await Pedometer.getPermissionsAsync();
    return normalizePermissionStatus(permission.status);
  } catch {
    return "undetermined";
  }
}

export async function requestStepPermission(): Promise<StepPermissionStatus> {
  try {
    const permission = await Pedometer.requestPermissionsAsync();
    return normalizePermissionStatus(permission.status);
  } catch {
    return "denied";
  }
}

export async function getTodayStepCount(): Promise<number | null> {
  if (Platform.OS !== "ios") return null;

  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const result = await Pedometer.getStepCountAsync(start, new Date());
    return normalizeSteps(result.steps);
  } catch {
    return null;
  }
}

export function watchStepCount(callback: (steps: number) => void): StepSubscription | null {
  try {
    const subscription = Pedometer.watchStepCount((result) => callback(normalizeSteps(result.steps)));
    return { remove: () => subscription.remove() };
  } catch {
    return null;
  }
}
