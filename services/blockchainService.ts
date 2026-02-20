import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';

// Smart Contract ABI - Replace with your compiled contract ABI
const contractABI = [
  // Add your contract ABI here after compiling
  {
    "inputs": [
      {"name": "_name", "type": "string"},
      {"name": "_gpsHash", "type": "string"},
      {"name": "_quantity", "type": "uint256"},
      {"name": "_pricePerQuintal", "type": "uint256"}
    ],
    "name": "registerProduct",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "_productId", "type": "uint256"}],
    "name": "getProductDetails",
    "outputs": [
      {"name": "id", "type": "uint256"},
      {"name": "name", "type": "string"},
      {"name": "farmer", "type": "address"},
      {"name": "currentOwner", "type": "address"},
      {"name": "status", "type": "uint8"},
      {"name": "registrationDate", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Ganache default address
const GANACHE_NETWORK_ID = '1337';
const GANACHE_CHAIN_ID = '0x539'; // 1337 in hex
const CONTRACT_ADDRESS = '0x...'; // Deploy and add your contract address

export class BlockchainService {
  private web3: Web3 | null = null;
  private contract: any = null;
  private account: string | null = null;

  async init() {
    try {
      // Check if MetaMask is installed
      const provider = await detectEthereumProvider();
      
      if (!provider) {
        throw new Error('Please install MetaMask to use blockchain features');
      }

      // Initialize Web3
      this.web3 = new Web3(provider as any);
      
      // Check if on correct network (Ganache)
      const networkId = await this.web3.eth.net.getId();
      if (networkId.toString() !== GANACHE_NETWORK_ID) {
        await this.switchToGanache();
      }

      // Request account access
      const accounts = await this.web3.eth.requestAccounts();
      this.account = accounts[0];

      // Initialize contract
      this.contract = new this.web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

      console.log('✅ Blockchain connected:', this.account);
      return true;
    } catch (error) {
      console.error('❌ Blockchain init error:', error);
      return false;
    }
  }

  async switchToGanache() {
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: GANACHE_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // If Ganache not added, add it
      if (switchError.code === 4902) {
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: GANACHE_CHAIN_ID,
            chainName: 'Ganache',
            rpcUrls: ['http://127.0.0.1:7545'], // Default Ganache GUI port
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            }
          }],
        });
      }
    }
  }

  async registerProductOnChain(
    name: string, 
    gpsHash: string, 
    quantity: number, 
    price: number
  ) {
    if (!this.contract || !this.account) {
      throw new Error('Blockchain not initialized');
    }

    try {
      const result = await this.contract.methods
        .registerProduct(name, gpsHash, quantity, price)
        .send({ 
          from: this.account,
          gas: 3000000 // Adjust gas as needed
        });

      return {
        success: true,
        productId: result.events.ProductRegistered.returnValues.productId,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber
      };
    } catch (error: any) {
      console.error('❌ Register on chain error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getProductFromChain(productId: number) {
    if (!this.contract) {
      throw new Error('Blockchain not initialized');
    }

    try {
      const product = await this.contract.methods
        .getProductDetails(productId)
        .call();
      
      return product;
    } catch (error) {
      console.error('❌ Get product error:', error);
      return null;
    }
  }

  getAccount() {
    return this.account;
  }

  async signMessage(message: string) {
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
}

export const blockchainService = new BlockchainService();