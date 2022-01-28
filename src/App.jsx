import React, { useEffect, useState } from "react";
import './App.css';
import { ethers } from 'ethers';
import abi from './utils/WavePortal.json';

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [waveCount, setWaveCount] = useState("");
  const [allWaves, setAllWaves] = useState("");
  const [message, setMessage] = useState("");

  const contractAddress = '0x827838085489078b4e068a54F72E5ACCeC27E4EC';
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log('Found an authorized account:', accounts);
        setCurrentAccount(account);
      } else {
        console.log('No authorized account found');
      }

    } catch (error) {
      console.log(error);
    }
  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, provider);
        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          })
        });

        setAllWaves(wavesCleaned);

        let count = await wavePortalContract.getTotalWaves();
        setWaveCount(count.toNumber());

        console.log(wavesCleaned);

        wavePortalContract.on('NewWave', (from, timestamp, message) => {
          console.log('NewWave', from, timestamp, message);
          setAllWaves(prevState => [
            ...prevState,
            {
              address: from,
              timestamp: new Date(timestamp * 1000),
              message: message
            }
          ])

          setWaveCount(prevState => prevState + 1);
        });

      } else {
        console.log("Ethereum object doesn't exist")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert('Get metamask!');
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0])
      setCurrentAccount(accounts[0]);

      getAllWaves();
    } catch (error) {
      console.log(error);
    }
  }

  const wave = async (e) => {
    e.preventDefault();
    if (message.replace(/ /g, '').length < 1) {
      alert('A message is required')
      return;
    }

    console.log(message);

    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        // ethers is the library to interact with our contract and provider is what we actually use to talk to Eth nodes
        const signer = provider.getSigner(); // Signer is an abstraction of an Ethereum account, which can be used to sign msgs/trns and send them to the Ethereum network 
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
        console.log('Mining...', waveTxn.hash);

        await waveTxn.wait();
        console.log('Mined --', waveTxn.hash);

        // getAllWaves(); // Replaced with event

        setMessage('');

      } else {
        console.log('No ethereum object');
      }
    } catch (error) {
      console.log(error);
    }
  }

  /*
  * This runs our function when the page loads.
  */
  useEffect(() => {
    getAllWaves();
    checkIfWalletIsConnected();
  }, [])

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
          Wave @ anicca & Win ETH! <span className="emoji">🤑🤑🤑</span>
        </div>

        <div className="bio">
          Wave @ anicca. Stand a chance to win 0.001 ether! <br/>
          <strong>Warning: This is a dApp deployed to Rinkeby network for demo purposes only. Don't connect your mainnet wallet. </strong>
        </div>

        <div className="instructions">
          Go ahead, connect your Ethereum wallet to wave at anicca!
        </div>

        {
          waveCount > 0 &&
          <div className="waveCount">
            {waveCount} have waved at him!
          </div>
        }

        {!currentAccount && (
          <button className="connectWalletButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {currentAccount && <form className="waveForm" onSubmit={wave}>
          <input type="text" name="message" className="waveText" placeholder="Your message..." value={message} onChange={e => setMessage(e.target.value)} />
          <input type="submit" value="Wave at Me" className="waveButton" />
        </form>}


        {allWaves && allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

export default App