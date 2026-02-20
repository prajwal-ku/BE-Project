#!/bin/bash

echo "=== Debugging Fabric Setup ==="
echo "Current directory: $(pwd)"
echo ""

echo "1. Checking Docker:"
docker --version
docker-compose --version
echo ""

echo "2. Checking Fabric binaries:"
which peer
which configtxgen
echo ""

echo "3. Checking chaincode path:"
echo "Absolute path: $(pwd)/Blockchain/chaincode"
ls -la Blockchain/chaincode/ 2>/dev/null || echo "Chaincode directory not found!"
echo ""

echo "4. Checking network status:"
cd fabric-samples/test-network
docker ps
echo ""

echo "5. Environment variables:"
echo "PATH: $PATH"
echo "FABRIC_CFG_PATH: $FABRIC_CFG_PATH"
