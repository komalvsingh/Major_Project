// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RoleManagement {
    address public admin;
    
    enum Role { STUDENT, DAO_REVIEWER, FINANCE_BUREAU, ADMIN }
    
    mapping(address => Role) public userRoles;
    mapping(address => bool) public isRegistered;
    
    event RoleAssigned(address indexed user, Role role);
    event RoleRemoved(address indexed user);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier hasRole(Role _role) {
        require(userRoles[msg.sender] == _role, "Unauthorized role");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        userRoles[admin] = Role.ADMIN;
        isRegistered[admin] = true;
    }
    
    function assignRole(address _user, Role _role) external onlyAdmin {
        userRoles[_user] = _role;
        isRegistered[_user] = true;
        emit RoleAssigned(_user, _role);
    }
    
    function removeRole(address _user) external onlyAdmin {
        delete userRoles[_user];
        isRegistered[_user] = false;
        emit RoleRemoved(_user);
    }
    
    function getUserRole(address _user) external view returns (Role) {
        return userRoles[_user];
    }
    
    function checkRole(address _user, Role _role) external view returns (bool) {
        return userRoles[_user] == _role;
    }
}