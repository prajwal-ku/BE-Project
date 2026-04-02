const KrishiSetu = artifacts.require("KrishiSetu");

contract("KrishiSetu", (accounts) => {
  const farmer = accounts[0];
  const distributor = accounts[1];
  
  let contract;
  
  beforeEach(async () => {
    contract = await KrishiSetu.new({ from: farmer });
  });
  
  it("should register a product", async () => {
    const result = await contract.registerProduct(
      "Organic Rice",
      100,
      2000,
      "Farm Location",
      "Cereals",
      { from: farmer }
    );
    
    const productId = result.logs[0].args.productId;
    assert.equal(productId, 1);
    
    const product = await contract.products(productId);
    assert.equal(product.name, "Organic Rice");
    assert.equal(product.quantity, 100);
    assert.equal(product.price, 2000);
    assert.equal(product.farmer, farmer);
    assert.equal(product.isAvailable, true);
  });
  
  it("should purchase a product", async () => {
    await contract.registerProduct(
      "Organic Rice",
      100,
      2000,
      "Farm Location",
      "Cereals",
      { from: farmer }
    );
    
    const price = 2000;
    const quantity = 10;
    const totalPrice = price * quantity;
    
    const result = await contract.purchaseProduct(
      1,
      quantity,
      { from: distributor, value: totalPrice }
    );
    
    const product = await contract.products(1);
    assert.equal(product.quantity, 90);
    assert.equal(product.currentOwner, distributor);
  });
});