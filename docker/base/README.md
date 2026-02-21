# Billing Base Docker Image

This is the base Docker image for Billing applications. It includes:

- PHP 8.4 with Apache
- Node.js 22.x with pnpm
- All required PHP extensions
- Composer
- System dependencies

## Building the Image

```bash
docker build -t eru123/billing-base:latest .
docker push eru123/billing-base:latest
```

## Versioning

Tag format: `eru123/billing-base:X.Y.Z`

- Major version: Breaking changes
- Minor version: New features/extensions
- Patch version: Bug fixes

## Automated Builds

This image is automatically built and pushed to Docker Hub when changes are committed to the `docker/base/` directory.
