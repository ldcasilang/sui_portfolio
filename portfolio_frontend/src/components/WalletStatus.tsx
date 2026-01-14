import { useCurrentAccount, ConnectButton } from "@mysten/dapp-kit"

const WalletStatus = () => {
  const account = useCurrentAccount()
  
  if (account) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-green-400">Connected</span>
        <div className="text-xs text-gray-400 font-mono">
          {account.address.slice(0, 6)}...{account.address.slice(-4)}
        </div>
      </div>
    )
  }

  return (
    <div>
      <ConnectButton 
        connectText="Connect Wallet"
        className="!bg-gradient-to-r !from-sui-blue !to-blue-700 !text-white !font-semibold !rounded-xl !px-5 !py-3 hover:!from-blue-700 hover:!to-sui-blue transition-all"
      />
    </div>
  )
}

export default WalletStatus