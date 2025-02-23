import { betterAuth } from "better-auth";

import { Database } from "bun:sqlite";

const db = new Database("test-service.db");

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
  },
});
