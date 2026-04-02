pragma solidity 0.5.0;

contract KrishiSetu {
    uint256 public productCounter;
    
    // Product structure
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
    
    // Product history structure
    struct ProductHistory {
        address[] owners;
        string[] actions;
        uint256[] timestamps;
    }
    
    // Mappings
    mapping(uint256 => Product) public products;
    mapping(address => uint256[]) public farmerProducts;
    mapping(uint256 => ProductHistory) public productHistory;
    
    // Events
    event ProductRegistered(uint256 indexed productId, address indexed farmer, string productName, uint256 quantity, uint256 price);
    event ProductPurchased(uint256 indexed productId, address indexed distributor, uint256 quantity, uint256 amount);
    event OwnershipTransferred(uint256 indexed productId, address indexed from, address indexed to, string action);
    
    // Register a new product
    function registerProduct(
        string memory _name,
        uint256 _quantity,
        uint256 _price,
        string memory _location,
        string memory _category
    ) public returns (uint256) {
        productCounter++;
        
        products[productCounter] = Product({
            name: _name,
            quantity: _quantity,
            price: _price,
            farmer: msg.sender,
            currentOwner: msg.sender,
            location: _location,
            category: _category,
            timestamp: now,
            isAvailable: true
        });
        
        farmerProducts[msg.sender].push(productCounter);
        
        // Initialize history
        ProductHistory storage history = productHistory[productCounter];
        history.owners.push(msg.sender);
        history.actions.push("Registered by Farmer");
        history.timestamps.push(now);
        
        emit ProductRegistered(productCounter, msg.sender, _name, _quantity, _price);
        emit OwnershipTransferred(productCounter, address(0), msg.sender, "Registered");
        
        return productCounter;
    }
    
    // Purchase a product
    function purchaseProduct(uint256 _productId, uint256 _quantity) public payable {
        Product storage product = products[_productId];
        require(product.isAvailable, "Product not available");
        require(product.quantity >= _quantity, "Insufficient quantity");
        require(msg.value >= product.price * _quantity, "Insufficient payment");
        
        // Transfer payment to farmer
        address payable farmer = address(uint160(product.farmer));
        farmer.transfer(msg.value);
        
        // Update product
        product.quantity -= _quantity;
        product.currentOwner = msg.sender;
        if (product.quantity == 0) {
            product.isAvailable = false;
        }
        
        // Update history
        ProductHistory storage history = productHistory[_productId];
        history.owners.push(msg.sender);
        history.actions.push("Purchased by Distributor");
        history.timestamps.push(now);
        
        emit ProductPurchased(_productId, msg.sender, _quantity, msg.value);
        emit OwnershipTransferred(_productId, product.farmer, msg.sender, "Purchased");
    }
    
    // Get all available products
    function getAvailableProducts() public view returns (uint256[] memory) {
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
    
    // Get products by farmer
    function getFarmerProducts(address _farmer) public view returns (uint256[] memory) {
        return farmerProducts[_farmer];
    }
    
    // Get product details
    function getProductDetails(uint256 _productId) public view returns (
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
    
    // Get product history
    function getProductHistory(uint256 _productId) public view returns (
        address[] memory,
        string[] memory,
        uint256[] memory
    ) {
        ProductHistory storage history = productHistory[_productId];
        return (
            history.owners,
            history.actions,
            history.timestamps
        );
    }
    
    // Get all products
    function getAllProducts() public view returns (uint256[] memory) {
        uint256[] memory allProducts = new uint256[](productCounter);
        for (uint256 i = 1; i <= productCounter; i++) {
            allProducts[i-1] = i;
        }
        return allProducts;
    }
    
    // Get product owner
    function getProductOwner(uint256 _productId) public view returns (address) {
        return products[_productId].currentOwner;
    }
    
    // Check if product is available
    function isProductAvailable(uint256 _productId) public view returns (bool) {
        return products[_productId].isAvailable;
    }
}