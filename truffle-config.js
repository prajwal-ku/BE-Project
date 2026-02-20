/**
 * Use this file to configure your truffle project.
 * More information about configuration can be found at:
 * https://trufflesuite.com/docs/truffle/reference/configuration
 */

const path = require("path");

module.exports = {
  /**
   * Contracts directory
   */
  contracts_build_directory: path.join(__dirname, "app/lib/contracts"),

  /**
   * Contracts directory
   */
  contracts_directory: path.join(__dirname, "contracts"),

  /**
   * Networks configuration
   */
  networks: {
    // Local Ganache network
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 7545,            // Standard Ganache port (default: none)
      network_id: "*",       // Any network (default: none)
      gas: 6721975,          // Gas limit
      gasPrice: 20000000000, // 20 gwei
    },

    // Ganache UI network
    ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: 5777,
      gas: 6721975,
      gasPrice: 20000000000,
    },

    // Test network
    test: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
      gas: 6721975,
      gasPrice: 20000000000,
    }
  },

  /**
   * Compiler configuration
   */
  compilers: {
    solc: {
      version: "0.8.19",    // Match your contract version
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },

  /**
   * Truffle DB is disabled by default
   */
  db: {
    enabled: false
  }
};