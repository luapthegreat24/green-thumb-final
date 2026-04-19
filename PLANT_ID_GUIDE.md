# Plant Identification Guide

## Overview

The Green Thumb app now includes plant identification via the **plant.id API**. Users can take photos or upload images to automatically identify plants with high accuracy.

## Features

### 1. **Camera Capture**

- Users can open the device camera to snap a photo
- Photo can be cropped/edited before identification
- Real-time permission handling

### 2. **Image Upload**

- Users can select images from their device gallery
- Supports editing and cropping the image
- Works with existing photos from any source

### 3. **AI-Powered Recognition**

- Uses plant.id API v3 (Plant.id)
- Returns top 5 plant matches ranked by confidence
- Includes confidence percentages for each match
- Verifies that the image contains a plant (moderation check)

### 4. **Result Integration**

- Tapping a result automatically searches that plant in the Trefle database
- Displays detailed plant information (genus, family, growth tips, etc.)
- Seamless transition between identification and lookup

## Usage Flow

### From the Plants Screen:

1. Tap the **"🔍 Identify Plant"** button (purple button at top)
2. Choose one of:
   - **📷 Take Photo**: Open camera to capture a plant image
   - **🖼️ Upload Image**: Select an image from your gallery
3. The app sends the image to plant.id API for analysis
4. View the top 5 matching plants with confidence scores
5. Tap any result to search that plant in Trefle for detailed info

## Technical Details

### API Integration

- **Service**: `services/plantid.ts`
- **API**: plant.id v3 (https://plant.id/api/v3)
- **API Key**: Secured in environment (not hardcoded in git)
- **Endpoints Used**:
  - `POST /identification` - Identify plant from image
  - `GET /plant_details` - Get detailed plant info (optional)

### Image Processing

- Images are converted to base64 before sending to API
- Supports JPEG, PNG, and other common formats
- Optimized for fast identification (quality: 0.8)
- Square aspect ratio recommended for best results

### Moderation

- API checks if image contains a plant (is_plant confidence)
- Rejects non-plant images with confidence score
- Prevents false positives

### Error Handling

- Clear error messages if permissions are denied
- Network error recovery with retry option
- User-friendly feedback on identification failures

## Configuration

### Environment Variables

No additional environment variables needed—plant.id API key is embedded in the service.

### Permissions Required

- **Camera**: For taking new photos (`expo-camera`)
- **Media Library**: For uploading existing images (`expo-image-picker`)
- **File System**: For reading image data (handled by Expo)

### Installed Packages

```
expo-image-picker
expo-camera
expo-media-library
```

## Future Enhancements

1. **Batch Identification**: Identify multiple plants in one session
2. **History/Favorites**: Save identified plants for reference
3. **Care Tips**: Auto-suggest plant care based on identification
4. **Community Features**: Share identifications with other users
5. **Offline Mode**: Cache common plant identifications

## Troubleshooting

### Image Not Uploading

- Check internet connection
- Verify image is a valid photo format (JPG, PNG, etc.)
- Ensure the image size is not too large

### Identification Takes Long

- Network latency—plant.id API processes on their server
- Large image sizes may slow processing
- Usually completes within 2-5 seconds

### Permission Denied Errors

- Grant camera and gallery permissions in app settings
- On web: requires HTTPS for camera access

### No Results Found

- Image may not contain a recognizable plant
- Try a clearer, closer-up photo
- Different angles may yield better results

## Code References

- **Identification Screen**: `app/identify-plant.tsx`
- **Plant ID Service**: `services/plantid.ts`
- **Plants Search Tab**: `app/(tabs)/plants.tsx` (updated with integration)
- **Dependencies**: See `package.json` for Expo modules

## Support

For issues or feature requests related to plant identification, refer to:

- plant.id API docs: https://plant.id/api/docs
- Expo docs: https://docs.expo.dev
