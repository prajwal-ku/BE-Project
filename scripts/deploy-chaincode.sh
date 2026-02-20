#!/bin/bash

set -e

echo "Deploying chaincode..."

# Wait for peer to be ready
sleep 10

# Package chaincode
echo "Packaging chaincode..."
docker exec cli peer lifecycle chaincode package basic.tar.gz --path /opt/gopath/src/github.com/chaincode --lang golang --label basic_1.0

# Install chaincode
echo "Installing chaincode..."
docker exec cli peer lifecycle chaincode install basic.tar.gz

# Get package ID
PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled | grep -oP "Package ID: basic_1.0:\K[^,]*")
echo "Package ID: $PACKAGE_ID"

# Approve for organization
echo "Approving chaincode for organization..."
docker exec cli peer lifecycle chaincode approveformyorg -o orderer.example.com:7050 --channelID mychannel --name basic --version 1.0 --package-id basic_1.0:$PACKAGE_ID --sequence 1 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Commit chaincode
echo "Committing chaincode..."
docker exec cli peer lifecycle chaincode commit -o orderer.example.com:7050 --channelID mychannel --name basic --version 1.0 --sequence 1 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Initialize ledger
echo "Initializing ledger..."
docker exec cli peer chaincode invoke -o orderer.example.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C mychannel -n basic --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt -c '{"function":"InitLedger","Args":[]}'

echo "Chaincode deployed and initialized successfully!"
