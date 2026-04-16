//In NativeScript, the app.ts file is the entry point to your application.
//You can use this file to perform app-level initialization, but the primary
//purpose of the file is to pass control to the app’s first page.

import { svelteNative } from '@nativescript-community/svelte-native';
import App from './App.svelte';

// Start the Svelte Native app
svelteNative(App as any, {});

