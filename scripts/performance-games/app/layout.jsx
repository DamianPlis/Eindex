import "@/css/globals.css";

export default function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Loaded before hydration to observe startup, including worker creation. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/metrics.js" />
      </head>
      <body style={{ maxWidth: 510, margin: "auto" }}>{children}</body>
    </html>
  );
}
