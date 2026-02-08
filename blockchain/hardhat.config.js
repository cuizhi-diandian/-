require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    "0g-galileo": {
      url: "https://evmrpc-testnet.0g.ai",
      chainId: 16601,
      accounts: [PRIVATE_KEY],
    },
  },
};
