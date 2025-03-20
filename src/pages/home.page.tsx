import { RootLayout } from "../layouts/root.layout";

export function HomePage() {
  return (
    <RootLayout>
      <div class="min-h-screen bg-black text-white font-mono p-8">
        <div class="max-w-2xl mx-auto">
          <div class="mb-12">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-6 h-6 border border-white/40"></div>
              <h1 class="text-4xl font-bold tracking-tight">namewastaken</h1>
            </div>
            <p class="text-white/60 text-lg ml-9">
              bestie, let's see if ur dream handle is taken fr fr
            </p>
          </div>

          <div class="space-y-8">
            <div class="space-y-4">
              <div class="flex gap-3">
                <input
                  type="text"
                  id="handle"
                  class="flex-1 bg-black border border-white/20 px-4 py-3 rounded-none focus:outline-none focus:border-white/40 text-white placeholder-white/40"
                  placeholder="drop ur handle with or without @"
                />
                <button
                  onclick="checkHandle()"
                  class="px-6 py-3 bg-white text-black hover:bg-white/90 focus:outline-none"
                >
                  vibe check
                </button>
              </div>
            </div>

            <div id="results"></div>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
