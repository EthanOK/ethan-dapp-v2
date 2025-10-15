import { ActionButtonList } from '../components/ActionButtonListSolana'
import { InfoList } from '../components/InfoList'
import { useState } from 'react'

export const SolanaPage = () => {
  const [hash, setHash] = useState('')
  const [signedMsg, setSignedMsg] = useState('')
  const [balance, setBalance] = useState('')

  return (
    <div className={'pages'}>
      <img
        src="/reown.svg"
        alt="Reown"
        style={{ width: '150px', height: '150px' }}
      />
      <h1>Ethan Dapp V2 - Solana</h1>
      <appkit-button />
      <ActionButtonList
        sendHash={setHash}
        sendSignMsg={setSignedMsg}
        sendBalance={setBalance}
      />
      <InfoList hash={hash} signedMsg={signedMsg} balance={balance} />
    </div>
  )
}
