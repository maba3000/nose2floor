import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Customises the HTML document for the web build.
 * Expo Router injects the app bundle and static content automatically.
 */
export default function Root({ children }: PropsWithChildren) {
  const baseUrl = process.env.EXPO_BASE_URL ?? '';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* iOS "Add to Home Screen" icon and standalone mode */}
        <link rel="apple-touch-icon" href={`${baseUrl}/apple-touch-icon.png`} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nose2Floor" />

        <meta name="theme-color" content="#F5F0EB" />

        {/* Prevent iOS long-press text selection and callout across the whole app */}
        <style>{`* { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }`}</style>

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
