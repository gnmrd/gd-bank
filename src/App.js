import { useState, useEffect } from 'react';
import { ethers, utils } from "ethers";
import abi from "./contracts/Bank.json";
import './App.css';

function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isBankerOwner, setIsBankerOwner] = useState(false);
  const [inputValue, setInputValue] = useState({ withdraw: "", deposit: "", bankName: ""});
  const [bankOwnerAddress, setBankOwnerAddress] = useState(null);
  const [customerTotalBalance, setCustomerTotalBalance] = useState(null);
  const [currentBankName, setCurrentBankName] = useState(null);
  const [customerAddress, setCustomerAddress] = useState(null);
  const [error, setError] = useState(null);

  const contractAddress = '0xa3c862531Ab8691b2A1921144924dea7EC664cC9';
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async() => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        const account = accounts[0];
        setIsWalletConnected(true);
        setCustomerAddress(account);
        console.log("Account Connected: ", account);
      } else {
        setError("Please install a MetaMask wallet to use our bank.");
        console.log("No MetaMask detected.");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const getBankName = async() => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer);

        let bankName = await bankContract.bankName();
        bankName = utils.parseBytes32String(bankName);
        setCurrentBankName(bankName.toString());
      } else {
        console.log("Ethereum object not found, install MetaMask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const setBankNameHandler = async (event) => {
    event.preventDefault();
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer);

        const txn = await bankContract.setBankName(utils.formatBytes32String(inputValue.bankName));
        console.log("Setting Bank Name...");
        await txn.wait();
        console.log("Bank Name Changed", txn.hash);
        getBankName();

      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const getbankOwnerHandler = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer);

        let owner = await bankContract.bankOwner();
        setBankOwnerAddress(owner);

        const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });

        if (owner.toLowerCase() === account.toLowerCase()) {
          setIsBankerOwner(true);
        }
      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const customerBalanceHandler = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer);

        let balance = await bankContract.getCustomerBalance();
        setCustomerTotalBalance(utils.formatEther(balance));
        console.log("Retrieved balance...", balance);

      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleInputChange = (event) => {
    setInputValue(prevFormData => ({ ...prevFormData, [event.target.name]: event.target.value }));
  }

  const deposityMoneyHandler = async (event) => {
    try {
      event.preventDefault();
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer);

        const txn = await bankContract.depositMoney({ value: ethers.utils.parseEther(inputValue.deposit) });
        console.log("Deposting money...");
        await txn.wait();
        console.log("Deposited money...done", txn.hash);

        customerBalanceHandler();

      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const withDrawMoneyHandler = async (event) => {
    try {
      event.preventDefault();
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer);

        let myAddress = await signer.getAddress()
        console.log("provider signer...", myAddress);

        const txn = await bankContract.withDrawMoney(myAddress, ethers.utils.parseEther(inputValue.withdraw));
        console.log("Withdrawing money...");
        await txn.wait();
        console.log("Money with drew...done", txn.hash);

        customerBalanceHandler();

      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Please install a MetaMask wallet to use our bank.");
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    getBankName();
    getbankOwnerHandler();
    customerBalanceHandler()
  }, [isWalletConnected])

  return (
    <main className='main-container'>
      <h2 className='headline'>GD 银行 💰</h2>
      <section className='customer-section'>
        {error && <p className='error-text'>{error}</p>}
        <div>
          {currentBankName === "" && isBankerOwner ? 
            <p>Input the name of your bank.</p> :
            <p>{currentBankName}</p>
          }
        </div>
        <div className='deposit-container'>
          <form>
            <input 
              type="text"
              onChange={handleInputChange}
              name="deposit"
              placeholder="0.0000 ETH"
              value={inputValue.deposit}
            />
            <button 
              className='main-button'
              onClick={deposityMoneyHandler}>
              Deposit Money in ETH
            </button>
          </form>
        </div>
        <div className='deposit-container'>
          <form>
            <input 
              type="text"
              onChange={handleInputChange}
              name="withdraw"
              placeholder="0.0000 ETH"
              value={inputValue.withdraw}
            />
            <button 
              className='main-button'
              onClick={withDrawMoneyHandler}>
              Withdraw Money in ETH
            </button>
          </form>
        </div>
        <div className='deposit-container'>
        <div className='balance-container'>
          <p className='second-headline'>Customer Balance:</p>
          <p>{customerTotalBalance}</p>
        </div>
        <div className='bankowner-container'>
          <p className='second-headline'>Bank Owner Address:</p>
          <p>{bankOwnerAddress}</p>
        </div>
        <div className='walletconnect-container'>
          {isWalletConnected &&
          <><p className='second-headline'>Customer Wallet Address:</p>
          <p>{customerAddress}</p></>
          }
          <button className="connect-button" onClick={checkIfWalletIsConnected}>
            {isWalletConnected ? "Wallet Connected 🔒" : "Connect Wallet 🔑"}
          </button>
        </div>
        </div>
      </section>
      {
        isBankerOwner && (
          <section className="bank-owner-section">
            <h2 className="second-headline">Bank Admin Panel</h2>
            <div className="deposit-container">
              <form>
                <input
                  type="text"
                  onChange={handleInputChange}
                  name="bankName"
                  placeholder="Enter a Name for Your Bank"
                  value={inputValue.bankName}
                />
                <button
                  className="main-button"
                  onClick={setBankNameHandler}>
                  Set Bank Name
                </button>
              </form>
            </div>
          </section>
        )
      }
    </main>
  );
}

export default App;