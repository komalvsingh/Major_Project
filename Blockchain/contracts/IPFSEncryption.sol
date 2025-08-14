// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./RoleManagement.sol";

contract IPFSEncryption {
    RoleManagement public roleManager;
    
    struct EncryptedDocument {
        string ipfsHash;
        string encryptedKey; // Encrypted symmetric key
        address owner;
        uint256 timestamp;
        mapping(address => bool) authorizedViewers;
    }
    
    mapping(string => EncryptedDocument) public documents;
    mapping(address => string[]) public userDocuments;
    
    event DocumentStored(string indexed ipfsHash, address indexed owner);
    event AccessGranted(string indexed ipfsHash, address indexed viewer);
    event AccessRevoked(string indexed ipfsHash, address indexed viewer);
    
    modifier onlyOwner(string memory _ipfsHash) {
        require(documents[_ipfsHash].owner == msg.sender, "Only document owner");
        _;
    }
    
    modifier onlyAuthorized(string memory _ipfsHash) {
        require(
            documents[_ipfsHash].owner == msg.sender ||
            documents[_ipfsHash].authorizedViewers[msg.sender] ||
            roleManager.checkRole(msg.sender, RoleManagement.Role.ADMIN) ||
            roleManager.checkRole(msg.sender, RoleManagement.Role.DAO_REVIEWER),
            "Unauthorized access"
        );
        _;
    }
    
    constructor(address _roleManager) {
        roleManager = RoleManagement(_roleManager);
    }
    
    function storeEncryptedDocument(
        string memory _ipfsHash,
        string memory _encryptedKey
    ) external {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(documents[_ipfsHash].owner == address(0), "Document already exists");
        
        EncryptedDocument storage doc = documents[_ipfsHash];
        doc.ipfsHash = _ipfsHash;
        doc.encryptedKey = _encryptedKey;
        doc.owner = msg.sender;
        doc.timestamp = block.timestamp;
        
        userDocuments[msg.sender].push(_ipfsHash);
        
        emit DocumentStored(_ipfsHash, msg.sender);
    }
    
    function grantAccess(string memory _ipfsHash, address _viewer) external onlyOwner(_ipfsHash) {
        documents[_ipfsHash].authorizedViewers[_viewer] = true;
        emit AccessGranted(_ipfsHash, _viewer);
    }
    
    function revokeAccess(string memory _ipfsHash, address _viewer) external onlyOwner(_ipfsHash) {
        documents[_ipfsHash].authorizedViewers[_viewer] = false;
        emit AccessRevoked(_ipfsHash, _viewer);
    }
    
    function getEncryptedKey(string memory _ipfsHash) external view onlyAuthorized(_ipfsHash) returns (string memory) {
        require(documents[_ipfsHash].owner != address(0), "Document does not exist");
        return documents[_ipfsHash].encryptedKey;
    }
    
    function getDocumentInfo(string memory _ipfsHash) external view returns (
        address owner,
        uint256 timestamp,
        bool hasAccess
    ) {
        EncryptedDocument storage doc = documents[_ipfsHash];
        require(doc.owner != address(0), "Document does not exist");
        
        bool access = (doc.owner == msg.sender || 
                      doc.authorizedViewers[msg.sender] ||
                      roleManager.checkRole(msg.sender, RoleManagement.Role.ADMIN) ||
                      roleManager.checkRole(msg.sender, RoleManagement.Role.DAO_REVIEWER));
        
        return (doc.owner, doc.timestamp, access);
    }
    
    function getUserDocuments(address _user) external view returns (string[] memory) {
        return userDocuments[_user];
    }
    
    function hasAccess(string memory _ipfsHash, address _user) external view returns (bool) {
        EncryptedDocument storage doc = documents[_ipfsHash];
        return (doc.owner == _user || 
                doc.authorizedViewers[_user] ||
                roleManager.checkRole(_user, RoleManagement.Role.ADMIN) ||
                roleManager.checkRole(_user, RoleManagement.Role.DAO_REVIEWER));
    }
    
    // Batch grant access for multiple viewers (useful for DAO reviewers)
    function batchGrantAccess(string memory _ipfsHash, address[] memory _viewers) external onlyOwner(_ipfsHash) {
        for (uint256 i = 0; i < _viewers.length; i++) {
            documents[_ipfsHash].authorizedViewers[_viewers[i]] = true;
            emit AccessGranted(_ipfsHash, _viewers[i]);
        }
    }
}