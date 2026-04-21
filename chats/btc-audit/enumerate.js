import { open } from 'lmdb';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const ecc = require('tiny-secp256k1')
const { BIP32Factory } = require('bip32')
const bip32 = BIP32Factory(ecc)

const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
import { createReadStream } from 'node:fs';

import { randomFill } from 'node:crypto';

/* -------------------------------------------------------------
   1️⃣  Infinite true‑random generator (gap‑free)
   ------------------------------------------------------------- */
async function* urandomGenerator(chunkSize = 64 * 1024) {
  let stream;
  try {
    // works on Unix/macOS
    stream = createReadStream('/dev/urandom', { highWaterMark: chunkSize });
  } catch (_) {
    stream = null;
  }

  if (stream) {
    for await (const chunk of stream) {
      yield chunk;               // Buffer from /dev/urandom
    }
  } else {
    // Windows or any platform where /dev/urandom is absent
    while (true) {
      const buf = Buffer.allocUnsafe(chunkSize);
      await randomFill(buf);     // OS CSPRNG (BCryptGenRandom on Windows)
      yield buf;
    }
  }
}

/* -------------------------------------------------------------
   2️⃣  Sliding 128‑bit window that consumes the generator
   ------------------------------------------------------------- */
class SlidingEntropy {
  #window = new Uint8Array(16); // 128‑bit buffer
  #filled = 0;
  #ready  = false;              // true after first 16 bytes

  constructor() {
    this._consume(urandomGenerator()); // start background consumption
  }

  /** Background consumer – runs forever */
  async _consume(asyncIter) {
    for await (const chunk of asyncIter) {
      for (const b of chunk) {
        if (this.#filled < 16) {
          this.#window[this.#filled++] = b;
          if (this.#filled === 16) this.#ready = true;
        } else {
          // slide left by one byte, append newest byte
          this.#window.copyWithin(0, 1);
          this.#window[15] = b;
        }
      }
    }
  }

  /** Public check – is the first 16 bytes already received? */
  isReady() {
    return this.#ready;
  }

  /** Return a *copy* of the current 128‑bit entropy */
  getEntropy() {
    if (!this.#ready) {
      throw new Error('Entropy not yet ready – wait a few ms after startup.');
    }
    return Buffer.from(this.#window);
  }
}

/* -------------------------------------------------------------
   3️⃣  Singleton instance used by the public API
   ------------------------------------------------------------- */
const _entropy = new SlidingEntropy();

/* -------------------------------------------------------------
   4️⃣  Public function – fresh 12‑word BIP‑39 mnemonic
   ------------------------------------------------------------- */
export async function getSeed() {
  // If the very first bytes haven’t arrived yet, pause briefly.
  while (!_entropy.isReady()) {
    await new Promise(r => setTimeout(r, 5));
  }

  return _entropy.getEntropy(); // 16 bytes = 128 bits
}

const db = open({
  path: './btc-lmdb',
  readOnly: true
});

const OUTPUT_DIR = './output';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

let total = 0;
let hits = 0;

function safeWrite(address, balance, seed) {
  const filePath = path.join(OUTPUT_DIR, `${address}.txt`);

  const content = `address=${address}\nbalance=${balance}\nseed=${seed}\n`;

  fs.writeFileSync(filePath, content, { flag: 'w' });
}

const NETWORK          = bitcoin.networks.bitcoin       
const COIN_TYPE        = 0;           // 0 = BTC mainnet, 1 = testnet
const ACCOUNT          = 0;           // default account
const CHANGE           = 0;           // 0 = external (receive) chain
const NUM_ADDRESSES    = 10;         

//Common purpose codes include 44 for legacy addresses (P2PKH), 49 for wrapped SegWit addresses (P2SH-P2WPKH), and 84 for native SegWit addresses (P2WPKH).

function deriveAddress(node, index, purpose) {
  // BIP‑44 path: m / purpose' / coin_type' / account' / change / address_index
  const path = `m/${purpose}'/${COIN_TYPE}'/${ACCOUNT}'/${CHANGE}/${index}`;
  //console.log(path)
  const child = node.derivePath(path);

  const derive = purpose !== 44 ? bitcoin.payments.p2wpkh : bitcoin.payments.p2pkh
  const d = derive({
    pubkey: child.publicKey,
    network: NETWORK,
  });

  if (purpose === 49) {
    const { address } = bitcoin.payments.p2sh({
        redeem: d,
        network: bitcoin.networks.bitcoin,
    });
    return address
  }
  //console.log(address)
  return d.address
}


function getAddressesFromSeed(seed) {
    // Buffer (or any Uint8Array‑compatible object)
    const root = bip32.fromSeed(seed, NETWORK);
    const addresses = [];

    for (let i = 0; i < NUM_ADDRESSES; i++) {
        addresses.push(deriveAddress(root, i, 44));
        addresses.push(deriveAddress(root, i, 49));
        addresses.push(deriveAddress(root, i, 84));
    }

    return addresses
}

async function genNextSeed(seed) {
    return await getSeed()
}

async function runAudit() {
    while (true) {
        const seed = await genNextSeed();
        if (!seed) break;

        const addresses = getAddressesFromSeed(seed);

        //addresses.push('bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2')
        addresses.forEach(address => {
            //console.log(address)
            const balance = db.get(address);

            total++;

            if (balance !== undefined) {
                hits++;

                safeWrite(address, balance, Buffer.from(seed).toString('hex'));
            }

            if (total % 1000 === 0) {
                console.log({
                    processed: total,
                    hits,
                    hitRate: hits / total
                });
            }
        })
    } 

    console.log('Done:', { total, hits });
}

runAudit()
