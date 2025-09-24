# Mintle

A web-based Wordle-like game where a new 5-letter word is generated every hour. Built with React, TypeScript, and Firebase.

🎮 **[Play Mintle](https://hongarc.github.io/mintle/)**

## Features

- 🕐 **Hourly Words**: New secret word every hour (UTC)
- 🎯 **Classic Gameplay**: 6 attempts to guess a 5-letter word
- 🔒 **Secure**: Immutable words with Firestore security rules
- 📱 **Responsive**: Works on desktop and mobile devices
- ⚡ **Fast**: Optimized bundle with code splitting
- 🎨 **Accessible**: Full keyboard support and screen reader friendly

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Firebase Firestore
- **Hosting**: GitHub Pages
- **Testing**: Vitest, Testing Library
- **Styling**: CSS with responsive design

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Firebase project

### Installation

1. Clone the repository:
```bash
git clone git@github.com:hongarc/mintle.git
cd mintle
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your Firebase configuration in `.env`:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Set up Firebase (for storing hourly words):
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (select Firestore only - we're using GitHub Pages for hosting)
firebase init firestore
```

5. Deploy Firestore security rules:
```bash
firebase deploy --only firestore:rules
```

**What Firebase is used for:**
- **Word Storage**: Each hour's secret word is stored in Firestore to ensure all players get the same word
- **Race Condition Handling**: Multiple players can safely generate the same hour's word without conflicts
- **Word Persistence**: Words remain consistent across browser refreshes and different devices

### Development

Start the development server:
```bash
npm run dev
```

Run tests:
```bash
npm test
```

Build for production:
```bash
npm run build
```

## Game Rules

1. **Objective**: Guess the 5-letter word in 6 attempts or fewer
2. **Feedback**: After each guess, letters are colored:
   - 🟩 **Green**: Correct letter in correct position
   - 🟨 **Yellow**: Correct letter in wrong position
   - ⬜ **Gray**: Letter not in the word
3. **New Words**: A new word is generated every hour (UTC)
4. **Dictionary**: Only valid English words are accepted

## Architecture

### Security Features

- **Immutable Words**: Once created, hourly words cannot be modified
- **Race Condition Handling**: Multiple clients can safely attempt to create the same hour's word
- **Client-Side Generation**: Words are generated deterministically to ensure consistency
- **Dictionary Protection**: Full dictionary is not exposed to prevent cheating

### Data Model

```typescript
// Firestore collection: words
{
  word: string;           // lowercase 5-letter word
  createdAt: string;      // ISO timestamp
  source: 'client';       // generation source
  dictionaryVersion: string; // dictionary version
}
```

### Hour ID Format

Words are stored using UTC-based hour IDs in `YYYYMMDDHH` format (e.g., `2025092323`).

## Deployment

### Automatic Deployment to GitHub Pages

The project includes GitHub Actions for automatic deployment to GitHub Pages:

1. Push to `main` branch triggers deployment
2. Tests and linting run automatically
3. Build artifacts are deployed to GitHub Pages
4. Site is available at: https://hongarc.github.io/mintle/

### Manual Deployment

```bash
# Build the project
npm run build

# The dist/ folder contains the built files ready for deployment
```

### Environment Variables

Set these secrets in your GitHub repository for Firebase integration:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### GitHub Pages Setup

1. Go to your repository settings on GitHub
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "GitHub Actions"
4. The workflow will automatically deploy on pushes to main

## Testing

The project includes comprehensive tests:

- **Unit Tests**: Core game logic, word evaluation, time utilities
- **Integration Tests**: Firestore operations, word management
- **Component Tests**: React components with Testing Library

Run tests:
```bash
npm test           # Run tests in watch mode
npm test -- --run  # Run tests once
npm run test:ui    # Run tests with UI
```

## Performance

- **Bundle Splitting**: Vendor and Firebase code are split into separate chunks
- **Tree Shaking**: Unused code is eliminated
- **Minification**: Production builds are minified and optimized
- **Caching**: Static assets are cached for optimal loading

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Wordle by Josh Wardle
- Built with modern web technologies
- Designed for accessibility and performance