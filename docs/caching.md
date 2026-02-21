# AI Base Caching

AI Base uses a database-backed key-value store for caching and rate limits. The cache is designed for server-side performance and can be extended through the `CacheService` in `api/Services`.

## Notes

- Cache entries are scoped by key and can store JSON payloads.
- Rate limiting uses the same key-value store to track activity windows.
