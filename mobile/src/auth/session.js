// Signed-in state. The session token lives only in the device's secure storage (iOS Keychain / Android Keystore).
import * as SecureStore from "expo-secure-store";
import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { api, setAuthToken, setUnauthorizedHandler } from "@/api/client";

const TOKEN_KEY = "scamshield.session";
const STORE_OPTIONS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
// The web build (used only for development testing) has no secure storage, so it keeps the token in memory.
let webToken = null;
const store = Platform.OS === "web"
  ? { get: async () => webToken, set: async value => { webToken = value; }, remove: async () => { webToken = null; } }
  : { get: () => SecureStore.getItemAsync(TOKEN_KEY, STORE_OPTIONS), set: value => SecureStore.setItemAsync(TOKEN_KEY, value, STORE_OPTIONS), remove: () => SecureStore.deleteItemAsync(TOKEN_KEY, STORE_OPTIONS) };
const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  // status: "loading" | "signedOut" | "signedIn". notice explains why the user was signed out.
  const [state, setState] = useState({ status: "loading", profile: null, notice: "" });

  const clear = useCallback(async notice => {
    setAuthToken(null);
    await store.remove().catch(() => {});
    setState({ status: "signedOut", profile: null, notice: notice || "" });
  }, []);

  const start = useCallback(async (token, profile) => {
    await store.set(token);
    setAuthToken(token);
    setState({ status: "signedIn", profile, notice: "" });
  }, []);

  // Restore a saved session on launch. Network problems keep the token, so offline users aren't signed out.
  useEffect(() => {
    setUnauthorizedHandler(message => { clear(message); });
    (async () => {
      const token = await store.get().catch(() => null);
      if (!token) { setState({ status: "signedOut", profile: null, notice: "" }); return; }
      setAuthToken(token);
      try {
        const { profile } = await api("/api/auth/session");
        if (profile.role !== "user") { await clear("Administrator accounts use the ScamShield website."); return; }
        setState({ status: "signedIn", profile, notice: "" });
      } catch (error) {
        if (error.status === 401) await clear("Your session has expired. Please sign in again.");
        else setState({ status: "signedIn", profile: null, notice: "" });
      }
    })();
  }, [clear]);

  // Resolves { twoFactorRequired: true } when a code is needed; throws ApiError for wrong details.
  const signIn = useCallback(async ({ email, password, code }) => {
    const data = await api("/api/auth/login", { method: "POST", body: { email, password, ...(code ? { code } : {}) } });
    if (data.two_factor_required && !data.token) return { twoFactorRequired: true };
    await start(data.token, data.profile);
    return {};
  }, [start]);

  const register = useCallback(async ({ email, displayName, password }) => {
    const data = await api("/api/auth/register", { method: "POST", body: { email, display_name: displayName, password } });
    await start(data.token, data.profile);
  }, [start]);

  // Revokes the session on the server too; signs out locally even when offline.
  const signOut = useCallback(async () => {
    try { await api("/api/auth/logout", { method: "POST", body: {} }); } catch {}
    await clear("");
  }, [clear]);

  const refreshProfile = useCallback(async () => {
    const { profile } = await api("/api/auth/session");
    setState(current => ({ ...current, profile }));
    return profile;
  }, []);

  const value = useMemo(() => ({ ...state, signIn, register, signOut, refreshProfile }), [state, signIn, register, signOut, refreshProfile]);
  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession() {
  const value = use(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
