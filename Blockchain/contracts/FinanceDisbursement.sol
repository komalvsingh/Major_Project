// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./RoleManagement.sol";
import "./ScholarshipRegistry.sol";

contract FinanceDisbursement {
    RoleManagement public roleManager;
    ScholarshipRegistry public scholarshipRegistry;
    
    struct Disbursement {
        uint256 appId;
        address recipient;
        uint256 amount;
        uint256 timestamp;
        bool isProcessed;
    }
    
    mapping(uint256 => Disbursement) public disbursements;
    mapping(address => uint256) public totalDisbursed;
    
    uint256 public totalFunds;
    uint256 public totalDisbursedAmount;
    
    event FundsDeposited(address indexed depositor, uint256 amount);
    event FundsReleased(uint256 indexed appId, address indexed recipient, uint256 amount);
    event EmergencyWithdrawal(address indexed admin, uint256 amount);
    
    modifier onlyFinanceBureau() {
        require(roleManager.checkRole(msg.sender, RoleManagement.Role.FINANCE_BUREAU), "Only finance bureau");
        _;
    }
    
    modifier onlyAdmin() {
        require(roleManager.checkRole(msg.sender, RoleManagement.Role.ADMIN), "Only admin");
        _;
    }
    
    constructor(address _roleManager, address _scholarshipRegistry) {
        roleManager = RoleManagement(_roleManager);
        scholarshipRegistry = ScholarshipRegistry(_scholarshipRegistry);
    }
    
    // Receive function to accept Ether
    receive() external payable {
        totalFunds += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }
    
    function depositFunds() external payable onlyFinanceBureau {
        require(msg.value > 0, "Amount must be greater than 0");
        totalFunds += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }
    
    function releaseFunds(uint256 _appId) external onlyFinanceBureau {
        ScholarshipRegistry.Application memory app = scholarshipRegistry.getApplication(_appId);
        
        require(app.id != 0, "Application does not exist");
        require(app.status == ScholarshipRegistry.Status.APPROVED, "Application not approved");
        require(!disbursements[_appId].isProcessed, "Funds already released");
        require(address(this).balance >= app.requestedAmount, "Insufficient contract balance");
        
        // Create disbursement record
        disbursements[_appId] = Disbursement({
            appId: _appId,
            recipient: app.applicant,
            amount: app.requestedAmount,
            timestamp: block.timestamp,
            isProcessed: true
        });
        
        // Update tracking
        totalDisbursed[app.applicant] += app.requestedAmount;
        totalDisbursedAmount += app.requestedAmount;
        
        // Update application status
        scholarshipRegistry.updateStatus(_appId, ScholarshipRegistry.Status.DISBURSED);
        
        // Transfer funds
        payable(app.applicant).transfer(app.requestedAmount);
        
        emit FundsReleased(_appId, app.applicant, app.requestedAmount);
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getDisbursementDetails(uint256 _appId) external view returns (Disbursement memory) {
        return disbursements[_appId];
    }
    
    function getUserDisbursedAmount(address _user) external view returns (uint256) {
        return totalDisbursed[_user];
    }
    
    // Emergency withdrawal function for admin
    function emergencyWithdraw(uint256 _amount) external onlyAdmin {
        require(_amount <= address(this).balance, "Insufficient balance");
        payable(msg.sender).transfer(_amount);
        emit EmergencyWithdrawal(msg.sender, _amount);
    }
    
    // Function to get total statistics
    function getContractStats() external view returns (
        uint256 balance,
        uint256 totalDeposited,
        uint256 totalDisbursedSoFar
    ) {
        return (address(this).balance, totalFunds, totalDisbursedAmount);
    }
}