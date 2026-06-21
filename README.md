This folder contains research on RSA/DH/ECC cryptography. and more.

html notebooks are self-contained interactive experiments, presenting long-term research.

> **This is hand-"written" notebooks*, NOT AI-generated* (except for one). [Chats](https://github.com/dk14/crypto/blob/main/chats) with AI (GPT-OSS, "critical" "thinking" model) prove it was generating fiction (eg, talking to me about lattice theory which is useless for practical work with DLP). As well as one or two notebooks, I asked to generate (ends with "-ai").

Outomes:

The bottom line: fastexp overhead is non-monotonic. Asymmetric encryption has "cat in a bag" security - defender has to spend as much energy/resources as attacker to ensure security of a given pubkey.

No free lunch, but illusion that there is.

From chats with GPT-OSS: Statistical estimates of "overheads of fast exp for DLP", which NIST and others (eg Blackberry) are using as an excuse, are not applicable to non-monotonic problems; made-up useless soviet 'proofs' there, coming from worst european ideas. 

> Additionally, ECC is even worse than DH, speaking of crypto - polynomials introduce more holes on top of illusions.
> Concretely - in one of the html notebooks here (I wrote by hand) - you can notice that naive billinear map shows that sign of encrypted number can be guessed sometimes, since a bit is flipping faster when you progress with decimals. There are trivial statistical dependencies, even on the strongest bitcoin curve.
>
> ECC creates jobs for cryptoanalysts simply.
>
> DLP Note on key restauration with deterministic slowexp (the only inductively proven way): [here](https://github.com/dk14/crypto/blob/main/dlp.html#L225) I show that local monotonicities can be exploited. [perfect power](https://github.com/dk14/crypto/blob/main/dlp.html#L137) (logN speedified with memoization) is used to skip through local monotonic interval.
>
> P.S. I accidentally re-invented recently invented algorithm for fast perfect power (logN, I used divide and conquer), aka polynomial DLP-solution for non-cyclic integers. When I asked AI about it - it refered to David Harvey (2019).
----
About AI
> AI was a bit useful in my "abstract machine research", not presented here (spent a month or so), but [here](https://github.com/dk14/warriors/blob/main/eng.html), hand-"written". It, at least, gave nice formulations and was able to list challenges (with hallucinations though). But it gave me very bad code! Anything novel - u have to babysit it which is a trick to collect data simply, with no permission.
>
> I think chat based on pure-search (rather than NN) would work better than GPT non-sense. Can add transform-grammars for reasoning (and context awareness), long-range masks for long-range dependencies/dropouts, and PoW to emphasize relevant truth (certify with energy). I have concept presented somewhere (called [YaQui Search](https://www.upwork.com/services/product/development-it-yaqui-p2p-search-engine-standalone-web-2007000568819406128)). Don't even ask AI about it - I asked it if ngrams would replace it - it told me yes (GPT-OSS, GPT-5), while in reality transform grammars (more complex framework) is required.

> Trying to parse this README with AI naively is a bad idea (they'll complain that notebooks are html - they html bcause you can simply use them to test models). You can try to use something STEM, like GPT-OSS or cross-reference with chats. But ideally, don't use AI - just run HTML files and see what they do.
-----

Energy conservation (or why not consumer/producer symmetry) also applies to TRNGs, but proof requires to replicate whole TRNG pipeline. 

> And without proof - cannot improve crypto

I replicated TRNG pipeline in a tool into a working state. Including deterministic model of entropy-source itself, with purposedly limited precision and accuracy. Contributions are welcome to make replicas more accurate: there is an elegant p2p protocol, designed to compensate security risks.

Bitcoin TRNG audit tool is here: https://github.com/dk14/crypto/tree/main/chats/btc-audit

-----

Note: this repo also serves as a root for augmented-reality [text based adventure game](chats/btc-audit/docs/FOR_GPT5.md)
. It is where research starts....
