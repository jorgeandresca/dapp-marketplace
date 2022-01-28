const { assert } = require("chai");

const Marketplace = artifacts.require("./Marketplace");
require('chai')
    .use(require('chai-as-promised'))
    .should();

contract('Marketplace', ([deployer, seller, buyer]) => {
    let marketplace;

    before(async () => {
        marketplace = await Marketplace.deployed();
    })

    describe('Checking deployment', async () => {
        it('Correct name', async () => {
            const address = await marketplace.address;

            //So the address it not empty
            assert.notEqual(address, 0x0);
            assert.notEqual(address, '');
            assert.notEqual(address, null);
            assert.notEqual(address, undefined);
        })

        it('Has address', async () => {
            const name = await marketplace.name();
            assert.equal(name, 'Dapp Marketplace');
        })
    })

    describe('Checking products', async () => {
        let result, productsCount, price;

        before(async () => {
            price = web3.utils.toWei('1', 'Ether');
            result = await marketplace.createProduct('iPhone X', price, { from: seller });
            productsCount = await marketplace.productsCount();
        })

        it('Creates product', async () => {
            // SUCCESS
            assert.equal(productsCount, 1);
            const event = result.logs[0].args;
            assert.equal(event.id.toNumber(), productsCount, 'checking id');
            assert.equal(event.name, 'iPhone X', 'checking name');
            assert.equal(event.price, price, 'checking price');
            assert.equal(event.owner, seller, 'checking owner');
            assert.equal(event.purchased, false, 'checking purchased');

            // FAILURED
            // no name
            await marketplace.createProduct('', price, { from: seller }).should.be.rejected;

            //no price
            await marketplace.createProduct('iPhone X', 0, { from: seller }).should.be.rejected;
        })

        it('Get a product', async () => {
            // SUCCESS
            const product = await marketplace.products(productsCount);
            assert.equal(product.id.toNumber(), productsCount, 'checking id');
            assert.equal(product.name, 'iPhone X', 'checking name');
            assert.equal(product.price, '1000000000000000000', 'checking price');
            assert.equal(product.owner, seller, 'checking owner');
            assert.equal(product.purchased, false, 'checking purchased');
        })

        it('Sell a product', async () => {

            // Track seller balance before purchase
            let oldSellerBalance;
            oldSellerBalance = await web3.eth.getBalance(seller);
            oldSellerBalance = new web3.utils.BN(oldSellerBalance);

            // SUCCESS
            // Checking the product
            result = await marketplace.purchaseProduct(productsCount, { from: buyer, value: web3.utils.toWei('1', 'Ether') })
            const event = result.logs[0].args;
            assert.equal(event.id.toNumber(), productsCount, 'checking id');
            assert.equal(event.name, 'iPhone X', 'checking name');
            assert.equal(event.price, price, 'checking price');
            assert.equal(event.owner, buyer, 'checking owner');
            assert.equal(event.purchased, true, 'checking purchased');

            // Checking the seller received the funds
            let newSellerBalance;
            newSellerBalance = await web3.eth.getBalance(seller);
            newSellerBalance = new web3.utils.BN(newSellerBalance);

            price = new web3.utils.BN(price);

            const expectedBalance = oldSellerBalance.add(price)
            assert.equal(newSellerBalance, expectedBalance.toString(), 'checking seller got paid');

            // FAILURE
            // Trying to buy a product that doesn't exist
            await marketplace.purchaseProduct(99, { from: buyer }).should.be.rejected;
            // Seller trying to buy his own product
            await marketplace.purchaseProduct(price, { from: seller }).should.be.rejected;
            // Trying to buy a product that has been already purchased
            await marketplace.purchaseProduct(price, { from: deployer }).should.be.rejected;
        })


    })

})