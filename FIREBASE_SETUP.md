# Firebase Firestore Setup Checklist

## Step 1: Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **mob-comp-de142**
3. Click **Firestore Database** in the left sidebar
4. Click **Create database** (if not already created)
5. Choose:
   - Start in **production mode** (we'll set security rules)
   - Choose region: **us-central1** (or closest to you)
6. Click **Create**

## Step 2: Set Up Security Rules

1. In Firestore, click the **Rules** tab
2. Replace the entire content with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Plants collection - only user's own plants
    match /plants/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }

    // Water logs collection - only user's own logs
    match /waterLogs/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }

    // Seeds collection - only user's own seeds
    match /seeds/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. Click **Publish**

## Step 3: Enable Email/Password Authentication

1. Go to **Authentication** in the left sidebar
2. Click the **Sign-in method** tab
3. Find **Email/Password** provider
4. Click the toggle to **Enable** it
5. Click **Save**

## Step 4: Create Collections (Optional - Will auto-create)

The app will automatically create collections when you add data, but you can pre-create them:

1. Click **Start collection** in Firestore
2. Collection ID: `users`
3. Click **Next** (skip adding document for now)
4. Repeat for `plants` and `waterLogs` collections
5. Repeat for `seeds` collection

## Step 5: Test the Connection

1. Open your app (web or Android)
2. Create a new account on signup screen
3. Check Firestore Console - you should see a new document in `users` collection
4. Click "Add Sample Plant" on home screen
5. Check Firestore - you should see a new document in `plants` collection

## Verify Your Setup

Go to: https://console.firebase.google.com/u/1/project/mob-comp-de142/firestore/databases/-default-/data

You should see:

- ✅ `users` collection (with your user documents)
- ✅ `plants` collection (with plant documents)
- ✅ `waterLogs` collection (once you start watering)
- ✅ `seeds` collection (once you add a seed)

## Useful Firebase Console Views

### View User Data

1. Firestore → Collections → `users`
2. Click any user document to see their profile

### View All Plants

1. Firestore → Collections → `plants`
2. Filter by `userId` to see plants for a specific user

### View Water Logs

1. Firestore → Collections → `waterLogs`
2. Filter by `plantId` to see watering history

## Enable Backups (Recommended)

1. Go to **Firestore** → **Backups**
2. Click **Create Schedule**
3. Set frequency: **Daily** (or as needed)
4. Choose backup location
5. Click **Create**

## Performance & Cost Tips

- **Read Operations**: ~$0.06 per 100,000 reads
- **Write Operations**: ~$0.18 per 100,000 writes
- **Delete Operations**: ~$0.02 per 100,000 deletes
- **Storage**: ~$0.18 per GB/month

**To reduce costs:**

- Use queries with proper indexes
- Batch operations when possible
- Archive old water logs periodically
- Compress images before uploading to Storage

## Troubleshooting

### Getting "Permission denied" errors?

- Check security rules are published correctly
- Ensure user is authenticated (UID matches in rules)
- Check Firestore collections exist

### Data not persisting?

- Verify Firestore database was created successfully
- Check browser console for JavaScript errors
- Ensure Firebase config is correct in `firebase.config.ts`

### Can't add plants?

- Check `plants` collection security rules
- Verify user ID is being passed to `addPlant()`
- Check network tab for failed requests

## Next Steps

1. ✅ Test creating account and plants
2. ✅ Test watering log functionality
3. ☐ Add onSnapshot listeners for real-time updates
4. ☐ Implement cloud functions for watering reminders
5. ☐ Add Firebase Storage for plant images
6. ☐ Set up Firestore composite indexes for advanced queries

---

**Your Firebase Project:** https://console.firebase.google.com/u/1/project/mob-comp-de142
