# TwinCards

![TwinCards Logo](./assets/logo.png)

A modern, intuitive flashcard study application built with React Native and Expo. TwinCards helps students organize their study materials, create flashcards, and track their learning progress with a beautiful, gesture-driven interface.

## ✨ Features

### 📚 Study Units
- **Organize by Subject**: Create units for different courses or topics
- **Custom Icons & Colors**: Personalize each unit with icons and color themes
- **Quick Stats**: View flashcard and material counts at a glance
- **Smart Search**: Quickly find units with real-time search

### 🎴 Flashcards
- **Easy Creation**: Add flashcards with front, back, and optional hints
- **CSV Import**: Bulk import flashcards from CSV files
- **Interactive Study Mode**: 
  - Gesture-based navigation (swipe up/down to navigate)
  - Tap to flip cards
  - Track correct/incorrect answers
  - Session summaries with accuracy metrics

### 📄 Study Materials
- **PDF Support**: Upload and view PDF documents in-app
- **PPTX Support**: Upload PowerPoint presentations
- **File Management**: Organize materials by unit
- **Quick Access**: Open materials directly from unit view

### 🎨 Beautiful UI/UX
- **Dark & Light Modes**: Automatic theme switching
- **Smooth Animations**: Gesture-driven interactions with fluid transitions
- **Modern Design**: Clean, card-based interface with vibrant colors
- **Loading States**: Skeleton loaders for smooth data loading
- **Responsive**: Optimized for various screen sizes

### 📊 Progress Tracking
- **Study Sessions**: Automatic session recording
- **Performance Metrics**: Track cards reviewed and accuracy
- **Activity Overview**: See this week's study activity
- **Unit Statistics**: Monitor progress per unit

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) with [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **UI Components**: [rn-primitives](https://rn-primitives.com/) (shadcn/ui for React Native)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Gestures**: [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- **Icons**: [Lucide React Native](https://lucide.dev/)

## 📋 Prerequisites

- **Node.js**: >= 18.0.0
- **npm** or **pnpm**
- **Expo CLI**: Installed globally or via npx
- **Expo Go** app (for testing on physical devices)
- **Android Studio** or **Xcode** (for emulators)

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd twincards
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. **Run on your device**
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Or press `a` for Android emulator, `i` for iOS simulator

### Available Scripts

```bash
npm run dev        # Start development server with cache clear
npm run android    # Start on Android
npm run ios        # Start on iOS
npm run web        # Start web version
npm run clean      # Clean cache and node_modules
```

## 📱 Building for Production

### Using EAS Build

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure your project**
   ```bash
   eas build:configure
   ```

4. **Build for Android (APK)**
   ```bash
   eas build --platform android --profile preview
   ```

5. **Build for Production**
   ```bash
   eas build --platform android --profile production
   ```

The `eas.json` configuration is already set up for development, preview, and production builds.

## 📂 Project Structure

```
twincards/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Tab navigation (if needed)
│   ├── flashcard/               # Flashcard CRUD screens
│   ├── material/                # Material viewer
│   ├── study/                   # Study session screen
│   ├── unit/                    # Unit management screens
│   ├── _layout.tsx              # Root layout with providers
│   └── index.tsx                # Home screen
├── components/                   # Reusable components
│   ├── ui/                      # UI primitives (buttons, cards, etc.)
│   ├── Container.tsx            # Safe area container
│   ├── EmptyState.tsx           # Empty state component
│   ├── FlashcardItem.tsx        # Flashcard list item
│   ├── Header.tsx               # App header
│   ├── MaterialItem.tsx         # Material list item
│   ├── SearchBar.tsx            # Search component
│   └── UnitCard.tsx             # Unit card component
├── db/                          # Database configuration
│   ├── schema.ts                # Drizzle schema definitions
│   └── index.ts                 # Database initialization
├── hooks/                       # Custom React hooks
│   └── useDatabase.ts           # Database query hooks
├── lib/                         # Utilities and configurations
│   ├── theme.ts                 # Theme configuration
│   └── utils.ts                 # Utility functions
├── utils/                       # Helper utilities
│   ├── fileManager.ts           # File operations
│   └── ids.ts                   # ID generation
├── assets/                      # Static assets
│   ├── logo.png                 # App logo
│   └── images/                  # Image assets
├── drizzle/                     # Database migrations
├── global.css                   # Global styles
├── tailwind.config.js           # Tailwind configuration
├── app.json                     # Expo configuration
├── eas.json                     # EAS Build configuration
└── package.json                 # Dependencies
```

## 🗄️ Database Schema

The app uses SQLite with Drizzle ORM. Main tables:

- **units**: Study units/courses
- **flashcards**: Flashcard questions and answers
- **materials**: PDF/PPTX study materials
- **study_sessions**: Study session records

Schema is defined in `db/schema.ts` and migrations are in the `drizzle/` directory.

## 🎨 Customization

### Theme

Edit `lib/theme.ts` to customize colors:

```typescript
export const THEME = {
  light: {
    background: 'hsl(210 20% 98%)',
    primary: 'hsl(0 100% 71%)',    // Coral red
    // ... more colors
  },
  dark: {
    background: 'hsl(222 47% 11%)', // Dark slate
    primary: 'hsl(0 100% 71%)',
    // ... more colors
  }
}
```

### Icons

Available icons for units (defined in `components/UnitCard.tsx`):
- `book` - BookOpen
- `folder` - Folder
- `file` - FileText
- `beaker` - Beaker
- `graduation` - GraduationCap

Add more icons by importing from `lucide-react-native` and adding to the `ICON_MAP`.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Known Issues

- PPTX files currently open in external apps (in-app viewer planned)
- Loading states may briefly show on fast connections

## 🔮 Roadmap

- [ ] In-app PPTX viewer
- [ ] Spaced repetition algorithm
- [ ] Cloud sync
- [ ] Study reminders
- [ ] Export study statistics
- [ ] Collaborative study sets
- [ ] Audio flashcards

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- UI components from [reactnative resuables](https://reactnativereusables.com/)
- Icons from [Lucide](https://lucide.dev/)
- Inspired by personal needs(Exam cramming)

---
