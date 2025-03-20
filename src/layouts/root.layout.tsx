export function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <title>@namewastaken</title>
        <meta name="description" content="bruh, that name was taken" />

        <meta name="application-name" content="namewastaken" />
        <meta name="publisher" content="namewastaken" />

        <meta name="theme-color" content="#ffffff" />

        <script src="/client.js" type="module"></script>

        {/* Styles */}
        <link rel="stylesheet" href="/tw.css"></link>

        {/* <link rel="manifest" href="/manifest.json" /> */}
        {/* <link rel="sitemap" href="/sitemap.xml" type="application/xml" /> */}
      </head>

      <body className="min-h-screen bg-black text-white">{children}</body>
    </html>
  );
}
