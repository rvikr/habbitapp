export type StepPermissionStatus = "granted" | "denied" | "undetermined";
export type StepSubscription = { remove: () => void };

export declare function isStepTrackingAvailable(): Promise<boolean>;
export declare function getStepPermissionStatus(): Promise<StepPermissionStatus>;
export declare function requestStepPermission(): Promise<StepPermissionStatus>;
export declare function getTodayStepCount(): Promise<number | null>;
export declare function watchStepCount(callback: (steps: number) => void): StepSubscription | null;
