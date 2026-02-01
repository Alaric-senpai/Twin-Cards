# App Configuration Guide

## Overview

The app now uses dynamic configuration via `app.config.ts` instead of static `app.json`. This allows different package names for development and production builds.

## Package Names

- **Production**: `com.alaric987.twincards`
- **Development**: `com.alaric987.twincards.dev`
- **Preview**: `com.alaric987.twincards` (uses production package)

## Build Profiles

### Development Build
```bash
eas build --profile development --platform android
```
- Package: `com.alaric987.twincards.dev`
- App Name: "Twin Cards (Dev)"
- Development client enabled
- Can be installed alongside production build

### Preview Build
```bash
eas build --profile preview --platform android
```
- Package: `com.alaric987.twincards`
- App Name: "Twin Cards"
- APK format for easy distribution
- Uses production package name

### Production Build
```bash
eas build --profile production --platform android
```
- Package: `com.alaric987.twincards`
- App Name: "Twin Cards"
- Auto-increment version code
- APK format for distribution

## Environment Variables

The `APP_VARIANT` environment variable controls the build configuration:

- `development` → Dev package name and app name
- `preview` → Production package name
- `production` → Production package name

## Local Development

For local development with `expo run:android`, set the environment variable:

```bash
# Development build
APP_VARIANT=development npx expo run:android

# Production build
APP_VARIANT=production npx expo run:android
```

## Benefits

1. **Side-by-side Installation**: Dev and production builds can coexist on the same device
2. **Clear Identification**: Dev builds have "(Dev)" suffix in app name
3. **Simplified Testing**: Test both versions without uninstalling
4. **Environment Separation**: Different package names prevent data conflicts

## Migration Notes

- The old `app.json` can be safely deleted after verifying builds work
- All configuration is now in `app.config.ts`
- EAS automatically reads environment variables from `eas.json`
