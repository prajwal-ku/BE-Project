// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract KrishiSetu {
    struct Product {
        string name;
        uint256 quantity;
        uint256 price;
        address farmer;
        address currentOwner;
        string location;
        string category;
        uint256 timestamp;
        bool isAvailable;
    }
    
    mapping(uint256 => Product) public products;
    mapping(address => uint256[]) public farmerProducts;
    mapping(uint256 => address[]) public productHistory;
    mapping(uint256 => string[]) public productActions;
    mapping(uint256 => uint256[]) public productTimestamps;
    
    uint256 public productCounter;
    
    event ProductRegistered(uint256 indexed productId, address indexed farmer, string productName, uint256 quantity, uint256 price);
    event ProductPurchased(uint256 indexed productId, address indexed distributor, uint256 quantity, uint256 amount);
    event ProductDelivered(uint256 indexed productId, address indexed retailer);
    event OwnershipTransferred(uint256 indexed productId, address indexed from, address indexed to, string action);
    
    // Farmer: Register product
    function registerProduct(
        string memory _name,
        uint256 _quantity,
        uint256 _price,
        string memory _location,
        string memory _category
    ) external returns (uint256) {
        productCounter++;
        
        products[productCounter] = Product({
            name: _name,
            quantity: _quantity,
            price: _price,
            farmer: msg.sender,
            currentOwner: msg.sender,
            location: _location,
            category: _category,
            timestamp: block.timestamp,
            isAvailable: true
        });
        
        farmerProducts[msg.sender].push(productCounter);
        
        // Add to history
        productHistory[productCounter].push(msg.sender);
        productActions[productCounter].push("Registered by Farmer");
        productTimestamps[productCounter].push(block.timestamp);
        
        emit ProductRegistered(productCounter, msg.sender, _name, _quantity, _price);
        emit OwnershipTransferred(productCounter, address(0), msg.sender, "Registered");
        
        return productCounter;
    }
    
    // Distributor: Purchase product
    function purchaseProduct(uint256 _productId, uint256 _quantity) external payable {
        Product storage product = products[_productId];
        require(product.isAvailable, "Product not available");
        require(product.quantity >= _quantity, "Insufficient quantity");
        require(msg.value >= product.price * _quantity, "Insufficient payment");
        
        // Transfer payment to farmer
        payable(product.farmer).transfer(msg.value);
        
        // Update product
        product.quantity -= _quantity;
        product.currentOwner = msg.sender;
        if (product.quantity == 0) {
            product.isAvailable = false;
        }
        
        // Add to history
        productHistory[_productId].push(msg.sender);
        productActions[_productId].push("Purchased by Distributor");
        productTimestamps[_productId].push(block.timestamp);
        
        emit ProductPurchased(_productId, msg.sender, _quantity, msg.value);
        emit OwnershipTransferred(_productId, product.farmer, msg.sender, "Purchased");
    }
    
    // View functions
    function getAvailableProducts() external view returns (uint256[] memory) {
        uint256[] memory available = new uint256[](productCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= productCounter; i++) {
            if (products[i].isAvailable) {
                available[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = available[i];
        }
        
        return result;
    }
    
    function getFarmerProducts(address _farmer) external view returns (uint256[] memory) {
        return farmerProducts[_farmer];
    }
    
    function getProductDetails(uint256 _productId) external view returns (
        string memory,
        uint256,
        uint256,
        address,
        address,
        string memory,
        uint256
    ) {
        Product memory product = products[_productId];
        return (
            product.name,
            product.quantity,
            product.price,
            product.farmer,
            product.currentOwner,
            product.location,
            product.timestamp
        );
    }
    
    function getProductHistory(uint256 _productId) external view returns (
        address[] memory,
        string[] memory,
        uint256[] memory
    ) {
        return (
            productHistory[_productId],
            productActions[_productId],
            productTimestamps[_productId]
        );
    }
    
    function getAllProducts() external view returns (uint256[] memory) {
        uint256[] memory allProducts = new uint256[](productCounter);
        for (uint256 i = 1; i <= productCounter; i++) {
            allProducts[i-1] = i;
        }
        return allProducts;
    }
}