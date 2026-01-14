import { useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"

const SendTransaction = () => {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()

  const sendTransaction = () => {
    const tx = new Transaction()
    
    // Build your transaction here
    // Example: tx.transferObjects([coin], tx.pure(address))
    
    signAndExecute({
      transaction: tx, // This should work now with the import fix
    })
  }

  return (
    <button onClick={sendTransaction}>
      Send Transaction
    </button>
  )
}

export default SendTransaction