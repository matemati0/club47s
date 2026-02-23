const { spawn } = require("node:child_process");

const child = spawn(
  process.execPath,
  ["./node_modules/next/dist/bin/next", "start", "-p", "3000"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      ALLOW_DEBUG_2FA: "true",
      DISABLE_EMAIL_DELIVERY: "true",
      ALLOW_MOCK_SOCIAL_LOGIN: "true",
      AUTH_COOKIE_SECRET: process.env.AUTH_COOKIE_SECRET || "e2e-secret"
    }
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
