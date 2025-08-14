// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./RoleManagement.sol";
import "./ScholarshipRegistry.sol";

contract DocumentVerificationDAO {
    RoleManagement public roleManager;
    ScholarshipRegistry public scholarshipRegistry;
    
    struct Proposal {
        uint256 appId;
        uint256 yesVotes;
        uint256 noVotes;
        mapping(address => bool) hasVoted;
        bool isActive;
        uint256 deadline;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => bool) public proposalExists;
    
    uint256 public votingPeriod = 3 days;
    uint256 public minimumVotes = 3;
    
    event ProposalCreated(uint256 indexed appId, uint256 deadline);
    event VoteCast(uint256 indexed appId, address indexed voter, bool vote);
    event ProposalFinalized(uint256 indexed appId, bool approved);
    
    modifier onlyDAOReviewer() {
        require(roleManager.checkRole(msg.sender, RoleManagement.Role.DAO_REVIEWER), "Only DAO reviewers can vote");
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            roleManager.checkRole(msg.sender, RoleManagement.Role.ADMIN) ||
            roleManager.checkRole(msg.sender, RoleManagement.Role.DAO_REVIEWER),
            "Unauthorized"
        );
        _;
    }
    
    constructor(address _roleManager, address _scholarshipRegistry) {
        roleManager = RoleManagement(_roleManager);
        scholarshipRegistry = ScholarshipRegistry(_scholarshipRegistry);
    }
    
    function createProposal(uint256 _appId) external onlyAuthorized {
        require(!proposalExists[_appId], "Proposal already exists");
        
        ScholarshipRegistry.Application memory app = scholarshipRegistry.getApplication(_appId);
        require(app.id != 0, "Application does not exist");
        require(app.aiFlagged, "Application not flagged by AI");
        
        Proposal storage newProposal = proposals[_appId];
        newProposal.appId = _appId;
        newProposal.isActive = true;
        newProposal.deadline = block.timestamp + votingPeriod;
        
        proposalExists[_appId] = true;
        
        emit ProposalCreated(_appId, newProposal.deadline);
    }
    
    function vote(uint256 _appId, bool _approve) external onlyDAOReviewer {
        require(proposalExists[_appId], "Proposal does not exist");
        
        Proposal storage proposal = proposals[_appId];
        require(proposal.isActive, "Proposal is not active");
        require(block.timestamp < proposal.deadline, "Voting period ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        proposal.hasVoted[msg.sender] = true;
        
        if (_approve) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }
        
        emit VoteCast(_appId, msg.sender, _approve);
    }
    
    function finalizeProposal(uint256 _appId) external onlyAuthorized {
        require(proposalExists[_appId], "Proposal does not exist");
        
        Proposal storage proposal = proposals[_appId];
        require(proposal.isActive, "Proposal already finalized");
        require(block.timestamp >= proposal.deadline, "Voting period not ended");
        
        uint256 totalVotes = proposal.yesVotes + proposal.noVotes;
        require(totalVotes >= minimumVotes, "Insufficient votes");
        
        proposal.isActive = false;
        
        bool approved = proposal.yesVotes > proposal.noVotes;
        
        if (approved) {
            scholarshipRegistry.updateStatus(_appId, ScholarshipRegistry.Status.APPROVED);
        } else {
            scholarshipRegistry.updateStatus(_appId, ScholarshipRegistry.Status.REJECTED);
        }
        
        emit ProposalFinalized(_appId, approved);
    }
    
    function getProposalDetails(uint256 _appId) external view returns (
        uint256 yesVotes,
        uint256 noVotes,
        bool isActive,
        uint256 deadline
    ) {
        Proposal storage proposal = proposals[_appId];
        return (proposal.yesVotes, proposal.noVotes, proposal.isActive, proposal.deadline);
    }
    
    function hasUserVoted(uint256 _appId, address _user) external view returns (bool) {
        return proposals[_appId].hasVoted[_user];
    }
}