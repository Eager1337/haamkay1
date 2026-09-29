# Haamkay Enterprise Mobile App

This branch adds an Android app build pipeline for the Haamkay Enterprise web application.

## Build

The GitHub Actions workflow `.github/workflows/build-android-apk.yml`:

1. Installs the web dependencies.
2. Builds the Vite/React website.
3. Installs Capacitor.
4. Generates the Android project.
5. Syncs the production web build into Android.
6. Builds a debug APK.
7. Uploads the APK as a GitHub Actions artifact.

## Download

After the workflow completes, open the workflow run in GitHub and download the artifact named:

`haamkay-enterprise-android-debug`

The artifact contains `app-debug.apk`.

## Release builds

The current workflow intentionally creates a debug APK so it can be built without exposing signing credentials. A Play Store-ready release APK/AAB requires Android signing credentials stored as GitHub Actions secrets.

## Important

The mobile app packages the Haamkay web application itself. Existing web functionality such as authentication, Supabase-backed data, checkout/order flows, admin pages, and API integrations remain web-backed and require their existing production configuration.
