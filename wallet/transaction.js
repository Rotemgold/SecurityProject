const uuid = require('uuid/v1');
const { verifySignature} = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

class Transaction {
  constructor({ senderWallet, recipient, amount, privateKey, outputMap, input }) {
    this.id = uuid();
    this.outputMap = outputMap || this.createOutputMap({ senderWallet, recipient, amount, privateKey });
    this.input = input || this.createInput({ senderWallet, outputMap: this.outputMap });
  }

  createOutputMap({ senderWallet, recipient, amount, privateKey }) {
    const outputMap = {};

    outputMap[senderWallet.privateKey] = senderWallet.privateKey;
    outputMap[recipient] = amount;
    outputMap[senderWallet.publicKey] = senderWallet.balance - amount;
    
    return outputMap;
  }

  createInput({ senderWallet, outputMap }) {
    return {
      timestamp: Date.now(),
      amount: senderWallet.balance,
      address: senderWallet.publicKey,
      signature: senderWallet.sign(outputMap)
    };
  }

  update({ senderWallet, recipient, amount, privateKey }) {
    if (amount > this.outputMap[senderWallet.publicKey]) {
      throw new Error('Amount exceeds balance');
    }
    if(privateKey != (this.outputMap[senderWallet.privateKey]).toString(16))
    {
      //console.log((this.outputMap[senderWallet.privateKey]).toString(16));
      console.log(privateKey);
      throw new Error('Wrong password');
    }

    if (!this.outputMap[recipient]) {
      this.outputMap[recipient] = amount;
    } else {
      this.outputMap[recipient] = this.outputMap[recipient] + amount;
    }

    this.outputMap[senderWallet.publicKey] =
      this.outputMap[senderWallet.publicKey] - amount;

    this.input = this.createInput({ senderWallet, outputMap: this.outputMap });
  }

  static validTransaction(transaction) {
    const { input: { address, amount, signature }, outputMap } = transaction;

    const outputTotal = Object.values(outputMap)
      .reduce((total, outputAmount) => total + outputAmount);

    if (amount !== outputTotal) {
      console.error(`Invalid transaction from ${address}`);
      return false;
    }

    if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
      console.error(`Invalid signature from ${address}`);
      return false;
    }

    return true;
  }

  static rewardTransaction({ minerWallet }) {
    return new this({
      input: REWARD_INPUT,
      outputMap: { [minerWallet.publicKey]: MINING_REWARD }
    });
  }
}

module.exports = Transaction;