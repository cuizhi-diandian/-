import React, { useState } from 'react';
import { Button, message, Card, Typography } from 'antd';
import { ethers } from 'ethers';
import VoiceNFTArtifact from '../contracts/VoiceNFT.json';
import { VOICE_NFT_ADDRESS, CHAIN_ID, CHAIN_CONFIG } from '../config/web3';

const { Text } = Typography;

interface VoiceNFTMintProps {
  voiceId: string;
  embeddingHash: string;
}

const VoiceNFTMint: React.FC<VoiceNFTMintProps> = ({ voiceId, embeddingHash }) => {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleMint = async () => {
    // @ts-ignore
    if (!window.ethereum) {
      message.error("Please install MetaMask!");
      return;
    }

    setLoading(true);
    try {
      // @ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Check network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== CHAIN_ID) {
        try {
          // @ts-ignore
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CHAIN_CONFIG.chainId }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            try {
              // @ts-ignore
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [CHAIN_CONFIG],
              });
            } catch (addError) {
              message.error("Failed to add network");
              setLoading(false);
              return;
            }
          } else {
            message.error("Failed to switch network");
            setLoading(false);
            return;
          }
        }
      }

      // Check if contract address is set
      if (VOICE_NFT_ADDRESS === "0x0000000000000000000000000000000000000000") {
         message.error("Contract not deployed yet. Please deploy the contract first.");
         setLoading(false);
         return;
      }

      const contract = new ethers.Contract(VOICE_NFT_ADDRESS, VoiceNFTArtifact.abi, signer);

      // Generate a simple metadata URI (in production, upload to IPFS/Arweave/0G Storage)
      const metadata = {
        name: `Voice ${voiceId}`,
        description: "Voice NFT on 0G Testnet",
        attributes: [
            { trait_type: "Voice ID", value: voiceId },
            { trait_type: "Embedding Hash", value: embeddingHash }
        ]
      };
      // For now, we just pass a data URI or empty string as user didn't specify storage
      const tokenURI = "data:application/json;base64," + btoa(JSON.stringify(metadata));

      const tx = await contract.mint(await signer.getAddress(), voiceId, embeddingHash, tokenURI);
      message.info("Transaction submitted: " + tx.hash);
      
      await tx.wait();
      setTxHash(tx.hash);
      message.success("Voice NFT Minted Successfully!");

    } catch (error: any) {
      console.error(error);
      message.error("Minting failed: " + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Mint Voice NFT on 0G Testnet" style={{ marginTop: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <Text strong>Voice ID:</Text> <Text code>{voiceId}</Text>
        <br />
        <Text strong>Embedding Hash:</Text> <Text code>{embeddingHash}</Text>
      </div>
      <Button type="primary" onClick={handleMint} loading={loading}>
        Mint NFT
      </Button>
      {txHash && (
        <div style={{ marginTop: 10 }}>
          <Text type="success">Minted! </Text>
          <a href={`${CHAIN_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
            View on Explorer
          </a>
        </div>
      )}
    </Card>
  );
};

export default VoiceNFTMint;
