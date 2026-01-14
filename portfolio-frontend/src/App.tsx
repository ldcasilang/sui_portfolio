import { useCurrentAccount, ConnectButton, useSuiClientQuery } from "@mysten/dapp-kit"
import { ToastContainer } from "react-toastify"
import PortfolioView from "./views/PortfolioView"
import AdminView from "./views/AdminView"
import { useState } from "react"

function App() {
  const account = useCurrentAccount()
  const [showAdmin, setShowAdmin] = useState(false)

  // Fetch SUI balance
  const { data: balanceData } = useSuiClientQuery(
    "getBalance",
    {
      owner: account?.address as string,
    },
    {
      enabled: !!account,
    }
  )

  // Convert MIST to SUI
  const getSuiBalance = () => {
    if (!balanceData) return "0.00"
    return (Number(balanceData.totalBalance) / 1_000_000_000).toFixed(2)
  }

  // Show AdminView if showAdmin is true, otherwise PortfolioView
  const CurrentView = showAdmin ? AdminView : PortfolioView

  return (
    <div className="min-h-screen bg-sui-dark text-white font-inter">
      <ToastContainer position="top-right" theme="dark" />
      
      {/* Simple Header */}
   <header className="bg-slate-900 border-b border-gray-800 py-4 px-6">
  <div className="max-w-[1100px] mx-auto flex justify-between items-center">
    <div className="flex items-center gap-3">
      <img 
        src="/sui-logo.png" 
        alt="Sui Logo" 
        className="w-10 h-10 rounded-lg"
      />
      <h1 className="text-2xl font-bold bg-name-gradient bg-clip-text text-transparent">
        Sui Portfolio
      </h1>
    </div>
          
          <div className="flex items-center gap-4">
            {/* Show "Edit Portfolio" button only when wallet is connected AND we're viewing portfolio */}
            {account && !showAdmin && (
              <button
                onClick={() => setShowAdmin(true)}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-sui-blue to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-sui-blue transition-all"
              >
                Edit Portfolio
              </button>
            )}
            
            {/* Show "Back to Portfolio" button when in AdminView */}
            {showAdmin && (
              <button
                onClick={() => setShowAdmin(false)}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 text-white font-semibold hover:from-gray-800 hover:to-gray-700 transition-all"
              >
                ← Back to Portfolio
              </button>
            )}
            
            <ConnectButton 
              connectText="Connect Wallet"
              className="!bg-gradient-to-r !from-sui-blue !to-blue-700 !text-white !font-semibold !rounded-xl !px-5 !py-3 hover:!from-blue-700 hover:!to-sui-blue transition-all"
            />
          </div>
        </div>
      </header>

      {/* Wallet Status Banner - UPDATED with balance */}
      {account && (
        <div className="bg-green-900/20 border-l-4 border-green-500 p-3">
          <div className="max-w-[1100px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-green-400">Wallet Connected</p>
                  <span className="text-gray-400">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">Balance:</span>
                    <span className="font-bold text-white">{getSuiBalance()} SUI</span>
                  </div>
                </div>
                <p className="text-green-300 text-sm mt-1">
                  {account.address.slice(0, 8)}...{account.address.slice(-6)}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-300">
              {showAdmin ? "Editing mode enabled" : "Ready to edit your portfolio"}
            </div>
          </div>
        </div>
      )}

      <main id="top">
        <CurrentView />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-gray-800 py-8">
        <div className="max-w-[1100px] mx-auto px-4 text-center text-gray-400">
          <p>Portfolio project published during <strong>Move Smart Contracts Code Camp</strong></p>
          <p className="mt-2">by DEVCON Philippines & SUI Foundation</p>
        </div>
      </footer>
    </div>
  )
}

export default App