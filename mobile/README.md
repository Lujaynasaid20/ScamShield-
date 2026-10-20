# ScamShield mobile app (Android and iOS)

An Expo (React Native) app for ScamShield **users**. It uses the same accounts, database and checks as the
website by calling the website's API. Administrators keep using the website; admin accounts can't sign in here.

- Sign-in sends `client: "mobile"` and receives a session token, stored only in the iOS Keychain / Android Keystore
  (`expo-secure-store`) and sent as `Authorization: Bearer`. Sessions appear on the website under signed-in devices
  and can be signed out there.
- The app never connects to the database and contains no secrets.

## Run it on your phone (Expo Go)

1. Install **Expo Go** from the App Store or Google Play.
2. Start the website API from the project root (your phone and computer must be on the same Wi-Fi):
   ```
   npm run dev
   ```
3. In another terminal:
   ```
   cd mobile
   npm install
   npx expo start
   ```
4. Scan the QR code: with the Camera app on iPhone, or inside Expo Go on Android.

In development the app calls `http://<your computer's address>:3000` automatically. If it says it can't reach
ScamShield, allow Node.js through Windows Firewall for private networks, or use the deployed website instead:
create `mobile/.env` with `EXPO_PUBLIC_API_URL=https://your-site.vercel.app` (see `.env.example`) and restart
with `npx expo start --clear`.

## Checks

```
npx expo-doctor                 # dependency and config health
npm run export:check            # bundles Android and iOS to catch build errors
```

## Structure

```
src/app/              screens (Expo Router): login, register, (app)/(tabs)/{index,scan,check,history,account}, (app)/history/[id]
src/api/client.js     API calls: base URL, bearer token, timeouts, offline and expired-session handling
src/auth/session.js   sign-in state and secure token storage
src/components/       shared UI and the explained result views
src/lib/              data-loading hook and formatting
```
