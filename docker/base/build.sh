#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building AI Base Docker Image${NC}"
echo "=========================================="

# Get version from user or use 'latest'
VERSION=${1:-latest}

echo -e "${YELLOW}Building version: ${VERSION}${NC}"

# Build the image
docker build -t lighty262/opensys-base:${VERSION} ./docker/base

echo -e "${GREEN}OK Image built successfully${NC}"
echo ""
echo -e "${YELLOW}To push to Docker Hub, run:${NC}"
echo "  docker push lighty262/opensys-base:${VERSION}"
echo ""
echo -e "${YELLOW}Or run this script with 'push' argument:${NC}"
echo "  $0 ${VERSION} push"

# Push if second argument is 'push'
if [ "$2" = "push" ]; then
    echo ""
    echo -e "${GREEN}Pushing to Docker Hub...${NC}"
    docker push lighty262/opensys-base:${VERSION}
    
    # Also tag and push as latest if not already latest
    if [ "$VERSION" != "latest" ]; then
        echo -e "${GREEN}Tagging as latest...${NC}"
        docker tag lighty262/opensys-base:${VERSION} lighty262/opensys-base:latest
        docker push lighty262/opensys-base:latest
    fi
    
    echo -e "${GREEN}OK Successfully pushed to Docker Hub${NC}"
fi
