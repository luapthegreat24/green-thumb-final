# Seeds Collection Documentation

## Overview

The Seeds collection stores information about seeds in your inventory. This allows you to track your seed stock, germination details, and planting information.

## Database Structure

### Seeds Collection

**Collection Path:** `seeds`

**Document Fields:**

```typescript
{
  id: string;                           // Auto-generated document ID
  userId: string;                       // Reference to user's UID
  name: string;                         // Common name (e.g., "Tomato", "Basil")
  species: string;                      // Scientific/botanical name
  quantity: number;                     // Number of seeds in stock
  type: "vegetable" | "flower" | "herb" | "fruit" | "other"; // Seed category

  // Optional fields
  plantingTemperature?: {
    min: number;                        // Minimum planting temperature (°C)
    max: number;                        // Maximum planting temperature (°C)
  };
  germinationDays?: number;             // Days until seeds sprout
  daysToMaturity?: number;              // Days from planting to harvest
  dateAdded: Timestamp;                 // When seed was added to inventory
  expiryDate?: Timestamp;               // Seed expiration date
  location?: string;                    // Where seeds are stored
  notes?: string;                       // Additional notes
  imageUrl?: string;                    // Seed packet or plant image URL
}
```

## Available Functions

### Add a Seed

```typescript
import { addSeed } from "@/services/firestore";
import { Timestamp } from "firebase/firestore";

const seedId = await addSeed(userId, {
  name: "Heirloom Tomato",
  species: "Solanum lycopersicum",
  quantity: 100,
  type: "vegetable",
  plantingTemperature: { min: 15, max: 30 },
  germinationDays: 5,
  daysToMaturity: 75,
  location: "Shelf in garage",
  notes: "Pink cherry variety, very productive",
});
```

### Get User's Seeds

```typescript
import { getUserSeeds } from "@/services/firestore";

const seeds = await getUserSeeds(userId);
console.log(seeds); // Array of Seed objects
```

### Update a Seed

```typescript
import { updateSeed } from "@/services/firestore";

await updateSeed(seedId, {
  quantity: 45, // Update remaining quantity
  location: "Moved to basement",
});
```

### Delete a Seed

```typescript
import { deleteSeed } from "@/services/firestore";

await deleteSeed(seedId);
```

### Get Seeds by Type

```typescript
import { getSeedsByType } from "@/services/firestore";

const vegetables = await getSeedsByType(userId, "vegetable");
const herbs = await getSeedsByType(userId, "herb");
const flowers = await getSeedsByType(userId, "flower");
```

## React Hook

### useUserSeeds Hook

```typescript
import { useUserSeeds } from "@/hooks/use-firestore";
import { useAuth } from "@/contexts/auth";

export function MySeedCollection() {
  const { user } = useAuth();
  const { seeds, loading, error, refetch } = useUserSeeds(user?.uid);

  if (loading) return <Text>Loading seeds...</Text>;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <>
      {seeds.map((seed) => (
        <Text key={seed.id}>{seed.name} (×{seed.quantity})</Text>
      ))}
      <Button title="Refresh" onPress={refetch} />
    </>
  );
}
```

## Seed Type Categories

### 1. **Vegetable** (🥬)

For edible vegetables like:

- Tomatoes, peppers, lettuce
- Carrots, beans, peas
- Squash, zucchini, cucumber

### 2. **Flower** (🌸)

For ornamental flowers like:

- Roses, tulips, sunflowers
- Lavender, daisies, petunias
- Marigolds, zinnias

### 3. **Herb** (🌿)

For culinary and medicinal herbs like:

- Basil, parsley, cilantro
- Oregano, thyme, sage
- Rosemary, mint

### 4. **Fruit** (🍓)

For fruit-bearing plants like:

- Strawberries, blueberries
- Watermelon, cantaloupe
- Grapes, melons

### 5. **Other** (🌱)

For miscellaneous seeds

## Best Practices

### 1. **Store Seed Metadata**

```typescript
{
  location: "Cool, dry place",  // Where it's actually stored
  expiryDate: Timestamp,         // For monitoring viability
  quantity: 100,                 // Track inventory
}
```

### 2. **Track Germination**

```typescript
{
  germinationDays: 7,    // How long until seed sprouts
  daysToMaturity: 60,    // Total time to harvest
  plantingTemperature: { min: 18, max: 26 }
}
```

### 3. **Add Useful Notes**

```typescript
{
  notes: "Start indoors 6 weeks before last frost",
  notes: "Direct sow after frost danger passes",
  notes: "High success rate, keeps well for 3 years"
}
```

### 4. **Keep Images**

```typescript
{
  imageUrl: "Seed packet photo URL",  // For identification
}
```

## Seed Viability Guide

General seed viability (how long seeds remain viable):

| Seed Type | Years |
| --------- | ----- |
| Tomato    | 4-6   |
| Basil     | 4-5   |
| Carrot    | 3-4   |
| Lettuce   | 4-5   |
| Pepper    | 2-3   |
| Onion     | 1-2   |
| Cucumber  | 5-8   |
| Beans     | 3-4   |

**Storage Tips:**

- Keep in cool temperature (50-70°F / 10-21°C)
- Low humidity (30-40%)
- Store in paper, not plastic
- Label with year purchased
- Keep away from light

## Common Seed Format

When saving seeds, follow this standard format:

```javascript
{
  // Basic Info
  name: "Cherry Tomato",
  species: "Solanum lycopersicum",
  type: "vegetable",

  // Inventory
  quantity: 150,
  location: "Kitchen drawer, Tupperware #3",

  // Timing
  germinationDays: 5,
  daysToMaturity: 65,

  // Environment
  plantingTemperature: { min: 15, max: 30 },

  // Protection
  expiryDate: Timestamp.fromDate(new Date(2027, 3, 1)),

  // Knowledge
  notes: "Collected from mother plant, very productive"
}
```

## Integration with Plants

You can link seeds to plants:

1. Use the same `species` field to identify which plant came from which seed
2. Store `seedId` reference in the Plant document
3. Track "seed to plant" progression

## UI Components

A Seeds tab is included showing:

- Total seed varieties
- Seed card with name, species, quantity
- Type emoji indicator (🥬 for vegetables, etc.)
- Germination timing
- Days to maturity
- Planting temperature range
- Storage location
- Custom notes
- Sample seed addition button

## Firestore Security Rules for Seeds

```javascript
match /seeds/{document=**} {
  allow read, write: if request.auth.uid == resource.data.userId;
  allow create: if request.auth.uid == request.resource.data.userId;
}
```

This restricts access to the seed owner only.

## Next Steps

1. ✅ Add Seeds UI (done)
2. ☐ Add image upload for seed packets
3. ☐ Create seed usage tracking (link to plants planted)
4. ☐ Add germination success tracker
5. ☐ Seed exchange/sharing feature
6. ☐ Seed expiry notifications
