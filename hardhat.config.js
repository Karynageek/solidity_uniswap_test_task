require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const KOVAN_RPC_URL = process.env.KOVAN_RPC_URL
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
PRIVATE_KEY_TESTNET = process.env.PRIVATE_KEY_TESTNET

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: "https://bsc-dataseed.binance.org/",
      }
    },
    kovan: {
      url: KOVAN_RPC_URL,
      accounts: {
        mnemonic: PRIVATE_KEY_TESTNET,
      },
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  paths: {
    deploy: 'deploy',
    deployments: 'client/packages/contracts/src/deployments',
    artifacts: 'client/packages/contracts/src/deployments/artifacts',
    imports: 'imports'
  },
  solidity: {
    compilers: [
      {
        version: "0.8.5",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
    ],

  },
  mocha: {
    timeout: 100000
  }
}