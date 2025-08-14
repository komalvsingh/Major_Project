import React from 'react';
import { useWallet } from '../context/WalletContext';

const WalletButton = () => {
  const { account, isConnected, connectWallet, disconnectWallet } = useWallet();

  return (
    <div>
      {!isConnected ? (
        <button onClick={connectWallet}>
          Connect Wallet
        </button>
      ) : (
        <div>
          <p>Connected: {account?.substring(0, 6)}...{account?.substring(38)}</p>
          <button onClick={disconnectWallet}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletButton;