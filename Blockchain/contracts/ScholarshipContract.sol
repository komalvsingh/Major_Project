// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ScholarshipContract {
    address public owner;
    uint256 public treasuryBalance;
    
    enum Role { Student, SAGBureau, Admin, FinanceBureau }
    enum ApplicationStatus { Applied, SAGVerified, AdminApproved, Disbursed }
    
    struct User {
        Role role;
        bool isActive;
    }
    
    struct Application {
        uint256 id;
        address student;
        string name;
        string email;
        string phone;
        string aadharNumber;
        string income;
        string documentsIPFSHash;
        ApplicationStatus status;
        uint256 sagVerifiedCount;
        uint256 adminApprovedCount;
        uint256 appliedAt;
        uint256 disbursementAmount;
        bool isDisbursed;
    }
    
    mapping(address => User) public users;
    mapping(uint256 => Application) public applications;
    mapping(uint256 => mapping(address => bool)) public sagVotes;
    mapping(uint256 => mapping(address => bool)) public adminVotes;
    
    uint256 public applicationCounter;
    address[] public sagBureauMembers;
    address[] public adminMembers;
    address[] public financeBureauMembers;
    
    // Fund management
    uint256 public standardScholarshipAmount = 0.01 ether; // Default amount
    
    event UserRoleAssigned(address indexed user, Role role);
    event ApplicationSubmitted(uint256 indexed applicationId, address indexed student);
    event SAGVerified(uint256 indexed applicationId, address indexed sagMember);
    event AdminApproved(uint256 indexed applicationId, address indexed admin);
    event FundsDisbursed(uint256 indexed applicationId, address indexed student, uint256 amount);
    event FundsDeposited(address indexed depositor, uint256 amount);
    event ScholarshipAmountUpdated(uint256 newAmount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier onlyRole(Role _role) {
        require(users[msg.sender].role == _role && users[msg.sender].isActive, "Unauthorized");
        _;
    }
    
    modifier onlyStudent() {
        require(users[msg.sender].role == Role.Student && users[msg.sender].isActive, "Only students allowed");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        users[msg.sender] = User(Role.Admin, true);
        adminMembers.push(msg.sender);
    }
    
    // Fund management functions
    receive() external payable {
        treasuryBalance += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }
    
    function depositFunds() external payable onlyOwner {
        require(msg.value > 0, "Must deposit some ETH");
        treasuryBalance += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }
    
    function setScholarshipAmount(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be greater than 0");
        standardScholarshipAmount = _amount;
        emit ScholarshipAmountUpdated(_amount);
    }
    
    function withdrawExcessFunds(uint256 _amount) external onlyOwner {
        require(_amount <= treasuryBalance, "Insufficient treasury balance");
        treasuryBalance -= _amount;
        
        (bool success, ) = payable(owner).call{value: _amount}("");
        require(success, "Transfer failed");
    }
    
    function assignRole(address _user, Role _role) external onlyOwner {
        users[_user] = User(_role, true);
        
        if (_role == Role.SAGBureau) {
            sagBureauMembers.push(_user);
        } else if (_role == Role.Admin) {
            adminMembers.push(_user);
        } else if (_role == Role.FinanceBureau) {
            financeBureauMembers.push(_user);
        }
        
        emit UserRoleAssigned(_user, _role);
    }
    
    function registerAsStudent() external {
        require(users[msg.sender].role == Role.Student || !users[msg.sender].isActive, "Already registered with different role");
        users[msg.sender] = User(Role.Student, true);
        emit UserRoleAssigned(msg.sender, Role.Student);
    }
    
    function submitApplication(
        string memory _name,
        string memory _email,
        string memory _phone,
        string memory _aadharNumber,
        string memory _income,
        string memory _documentsIPFSHash
    ) external onlyStudent {
        applicationCounter++;
        
        applications[applicationCounter] = Application(
            applicationCounter,
            msg.sender,
            _name,
            _email,
            _phone,
            _aadharNumber,
            _income,
            _documentsIPFSHash,
            ApplicationStatus.Applied,
            0,
            0,
            block.timestamp,
            standardScholarshipAmount, // Set default amount
            false
        );
        
        emit ApplicationSubmitted(applicationCounter, msg.sender);
    }
    
    function verifySAG(uint256 _applicationId) external onlyRole(Role.SAGBureau) {
        require(_applicationId <= applicationCounter && _applicationId > 0, "Invalid application");
        require(!sagVotes[_applicationId][msg.sender], "Already voted");
        require(applications[_applicationId].status == ApplicationStatus.Applied, "Application not in applied status");
        
        sagVotes[_applicationId][msg.sender] = true;
        applications[_applicationId].sagVerifiedCount++;
        
        // Require at least 1 SAG verification to move to next stage
        if (applications[_applicationId].sagVerifiedCount >= 1) {
            applications[_applicationId].status = ApplicationStatus.SAGVerified;
        }
        
        emit SAGVerified(_applicationId, msg.sender);
    }
    
    function adminApprove(uint256 _applicationId) external onlyRole(Role.Admin) {
        require(_applicationId <= applicationCounter && _applicationId > 0, "Invalid application");
        require(!adminVotes[_applicationId][msg.sender], "Already voted");
        require(applications[_applicationId].status == ApplicationStatus.SAGVerified, "Not SAG verified");
        
        adminVotes[_applicationId][msg.sender] = true;
        applications[_applicationId].adminApprovedCount++;
        
        // Require 2 admin approvals (DAO process)
        if (applications[_applicationId].adminApprovedCount >= 2) {
            applications[_applicationId].status = ApplicationStatus.AdminApproved;
        }
        
        emit AdminApproved(_applicationId, msg.sender);
    }
    
    function disburseFunds(uint256 _applicationId, uint256 _customAmount) external onlyRole(Role.FinanceBureau) {
        require(_applicationId <= applicationCounter && _applicationId > 0, "Invalid application");
        require(applications[_applicationId].status == ApplicationStatus.AdminApproved, "Not admin approved");
        require(!applications[_applicationId].isDisbursed, "Already disbursed");
        
        uint256 amountToSend;
        
        // Use custom amount if provided, otherwise use default
        if (_customAmount > 0) {
            amountToSend = _customAmount;
        } else {
            amountToSend = applications[_applicationId].disbursementAmount;
        }
        
        require(amountToSend <= treasuryBalance, "Insufficient treasury funds");
        
        address studentAddress = applications[_applicationId].student;
        
        // Update state first (CEI pattern)
        applications[_applicationId].disbursementAmount = amountToSend;
        applications[_applicationId].isDisbursed = true;
        applications[_applicationId].status = ApplicationStatus.Disbursed;
        treasuryBalance -= amountToSend;
        
        // Transfer funds to student
        (bool success, ) = payable(studentAddress).call{value: amountToSend}("");
        require(success, "Transfer to student failed");
        
        emit FundsDisbursed(_applicationId, studentAddress, amountToSend);
    }
    
    // Emergency function to update disbursement amount for approved applications
    function updateDisbursementAmount(uint256 _applicationId, uint256 _newAmount) external onlyRole(Role.FinanceBureau) {
        require(_applicationId <= applicationCounter && _applicationId > 0, "Invalid application");
        require(applications[_applicationId].status == ApplicationStatus.AdminApproved, "Not admin approved");
        require(!applications[_applicationId].isDisbursed, "Already disbursed");
        require(_newAmount > 0, "Amount must be greater than 0");
        
        applications[_applicationId].disbursementAmount = _newAmount;
    }
    
    // View functions
    function getUserRole(address _user) external view returns (Role, bool) {
        return (users[_user].role, users[_user].isActive);
    }
    
    function getApplication(uint256 _applicationId) external view returns (Application memory) {
        return applications[_applicationId];
    }
    
    function getAllApplications() external view returns (Application[] memory) {
        Application[] memory allApps = new Application[](applicationCounter);
        for (uint256 i = 1; i <= applicationCounter; i++) {
            allApps[i-1] = applications[i];
        }
        return allApps;
    }
    
    function getApplicationsByStatus(ApplicationStatus _status) external view returns (Application[] memory) {
        uint256 count = 0;
        
        // Count applications with the specified status
        for (uint256 i = 1; i <= applicationCounter; i++) {
            if (applications[i].status == _status) {
                count++;
            }
        }
        
        Application[] memory filteredApps = new Application[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= applicationCounter; i++) {
            if (applications[i].status == _status) {
                filteredApps[index] = applications[i];
                index++;
            }
        }
        
        return filteredApps;
    }
    
    function getMyApplications() external view returns (Application[] memory) {
        uint256 count = 0;
        
        // Count user's applications
        for (uint256 i = 1; i <= applicationCounter; i++) {
            if (applications[i].student == msg.sender) {
                count++;
            }
        }
        
        Application[] memory myApps = new Application[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= applicationCounter; i++) {
            if (applications[i].student == msg.sender) {
                myApps[index] = applications[i];
                index++;
            }
        }
        
        return myApps;
    }
    
    function getSAGMembers() external view returns (address[] memory) {
        return sagBureauMembers;
    }
    
    function getAdminMembers() external view returns (address[] memory) {
        return adminMembers;
    }
    
    function getFinanceMembers() external view returns (address[] memory) {
        return financeBureauMembers;
    }
    
    function getTreasuryBalance() external view returns (uint256) {
        return treasuryBalance;
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}