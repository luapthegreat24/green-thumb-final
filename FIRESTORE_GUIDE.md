# Firebase Firestore Integration Guide

## Overview

Your Green Thumb app is now fully integrated with Firebase Firestore for storing user data and plant information.

## Database Structure

### Collections

#### 1. `users` Collection

Stores user profile information.

**Document ID:** User's Firebase Auth UID

**Fields:**

```typescript
{
  uid: string; // User's Firebase UID
  email: string; // User's email
  name: string; // User's display name
  createdAt: Timestamp; // Account creation time
  updatedAt: Timestamp; // Last update time
}
```

#### 2. `plants` Collection

Stores plant information for each user.

**Document ID:** Auto-generated

**Fields:**

```typescript
{
  id: string;               // Auto-generated document ID
  userId: string;           // Reference to user's UID
  name: string;             // Plant name (e.g., "Snake Plant")
  species: string;          // Scientific/common species name
  waterFrequency: number;   // Days between watering
  lastWatered: Timestamp;   // Last time the plant was watered
  dateAdded: Timestamp;     // When plant was added
  notes?: string;           // Optional notes about the plant
  imageUrl?: string;        // Optional image URL
}
```

#### 3. `waterLogs` Collection

Tracks watering history for each plant.

**Document ID:** Auto-generated

**Fields:**

```typescript
{
  id: string;               // Auto-generated document ID
  plantId: string;          // Reference to plant document
  userId: string;           // Reference to user's UID
  wateredAt: Timestamp;     // When the plant was watered
  notes?: string;           // Optional notes about watering
}
```

#### 4. `seeds` Collection

Stores seed inventory information for planning and tracking.

**Document ID:** Auto-generated

**Fields:**

```typescript
{
  id: string;               // Auto-generated document ID
  userId: string;           // Reference to user's UID
  name: string;             // Common name (e.g., "Tomato")
  species: string;          // Scientific name
  quantity: number;         // Number of seeds in stock
  type: "vegetable" | "flower" | "herb" | "fruit" | "other";

  // Optional fields
  plantingTemperature?: { min: number; max: number };
  germinationDays?: number; // Days to sprout
  daysToMaturity?: number;  // Days from planting to harvest
  dateAdded: Timestamp;     // When seed was added
  expiryDate?: Timestamp;   // Seed expiration date
  location?: string;        // Where seeds are stored
  notes?: string;           // Custom notes
  imageUrl?: string;        // Packet or plant image
}
```

## Firebase Security Rules

Recommended security rules for your Firestore database:

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
  }
}
```

**To apply these rules:**

1. Go to Firestore Console
2. Click on "Rules" tab
3. Replace the rules with the above
4. Click "Publish"

## Available Services & Hooks

### Firestore Service (`services/firestore.ts`)

#### User Functions

```typescript
// Get user data
const userData = await getUserData(uid: string);

// Update user data
await updateUserData(uid: string, data: Partial<User>);
```

#### Plant Functions

```typescript
// Add a new plant
const plantId = await addPlant(userId: string, plantData);

// Get all plants for a user
const plants = await getUserPlants(userId: string);

// Update a plant
await updatePlant(plantId: string, plantData);

// Delete a plant
await deletePlant(plantId: string);
```

#### Water Log Functions

```typescript
// Log watering event
const logId = await logWater(plantId: string, userId: string, notes?: string);

// Get water logs for a plant
const logs = await getWaterLogs(plantId: string);
```

#### Seed Functions

```typescript
// Add a new seed
const seedId = await addSeed(userId: string, seedData);

// Get all seeds for a user
const seeds = await getUserSeeds(userId: string);

// Update a seed
await updateSeed(seedId: string, seedData);

// Delete a seed
await deleteSeed(seedId: string);

// Get seeds by type
const vegetables = await getSeedsByType(userId: string, "vegetable");
```

### Custom Hooks (`hooks/use-firestore.ts`)

```typescript
// Hook to load user's plants
const { plants, loading, error, refetch } = useUserPlants(userId: string);

// Hook to load water logs for a plant
const { logs, loading, error, refetch } = useWaterLogs(plantId: string);
```

## Usage Examples

### Add a Plant

```typescript
import { addPlant } from "@/services/firestore";
import { Timestamp } from "firebase/firestore";

const plantId = await addPlant(user.uid, {
  name: "Monstera",
  species: "Monstera deliciosa",
  waterFrequency: 7,
  lastWatered: Timestamp.now(),
  notes: "Keep in indirect sunlight",
});
```

### Get User's Plants

```typescript
import { useUserPlants } from "@/hooks/use-firestore";
import { useAuth } from "@/contexts/auth";

export function MyGarden() {
  const { user } = useAuth();
  const { plants, loading } = useUserPlants(user?.uid);

  if (loading) return <Text>Loading...</Text>;

  return (
    <>
      {plants.map((plant) => (
        <Text key={plant.id}>{plant.name}</Text>
      ))}
    </>
  );
}
```

### Log Watering

```typescript
import { logWater } from "@/services/firestore";

await logWater(plantId, userId, "Watered thoroughly");
```

## Key Features

✅ **Real-time Data**: Firestore uses real-time listeners (can be enhanced with `onSnapshot`)
✅ **Type Safety**: Full TypeScript support with interfaces
✅ **Error Handling**: Comprehensive error handling in all functions
✅ **User Privacy**: Security rules ensure users only access their own data
✅ **Scalable**: Structure supports millions of users and plants

## Next Steps

1. **Enable Firestore Indexes**: If you use complex queries, create indexes via Firebase Console
2. **Add Real-time Listeners**: Update hooks to use `onSnapshot` for live updates
3. **Implement Image Storage**: Use Firebase Storage for plant photos
4. **Add Notifications**: Set up scheduled notifications for watering reminders
5. **Backup Plans**: Configure automatic Firestore backups in Firebase Console

## Troubleshooting

### Plants not saving?

- Check Firestore Security Rules in Firebase Console
- Verify user is authenticated (check `useAuth()` hook)
- Check browser console for errors

### Data not loading?

- Verify Firestore database has data (check Firebase Console)
- Ensure security rules allow read access
- Check network connectivity

### Timestamp issues?

- Always use `Timestamp.now()` from Firebase instead of `new Date()`
- Make sure imports are from `firebase/firestore`

## Resources

- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
