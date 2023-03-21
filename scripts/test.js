const sapphire = require('@oasisprotocol/sapphire-paratime');
const fs = require("fs");

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to test a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network sapphire'"
    );
  }

  const addressesFile = __dirname + "/../deployments/contract-address.json";

  if (!fs.existsSync(addressesFile)) {
    console.error("You need to deploy your contract first");
    return;
  }

  const addressJson = fs.readFileSync(addressesFile);
  const address = JSON.parse(addressJson);

  if ((await ethers.provider.getCode(address.Token)) === "0x") {
    console.error("You need to deploy your contract first");
    return;
  }

  const token = await ethers.getContractAt("Token", address.Token);
  const [deployer, tester] = await ethers.getSigners();

  const deployerTokenReadInstance = await token.connect(deployer);
  const deployerTokenWriteInstance = await token.connect(sapphire.wrap(deployer));

  const testerTokenReadInstance = await token.connect(tester);
  const testerTokenWriteInstance = await token.connect(sapphire.wrap(tester));

  console.log("Token address:", token.address);
  console.log("Token deployer was: ", await deployer.getAddress());
  console.log("Testing the contracts with the account:", await tester.getAddress());

  // 1. Check if tester account has enough ether to execute later test transactions
  console.log("1 - Check if tester account has enough ether");
  let testerBalance = await tester.getBalance();
  if (testerBalance.lt(ethers.utils.parseEther("1"))) {
    console.log("Tester account balance before transfer:", testerBalance.toString());
    // Send some ether to the tester account
    const tx1 = await deployer.sendTransaction({
      to: tester.address,
      value: ethers.constants.WeiPerEther,
      data: "0x" // This is required to send ether
    });
    await tx1.wait();

    console.log("Tester account balance after transfer:", (await tester.getBalance()).toString());
  }
  else {
    console.log("Tester account balance:", testerBalance.toString());
  }

  // 2. Check if tester account has enough token
  console.log("2 - Check if tester account has at least 100 tokens if he has't, send them from deployer account");
  // ISSUE: balanceOf call work only from deployer normal signer
  let testerTokenBalanceBefore = await deployerTokenReadInstance.balanceOf(tester.address);
  let deployerTokenBalanceBefore = await deployerTokenReadInstance.balanceOf(deployer.address);
  if (testerTokenBalanceBefore.lt(100)) {
    console.log("Deployer account token balance before transfer:", deployerTokenBalanceBefore.toString());
    console.log("Tester account token balance before transfer:", testerTokenBalanceBefore.toString());
    // Send some token to the tester account
    // ISSUE: transfer transaction below work without revert, but blockchain state will not be changed (balanceOf call for tester return same as before)
    const tx2 = await deployerTokenWriteInstance.transfer(tester.address, 100);
    await tx2.wait();
    testerTokenBalanceAfter = await deployerTokenReadInstance.balanceOf(tester.address);
    deployerTokenBalanceAfter = await deployerTokenReadInstance.balanceOf(deployer.address);
    console.log("Deployer account token balance after transfer:", deployerTokenBalanceAfter.toString());
    console.log("Tester account token balance after transfer:", testerTokenBalanceAfter.toString());
    if (testerTokenBalanceBefore.eq(testerTokenBalanceAfter)) {
      console.log("ERROR: Tester account token balance not changed!!");
    }
  }
  else {
    console.log("Tester account have enough tokens. Balance:", testerTokenBalanceBefore.toString());
  }

  // 3. Check if tester account can transfer token to deployer account
  console.log("3 - Check if tester account can transfer 10 token to deployer account");
  deployerTokenBalanceBefore = await deployerTokenReadInstance.balanceOf(deployer.address);
  testerTokenBalanceBefore = await deployerTokenReadInstance.balanceOf(tester.address);
  if (testerTokenBalanceBefore.gte(10)) {
    console.log("Deployer account token balance before transfer:", deployerTokenBalanceBefore.toString());
    console.log("Tester account token balance before transfer:", testerTokenBalanceBefore.toString());
    // Send some token to the deployer account
    // ISSUE: transfer transaction below work without revert, but blockchain state will not be changed (balanceOf call for tester return same as before)
    const tx3 = await testerTokenWriteInstance.transfer(deployer.address, 10);
    await tx3.wait();
    testerTokenBalanceAfter = await deployerTokenReadInstance.balanceOf(tester.address);
    deployerTokenBalanceAfter = await deployerTokenReadInstance.balanceOf(deployer.address);
    console.log("Deployer account token balance after transfer:", deployerTokenBalanceAfter.toString());
    console.log("Tester account token balance after transfer:", testerTokenBalanceAfter.toString());
    if (testerTokenBalanceBefore.eq(testerTokenBalanceAfter)) {
      console.log("ERROR: Tester account token balance not changed!!");
    }
  }
  else {
    console.log("Tester don't have enough tokens to send. Balance:", testerTokenBalanceBefore.toString());
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
