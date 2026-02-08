// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VoiceNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    struct VoiceData {
        string voiceId;
        string embeddingHash;
    }

    mapping(uint256 => VoiceData) public voiceData;

    constructor() ERC721("VoiceNFT", "VNFT") Ownable(msg.sender) {}

    function mint(address to, string memory voiceId, string memory embeddingHash, string memory uri) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        voiceData[tokenId] = VoiceData(voiceId, embeddingHash);
        return tokenId;
    }

    // Function to retrieve voice data for a token
    function getVoiceData(uint256 tokenId) public view returns (string memory, string memory) {
        // We can't check existence easily with just mapping, but ownerOf will throw if token doesn't exist
        address owner = ownerOf(tokenId);
        require(owner != address(0), "Token does not exist");
        
        VoiceData memory data = voiceData[tokenId];
        return (data.voiceId, data.embeddingHash);
    }
}
