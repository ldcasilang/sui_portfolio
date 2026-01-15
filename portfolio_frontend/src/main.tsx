import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui/client'
import { BrowserRouter } from 'react-router-dom' // Keep BrowserRouter
import App from './App'
import './index.css'

// Create query client with minimal retries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0, // No retries to prevent multiple error toasts
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 0,
    },
  },
})

// Create network config for Sui
const networks = {
  testnet: { 
    url: getFullnodeUrl('testnet'),
    variables: {}
  },
  devnet: { 
    url: getFullnodeUrl('devnet'),
    variables: {}
  },
  mainnet: { 
    url: getFullnodeUrl('mainnet'),
    variables: {}
  },
  localnet: { 
    url: 'http://127.0.0.1:9000',
    variables: {}
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider 
        networks={networks} 
        defaultNetwork="testnet"
        // Disable query key normalization which can cause errors
        queryKeyNormalization={false}
      >
        <WalletProvider 
          // CRITICAL: Prevent all auto-connection attempts
          autoConnect={false}
          // Disable unsafe burner wallet
          enableUnsafeBurner={false}
          // Configure stashed wallet silently
          stashedWallet={{
            name: "Sui Portfolio",
            // Silent error handlers
            onConnectError: () => console.log('[Silent] Wallet connect error'),
            onDisconnectError: () => console.log('[Silent] Wallet disconnect error'),
          }}
          // Global silent error handler
          onError={(error) => {
            console.log('[Silent] Wallet provider error:', error.message)
            // Don't throw or show toast
          }}
          // Disable auto reconnect
          enableUnsafeBurnerAutoConnect={false}
        >
          
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
)