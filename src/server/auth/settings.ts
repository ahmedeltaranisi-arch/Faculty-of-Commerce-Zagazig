export function requiresEmailVerification() {
  return process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true";
}
