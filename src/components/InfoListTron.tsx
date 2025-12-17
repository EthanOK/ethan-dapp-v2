import { useEffect, useState } from 'react'
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks'
import { TRON_NILE_NET_RPC_URL } from '../config/constant'
import { TronWeb } from 'tronweb'
import toast from 'react-hot-toast'

interface InfoListProps {
  hash: string
  signedMsg: string
  balance: string
}

const tronWeb = new TronWeb({
  fullHost: TRON_NILE_NET_RPC_URL,
})

export const InfoList = ({ hash, signedMsg, balance }: InfoListProps) => {
  const [statusTx, setStatusTx] = useState('')
  const { wallet } = useWallet()

  useEffect(() => {
    const checkTransactionStatus = async () => {
      if (hash && wallet) {
        try {
          // wait 3 seconds
          await new Promise((resolve) => setTimeout(resolve, 3000))
          const unconfirmedTransactionInfo =
            await tronWeb.trx.getUnconfirmedTransactionInfo(hash)
          const result = unconfirmedTransactionInfo

          const isSuccess = result.result !== 'FAILED'

          setStatusTx(isSuccess ? 'Success' : 'Failed')

          if (isSuccess) {
            toast.success('Transaction successful')
          } else {
            toast.error('Transaction failed')
          }
        } catch (err) {
          console.error('Error checking transaction status:', err)
          setStatusTx('Error')
        }
      }
    }

    checkTransactionStatus()
  }, [hash, wallet])

  return (
    <>
      {balance && (
        <section>
          <h2>Balance: {balance}</h2>
        </section>
      )}
      {hash && (
        <section>
          <h2>Sign Tx</h2>
          <pre>
            Hash: {hash}
            <br />
            Status: {statusTx}
            <br />
          </pre>
        </section>
      )}
      {signedMsg && (
        <section>
          <h2>Sign msg</h2>
          <pre>
            signedMsg: {signedMsg}
            <br />
          </pre>
        </section>
      )}

      <section>
        <h2>WalletInfo</h2>
        <pre>
          Name: {wallet?.adapter.name}
          <br />
          URL: {wallet?.adapter.url}
          <br />
          State: {wallet?.state}
          <br />
          Address: {wallet?.adapter.address}
        </pre>
      </section>
    </>
  )
}
