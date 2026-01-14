import { getFullnodeUrl } from "@mysten/sui/client"

export const networks = {
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
  localnet: { // Changed from "local" to "localnet"
    url: getFullnodeUrl('localnet'),
    variables: {}
  }
}

export const defaultNetwork = "testnet"