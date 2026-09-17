declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    CONTACT_EMAIL?: SendEmail;
    CONTACT_LIMIT?: RateLimit;
    CONTACT_TOTAL_LIMIT?: RateLimit;
    BUCKET?: R2Bucket;
    OWNER_EMAIL?: string;
    ACCESS_ENABLED?: string;
    ACCESS_ISSUER?: string;
    ACCESS_AUDIENCE?: string;
  }
}
