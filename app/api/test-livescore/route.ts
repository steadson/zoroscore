// Bridge route for app router. Re-exports the GET handler defined in
// `app/api/test-livescore.ts` so Next.js recognizes the endpoint at
// `/api/test-livescore` (App Router requires a `route.ts` file inside a
// directory under `app/api`).

export { GET } from "../test-livescore";
