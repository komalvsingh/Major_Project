// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./RoleManagement.sol";

contract ScholarshipRegistry {
    RoleManagement public roleManager;
    
    enum Status { PENDING, AI_VERIFIED, DAO_REVIEW, APPROVED, REJECTED, DISBURSED }
    
    struct Application {
        uint256 id;
        address applicant;
        string personalDataHash; // IPFS hash for encrypted personal data
        string[] documentHashes; // IPFS hashes for encrypted documents
        Status status;
        uint256 requestedAmount;
        uint256 timestamp;
        bool aiFlagged;
        string aiRemarks;
    }
    
    mapping(uint256 => Application) public applications;
    mapping(address => uint256[]) public applicantApplications;
    uint256 public applicationCounter;
    
    event ApplicationSubmitted(uint256 indexed appId, address indexed applicant);
    event StatusUpdated(uint256 indexed appId, Status newStatus);
    event AIFlagged(uint256 indexed appId, string remarks);
    
    modifier onlyStudent() {
        require(roleManager.checkRole(msg.sender, RoleManagement.Role.STUDENT), "Only students can apply");
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            roleManager.checkRole(msg.sender, RoleManagement.Role.ADMIN) ||
            roleManager.checkRole(msg.sender, RoleManagement.Role.DAO_REVIEWER) ||
            roleManager.checkRole(msg.sender, RoleManagement.Role.FINANCE_BUREAU),
            "Unauthorized"
        );
        _;
    }
    
    constructor(address _roleManager) {
        roleManager = RoleManagement(_roleManager);
    }
    
    function applyForScholarship(
        string memory _personalDataHash,
        string[] memory _documentHashes,
        uint256 _requestedAmount
    ) external onlyStudent returns (uint256) {
        applicationCounter++;
        
        Application storage newApp = applications[applicationCounter];
        newApp.id = applicationCounter;
        newApp.applicant = msg.sender;
        newApp.personalDataHash = _personalDataHash;
        newApp.documentHashes = _documentHashes;
        newApp.status = Status.PENDING;
        newApp.requestedAmount = _requestedAmount;
        newApp.timestamp = block.timestamp;
        
        applicantApplications[msg.sender].push(applicationCounter);
        
        emit ApplicationSubmitted(applicationCounter, msg.sender);
        return applicationCounter;
    }
    
    function updateStatus(uint256 _appId, Status _newStatus) external onlyAuthorized {
        require(applications[_appId].id != 0, "Application does not exist");
        applications[_appId].status = _newStatus;
        emit StatusUpdated(_appId, _newStatus);
    }
    
    function flagByAI(uint256 _appId, string memory _remarks) external onlyAuthorized {
        require(applications[_appId].id != 0, "Application does not exist");
        applications[_appId].aiFlagged = true;
        applications[_appId].aiRemarks = _remarks;
        applications[_appId].status = Status.DAO_REVIEW;
        emit AIFlagged(_appId, _remarks);
    }
    
    function getApplication(uint256 _appId) external view returns (Application memory) {
        return applications[_appId];
    }
    
    function getMyApplications() external view returns (uint256[] memory) {
        return applicantApplications[msg.sender];
    }
    
    function getAllPendingApplications() external view onlyAuthorized returns (uint256[] memory) {
        uint256[] memory pending = new uint256[](applicationCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= applicationCounter; i++) {
            if (applications[i].status == Status.PENDING || applications[i].status == Status.DAO_REVIEW) {
                pending[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pending[i];
        }
        
        return result;
    }
}