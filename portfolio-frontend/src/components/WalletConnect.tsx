import { ConnectButton } from "@mysten/dapp-kit"

const WalletConnect = () => {
  return (
    <ConnectButton 
      connectText="Connect Wallet"
      className="!bg-gradient-to-r !from-sui-blue !to-blue-700 !text-white !font-semibold !rounded-xl !px-5 !py-3 hover:!from-blue-700 hover:!to-sui-blue transition-all"
    />
  )
}

export default WalletConnect