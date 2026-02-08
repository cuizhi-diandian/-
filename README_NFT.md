# Voice NFT on 0G Testnet

This project allows minting Voice IDs as NFTs on the 0G Galileo Testnet.

## Prerequisites

1.  **Node.js**: Installed.
2.  **MetaMask**: Installed in your browser.
3.  **0G Testnet Tokens**: You need tokens to deploy and mint. Get them from the [0G Faucet](https://faucet.0g.ai/).

## Deployment (One-time setup)

To enable minting, you need to deploy the Smart Contract first.

1.  Open `blockchain/hardhat.config.js` and `blockchain/.env`.
2.  Create a `.env` file in `blockchain` folder with your private key:
    ```
    PRIVATE_KEY=your_private_key_here
    ```
3.  Install dependencies in `blockchain` folder:
    ```bash
    cd blockchain
    npm install
    ```
4.  Deploy the contract:
    ```bash
    npx hardhat run scripts/deploy.js --network 0g-galileo
    ```
5.  Copy the deployed contract address from the output (e.g., `VoiceNFT deployed to 0x...`).
6.  Open `frontend/src/config/web3.ts` and replace `VOICE_NFT_ADDRESS` with your new contract address.

## Usage

1.  Start the frontend:
    ```bash
    cd frontend
    npm run dev
    ```
2.  Go to "My Voices" (or create one).
3.  Click on a voice to see details.
4.  You will see a "Mint Voice NFT on 0G Testnet" card.
5.  Click "Mint NFT" and confirm the transaction in MetaMask.

## Network Info

-   **Network Name**: 0G Galileo Testnet
-   **RPC URL**: https://evmrpc-testnet.0g.ai
-   **Chain ID**: 16601
-   **Currency**: 0G
