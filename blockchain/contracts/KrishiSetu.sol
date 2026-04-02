pragma solidity 0.5.0;

contract KrishiSetu {
    uint256 public productCounter;
    
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
    
    event ProductRegistered(uint256 indexed productId, address indexed farmer, string productName, uint256 quantity, uint256 price);
    event ProductPurchased(uint256 indexed productId, address indexed distributor, uint256 quantity, uint256 amount);
    
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
        
        emit ProductRegistered(productCounter, msg.sender, _name, _quantity, _price);
        
        return productCounter;
    }
    
    function purchaseProduct(uint256 _productId, uint256 _quantity) public payable {
        Product storage product = products[_productId];
        require(product.isAvailable, "Product not available");
        require(product.quantity >= _quantity, "Insufficient quantity");
        require(msg.value >= product.price * _quantity, "Insufficient payment");
        
        address payable farmer = address(uint160(product.farmer));
        farmer.transfer(msg.value);
        
        product.quantity -= _quantity;
        product.currentOwner = msg.sender;
        if (product.quantity == 0) {
            product.isAvailable = false;
        }
        
        emit ProductPurchased(_productId, msg.sender, _quantity, msg.value);
    }
    
    function getAvailableProducts() public view returns (uint256[] memory) {
        uint256[] memory available = new uint256[](productCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= productCounter; i++) {
            if (products[i].isAvailable) {
                available[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = available[i];
        }
        
        return result;
    }
    
    function getFarmerProducts(address _farmer) public view returns (uint256[] memory) {
        return farmerProducts[_farmer];
    }
    
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
    
    function getAllProducts() public view returns (uint256[] memory) {
        uint256[] memory allProducts = new uint256[](productCounter);
        for (uint256 i = 1; i <= productCounter; i++) {
            allProducts[i-1] = i;
        }
        return allProducts;
    }
}
