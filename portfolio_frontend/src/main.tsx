import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui/client'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

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
      >
        <WalletProvider 
          // REMOVED: autoConnect={true} to prevent wallet detection toast
          stashedWallet={{
            name: "Sui Portfolio"
          }}
        >
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
)