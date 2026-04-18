import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';

// Full ABI from your compiled KrishiSetu contract
const contractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "productId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "farmer", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "productName", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "quantity", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" }
    ],
    "name": "ProductRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "productId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "distributor", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "quantity", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "ProductPurchased",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "getAllProducts",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAvailableProducts",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_farmer", "type": "address" }],
    "name": "getFarmerProducts",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_productId", "type": "uint256" }],
    "name": "getProductDetails",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" },
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "address", "name": "", "type": "address" },
      { "internalType": "address", "name": "", "type": "address" },
      { "internalType": "string", "name": "", "type": "string" },
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "productCounter",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "products",
    "outputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "uint256", "name": "quantity", "type": "uint256" },
      { "internalType": "uint256", "name": "price", "type": "uint256" },
      { "internalType": "address", "name": "farmer", "type": "address" },
      { "internalType": "address", "name": "currentOwner", "type": "address" },
      { "internalType": "string", "name": "location", "type": "string" },
      { "internalType": "string", "name": "category", "type": "string" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "internalType": "bool", "name": "isAvailable", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "uint256", "name": "_quantity", "type": "uint256" },
      { "internalType": "uint256", "name": "_price", "type": "uint256" },
      { "internalType": "string", "name": "_location", "type": "string" },
      { "internalType": "string", "name": "_category", "type": "string" }
    ],
    "name": "registerProduct",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_productId", "type": "uint256" },
      { "internalType": "uint256", "name": "_quantity", "type": "uint256" }
    ],
    "name": "purchaseProduct",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

const GANACHE_CONFIG = {
  networkId: '1337',
  chainId: '0x539',
  rpcUrl: 'http://127.0.0.1:7545',
  chainName: 'Ganache'
};

let CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x17132d5b75Aa12A67881895573d043961349ba55';

export interface RegistrationResult {
  success: boolean;
  productId?: number;
  transactionHash?: string;
  blockNumber?: number;
  error?: string;
}

export interface PurchaseResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

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
  location: string;
  category: string;
}

export interface BlockchainTransfer {
  productId: number;
  from: string;
  to: string;
  role: string;
  timestamp: number;
}

class BlockchainService {
  private web3: any = null;
  private contract: any = null;
  private account: string | null = null;
  private initialized: boolean = false;

  async init(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      const provider = await detectEthereumProvider();
      if (!provider) {
        console.warn('MetaMask not installed');
        return false;
      }

      this.web3 = new Web3(provider);
      
      // Check network
      const networkId = await this.web3.eth.net.getId();
      if (networkId.toString() !== GANACHE_CONFIG.networkId) {
        await this.switchToGanache();
      }

      const accounts = await this.web3.eth.requestAccounts();
      this.account = accounts[0];

      // Get contract address from localStorage or env
      const savedAddress = localStorage.getItem('contractAddress');
      if (savedAddress && savedAddress !== '0x...') {
        CONTRACT_ADDRESS = savedAddress;
      }

      if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x...') {
        this.contract = new this.web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
        this.initialized = true;
        console.log('✅ Blockchain connected:', this.account);
        console.log('✅ Contract address:', CONTRACT_ADDRESS);
        return true;
      }
      
      console.warn('⚠️ Contract address not configured');
      return false;
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
    quantity: number,
    price: number,
    location: string,
    category: string
  ): Promise<RegistrationResult> {
    if (!this.contract || !this.account) {
      return { success: false, error: 'Contract not initialized' };
    }

    try {
      const tx = await this.contract.methods
        .registerProduct(name, quantity, price, location, category)
        .send({ from: this.account, gas: 500000 });

      const productId = tx.events?.ProductRegistered?.returnValues?.productId;
      
      return {
        success: true,
        productId: parseInt(productId),
        transactionHash: tx.transactionHash,
        blockNumber: tx.blockNumber
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  // THIS IS THE PURCHASE METHOD - WAS MISSING
  async purchaseProduct(
    productId: number,
    quantity: number,
    pricePerQuint: number
  ): Promise<PurchaseResult> {
    if (!this.contract || !this.account) {
      return { success: false, error: 'Contract not initialized' };
    }

    try {
      const totalPrice = pricePerQuint * quantity;
      const weiAmount = this.web3.utils.toWei(totalPrice.toString(), 'ether');
      
      console.log(`🛒 Purchasing product ${productId}: ${quantity} q @ ₹${pricePerQuint}/q = ₹${totalPrice}`);
      console.log(`💰 Sending ${weiAmount} wei (${totalPrice} ETH)`);
      
      const tx = await this.contract.methods
        .purchaseProduct(productId, quantity)
        .send({
          from: this.account,
          value: weiAmount,
          gas: 500000
        });
      
      console.log('✅ Purchase transaction successful:', tx.transactionHash);
      
      return {
        success: true,
        transactionHash: tx.transactionHash
      };
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      
      if (error.code === 4001) {
        return { success: false, error: 'Transaction rejected by user' };
      }
      
      return { success: false, error: error.message };
    }
  }

  async getProduct(productId: number): Promise<BlockchainProduct | null> {
    if (!this.contract) return null;

    try {
      const details = await this.contract.methods.getProductDetails(productId).call();
      return {
        id: productId,
        name: details[0],
        farmer: details[3],
        currentOwner: details[4],
        status: 0,
        quantity: parseInt(details[1]),
        pricePerQuintal: parseInt(details[2]),
        registrationDate: parseInt(details[6]),
        gpsHash: details[5],
        location: details[5],
        category: ''
      };
    } catch (error) {
      console.error('Get product error:', error);
      return null;
    }
  }

  async getFarmerProducts(farmerAddress: string): Promise<number[]> {
    if (!this.contract) return [];

    try {
      const products = await this.contract.methods.getFarmerProducts(farmerAddress).call();
      return products.map((id: any) => parseInt(id));
    } catch (error) {
      console.error('Get farmer products error:', error);
      return [];
    }
  }

  async getAllProducts(): Promise<number[]> {
    if (!this.contract) return [];

    try {
      const products = await this.contract.methods.getAllProducts().call();
      return products.map((id: any) => parseInt(id));
    } catch (error) {
      console.error('Get all products error:', error);
      return [];
    }
  }

  getAccount(): string | null {
    return this.account;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  setContractAddress(address: string) {
    CONTRACT_ADDRESS = address;
    localStorage.setItem('contractAddress', address);
    if (this.web3 && contractABI) {
      this.contract = new this.web3.eth.Contract(contractABI, address);
    }
  }

  getContractAddress(): string {
    return CONTRACT_ADDRESS;
  }
}

export const blockchainService = new BlockchainService();