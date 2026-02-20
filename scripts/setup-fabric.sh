#!/bin/bash

set -e

echo "Setting up Hyperledger Fabric network..."

# Clean up any existing setup
echo "Cleaning up previous setup..."
docker-compose -f ./blockchain/network/docker-compose.yaml down || true
rm -rf ./blockchain/network/organizations
rm -rf ./blockchain/network/system-genesis-block
rm -rf ./blockchain/network/channel-artifacts
rm -rf ./blockchain/wallet

# Create necessary directories
mkdir -p ./blockchain/network/organizations
mkdir -p ./blockchain/network/system-genesis-block
mkdir -p ./blockchain/network/channel-artifacts
mkdir -p ./blockchain/wallet

# Create organizations
echo "Generating crypto material..."
cryptogen generate --config=./blockchain/network/crypto-config.yaml --output=./blockchain/network/organizations

# Generate genesis block
echo "Generating genesis block..."
export FABRIC_CFG_PATH=./blockchain/network
configtxgen -profile TestOrgsOrdererGenesis -channelID system-channel -outputBlock ./blockchain/network/system-genesis-block/genesis.block

# Create channel transaction
echo "Creating channel transaction..."
configtxgen -profile TestOrgsChannel -outputCreateChannelTx ./blockchain/network/channel-artifacts/mychannel.tx -channelID mychannel

# Start network
echo "Starting network..."
docker-compose -f ./blockchain/network/docker-compose.yaml up -d

# Wait for containers to start
echo "Waiting for containers to be ready..."
sleep 10

echo "Fabric network setup completed!"
