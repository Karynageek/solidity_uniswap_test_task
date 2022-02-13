const { ethers } = require("hardhat");

async function main() {
  const Givers = await ethers.getContractFactory("GIVERS");
  [owner, charityWallet, marketingWallet] = await ethers.getSigners();

  const givers = await Givers.deploy(charityWallet.address, marketingWallet.address);
  await givers.deployed();

  console.log("Givers deployed to:", givers.address);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });