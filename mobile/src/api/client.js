// API client for the ScamShield server: bearer-token auth, timeouts, readable errors, expired-session handling.
import Constants from "expo-constants";
import { Platform } from "react-native";

// Preview and production builds must set EXPO_PUBLIC_API_URL. In development, fall back to the computer
// running `npx expo start` (the same host Expo Go loaded the app from), on port 3000.
function resolveBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (__DEV__ && host) return `http://${host}:3000`;
  return "";
}

export const API_URL = resolveBaseUrl();
const USER_AGENT = `ScamShield-Mobile/${Constants.expoConfig?.version || "1.0.0"} (${Platform.OS === "ios" ? "iOS" : "Android"} ${Platform.Version})`;
const TIMEOUT_MS = 20000;

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let authToken = null;
let onUnauthorized = null;
export const setAuthToken = token => { authToken = token; };
export const setUnauthorizedHandler = handler => { onUnauthorized = handler; };

// body: a plain object (sent as JSON) or FormData. Auth endpoints are told this is the mobile client.
export async function api(path, { method = "GET", body, signal } = {}) {
  if (!API_URL) throw new ApiError("The app isn't configured with a ScamShield server address.", 0);
  const headers = { Accept: "application/json", "User-Agent": USER_AGENT };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  let payload;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(path.startsWith("/api/auth/") ? { ...body, client: "mobile" } : body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  signal?.addEventListener?.("abort", () => controller.abort());
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { method, headers, body: payload, signal: controller.signal, credentials: "omit" });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(controller.signal.aborted
      ? "ScamShield took too long to respond. Check your connection and try again."
      : "Can't reach ScamShield. Check your internet connection and try again.", 0);
  } finally {
    clearTimeout(timer);
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (response.status === 401 && authToken && !path.startsWith("/api/auth/login") && !path.startsWith("/api/auth/register")) {
    onUnauthorized?.(data?.error || "Your session has expired. Please sign in again.");
  }
  if (!response.ok) {
    const fallback = response.status >= 500 ? "ScamShield had a problem. Please try again in a moment." : "Something went wrong. Please try again.";
    throw new ApiError(data?.error || fallback, response.status, data);
  }
  return data;
}
