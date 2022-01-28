require('babel-register');
require('babel-polyfill');
const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
    networks: {
        development: {
            host: "127.0.0.1",
            port: 7545,
            network_id: "*" // Match any network id
        },
        ropsten: {
            provider: function () {
                return new HDWalletProvider([process.env.MNEMONIC], process.env.ROPSTENURL)
            },
            network_id: 3,
            gas: 4000000      //make sure this gas allocation isn't over 4M, which is the max
        }
    },
    contracts_directory: './src/contracts/',
    contracts_build_directory: './src/abis/',
    compilers: {
        solc: {
            version: "0.8.11",
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    }
}
