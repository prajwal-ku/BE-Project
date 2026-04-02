import Web3 from 'web3';
import KrishiSetuABI from '../blockchain/build/contracts/KrishiSetu.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

export interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  farmer: string;
  currentOwner: string;
  location: string;
  timestamp: number;
}

class BlockchainService {
  private web3: Web3 | null = null;
  private contract: any = null;
  private account: string | null = null;

  async init(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        console.warn('MetaMask not available');
        return false;
      }

      this.web3 = new Web3(window.ethereum);
      const accounts = await this.web3.eth.requestAccounts();
      this.account = accounts[0];

      if (CONTRACT_ADDRESS && KrishiSetuABI.abi) {
        this.contract = new this.web3.eth.Contract(KrishiSetuABI.abi, CONTRACT_ADDRESS);
        console.log('✅ Blockchain connected:', this.account);
        return true;
      }
      
      console.warn('⚠️ Contract address not configured');
      return false;
    } catch (error) {
      console.error('Blockchain init error:', error);
      return false;
    }
  }

  async registerProduct(
    name: string,
    quantity: number,
    price: number,
    location: string,
    category: string
  ): Promise<{ success: boolean; productId?: number; error?: string }> {
    if (!this.contract || !this.account) {
      return { success: false, error: 'Contract not initialized' };
    }

    try {
      const tx = await this.contract.methods
        .registerProduct(name, quantity, price, location, category)
        .send({ from: this.account, gas: 500000 });

      const productId = tx.events.ProductRegistered.returnValues.productId;
      
      return {
        success: true,
        productId: parseInt(productId)
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  async getProduct(productId: number): Promise<Product | null> {
    if (!this.contract) return null;

    try {
      const details = await this.contract.methods.getProductDetails(productId).call();
      return {
        id: productId,
        name: details[0],
        quantity: parseInt(details[1]),
        price: parseInt(details[2]),
        farmer: details[3],
        currentOwner: details[4],
        location: details[5],
        timestamp: parseInt(details[6])
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
    return this.contract !== null;
  }
}

export const blockchainService = new BlockchainService();
