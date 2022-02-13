const { ethers } = require("hardhat");
web3 = require('web3');

const { parseEther } = ethers.utils;
const { MaxUint256 } = ethers.constants;

const { expect } = require("chai");
require('chai').use(require('chai-as-promised')).should();
const assert = require("assert");

const routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const factoryAddress = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";

describe('GIVERS', function () {
  let givers;
  let router;
  let factory;
  let owner;
  let charityWallet;
  let marketingWallet;
  let aliceWallet;
  let bobWallet;

  before(async function () {
    router = await ethers.getContractAt("IUniswapV2Router02", routerAddress);
    factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress);

    const Givers = await ethers.getContractFactory("GIVERS");
    [owner, charityWallet, marketingWallet, aliceWallet, bobWallet] = await ethers.getSigners();

    givers = await Givers.deploy(charityWallet.address, marketingWallet.address);
    await givers.deployed();
  });

  describe('deployment', () => {
    it('assigns the total supply to the deployer', async () => {
      const totalSupply = parseEther('1000000000');
      const ownerBalance = await givers.balanceOf(owner.address);

      expect(await givers.totalSupply()).to.equal(ownerBalance);
      expect(await givers.totalSupply()).to.equal(totalSupply);
    })
  })

  describe('transfer excluded and not excluded from fee', () => {
    it('transfer to wallets that are excluded', async () => {
      const amount = parseEther('100');
      const ownerBalanceBefore = await givers.balanceOf(owner.address);
      const bobBalanceBefore = await givers.balanceOf(bobWallet.address);

      await givers.transfer(bobWallet.address, amount);

      const ownerBalanceAfter = await givers.balanceOf(owner.address);
      const bobBalanceAfter = await givers.balanceOf(bobWallet.address);

      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore.sub(bobBalanceAfter));
      expect(bobBalanceAfter).to.equal(bobBalanceBefore.add(amount));

      it('transfer to wallets that are not excluded from fee', async () => {
        const amount = parseEther('100');
        await givers.transfer(bobWallet.address, amount);

        const ownerBalanceBefore = await givers.balanceOf(owner.address);
        const bobBalanceBefore = await givers.balanceOf(bobWallet.address);

        await givers.connect(bobWallet).transfer(aliceWallet.address, amount);

        const ownerBalanceAfter = await givers.balanceOf(owner.address);
        const bobBalanceAfter = await givers.balanceOf(bobWallet.address);
        const aliceBalanceAfter = await givers.balanceOf(aliceWallet.address);

        assert.notEqual(ownerBalanceAfter, ownerBalanceBefore.sub(aliceBalanceAfter));
        expect(bobBalanceAfter).to.equal(bobBalanceBefore.sub(amount));
      })
    })
  })

  describe('addLiquidity', () => {
    it('checks adding liquidity', async () => {
      const supply = parseEther('1000');
      const wethAddr = await router.WETH();
      const pairAddress = await factory.getPair(givers.address, wethAddr);

      await givers.approve(routerAddress, MaxUint256);

      const ownerBalanceBefore = await givers.balanceOf(owner.address);
      const pairLiquidityBefore = await givers.balanceOf(pairAddress);

      await router.addLiquidityETH(givers.address, supply, supply, supply, owner.address, MaxUint256, { value: supply });

      const ownerBalanceAfter = await givers.balanceOf(owner.address);
      const pairLiquidityAfter = await givers.balanceOf(pairAddress);

      expect(pairLiquidityAfter).to.equal(pairLiquidityBefore.add(supply));
      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore.sub(supply));
    })
  })

  describe('SwapAndLiquify', () => {
    it('checks swap and liquify', async () => {
      const taxFee = 3;
      const liquidityFee = 3;
      const marketingFee = 3;
      const charityFee = 3;

      const supply = parseEther('1000');

      await givers.approve(routerAddress, MaxUint256);

      await router.addLiquidityETH(givers.address, supply, supply, supply, owner.address, MaxUint256, { value: supply });

      await givers.transfer(bobWallet.address, parseEther('100000000'));

      await givers.connect(bobWallet).transfer(aliceWallet.address, parseEther('90000000'));

      let tx = await givers.connect(aliceWallet).transfer(bobWallet.address, parseEther('1000'));

      const totalFee = liquidityFee + marketingFee + charityFee;
      const balance = parseEther('1000000');
      const fromLiquidityFee = balance.div(totalFee).mul(taxFee);
      const otherTokens = balance.sub(fromLiquidityFee);
      const half = fromLiquidityFee.div(2);
      const otherHalf = fromLiquidityFee.sub(half);

      const rc = await tx.wait();
      const event = rc.events.find(event => event.event === 'SwapAndLiquify');
      const [tokensSwapped, , tokensIntoLiqudity] = event.args;

      expect(tokensSwapped.toString()).to.equal(half.add(otherTokens).toString());
      expect(tokensIntoLiqudity.toString()).to.equal(otherHalf.toString());
    })
  })
});
