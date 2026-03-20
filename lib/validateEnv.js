/**
 * Validates required environment variables at application startup
 * Throws an error with clear messaging if any required variables are missing
 */

const requiredEnvVars = {
  // Authentication
  NEXTAUTH_URL: 'The base URL of your application (e.g., http://localhost:3000)',
  NEXTAUTH_SECRET: 'A secret key for encrypting tokens (generate with: openssl rand -base64 32)',

  // OAuth
  GOOGLE_CLIENT_ID: 'Google OAuth client ID from Google Cloud Console',
  GOOGLE_CLIENT_SECRET: 'Google OAuth client secret from Google Cloud Console',

  // Database
  DATABASE_URL: 'Database connection string (e.g., file:./dev.db for SQLite)',
};

const optionalEnvVars = {
  NODE_ENV: 'Environment (development, production, test)',
  UPLOAD_DIR: 'Directory for file uploads (defaults to ./uploads)',
};

/**
 * Validates that all required environment variables are set
 * @throws {Error} If any required environment variable is missing
 */
function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const [varName, description] of Object.entries(requiredEnvVars)) {
    if (!process.env[varName]) {
      missing.push({ varName, description });
    }
  }

  // Check optional variables (warnings only)
  for (const [varName, description] of Object.entries(optionalEnvVars)) {
    if (!process.env[varName]) {
      warnings.push({ varName, description });
    }
  }

  // Report missing required variables
  if (missing.length > 0) {
    const errorMessage = [
      '\n❌ ENVIRONMENT CONFIGURATION ERROR',
      '\nThe following required environment variables are missing:\n',
      ...missing.map(({ varName, description }) =>
        `  • ${varName}\n    ${description}`
      ),
      '\nPlease create a .env file in the project root with these variables.',
      'See .env.example for a template.\n'
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Report optional variables (in development only)
  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('\n⚠️  Optional environment variables not set:');
    warnings.forEach(({ varName, description }) => {
      console.warn(`  • ${varName}: ${description}`);
    });
    console.warn('');
  }

  // Validate format of specific variables
  validateFormat();

  // Success message in development
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Environment variables validated successfully\n');
  }
}

/**
 * Validates the format of specific environment variables
 * @throws {Error} If any variable has an invalid format
 */
function validateFormat() {
  const errors = [];

  // Validate NEXTAUTH_URL format
  if (process.env.NEXTAUTH_URL) {
    try {
      new URL(process.env.NEXTAUTH_URL);
    } catch (e) {
      errors.push('NEXTAUTH_URL must be a valid URL (e.g., http://localhost:3000 or https://example.com)');
    }
  }

  // Validate NEXTAUTH_SECRET length (should be at least 32 characters)
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    errors.push('NEXTAUTH_SECRET should be at least 32 characters long for security. Generate with: openssl rand -base64 32');
  }

  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL) {
    const validPrefixes = ['postgresql://', 'mysql://', 'file:', 'sqlite:'];
    const hasValidPrefix = validPrefixes.some(prefix =>
      process.env.DATABASE_URL.startsWith(prefix)
    );
    if (!hasValidPrefix) {
      errors.push(`DATABASE_URL must start with one of: ${validPrefixes.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    const errorMessage = [
      '\n❌ ENVIRONMENT CONFIGURATION ERROR',
      '\nThe following environment variables have invalid formats:\n',
      ...errors.map(error => `  • ${error}`),
      ''
    ].join('\n');

    throw new Error(errorMessage);
  }
}

module.exports = { validateEnv };
