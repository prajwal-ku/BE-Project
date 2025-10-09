import { Gateway, Wallets } from 'fabric-network';
import * as FabricCAServices from 'fabric-ca-client';
import * as path from 'path';
import * as fs from 'fs';

class FabricConnection {
    constructor() {
        this.gateway = new Gateway();
        this.wallet = null;
        this.connected = false;
    }

    async connect() {
        try {
            // Load connection profile
            const connectionProfilePath = path.resolve(process.cwd(), 'hyperledger/config/connection.json');
            const connectionProfile = JSON.parse(fs.readFileSync(connectionProfilePath, 'utf8'));

            // Create wallet
            const walletPath = path.join(process.cwd(), 'hyperledger/config/wallet');
            this.wallet = await Wallets.newFileSystemWallet(walletPath);

            // Connection options
            const connectionOptions = {
                wallet: this.wallet,
                identity: 'farmerAdmin',
                discovery: { enabled: true, asLocalhost: true }
            };

            // Connect to gateway
            await this.gateway.connect(connectionProfile, connectionOptions);
            this.connected = true;
            console.log('Connected to Hyperledger Fabric Network');
            
        } catch (error) {
            console.error('Failed to connect to Hyperledger:', error);
            throw error;
        }
    }

    async getContract() {
        if (!this.connected) {
            await this.connect();
        }
        
        const network = await this.gateway.getNetwork('mychannel');
        return network.getContract('agriculture-chaincode');
    }

    async disconnect() {
        this.gateway.disconnect();
        this.connected = false;
    }
}

export default new FabricConnection();