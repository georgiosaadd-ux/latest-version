# Images Directory

This directory contains local image assets for the HeartWise application.

## How to add your images:

1. **Upload your images** to this `src/assets/images/` folder
2. **Supported formats**: .jpg, .jpeg, .png, .svg, .webp
3. **Recommended naming**: Use descriptive names with hyphens (e.g., `hero-background.jpg`, `ebook-cover-1.png`)

## Usage in components:

```jsx
// Import the image
import myImage from '../assets/images/my-image.jpg';

// Use in JSX
<img src={myImage} alt="Description" />
```

## Current structure:
- `/covers/` - eBook cover images
- `/hero/` - Hero section images  
- `/general/` - General purpose images