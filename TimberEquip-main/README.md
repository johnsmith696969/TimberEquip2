# Forestry Equipment Sales
Forestry Equipment Sales is an e-commerce webapp for the Timber Industry. Our main focus is helping loggers & firewood producers market their heavy equipment, and provide institutional grade analysis on markets.

## Run Locally

Prerequisites: Node.js

1. Install dependencies:
   `npm install`
2. Set environment values in `.env.local`:
   `VITE_FIREBASE_API_KEY=your_firebase_web_api_key`
   `GEMINI_API_KEY=your_gemini_api_key` (only if Gemini features are enabled)
3. Run the app:
   `npm run dev`

## Build

`npm run build`

## Deploy

Deploy with Firebase:

`npx firebase-tools deploy --only firestore,functions,hosting`

Notes:

- Firestore deploys must target the named database configured in `firebase.json`.
- Stripe and SendGrid production credentials are supplied through Firebase Functions secrets, not `.env.local`.
- The inspection dealer matcher uses the Firebase Functions secret `GOOGLE_MAPS_API_KEY` for geocoding. Keep that key server-side only and make sure the Geocoding API is enabled for it.
