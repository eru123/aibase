# Caching Notes

AI Base includes a database-backed key-value cache (`kv_store`) used for:

- server-side caching,
- request throttling/rate-limit state,
- lightweight shared transient data.

## Implementation

- Cache operations are centralized in `api/Services/CacheService.php`.
- Data is keyed and can store JSON payloads.
- Expiry is managed in application logic to keep behavior explicit.

## Starter-template guidance

If your product needs high-throughput caching, you can keep the same service contract and swap the backend to Redis while preserving controller/service callers.
