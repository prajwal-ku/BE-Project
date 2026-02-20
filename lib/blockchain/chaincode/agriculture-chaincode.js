// lib/blockchain/chaincode/agriculture-chaincode.js
const { Contract } = require('fabric-contract-api');

class AgricultureChaincode extends Contract {
    
    // Initialize ledger
    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const initialProducts = [
            {
                id: 'prod1',
                name: 'Organic Tomatoes',
                type: 'vegetable',
                farmerId: 'farmer001',
                farmerName: 'John Doe',
                timestamp: new Date().toISOString()
            }
        ];

        for (let i = 0; i < initialProducts.length; i++) {
            await ctx.stub.putState('PROD' + i, Buffer.from(JSON.stringify(initialProducts[i])));
            console.info('Added <--> ', initialProducts[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    // Register a new product
    async registerProduct(ctx, productId, productData) {
        console.info('============= START : Register Product ===========');
        
        // Check if product already exists
        const productAsBytes = await ctx.stub.getState(productId);
        if (productAsBytes && productAsBytes.length > 0) {
            throw new Error(`Product ${productId} already exists`);
        }

        // Parse product data
        const product = JSON.parse(productData);
        
        // Add metadata
        product.registeredAt = new Date().toISOString();
        product.transactionId = ctx.stub.getTxID();
        
        // Store on blockchain
        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
        
        // Add to history
        await this.addToHistory(ctx, productId, 'REGISTERED', product);
        
        console.info('============= END : Register Product ===========');
        return JSON.stringify({
            success: true,
            productId: productId,
            transactionId: ctx.stub.getTxID(),
            message: 'Product registered successfully'
        });
    }

    // Get product by ID
    async getProduct(ctx, productId) {
        console.info('============= START : Get Product ===========');
        
        const productAsBytes = await ctx.stub.getState(productId);
        if (!productAsBytes || productAsBytes.length === 0) {
            throw new Error(`Product ${productId} does not exist`);
        }
        
        const product = JSON.parse(productAsBytes.toString());
        console.info('============= END : Get Product ===========');
        return JSON.stringify(product);
    }

    // Get product history
    async getProductHistory(ctx, productId) {
        console.info('============= START : Get Product History ===========');
        
        const iterator = await ctx.stub.getHistoryForKey(productId);
        const history = [];
        let result = await iterator.next();

        while (!result.done) {
            const historyItem = {
                txId: result.value.txId,
                timestamp: result.value.timestamp,
                value: JSON.parse(result.value.value.toString('utf8')),
                isDelete: result.value.isDelete
            };
            history.push(historyItem);
            result = await iterator.next();
        }

        await iterator.close();
        console.info('============= END : Get Product History ===========');
        return JSON.stringify(history);
    }

    // Transfer product ownership
    async transferProduct(ctx, productId, newOwnerId, newOwnerName) {
        console.info('============= START : Transfer Product ===========');
        
        const productAsBytes = await ctx.stub.getState(productId);
        if (!productAsBytes || productAsBytes.length === 0) {
            throw new Error(`Product ${productId} does not exist`);
        }

        const product = JSON.parse(productAsBytes.toString());
        
        // Update ownership
        const previousOwner = {
            id: product.ownerId,
            name: product.ownerName
        };
        
        product.ownerId = newOwnerId;
        product.ownerName = newOwnerName;
        product.previousOwners = product.previousOwners || [];
        product.previousOwners.push(previousOwner);
        product.lastTransferred = new Date().toISOString();

        // Save updated product
        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
        
        // Add to history
        await this.addToHistory(ctx, productId, 'TRANSFERRED', {
            from: previousOwner,
            to: { id: newOwnerId, name: newOwnerName }
        });

        console.info('============= END : Transfer Product ===========');
        return JSON.stringify({
            success: true,
            productId: productId,
            transactionId: ctx.stub.getTxID(),
            message: 'Product transferred successfully'
        });
    }

    // Get blockchain statistics
    async getStats(ctx) {
        console.info('============= START : Get Stats ===========');
        
        const iterator = await ctx.stub.getStateByRange('', '');
        let productCount = 0;
        let result = await iterator.next();

        while (!result.done) {
            productCount++;
            result = await iterator.next();
        }

        await iterator.close();
        
        const stats = {
            totalProducts: productCount,
            network: 'Agriculture Supply Chain',
            timestamp: new Date().toISOString()
        };

        console.info('============= END : Get Stats ===========');
        return JSON.stringify(stats);
    }

    // Helper function to add transaction to history
    async addToHistory(ctx, productId, action, data) {
        const historyKey = `HISTORY_${productId}_${ctx.stub.getTxID()}`;
        const historyItem = {
            productId: productId,
            action: action,
            data: data,
            timestamp: new Date().toISOString(),
            transactionId: ctx.stub.getTxID()
        };
        
        await ctx.stub.putState(historyKey, Buffer.from(JSON.stringify(historyItem)));
    }

    // Query products by owner
    async queryProductsByOwner(ctx, ownerId) {
        console.info('============= START : Query Products By Owner ===========');
        
        const queryString = {
            selector: {
                ownerId: ownerId
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = [];
        let result = await iterator.next();

        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            results.push(record);
            result = await iterator.next();
        }

        await iterator.close();
        console.info('============= END : Query Products By Owner ===========');
        return JSON.stringify(results);
    }
}

module.exports = AgricultureChaincode;