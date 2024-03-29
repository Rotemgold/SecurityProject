const Transaction = require('./transaction');
const { STARTING_BALANCE } = require('../config');
const { ec, cryptoHash } = require('../util');

class Wallet {
  constructor() {
    this.balance = STARTING_BALANCE;

    this.keyPair = ec.genKeyPair();


    this.publicKey = this.keyPair.getPublic().encode('hex');
    this.privateKey = this.keyPair.getPrivate();
    console.log("Your privte key= " + this.privateKey.toString(16));
  }

  sign(data) {
    return this.keyPair.sign(cryptoHash(data))
  }

  createTransaction({ recipient, amount, privateKey, chain  }) {
    if (chain) {
      this.balance = Wallet.calculateBalance({
        chain,
        address: this.publicKey
      });
    }

    if (amount > this.balance) {
      throw new Error('Amount exceeds balance');
    }

     if(privateKey != this.privateKey.toString(16))
     {
       console.log(privateKey);
       console.log(this.privateKey.toString(16));
       throw new Error('Wrong password2');
     }


    return new Transaction({ senderWallet: this, recipient, amount });
  }

  static calculateBalance({ chain, address }) {
    let hasConductedTransaction = false;
    let outputsTotal = 0;

    for (let i=chain.length-1; i>0; i--) {
      const block = chain[i];

      for (let transaction of block.data) {
        if (transaction.input.address === address) {
          hasConductedTransaction = true;
        }

        const addressOutput = transaction.outputMap[address];

        if (addressOutput) {
          outputsTotal = outputsTotal + addressOutput;
        }
      }

      if (hasConductedTransaction) {
        break;
      }
    }

    return hasConductedTransaction ? outputsTotal : STARTING_BALANCE + outputsTotal;
  }
};

module.exports = Wallet;