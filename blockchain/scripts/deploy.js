const hre = require("hardhat");

async function main() {
  const VoiceNFT = await hre.ethers.getContractFactory("VoiceNFT");
  const voiceNFT = await VoiceNFT.deploy();

  await voiceNFT.waitForDeployment();

  console.log(`VoiceNFT deployed to ${voiceNFT.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
