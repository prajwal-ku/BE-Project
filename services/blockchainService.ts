import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';

// This will be replaced with your actual contract ABI after compilation
const contractABI: any[] = []; // You'll fill this after compiling your contract

// Ganache configuration
const GANACHE_CONFIG = {
  networkId: '1337',
  chainId: '0x539', // 1337 in hex
  rpcUrl: 'http://127.0.0.1:7545', // Default Ganache GUI port
  chainName: 'Ganache'
};

// This will be set after deployment
let CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x...';

export interface BlockchainProduct {
  id: number;
  name: string;
  farmer: string;
  currentOwner: string;
  status: number;
  quantity: number;
  pricePerQuintal: number;
  registrationDate: number;
  gpsHash: string;
}

export interface BlockchainTransfer {
  productId: number;
  from: string;
  to: string;
  role: string;
  timestamp: number;
}

export interface RegistrationResult {
  success: boolean;
  productId?: number;
  transactionHash?: string;
  blockNumber?: number;
  error?: string;
}

class BlockchainService {
  private web3: Web3 | null = null;
  private contract: any = null;
  private account: string | null = null;
  private initialized: boolean = false;

  async init(): Promise<boolean> {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment');
      }

      // Check if MetaMask is installed
      const provider = await detectEthereumProvider();
      
      if (!provider) {
        throw new Error('Please install MetaMask to use blockchain features');
      }

      // Initialize Web3
      this.web3 = new Web3(provider as any);
      
      // Check if on correct network (Ganache)
      const networkId = await this.web3.eth.net.getId();
      if (networkId.toString() !== GANACHE_CONFIG.networkId) {
        await this.switchToGanache();
      }

      // Request account access
      const accounts = await this.web3.eth.requestAccounts();
      this.account = accounts[0];

      // Initialize contract if ABI and address exist
      if (contractABI.length > 0 && CONTRACT_ADDRESS !== '0x...') {
        this.contract = new this.web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
      }
      
      this.initialized = true;
      console.log('✅ Blockchain connected:', this.account);
      
      return true;
    } catch (error) {
      console.error('❌ Blockchain init error:', error);
      this.initialized = false;
      return false;
    }
  }

  async switchToGanache(): Promise<void> {
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: GANACHE_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      // If Ganache not added, add it
      if (switchError.code === 4902) {
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: GANACHE_CONFIG.chainId,
            chainName: GANACHE_CONFIG.chainName,
            rpcUrls: [GANACHE_CONFIG.rpcUrl],
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            }
          }],
        });
      } else {
        throw switchError;
      }
    }
  }

  async registerProduct(
    name: string, 
    gpsHash: string, 
    quantity: number, 
    price: number
  ): Promise<RegistrationResult> {
    if (!this.contract || !this.account) {
      return {
        success: false,
        error: 'Blockchain not initialized or contract not deployed'
      };
    }

    try {
      // This is a placeholder - replace with actual contract call
      console.log('📝 Registering on blockchain:', { name, gpsHash, quantity, price });
      
      // Simulate successful registration for now
      return {
        success: true,
        productId: Math.floor(Math.random() * 1000),
        transactionHash: '0x' + Math.random().toString(16).substring(2, 42),
        blockNumber: Math.floor(Math.random() * 10000)
      };
      
    } catch (error: any) {
      console.error('❌ Register on chain error:', error);
      
      if (error.code === 4001) {
        return {
          success: false,
          error: 'Transaction rejected by user'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  async getProduct(productId: number): Promise<BlockchainProduct | null> {
    if (!this.contract) {
      return null;
    }

    try {
      // This is a placeholder - replace with actual contract call
      return {
        id: productId,
        name: 'Sample Product',
        farmer: '0x1234...5678',
        currentOwner: '0x1234...5678',
        status: 0,
        quantity: 100,
        pricePerQuintal: 2000,
        registrationDate: Math.floor(Date.now() / 1000),
        gpsHash: '0x' + Math.random().toString(16).substring(2, 66)
      };
    } catch (error) {
      console.error('❌ Get product error:', error);
      return null;
    }
  }

  async getProductHistory(productId: number): Promise<BlockchainTransfer[]> {
    if (!this.contract) {
      return [];
    }

    try {
      // This is a placeholder - replace with actual contract call
      return [];
    } catch (error) {
      console.error('❌ Get history error:', error);
      return [];
    }
  }

  async getProductsByFarmer(farmerAddress: string): Promise<number[]> {
    if (!this.contract) {
      return [];
    }

    try {
      // This is a placeholder - replace with actual contract call
      return [1, 2, 3];
    } catch (error) {
      console.error('❌ Get farmer products error:', error);
      return [];
    }
  }

  async transferToDistributor(productId: number, distributorAddress: string): Promise<any> {
    if (!this.contract || !this.account) {
      return {
        success: false,
        error: 'Blockchain not initialized'
      };
    }

    try {
      // This is a placeholder - replace with actual contract call
      return {
        success: true,
        transactionHash: '0x' + Math.random().toString(16).substring(2, 42)
      };
    } catch (error: any) {
      console.error('❌ Transfer error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getAccount(): string | null {
    return this.account;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async signMessage(message: string): Promise<string | null> {
    if (!this.web3 || !this.account) {
      throw new Error('Blockchain not initialized');
    }

    try {
      const signature = await this.web3.eth.personal.sign(
        message, 
        this.account, 
        ''
      );
      return signature;
    } catch (error) {
      console.error('❌ Signing error:', error);
      return null;
    }
  }

  getWeb3(): Web3 | null {
    return this.web3;
  }

  setContractAddress(address: string) {
    CONTRACT_ADDRESS = address;
    localStorage.setItem('contractAddress', address);
    if (this.web3 && contractABI.length > 0) {
      this.contract = new this.web3.eth.Contract(contractABI, address);
    }
  }
}

export const blockchainService = new BlockchainService();