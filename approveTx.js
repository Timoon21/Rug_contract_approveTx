const web3 = require('@solana/web3.js');
const fetch = require('node-fetch');

// Log to File
const { Console } = require("console");
const fs = require("fs");
const myLogger = new Console({
  stdout: fs.createWriteStream(`log.csv`),
});
//

const ADRESS_TO_SCAN = '31ARfyxZg6fr1J9hVs1NqBWkdeYeCKipuY71bMovNpy9' // SolFire Rug Program
const RPC_URL = 'https://ssc-dao.genesysgo.net/'
const ELT_NB = 1000
const connection = new web3.Connection(RPC_URL, 'confirmed');

const setTxParam = (before) => {
  param = {"limit": ELT_NB}
  if (before){param.before = before}
  return param
}

async function getTx(before) {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getSignaturesForAddress",
        "params": [
          ADRESS_TO_SCAN,
          setTxParam(before)
        ]
      }),
    });
    const result = await response.json()
    return result.result
}

async function searchApprouveAndReturnLastTx(tx){
  let txSig, txParsed, txSigner, txDate
  for (let i in tx){
    txSig = tx[i].signature
    txParsed = await connection.getParsedTransaction(txSig)
    try{
      for (j in txParsed.transaction.message.instructions){
        try{
          type = txParsed.transaction.message.instructions[j].parsed.type
          if (type == "approve"){
            if (!txParsed.meta.err) {
            txSigner = txParsed.transaction.message.accountKeys[0].pubkey.toString()
            txDate = new Date(txParsed.blockTime*1000);
            myLogger.log(`${txDate};${txSigner};${txSig}`)
            console.log(txDate, "- Signer:", txSigner,"- Tx:", txSig)
            }
          }
        process.stdout.write(`${txSig} \r`)
        } catch (e) {}
      }
    } catch (e) {}
  }
  return txSig;
}




const main = async () => {
  myLogger.log("Date; Signer; Tx")
  let lastTx = false
  let tx = Array.from(Array(ELT_NB).keys())

  while (tx.length >= ELT_NB){
    tx = await getTx(lastTx);
    lastTx = await searchApprouveAndReturnLastTx(tx);
  }
};

main();
