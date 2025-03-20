import { RootLayout } from "../layouts/root.layout";
import { wastaken } from "../api/wastaken";
import { ErrorBoundary, Suspense } from "hono/jsx";
import { useRequestContext } from "hono/jsx-renderer";

export function HomePage() {
  const c = useRequestContext();

  const handle = (c.req.param("handle") ?? "").replace("@", "");

  return (
    <RootLayout>
      <div class="min-h-screen bg-black text-white font-mono p-8">
        <div class="max-w-2xl mx-auto">
          <div class="mb-12">
            <div class="flex items-center gap-3 mb-2">
              <a href="/" class="w-6 h-6 border border-white/40"></a>
              <h1 class="text-4xl font-bold tracking-tight">namewastaken</h1>
            </div>
            <p class="text-white/60 text-lg ml-9">
              bestie, let's see if ur dream handle is taken fr fr
            </p>
          </div>

          <div class="space-y-8">
            <div class="space-y-4">
              <form method="get" action="/" class="flex gap-3">
                <input
                  type="text"
                  name="handle"
                  value={handle?.replace("@", "") || ""}
                  class="flex-1 bg-black border border-white/20 px-4 py-3 rounded-none focus:outline-none focus:border-white/40 text-white placeholder-white/40"
                  placeholder="drop ur handle with or without @"
                />
                <button
                  type="submit"
                  class="px-6 py-3 bg-white text-black hover:bg-white/90 focus:outline-none"
                >
                  vibe check
                </button>
              </form>
            </div>

            {handle && (
              <ErrorBoundary
                fallbackRender={(e) => (
                  <div class="text-red-300 text-center">
                    oopsie daisy: {e.message}
                  </div>
                )}
              >
                <Suspense fallback={<div>checking...</div>}>
                  <HandleCheckResults handle={handle} />
                </Suspense>
              </ErrorBoundary>
            )}
          </div>
        </div>
      </div>
    </RootLayout>
  );
}

async function HandleCheckResults({ handle }: { handle: string }) {
  if (!handle) {
    return null;
  }

  const results = await wastaken(handle);

  return (
    <div class="border border-white/20 divide-y divide-white/20">
      {Object.entries(results).map(([platform, taken]) => (
        <div class="flex items-center justify-between p-4">
          <span class="text-white/60">{platform}</span>
          <div class="flex items-center gap-2">
            <span class={taken ? "text-white/60" : "text-white"}>
              {taken ? "taken" : "available"}
            </span>
            <div
              class={`w-2 h-2 rounded-full ${
                taken ? "bg-white/60" : "bg-white"
              }`}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}
