This folder contains research on RSA/DH/ECC cryptography. 

> **This is hand-written notebooks*, NOT AI-generated* (except for one). [Chats](https://github.com/dk14/crypto/blob/main/chats) with AI (GPT-OSS, "critical" "thinking" model) prove it was generating fiction (eg, talking to me about lattice theory which is useless for practical work with DLP). As well as one or two notebooks, I asked to generate (ends with "-ai").

The bottom line: fastexp overhead is non-monotonic. Asymmetric encryption has "cat in a bag" security - defender has to spend as much energy/resources as attacker to ensure security of a given pubkey.

No free lunch, but illusion that there is.

Statistical estimates of "overheads of fast exp for DLP", which NIST and others (eg Blackberry) are using as an excuse, are not applicable to non-monotonic problems; made-up useless soviet 'proofs' there, coming from worst european ideas. 

> Additionally, ECC is even worse than DH, speaking of crypto - polynomials introduce more holes on top of illusions.
> Concretely - in one of the html notebooks here (I wrote by hand) - you can notice that naive billinear map shows that sign of encrypted number can be guessed sometimes, since a bit is flipping faster when you progress with decimals. There are trivial statistical dependencies, even on the strongest bitcoin curve.
>
> ECC creates jobs for cryptoanalysts simply.
>
> DLP Note on key restauration with deterministic slowexp (the only inductively proven way): [here](https://github.com/dk14/crypto/blob/main/dlp.html#L225) I show that local monotonicities can be exploited. [perfect power](https://github.com/dk14/crypto/blob/main/dlp.html#L137) (logN speedified with memoization) is used to skip through local monotonic interval.

-----

Energy conservation (or why not consumer/producer symmetry) also applies to TRNGs, but proof requires to replicate whole TRNG pipeline. 

> And without proof - cannot improve crypto

I partially replicated TRNG pipeline in a tool. PRs are welcome.

Bitcoin TRNG audit tool is here: https://github.com/dk14/crypto/tree/main/chats/btc-audit

Donations BTC: bc1qekvmkczge3hxrvwdf2lj3yyvgjnparn3fdf9lg
