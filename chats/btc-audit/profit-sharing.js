/**
 * profit-share.js
 * -------------------------------------------------
 * A tiny “profit‑sharing fund” in JavaScript / Node.
 *
 *  • Takes the whole balance of a local Bitcoin Core wallet.
 *  • Finds every transaction that ever sent coins to a given address.
 *  • Sends each contributor a share proportional to what they originally sent.
 *
 *  Dependencies:
 *    npm i bitcoin-core bitcoinjs-lib
 *
 *  WARNING:  This script is for demonstration / testing only.
 *            Do NOT run it on a hot‑wallet with real funds until you
 *            understand every line and have added proper safety checks.
 */

const BitcoinCore = require('bitcoin-core');
const bitcoin = require('bitcoinjs-lib');

// -------------------------------------------------
// 1️⃣  CONFIGURATION
// -------------------------------------------------
const CONFIG = {
  // RPC connection to your local bitcoind
  rpc: {
    network: 'mainnet',          // or 'testnet' / 'regtest'
    username: 'yourrpcuser',
    password: 'yourrpcpassword',
    host: '127.0.0.1',
    port: 8332,                  // 18332 for testnet, 18443 for regtest
  },

  // The address that acts as the “fund”. All incoming funds are pooled here.
  // (Replace with the address you actually want to share profits from)
  fundAddress: 'bc1qekvmkczge3hxrvwdf2lj3yyvgjnparn3fdf9lg',

  // Minimum amount (satoshis) a contributor must have sent to be included.
  // This avoids dust‑spam that would otherwise bloat the transaction.
  minContribution: 1000, // 1 000 sat ≈ $0.30 at $30k/BTC

  // Fee rate (sat/vByte) you want to pay. Adjust as needed.
  feeRateSatPerVByte: 8,
};

// -------------------------------------------------
// 2️⃣  CREATE RPC CLIENT
// -------------------------------------------------
const client = new BitcoinCore(CONFIG.rpc);

// -------------------------------------------------
// 3️⃣  HELPERS
// -------------------------------------------------
/**
 * Convert BTC string → satoshis (Number)
 */
function btcToSat(btc) {
  return Math.round(parseFloat(btc) * 1e8);
}

/**
 * Estimate transaction weight (vbytes) for given numbers of inputs/outputs.
 * Very rough – good enough for a demo.
 */
function estimateVSize(numInputs, numOutputs) {
  // P2WPKH input: 68 vbytes
  // P2WPKH output: 31 vbytes
  // + 10 vbytes overhead
  return 10 + numInputs * 68 + numOutputs * 31;
}

/**
 * Build a PSBT (Partial‑Signed Bitcoin Transaction) with the given inputs/outputs.
 */
function buildPsbt({ inputs, outputs, network }) {
  const psbt = new bitcoin.Psbt({ network });

  inputs.forEach(i => psbt.addInput(i));
  outputs.forEach(o => psbt.addOutput(o));

  return psbt;
}

/**
 * HACK: fetch raw transaction (hex) and decode it with bitcoinjs‑lib.
 * This is needed to get the exact vout index that paid to the fund address.
 */
async function getTxInfo(txid) {
  const rawHex = await client.command('getrawtransaction', txid, true); // true → decode
  return rawHex; // already a JSON object because of the 3rd argument
}

// -------------------------------------------------
// 4️⃣  MAIN LOGIC
// -------------------------------------------------
(async () => {
  try {
    // -----------------------------------------------------------------
    // 4.1  Get the whole balance of the wallet (excluding pending)
    // -----------------------------------------------------------------
    const walletInfo = await client.command('getwalletinfo');
    const totalBalanceSat = btcToSat(walletInfo.balance);
    if (totalBalanceSat === 0) {
      console.log('❌ Wallet balance is zero – nothing to distribute.');
      return;
    }
    console.log(`💰 Total spendable balance: ${totalBalanceSat} sat (${walletInfo.balance} BTC)`);

    // -----------------------------------------------------------------
    // 4.2  Find every TX that ever sent to the fund address.
    //      We’ll use `listtransactions` with a *large* count and filter.
    // -----------------------------------------------------------------
    console.log('🔎 Scanning wallet history for contributions…');
    const history = await client.command('listtransactions', '*', 10000, 0, true);
    // Listtransactions returns each *receive* entry; we only keep those where
    // the address matches our fundAddress.
    const contributions = {};

    history.forEach(entry => {
      if (entry.address !== CONFIG.fundAddress) return;
      if (entry.category !== 'receive') return; // ignore change
      if (entry.amount <= 0) return;

      // entry.amount is in BTC, convert to sat.
      const sat = btcToSat(entry.amount);
      if (sat < CONFIG.minContribution) return; // ignore dust

      // The original sender is NOT given directly – we need to look at the
      // *inputs* of the transaction that created this output.
      // We'll fetch the raw tx later, but for now just group by txid.
      if (!contributions[entry.txid]) contributions[entry.txid] = { sat, vout: entry.vout };
    });

    const txids = Object.keys(contributions);
    if (txids.length === 0) {
      console.log('⚠️ No qualifying contributions found.');
      return;
    }
    console.log(`✅ Found ${txids.length} contributing transactions.`);

    // -----------------------------------------------------------------
    // 4.3  For each contribution transaction, discover the *sender address(es)*.
    //      This is done by examining the inputs of each tx and taking the
    //      first P2WPKH input’s address (good enough for a demo).
    // -----------------------------------------------------------------
    const senderMap = {}; // address → total sat contributed (aggregate across many txs)

    for (const txid of txids) {
      const txInfo = await getTxInfo(txid);
      // Find the output that belongs to the fund address (by vout index)
      const output = txInfo.vout.find(v => v.n === contributions[txid].vout);
      if (!output) continue; // should not happen
      const contributedSat = btcToSat(output.value);

      // Now look at inputs – we’ll take the first input’s address as “sender”.
      // (Outputs can have many inputs; in real life you’d probably want to
      //  aggregate per unique input address or even per scriptPubKey.)
      const firstInput = txInfo.vin[0];
      // Use `getrawtransaction` again to decode the previous output.
      const prevTx = await getTxInfo(firstInput.txid);
      const prevOut = prevTx.vout[firstInput.vout];
      const senderAddr = prevOut.scriptPubKey.addresses?.[0] || 'unknown';
      if (senderAddr === 'unknown') continue;

      // Accumulate contribution per sender address.
      senderMap[senderAddr] = (senderMap[senderAddr] || 0) + contributedSat;
    }

    // Remove any entries that fell below the dust limit after aggregation.
    Object.entries(senderMap).forEach(([addr, sat]) => {
      if (sat < CONFIG.minContribution) delete senderMap[addr];
    });

    const contributors = Object.entries(senderMap);
    if (contributors.length === 0) {
      console.log('⚠️ No contributors passed the dust filter after aggregation.');
      return;
    }

    console.log('📊 Contributor list (address → sat contributed):');
    contributors.forEach(([addr, sat]) => console.log(`   ${addr}: ${sat}`));

    // -----------------------------------------------------------------
    // 4.4  Compute each participant’s share.
    // -----------------------------------------------------------------
    const totalContributedSat = contributors.reduce((sum, [, sat]) => sum + sat, 0);
    console.log(`🧮 Total contributed amount (used for share calc): ${totalContributedSat} sat`);

    // Build outputs: each address gets (balance * its share)
    const outputs = contributors.map(([addr, sat]) => {
      const fraction = sat / totalContributedSat;
      const payoutSat = Math.floor(totalBalanceSat * fraction);
      return {
        address: addr,
        value: payoutSat,
      };
    });

    // The sum of all payouts may be a few satoshis under the total because of
    // rounding.  Those remainder satoshis are left as miner fee.
    const payoutSum = outputs.reduce((s, o) => s + o.value, 0);
    const feeSat = totalBalanceSat - payoutSum;
    console.log(`🚀 Total payout will be ${payoutSum} sat, fee ≈ ${feeSat} sat`);

    // -----------------------------------------------------------------
    // 4.5  Gather *spendable* UTXOs from the wallet to fund the payouts.
    // -----------------------------------------------------------------
    const utxos = await client.command('listunspent', 1, 9999999, [CONFIG.fundAddress]);
    if (utxos.length === 0) {
      console.error('❌ No spendable UTXO found for the fund address.');
      return;
    }

    // Choose enough UTXOs to cover all payouts + fee.
    let selectedUtxos = [];
    let selectedTotal = 0;
    for (const u of utxos) {
      selectedUtxos.push(u);
      selectedTotal += btcToSat(u.amount);
      if (selectedTotal >= totalBalanceSat) break;
    }

    // Build PSBT inputs
    const network = bitcoin.Networks.bitcoin; // change to testnet if needed
    const inputs = selectedUtxos.map(u => ({
      hash: u.txid,
      index: u.vout,
      witnessUtxo: {
        script: Buffer.from(u.scriptPubKey, 'hex'),
        value: btcToSat(u.amount),
      },
    }));

    // -----------------------------------------------------------------
    // 4.6  Assemble the transaction
    // -----------------------------------------------------------------
    const psbt = buildPsbt({ inputs, outputs, network });

    // Sign all inputs with the wallet (using `walletprocesspsbt` RPC)
    const base64Psbt = psbt.toBase64();
    const signed = await client.command('walletprocesspsbt', base64Psbt, true, 'ALL', false);
    if (!signed.complete) {
      console.error('❌ Could not fully sign the transaction via RPC.');
      return;
    }

    // Extract the final raw transaction hex
    const final = await client.command('finalizepsbt', signed.psbt);
    if (!final.hex) {
      console.error('❌ finalizepsbt did not return a hex string.');
      return;
    }

    // -----------------------------------------------------------------
    // 4.7  Broadcast
    // -----------------------------------------------------------------
    const txid = await client.command('sendrawtransaction', final.hex);
    console.log(`✅ Transaction broadcast! TXID: ${txid}`);

  } catch (err) {
    console.error('🚨 Unexpected error:', err);
  }
})();

//Explorer Node required for full integration, and unit tests
