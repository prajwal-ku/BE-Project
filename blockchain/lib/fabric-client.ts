import { Gateway, Wallets, Wallet, Network, Contract } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';
import * as FabricCAServices from 'fabric-ca-client';

export class FabricClient {
  private gateway: Gateway;
  private wallet: Wallet | null = null;

  constructor() {
    this.gateway = new Gateway();
  }

  async connect(): Promise<{ network: Network; contract: Contract }> {
    try {
      // Load connection profile
      const ccpPath = path.resolve(process.cwd(), 'blockchain/config/connection.json');
      const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

      // Create wallet
      const walletPath = path.join(process.cwd(), 'blockchain/wallet');
      this.wallet = await Wallets.newFileSystemWallet(walletPath);

      // Check for existing user identity
      const identity = await this.wallet.get('appUser');
      if (!identity) {
        console.log('User identity not found, enrolling admin and registering user...');
        await this.enrollAdmin();
        await this.registerUser();
      }

      // Connect to gateway
      await this.gateway.connect(ccp, {
        wallet: this.wallet,
        identity: 'appUser',
        discovery: { enabled: true, asLocalhost: true }
      });

      // Get network and contract
      const network = await this.gateway.getNetwork('mychannel');
      const contract = network.getContract('basic');

      return { network, contract };
    } catch (error) {
      console.error('Failed to connect to Fabric network:', error);
      throw error;
    }
  }

  private async enrollAdmin(): Promise<void> {
    try {
      const ccpPath = path.resolve(process.cwd(), 'blockchain/config/connection.json');
      const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

      // Create a new CA client for interacting with the CA.
      const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
      const caTLSCACerts = fs.readFileSync(caInfo.tlsCACerts.path).toString();
      const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

      // Create a new file system wallet
      const walletPath = path.join(process.cwd(), 'blockchain/wallet');
      const wallet = await Wallets.newFileSystemWallet(walletPath);

      // Check to see if we've already enrolled the admin user.
      const adminIdentity = await wallet.get('admin');
      if (adminIdentity) {
        console.log('An identity for the admin user "admin" already exists in the wallet');
        return;
      }

      // Enroll the admin user, and import the new identity into the wallet.
      const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
      const x509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes(),
        },
        mspId: 'Org1MSP',
        type: 'X.509',
      };
      await wallet.put('admin', x509Identity);
      console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
    } catch (error) {
      console.error(`Failed to enroll admin user "admin": ${error}`);
      throw error;
    }
  }

  private async registerUser(): Promise<void> {
    try {
      const ccpPath = path.resolve(process.cwd(), 'blockchain/config/connection.json');
      const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

      // Create a new CA client for interacting with the CA.
      const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
      const caTLSCACerts = fs.readFileSync(caInfo.tlsCACerts.path).toString();
      const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

      const walletPath = path.join(process.cwd(), 'blockchain/wallet');
      const wallet = await Wallets.newFileSystemWallet(walletPath);

      // Check to see if we've already enrolled the user
      const userIdentity = await wallet.get('appUser');
      if (userIdentity) {
        console.log('An identity for the user "appUser" already exists in the wallet');
        return;
      }

      // Must have an admin to register a new user
      const adminIdentity = await wallet.get('admin');
      if (!adminIdentity) {
        console.log('An identity for the admin user "admin" does not exist in the wallet');
        console.log('Run the enrollAdmin.ts application before retrying');
        return;
      }

      // Build a user object for authenticating with the CA
      const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
      const adminUser = await provider.getUserContext(adminIdentity, 'admin');

      // Register the user, enroll the user, and import the new identity into the wallet.
      const secret = await ca.register({
        affiliation: 'org1.department1',
        enrollmentID: 'appUser',
        role: 'client'
      }, adminUser);
      
      const enrollment = await ca.enroll({
        enrollmentID: 'appUser',
        enrollmentSecret: secret
      });
      
      const x509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes(),
        },
        mspId: 'Org1MSP',
        type: 'X.509',
      };
      
      await wallet.put('appUser', x509Identity);
      console.log('Successfully registered and enrolled admin user "appUser" and imported it into the wallet');
    } catch (error) {
      console.error(`Failed to register user "appUser": ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.gateway.disconnect();
  }
}
