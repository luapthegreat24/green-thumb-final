# Web vs Native - Troubleshooting Guide

## Current Issues

### 1. **Plant.id API 400 Bad Request (Web)**

**Symptoms:** Error when trying to identify plants using camera on web
**Root Cause:**

- Browser extensions (ad blockers, privacy tools) may block plant.id API requests
- CORS headers may be stricter on web

**Solutions:**

- ✅ **Test on Android/iOS** (recommended) - native apps have fewer restrictions
- ✅ **Disable ad blockers** - Try disabling extensions like uBlock Origin, Adblock Plus
- ✅ **Use Incognito/Private Mode** - Extensions are typically disabled
- ✅ **Try a different browser** - Some browsers have fewer restrictions
- ✅ **Use localhost** - Clear browser cache and restart Expo

### 2. **Firestore net::ERR_BLOCKED_BY_CLIENT**

**Symptoms:** Firestore requests fail with "blocked by client" error
**Root Cause:**

- Same as above - browser extensions blocking requests to firestore.googleapis.com

**Solutions:**

- ✅ Add firestore.googleapis.com to extension whitelist
- ✅ Test on physical device (Android/iOS)
- ✅ Use Incognito/Private Mode
- ✅ Disable privacy/security extensions temporarily

## Platform Comparison

| Feature   | Web                  | Android            | iOS                |
| --------- | -------------------- | ------------------ | ------------------ |
| Camera    | ✅ Limited           | ✅ Full            | ✅ Full            |
| Gallery   | ✅ Limited           | ✅ Full            | ✅ Full            |
| Plant ID  | ⚠️ CORS issues       | ✅ Works           | ✅ Works           |
| Firestore | ⚠️ Blocked           | ✅ Works           | ✅ Works           |
| Speed     | Slower               | Fast               | Fast               |
| Security  | Browser restrictions | Fewer restrictions | Fewer restrictions |

## Testing Recommendations

### Best for Testing:

1. **Physical Device** (Most recommended)
   - Android: `expo start` then press `a`
   - iOS: `expo start` then press `i`
   - No extension blockers
   - Full camera access

2. **Expo Go App**
   - Install Expo Go from Play Store/App Store
   - Scan QR code from `expo start`
   - Same benefits as physical device

3. **Web in Private Mode**
   - Disables most extensions
   - Quick feedback loop
   - Limited functionality but good for testing UI

## For Web Development

If you need plant.id to work on web, consider:

1. **Using a backend proxy** - Create an API endpoint that forwards to plant.id
2. **Use Firebase Cloud Functions** - Already set up but requires Blaze plan
3. **CORS proxy service** - Temporary solution (not recommended for production)

## How to Clear Cache & Restart

```bash
# Kill Expo
Ctrl+C

# Clear cache
npx expo start --clear

# Or completely clean
rm -rf node_modules .expo
npm install
npx expo start --clear
```

## Error Messages Explained

### "Failed to load resource: net::ERR_BLOCKED_BY_CLIENT"

- A browser extension blocked the request
- Solution: Disable extensions or use private/incognito mode

### "400 Bad Request from plant.id"

- Image encoding might be invalid
- Or API request rate limited
- Solution: Try a different image, wait a moment, or test on native

### "TouchableOpacity is not defined"

- Cache issue after code changes
- Solution: Clear Expo cache with `--clear` flag

## Recommended Actions Now

1. **Test on Android/iOS** (if possible)
   - Plug in device or use Android emulator
   - Run `expo start` and scan QR code
   - Plant ID should work without issues

2. **If testing on web only:**
   - Use **Incognito/Private mode**
   - Disable ad blockers: uBlock Origin, Adblock Plus, Privacy Badger, etc.
   - Or whitelist: plant.id, firestore.googleapis.com, expo.dev

3. **Clear Expo cache:**

   ```bash
   npx expo start --clear
   ```

4. **Restart browser:**
   - Close all tabs
   - Reopen Expo URL
   - Try identifying a plant again

## Next Steps

Once you get it working on a native device, you'll see plant ID works flawlessly. The web experience can be improved with a backend proxy for production use.
