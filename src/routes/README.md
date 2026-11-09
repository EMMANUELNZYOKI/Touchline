# Touchline route components

The active routing system is the **Next.js App Router** under `src/app/`. Add new URLs there using `page.tsx`, `layout.tsx`, and dynamic folder segments such as `[playerId]`.

The existing React screens remain temporarily in this directory as client components so the framework migration can preserve UI behavior with minimal redesign. Each file under `src/app/` imports the corresponding screen module here. Protected layouts are implemented at `src/routes/admin/_shell.tsx`, `src/routes/coach/_shell.tsx`, and `src/routes/platform/_shell.tsx` and mounted by App Router layouts.

`src/lib/next-router-compat.tsx` is a transitional adapter for existing links, navigation, route params, and page components. Do not add new TanStack Start/Router dependencies or route conventions. As screens are touched later, move their route logic into Next-native APIs and remove the adapter once no screens depend on it.
