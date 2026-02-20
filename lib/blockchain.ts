import { ethers } from 'ethers';

// Ganache Configuration
export const GANACHE_CONFIG = {
  rpcUrl: 'http://localhost:8545',
  chainId: 1337,
  chainName: 'Ganache',
  symbol: 'ETH',
};

// Contract ABI (Simplified for your supply chain)
export const KRISHI_SETU_ABI = [
  // Events
  "event ProductRegistered(uint256 indexed productId, address indexed farmer, string productName, uint256 quantity, uint256 price)",
  "event ProductPurchased(uint256 indexed productId, address indexed distributor, uint256 quantity, uint256 amount)",
  "event ProductDelivered(uint256 indexed productId, address indexed retailer)",
  "event OwnershipTransferred(uint256 indexed productId, address indexed from, address indexed to, string action)",
  
  // Farmer Functions
  "function registerProduct(string memory _name, uint256 _quantity, uint256 _price, string memory _location, string memory _category) external returns (uint256)",
  "function getFarmerProducts(address _farmer) external view returns (uint256[] memory)",
  
  // Distributor Functions
  "function purchaseProduct(uint256 _productId, uint256 _quantity) external payable",
  "function getAvailableProducts() external view returns (uint256[] memory)",
  
  // Admin/Tracking Functions
  "function getProductDetails(uint256 _productId) external view returns (string memory, uint256, uint256, address, address, string memory, uint256)",
  "function getProductHistory(uint256 _productId) external view returns (address[] memory, string[] memory, uint256[] memory)",
  
  // Utility Functions
  "function getProductOwner(uint256 _productId) external view returns (address)",
  "function getProductStatus(uint256 _productId) external view returns (string memory)",
  "function getAllProducts() external view returns (uint256[] memory)",
];

// Contract Address (Update after deployment)
let contractAddress = '';

export const setContractAddress = (address: string) => {
  contractAddress = address;
  localStorage.setItem('contract_address', address);
};

export const getContractAddress = () => {
  return contractAddress || localStorage.getItem('contract_address') || '';
};

// Get Provider
export const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  return new ethers.providers.JsonRpcProvider(GANACHE_CONFIG.rpcUrl);
};

// Get Contract Instance
export const getContract = (withSigner = false) => {
  const provider = getProvider();
  const address = getContractAddress();
  
  if (!address) {
    console.warn('⚠️ Contract address not set. Please deploy contract first.');
    return null;
  }
  
  if (withSigner && window.ethereum) {
    const signer = provider.getSigner();
    return new ethers.Contract(address, KRISHI_SETU_ABI, signer);
  }
  
  return new ethers.Contract(address, KRISHI_SETU_ABI, provider);
};

// Connect Wallet
export const connectWallet = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      // Get network
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      
      // Check if on Ganache
      if (network.chainId !== GANACHE_CONFIG.chainId) {
        await switchToGanache();
      }
      
      return {
        address: accounts[0],
        network: network.name,
        chainId: network.chainId
      };
    } catch (error) {
      console.error('🔴 Wallet connection error:', error);
      throw error;
    }
  } else {
    throw new Error('Please install MetaMask or another Web3 wallet');
  }
};

// Switch to Ganache Network
export const switchToGanache = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${GANACHE_CONFIG.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // If network not added, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${GANACHE_CONFIG.chainId.toString(16)}`,
            chainName: GANACHE_CONFIG.chainName,
            rpcUrls: [GANACHE_CONFIG.rpcUrl],
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
            },
          }],
        });
      }
    }
  }
};

// Check if Wallet is Connected
export const checkWalletConnection = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts.length > 0 ? accounts[0] : null;
  }
  return null;
};

// Helper Functions
export const formatEther = (wei: ethers.BigNumberish) => {
  return ethers.utils.formatEther(wei);
};

export const parseEther = (eth: string) => {
  return ethers.utils.parseEther(eth);
};

// Listen to Events
export const setupEventListeners = (contract: ethers.Contract, callbacks: any) => {
  contract.on('ProductRegistered', (productId, farmer, productName, quantity, price, event) => {
    console.log('📝 Product Registered:', { productId, farmer, productName, quantity, price });
    callbacks.onProductRegistered?.({ productId, farmer, productName, quantity, price });
  });
  
  contract.on('ProductPurchased', (productId, distributor, quantity, amount, event) => {
    console.log('🛒 Product Purchased:', { productId, distributor, quantity, amount });
    callbacks.onProductPurchased?.({ productId, distributor, quantity, amount });
  });
  
  contract.on('OwnershipTransferred', (productId, from, to, action, event) => {
    console.log('🔄 Ownership Changed:', { productId, from, to, action });
    callbacks.onOwnershipTransferred?.({ productId, from, to, action });
  });
};