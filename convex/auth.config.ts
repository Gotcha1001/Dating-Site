// convex/auth.config.ts
const authConfig = {
  providers: [
    {
      domain: "https://assuring-porpoise-9053.clerk.accounts.dev",
      applicationID: "convex", // ← must be "convex", not a dynamic env var
    },
  ],
};

export default authConfig;
