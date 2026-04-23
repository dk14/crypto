This folder contains research on RSA/DH/ECC cryptography. 

The bottom line: fastexp overhead is non-monotonic. Asymmetric encryption has "cat in a bag" security - defender has to spend as much energy/resources as attacker to ensure security of a given pubkey.
Statistical estimates of "overheads of fast exp for DLP", which NIST and others (eg Blackberry) are using as an excuse, are not applicable to non-monotonic problems; made-up useless soviet 'proofs' there, coming from worst european ideas. 

-----

Energy conservation also applies to TRNGs, but proof requires to replicate whole TRNG pipeline. 
I partially replicated it in a tool. PRs are welcome.

Bitcoin TRNG audit tool is here: https://github.com/dk14/crypto/tree/main/chats/btc-audit

Donations BTC: bc1qekvmkczge3hxrvwdf2lj3yyvgjnparn3fdf9lg
