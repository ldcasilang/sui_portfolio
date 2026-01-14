import { useCurrentAccount } from '@mysten/dapp-kit';

const WalletView = () => {
  const account = useCurrentAccount();

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Your Wallet Info</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        {account ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className="text-green-500 font-semibold">Connected</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Address:</span>
              <p className="mt-2 font-mono text-sm bg-gray-100 dark:bg-gray-900 p-3 rounded-lg break-all">
                {account.address}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
              Wallet not connected
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm">
              Connect your wallet to view wallet information
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletView;