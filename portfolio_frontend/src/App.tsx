import { useCurrentAccount, ConnectButton, useSuiClientQuery } from "@mysten/dapp-kit"
import { ToastContainer } from "react-toastify"
import PortfolioView from "./views/PortfolioView"
import AdminView from "./views/AdminView"
import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"
import PasswordProtection from "./components/PasswordProtection"

// Inline toast filter function
const toastClassName = (context: any): string => {
  if (!context?.toastProps?.children) return '';
  
  try {
    const message = context.toastProps.children.toString();
    const lowerMessage = message.toLowerCase();
    const walletKeywords = ['wallet', 'connect', 'disconnect', 'failed', 'error', 'no wallet', 'extension'];
    
    if (walletKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'wallet-toast-hidden';
    }
  } catch (error) {
    // Silent error handling
  }
  return '';
};

// Main Layout Component
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const account = useCurrentAccount()
  const [showAdmin, setShowAdmin] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Fetch SUI balance silently
  const { data: balanceData } = useSuiClientQuery(
    "getBalance",
    {
      owner: account?.address as string,
    },
    {
      enabled: !!account,
      retry: 0, // No retries to prevent error toasts
      onError: (error) => {
        // Silent error handling
        console.log('Balance fetch failed:', error.message);
      }
    }
  )

  // Convert MIST to SUI
  const getSuiBalance = () => {
    if (!balanceData) return "0.00"
    return (Number(balanceData.totalBalance) / 1_000_000_000).toFixed(2)
  }

  // Handle back to portfolio
  const handleBackToPortfolio = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-sui-dark text-white font-inter">
      {/* Filtered ToastContainer */}
      <ToastContainer 
        position="top-right" 
        theme="dark"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        limit={1}
        // Apply filter function
        toastClassName={toastClassName}
      />
      
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
            {/* Show "Back to Portfolio" button when on admin page */}
            {location.pathname === '/admin' && (
              <button
                onClick={handleBackToPortfolio}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 text-white font-semibold hover:from-gray-800 hover:to-gray-700 transition-all"
              >
                ← Back to Portfolio
              </button>
            )}
            
            {/* Show Connect Wallet button only on admin page */}
            {location.pathname === '/admin' && (
              <ConnectButton 
                connectText="Connect Wallet"
                className="!bg-gradient-to-r !from-sui-blue !to-blue-700 !text-white !font-semibold !rounded-xl !px-5 !py-3 hover:!from-blue-700 hover:!to-sui-blue transition-all"
              />
            )}
          </div>
        </div>
      </header>

      {/* Wallet Status Banner - Only show on admin page when connected */}
      {account && location.pathname === '/admin' && (
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
              Ready to edit your portfolio
            </div>
          </div>
        </div>
      )}

      <main id="top">
        {children}
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

function App() {
  // Intercept toast calls early
  useEffect(() => {
    // Monkey patch toast.error to filter wallet messages
    const originalToastError = (window as any).toast?.error;
    if (originalToastError && typeof originalToastError === 'function') {
      (window as any).toast.error = (message: string, options?: any) => {
        const lowerMessage = String(message).toLowerCase();
        const walletKeywords = ['wallet', 'connect', 'failed', 'error', 'no wallet'];
        
        if (walletKeywords.some(keyword => lowerMessage.includes(keyword))) {
          console.log('[Suppressed] Wallet toast:', message);
          return { id: 'suppressed' };
        }
        
        return originalToastError(message, options);
      };
    }
    
    // Also intercept console.error which might trigger toasts
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.toLowerCase().includes('wallet') || 
          message.toLowerCase().includes('connect') ||
          message.toLowerCase().includes('dapp-kit')) {
        console.log('[Suppressed console error]:', message);
        return;
      }
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      // Restore original functions
      if (originalToastError) {
        (window as any).toast.error = originalToastError;
      }
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <MainLayout>
            <PortfolioView />
          </MainLayout>
        } />
        <Route path="/admin" element={
          <PasswordProtection password="Movecodecampexercise!">
            <MainLayout>
              <AdminView />
            </MainLayout>
          </PasswordProtection>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App