import React, { Component } from 'react';
import './App.css';
import Web3 from 'web3';
import Marketplace from '../abis/Marketplace.json';
import NavBar from './NavBar'
import Main from './Main'
class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            account: '',
            productCount: 0,
            products: [],
            loading: true,
            networkFound: false
        }

        this.createProduct = this.createProduct.bind(this);
        this.purchaseProduct = this.purchaseProduct.bind(this);
    }

    async componentWillMount() {
        await this.loadWeb3();
        await this.loadBlockchainData();

        if (this.state.networkFound)
            setInterval(async () => {
                const currentAccount = (await window.web3.eth.getAccounts())[0]
                const currentNetworkId = await window.web3.eth.net.getId();
                if (currentNetworkId !== this.state.networkId ||
                    currentAccount !== this.state.account) {

                    console.log("\n")
                    console.log("currentNetworkId", currentNetworkId)
                    console.log("this.state.networkId", this.state.networkId)
                    console.log("currentAccount", currentAccount)
                    console.log("this.state.account", this.state.account)

                    this.resetStates();
                    this.setState({ networkId: currentNetworkId })
                    await this.loadWeb3();
                    await this.loadBlockchainData();
                }
            }, 3000);
    }


    resetStates() {
        this.setState({
            account: '',
            networkId: 0,
            productCount: 0,
            products: [],
            loading: true
        })
        return;
    }


    async loadWeb3() {
        console.log("loadWeb3")
        // Modern browsers
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            await window.ethereum.enable();
        }
        // Legacy browsers
        else if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider)
        }

    }

    async loadBlockchainData() {
        console.log("loadBlockchainData")
        const web3 = window.web3;

        // Load accounts
        const accounts = await web3.eth.getAccounts();
        const currentAccount = accounts[0];
        let accountBalance = await web3.eth.getBalance(currentAccount);
        accountBalance = web3.utils.fromWei(accountBalance.toString(), 'ether')
        accountBalance = Math.round(accountBalance * 10) / 10;

        this.setState({ account: currentAccount });
        this.setState({ accountBalance: accountBalance });

        const networkId = await web3.eth.net.getId();
        const networkData = Marketplace.networks[networkId];
        console.log("networkId: " + networkId)
        if (networkData) {
            const marketplaceContract = web3.eth.Contract(Marketplace.abi, networkData.address);

            this.setState({ marketplaceContract })
            this.setState({ loading: false })
            this.setState({ networkId: networkId })
            this.setState({ networkFound: true })

            const productsCount = await marketplaceContract.methods.productsCount().call();
            for (let i = 1; i <= productsCount; i++) {
                const product = await marketplaceContract.methods.products(i).call();
                this.setState({
                    products: [... this.state.products, product]
                })
            }
        }
        else {
            this.setState({ networkFound: false });
        }

    }

    async connectOnClick() {
        try {
            await this.loadWeb3();
            await this.loadBlockchainData();
        }
        catch (err) {
            if (err.message.includes("alread…ng for origin") || err.message.includes("already pending for origin"))
                alert("There is already a request. Please check Metamask.")
        }
    }

    createProduct(name, price) {

        this.setState({ loading: true });
        this.state.marketplaceContract.methods.createProduct(name, price).send({ from: this.state.account })
            .once('receipt', (receipt) => {
                console.log("HOLA")
                this.setState({ loading: false });
            })
            .catch(err => {
                if (err.code === 4001) // user rejected the transaction
                    alert("User has rejected the transaction")
                else
                    alert(err.message)
                this.setState({ loading: false });
            })
    }

    purchaseProduct(id, price) {
        this.setState({ loading: true });
        this.state.marketplaceContract.methods.purchaseProduct(id).send({ from: this.state.account, value: price })
            .once('receipt', (receipt) => {
                this.setState({ loading: false });
            })
    }

    render() {

        return (
            <div className="d-flex justify-content-center text-center">
                <NavBar
                    account={this.state.account}
                    accountBalance={this.state.accountBalance} />
                <div className="container-fluid mt-5">

                    {
                        !this.state.networkFound ?
                            <div className="justify-content-center text-center">
                                <h2>Please connect to Ropsten network</h2>
                                <button onClick={() => this.connectOnClick()} className="btn btn-primary">Connect wallet</button>
                            </div> : null
                    }
                    <div className="row">
                        <main role="main" className="col-lg-12 d-flex"></main>

                        <Main
                            products={this.state.products}
                            createProduct={this.createProduct}
                            purchaseProduct={this.purchaseProduct}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
