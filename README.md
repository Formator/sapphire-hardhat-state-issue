# Sapphire Hardhat integration state issue demonstration

## Description

This example tries to demonstrate a problem with the Sapphire Hardhat integration, where the Hardhat script cannot change the state of an existing smart contract, where by all rules it could.

## Replicate the issue

1. Set enviroment variables for two accounts:

```sh
PRIVATE_KEY=your_sapphire_private_key_in_hex
PRIVATE_KEY_TESTER=your_sapphire_private_key_in_hex
```

2. Fund some ROSE on test accounts
3. Run deploy

```sh
npx hardhat run scripts/deploy.js --network sapphire
```

4. Run test

```sh
npx hardhat run scripts/test.js --network sapphire
```

## Wrong Test output

```console
Token address: 0xe01dCBaBe0FFB65b29df36C39FA28822517ceb49
Token deployer was:  0x84373E739d2c50eE55EF8a3AF7238f77804f83bF
Testing the contracts with the account: 0xC88309139e5809f4E736D700bB8Aca31540C67d8
1 - Check if tester account has enough ether
Tester account balance: 1992512000000000000
2 - Check if tester account has at least 100 tokens if he has't, send them from deployer account
Deployer account token balance before transfer: 1000000
Tester account token balance before transfer: 0
Deployer account token balance after transfer: 1000000
Tester account token balance after transfer: 0
ERROR: Tester account token balance not changed!!
3 - Check if tester account can transfer 10 token to deployer account
Tester don't have enough tokens to send. Balance: 0
```

## Expected Test output (focus on balance)
```console
Token address: 0x7cb7E002314d616fEA7F4bfE1FD6A9c117561500
Token deployer was:  0x84373E739d2c50eE55EF8a3AF7238f77804f83bF
Testing the contracts with the account: 0xC88309139e5809f4E736D700bB8Aca31540C67d8
1 - Check if tester account has enough ether
Tester account balance: 11979414400000000000
2 - Check if tester account has at least 100 tokens if he has't, send them from deployer account
Deployer account token balance before transfer: 1000000
Tester account token balance before transfer: 0
before transaction
transaction completed
Deployer account token balance after transfer: 999900
Tester account token balance after transfer: 100
3 - Check if tester account can transfer 10 token to deployer account
Deployer account token balance before transfer: 999900
Tester account token balance before transfer: 100
Deployer account token balance after transfer: 999910
Tester account token balance after transfer: 90
```

## Explanation

"ERROR: Tester account token balance not changed!!" --> Smart Contract state has not changed

## Issues resolving
- Smart Contract State doesn't change has been resolved within this [issue](https://github.com/oasisprotocol/sapphire-paratime/issues/106)
- Error when calling Smart Contract's method from signer other then deployer has been resolved within this - [issue](https://github.com/oasisprotocol/sapphire-paratime/issues/123)