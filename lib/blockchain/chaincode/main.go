package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type AgriSupplyChain struct {
	contractapi.Contract
}

type Product struct {
	ID                    string    `json:"id"`
	ProductName           string    `json:"productName"`
	Category              string    `json:"category"`
	HarvestDate           string    `json:"harvestDate"`
	FarmerID              string    `json:"farmerId"`
	QualityMetrics        string    `json:"qualityMetrics"`
	OrganicCertifications string    `json:"organicCertifications"`
	QRCodeHash            string    `json:"qrCodeHash"`
	CreatedAt             time.Time `json:"createdAt"`
	Description           string    `json:"description"`
	BatchNumber           string    `json:"batchNumber"`
	CurrentOwner          string    `json:"currentOwner"`
}

type Transaction struct {
	ID                  string    `json:"id"`
	ProductID           string    `json:"productId"`
	FromUserID          string    `json:"fromUserId"`
	ToUserID            string    `json:"toUserId"`
	TransactionType     string    `json:"transactionType"`
	Price               float64   `json:"price"`
	Quantity            float64   `json:"quantity"`
	TransactionHash     string    `json:"transactionHash"`
	TransactionTime     time.Time `json:"transactionTime"`
	Location            string    `json:"location"`
	Notes               string    `json:"notes"`
	QualityCheckPassed  bool      `json:"qualityCheckPassed"`
}

func (s *AgriSupplyChain) CreateProduct(ctx contractapi.TransactionContextInterface, productData string) error {
	var product Product
	if err := json.Unmarshal([]byte(productData), &product); err != nil {
		return fmt.Errorf("failed to unmarshal product data: %v", err)
	}

	product.CreatedAt = time.Now()
	product.CurrentOwner = product.FarmerID

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(product.ID, productJSON)
}

func (s *AgriSupplyChain) GetProduct(ctx contractapi.TransactionContextInterface, productID string) (*Product, error) {
	productJSON, err := ctx.GetStub().GetState(productID)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if productJSON == nil {
		return nil, fmt.Errorf("product %s does not exist", productID)
	}

	var product Product
	err = json.Unmarshal(productJSON, &product)
	if err != nil {
		return nil, err
	}

	return &product, nil
}

func (s *AgriSupplyChain) CreateTransaction(ctx contractapi.TransactionContextInterface, transactionData string) error {
	var transaction Transaction
	if err := json.Unmarshal([]byte(transactionData), &transaction); err != nil {
		return fmt.Errorf("failed to unmarshal transaction data: %v", err)
	}

	transaction.TransactionTime = time.Now()
	transaction.TransactionHash = ctx.GetStub().GetTxID()

	transactionJSON, err := json.Marshal(transaction)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(transaction.ID, transactionJSON)
}

func (s *AgriSupplyChain) GetProductHistory(ctx contractapi.TransactionContextInterface, productID string) ([]*Transaction, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var transactions []*Transaction
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var transaction Transaction
		if err := json.Unmarshal(queryResponse.Value, &transaction); err == nil {
			if transaction.ProductID == productID {
				transactions = append(transactions, &transaction)
			}
		}
	}

	return transactions, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&AgriSupplyChain{})
	if err != nil {
		log.Panicf("Error creating agri-supply-chain chaincode: %v", err)
	}

	if err := chaincode.Start(); err != nil {
		log.Panicf("Error starting agri-supply-chain chaincode: %v", err)
	}
}