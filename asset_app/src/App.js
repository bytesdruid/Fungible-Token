import './App.css';
import {PeraWalletConnect} from '@perawallet/connect';
import algosdk, { waitForConfirmation } from 'algosdk';
import { useEffect, useState } from 'react';
import { TextField, Button, Container } from '@material-ui/core';

// instantiates pera wallet connection
const peraWallet = new PeraWalletConnect();

// app ID from the testnet deployment
const appIndex = 121962350;

// algorand node connection instantiated
const algod = new algosdk.Algodv2('','https://testnet-api.algonode.cloud', 443);

function App() {
  // state for account address
  const [accountAddress, setAccountAddress] = useState(null);
  // state of connection to pera wallet
  const isConnectedToPeraWallet = !!accountAddress;

  // hooks are defined here
  useEffect(() => {
    // when component is mounted reconnect pera wallet session
    peraWallet.reconnectSession().then((accounts) => {
      // disconnection event listener
      peraWallet.connector?.on('disconnect', handleDisconnectWalletClick);
  
      if (accounts.length) {
        setAccountAddress(accounts[0]);
      }
    })

  },[]);

  return (
    <Container id='root DOM node'>
      <h1 className='top-div'>Bloom Token Management Console</h1>
      <div>
        <div className='centered-div'>
          <Button variant="outlined" color="primary"
            onClick={isConnectedToPeraWallet ? handleDisconnectWalletClick : handleConnectionWalletClick
            }>
            {isConnectedToPeraWallet ? "Disconnect": "Connect to Pera Wallet"}
          </Button>
        </div>
        <div className='centered-div'>
          <Button variant='outlined' color="primary"
            onClick={
              () => optInToApp()
            }>
            Opt-in
          </Button>
        </div>
        <div className='centered-div'>
          <Button variant='outlined' color="primary"
            onClick={
              () => callOneArg('Init_Admin')
            }>
            Init Admin
          </Button>
          <Button variant='outlined' color="primary"
            onClick={
              () => callOneArg('Set_Admin')
            }>
            Change Admin
          </Button>
        </div>
        <div className='centered-div'>
          <TextField label="Mint Amount" variant="outlined"/>
          <Button variant='outlined' color="primary"
            onClick={
              () => callTwoArg('Mint', '10')
            }>
            Mint BLT
          </Button>
        </div>
        <div className='centered-div'>
          <TextField label="Transfer Amount" variant="outlined"/>
          <Button variant='outlined' color="primary"
            onClick={
              () => callTwoArg('Transfer', '1')
            }>
            Transfer BLT
          </Button>
        </div>
      </div>
    </Container>
  );

  // function for making noop calls to Algorand application
  async function callTwoArg(appArg1, appArg2) {
    try {
      // get suggested txn params from algod
      const suggestedParams = await algod.getTransactionParams().do();
      // app arg array
      const appArgs = [];
      // add the first argument to the app arg array
      appArgs.push(new Uint8Array(Buffer.from(appArg1)));
      console.log(appArgs);
      // add the second argument to the app arg array
      appArgs.push(new Uint8Array(Buffer.from(appArg2)));
      console.log(appArgs);
      // this has all txn params
      const actionTx = algosdk.makeApplicationNoOpTxn(
          accountAddress,
          suggestedParams,
          appIndex,
          appArgs
      );
      // has txn info and signer info
      const actionTxGroup = [{txn: actionTx, signers: [accountAddress]}];
      // execute the txn
      const signedTx = await peraWallet.signTransaction([actionTxGroup]);
      // print the txn results object
      console.log(signedTx)
      // get the txn id from algod
      const { txId } = await algod.sendRawTransaction(signedTx).do();
      const result = await waitForConfirmation(algod, txId, 2);
    } catch (e) {
      console.error(`There was an error setting item: ${e}`);
    }
  }

  // function for making noop calls to Algorand application
  async function callOneArg(appArg1) {
    try {
      // get suggester txn params from algod
      const suggestedParams = await algod.getTransactionParams().do();
      // set the application argument from the action being passed in
      const appArgs = [new Uint8Array(Buffer.from(appArg1))];
      // this has all txn params
      const actionTx = algosdk.makeApplicationNoOpTxn(
          accountAddress,
          suggestedParams,
          appIndex,
          appArgs
      );
      // has txn info and signer info
      const actionTxGroup = [{txn: actionTx, signers: [accountAddress]}];
      // execute the txn
      const signedTx = await peraWallet.signTransaction([actionTxGroup]);
      // print the txn results object
      console.log(signedTx)
      // get the txn id from algod
      const { txId } = await algod.sendRawTransaction(signedTx).do();
      const result = await waitForConfirmation(algod, txId, 2);
    } catch (e) {
      console.error(`There was an error configuring admin: ${e}`);
    }
  }

  // function that opts account into application
  async function optInToApp() {
    const suggestedParams = await algod.getTransactionParams().do();
    const optInTxn = algosdk.makeApplicationOptInTxn(
      accountAddress,
      suggestedParams,
      appIndex
    );

    const optInTxGroup = [{txn: optInTxn, signers: [accountAddress]}];

      const signedTx = await peraWallet.signTransaction([optInTxGroup]);
      console.log(signedTx);
      const { txId } = await algod.sendRawTransaction(signedTx).do();
      const result = await waitForConfirmation(algod, txId, 2);
  }

  // function that handles the connection to pera wallet through the UI
  function handleConnectionWalletClick() {
    // connects the wallet
    peraWallet.connect().then((newAccounts) => {
      // sets up disconnect event listener
      peraWallet.connector?.on('disconnect', handleDisconnectWalletClick);
      // sets the account address to a new account at index zero
      setAccountAddress(newAccounts[0]);
    });
  }

  // function that handles the wallet UI click to disconnect
  function handleDisconnectWalletClick() {
    // disconnects the wallet
    peraWallet.disconnect();
    // sets the account address to null value
    setAccountAddress(null);
  }

}

export default App;
