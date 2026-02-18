# JARVIS - Mobile Device Controller

## Overview

JARVIS is a React Native (Expo) mobile application with an Express.js backend that serves as a remote device controller. It communicates with Android devices via ADB (Android Debug Bridge) commands, providing a dashboard interface to monitor device status, execute commands, and control connected devices. The app features Hindi voice responses using text-to-speech, a futuristic dark UI theme inspired by the JARVIS AI assistant, and real-time device monitoring including battery status and Shizuku authorization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo/React Native)
- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture (`newArchEnabled: true`)
- **Routing**: File-based routing via `expo-router` v6 with typed routes. The app uses a tab-based layout with three tabs: Dashboard (`index`), Controls (`controls`), and Settings (`settings`)
- **State Management**: React Context (`JarvisProvider` in `lib/jarvis-context.tsx`) manages global state including device status, battery info, Shizuku status, command logs, and text-to-speech. Server data fetching uses `@tanstack/react-query`
- **UI Design**: Custom dark theme defined in `constants/colors.ts` with cyan accent colors (`#00D4FF`). Uses `expo-linear-gradient`, `expo-blur`, `react-native-reanimated` for animations, and `expo-haptics` for tactile feedback
- **Voice/TTS**: Uses `expo-speech` to speak responses in Hindi (Hinglish style)
- **Fonts**: Inter (regular, medium, semibold, bold) and Space Mono (regular, bold) loaded via `@expo-google-fonts`

### Backend (Express.js)
- **Runtime**: Node.js with Express v5, TypeScript compiled via `tsx` (dev) or `esbuild` (prod)
- **API Design**: RESTful JSON API under `/api/` prefix with routes defined in `server/routes.ts`
- **Key Endpoints**:
  - `GET /api/shizuku/status` - Check Shizuku/ADB authorization status
  - `GET /api/adb/status` - Get connected device status
  - `GET /api/adb/battery` - Get device battery level
  - `POST /api/adb/command` - Execute ADB commands (with confirmation flow for critical actions)
  - `POST /api/adb/call` - Initiate phone calls via ADB
- **ADB Integration**: `server/adb.ts` wraps `child_process.exec` to run ADB shell commands with timeout support and error handling. Commands detect disconnected devices and return appropriate status
- **Storage**: Currently uses in-memory storage (`MemStorage` class in `server/storage.ts`) for user data. Database schema exists in `shared/schema.ts` but the app primarily uses MemStorage
- **CORS**: Dynamic CORS configuration supporting Replit domains and localhost for development
- **Static Serving**: In production, serves a pre-built static web export of the Expo app; in development, proxies to the Expo dev server

### Shared Layer
- **Schema**: `shared/schema.ts` defines a `users` table using Drizzle ORM with PostgreSQL dialect. Includes Zod validation schemas via `drizzle-zod`
- **Path Aliases**: `@/*` maps to project root, `@shared/*` maps to `./shared/*`

### Build & Deployment
- **Development**: Two processes run simultaneously - Expo dev server (`expo:dev`) and Express server (`server:dev`)
- **Production**: Expo app is statically built via `scripts/build.js`, Express server is bundled with esbuild, and the server serves the static build
- **Database Migrations**: Drizzle Kit configured for PostgreSQL push-based migrations (`db:push`)

### Command Execution Pattern
The app implements a two-step confirmation flow for critical actions: the server flags dangerous commands (like factory reset, wipe data) and requires a `confirmed: true` flag before execution. All command results include Hindi response text for voice feedback.

## External Dependencies

- **PostgreSQL**: Database configured via `DATABASE_URL` environment variable, schema managed by Drizzle ORM. Used for persistent user storage (though currently the app uses in-memory storage as default)
- **ADB (Android Debug Bridge)**: Must be installed on the server/host machine. The app executes ADB commands to control connected Android devices
- **Shizuku**: Android permission framework - the app checks Shizuku authorization status to determine if it can execute privileged commands on devices
- **Expo Services**: Standard Expo build and development tooling
- **Replit Environment**: The app is designed to run on Replit, using `REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS`, and `REPLIT_INTERNAL_APP_DOMAIN` environment variables for URL configuration and CORS
- **Key npm packages**: `expo-speech` (TTS), `react-native-reanimated` (animations), `react-native-keyboard-controller`, `expo-haptics`, `@tanstack/react-query` (data fetching), `http-proxy-middleware` (dev proxy)