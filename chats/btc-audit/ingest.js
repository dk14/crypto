import { open } from 'lmdb';
import fs from 'fs';
import split2 from 'split2';

const db = open({
  path: './btc-lmdb',
  mapSize: 1024 * 1024 * 1024 * 64, // 64GB
});

const stream = fs.createReadStream('blockchair_bitcoin_addresses_and_balance_LATEST.tsv')
  .pipe(split2());

let count = 0;

db.transaction(() => {
  stream.on('data', (line) => {
    if (!line) return;

    const [address, balance] = line.split('\t');

    // keep only real addresses
    if (!/^(1|3|bc1)/.test(address)) return;

    db.put(address, Number(balance));
    count++;

    if (count % 1_000_000 === 0) {
      console.log(`Processed ${count}`);
    }
  });

  stream.on('end', () => {
    console.log(`Done: ${count}`);
  });
});