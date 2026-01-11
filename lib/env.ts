export function ensureServerEnv() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }

  return {
    DATABASE_URL,
  };
}
