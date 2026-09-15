declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    OWNER_EMAIL?: string;
    ACCESS_ENABLED?: string;
    ACCESS_ISSUER?: string;
    ACCESS_AUDIENCE?: string;
  }
}
