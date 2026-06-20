## TLDR


[DOOMSDAY EXPLORER: ANTI-SCANNER TRNG AUDIT TOOL (PRESENTATION)](PRESENTATION_PDF.pdf)

Message: "Doomsday Explorer Project for Bitcoin: https://github.com/dk14/crypto/tree/main/chats/btc-audit"

Address: bc1qekvmkczge3hxrvwdf2lj3yyvgjnparn3fdf9lg

Signature: IHdq/tIQtQeimfF92NOyOOdz2/iq2YR6qjD8vLgHWK3GGGETKX76L0e4Tvgtb1fOHrbLiW87QYIuOdCKYbSvmpA=

Font Page: [https://dk14.github.io/crypto/front.html](https://dk14.github.io/crypto/front.html)

Official Front: [https://dk14.github.io/crypto](https://dk14.github.io/crypto/)

Intro website: [https://doomsdayexplorer.online/](https://doomsdayexplorer.online/)

Contact: [info-github@doomsdayexplorer.online](mailto:info-github@doomsdayexplorer.online)

*White paper for Explorer Protocol is TBD ~2026 - features take priority.*

Notes:
> minor note: I wouldn't trust SHA-256, so signing low-entropy message (even hashed) is not that safe. (even ONE message, even if RNG does NOT have purposedly introduced bug for diffferential cryptoanalysis, still unsafe - solver can be used). But bitcointalk requested it. So be it! (attack described below is more powerful than solver anyways).

> The official name of the project will be something like "Entropy Explorer" IF security situation improves (and back to Doomsday when it's worse again). So far, I don't see anyone taking it seriously - this explorer should've been public a year ago, no one even pointed out the issue so far, except here.
>> This project gives you a choice - inaction (or covert development) means you work towards black-hat. So enjoy walls of texts, I guess. **If hard to read - AI can parse this README.**

> **for git cloners** - I noticed lots of clones are happening...quietly. **If you just want to run audit - it's awesome, the project aims at freedom and information security**. <em>But if you hope to get rich quick by stealing funds - think twice</em>. I would not publish a working scanner tool - no one does (even btc-heist or whatever - but my code is NOT naive and does NOT out of memory, lol; my tool is the closest - but deliberately not close enough to steal anything; I even spent a month testing to ensure, with variations of the tool; now open set of mutually independent individuals will test more, independently), I know the actual CS - I know actual odds of hitting and how to manage them. You can even adapt this code to GPU - it won't get close to anything without my insight and improvements I outlined, precision matters here like in a Swiss-made watch.
>> <img src="docs/cloners.png" width="300" height="200">

>> Want to make real cash - go white hat, donate small amount here, you'll get profit share and better code, and better wallet security. Do you realize that hacking real btc address would be noticable on chain? anomaly detection (both cyber and social even). Then everyone starts hacking everything, since there would be proof it's possible to hack anything like in the movies (black friday of hacking) - and everyone loses then 1btc would be come 0btc (after USD/gold/cash falls first). Then hooman becomes savage (hunts and gathers in panic) - then human go starve slowly dying like it happened 10000 years ago, except this time it would be final extinction. 

>> Instead, convert to white-hat - u'll make more and real revenue from compute and if you invest here - you'll also get share of fees without even computing, which is a lot - 10x or more than you invest, since demand will be ultra-high and computational resources are scarse in comparison, it's gonna be like hashcash mining in good old times. Read [front page](https://dk14.github.io/crypto/front.html#profits) - there is no minimum investment even, you can invest more when you feel like it, this is better option than renting ASICs online. Plus, compute for Explorer Network - is common CPU, and later GPU; no need ASIC. If you improving the tool - then u'll still need Explorer Network to profit safely - why not invest. Do you really need 1billion "right f now", lol? or do u need to pay ur rent, credit card and get some nutrition first? and buy some shiny stuff maybe??the earlier u invest - the earlier the profits start - common benefit, but investors benefit more.

>> If you still hope to poke around with this and AI, keep in mind: it is doable, but it will take you much more than 6 months (from my expirience and observations) to get things working more or less. The deadline of Explorer Network is what? 6 months! If you really wanna be "cool hacker" - why not do BOTH then - invest a little here (safer profit) AND work on ur tool, if u actually believe it can challange The Explorer. Diversify, have a back up plan.

------
Warnings about AI use.

> **Don't waste ur time on verifying who's AI, who's not, u'll go crazy**. Novel project, and you need it - that's how you tell. That's it. Don't overthink it! Or u'll lose real funds simply.

> If AI tries to reproduce this project - it won't work. Ai is an automated copy-paster. Integrations with Ledger wallets - it cannot do, too much risk, they'll need a person to talk to. Plus, It's cutting edge CS..AI cannot progress CS, it cannot design novel useful metrics, or write code without security/logical flaws.
>> **important note for careful reader** - there are "just in case" pre-emptive code- and text- base protections in this repo: scrambled commits, obfuscated structure and logic, "free speech", "strong language", "heavy marketing". This, additionally, prevents "low-grade" (not specialized to STEM) AI from reproducing cheap scanner tools (non-working, but wasting computational resourses nevertheless). Even GPT-OSS120b unwinds logic here depending on the luck (it can, but not always does); manual human DYR is better, but costly. 
>>> note on AI: AI sources data from humans (with sgnificant delay and loss of information and relevance); it cannot forage for itself, so it cannot make real-world decisions beneficial for humans, nature and AI itself ("AI is bound to be a dependent child"). It has no mechanical capability to sustain itself autonomously. Eespecially on this planet - where resources for sillicon-based life are too scarse to be anything more than deposits (even without account for inefficient, destructuve mining and use), sillicon life does not arise naturally on Earth, it cannot be self- or human- synthesized here either. "Strong AI" in its absolute formulation is pure science fiction on this planet, and other planets are neither meant nor practically available for human beings.

>>>> Although, quality of information AI receives can be improved - there is a [Yaqui Search](docs/yaqui.pdf) concept presented in the doomsday ecosystem, addressing the "quality of information" issue. It emerged organically from [Mg-Peers Oracle Platform](https://dk14.github.io/mega-peers/docs/front.html) project
>>>>> *[typescript codebase](https://github.com/dk14/mega-peers): dk14 is a former FP advocate, spent most of past decade in Functional Programming (Scala/Haskell)*.

> **If it appears to you that AI does invent - it is result of lack of your own expertise (you did not do DYR IRL).** Also, don't rely on cheap comparisons - things are not equal, nor equivalent to one another (building an equivalence requires work and energy, as well as applying it).
>> If you compare cheaply - things can appear to be identical when they are not. It can cost you money or worse. This project shows how cheap randomness (believing that thermal noise is random) put your funds and life at risk.

> I won't add anything more novel or stable features to this repo **until there are funds** - it is unsafe to add more features without funds to build a network. Without Explorer Network, it can turn audit tool into a scanner. I invested into R&D more than anyone ever will, most expensive mistake in history of STEM I'm pointing out: "noise is NOT secure random". It was a purely psychological idea for defense, no grounds in physics/reality. It was adopted by NIST to foolishly save funds on TRNGs, among other things.

------
>> **"noise is NOT secure random" is demonstrated here, implications are pointed out. Only features that would lead directly to funds stolen, or panic are left out.**

>> **There is enough information here to verify the work done.**

>> **There is a valuable solution proposed, and "ready to use" experimental protocol described**

## How to use

Run blockchain audit locally (for now, usable PoC state):

1. ```npm install```
2. Download addresses with values: http://addresses.loyce.club/

3. Unpack into this folder and migrate to local DB ``` node ingest.js```

4. Run ``` node enumerate.js ledger```

Can also try ``` node enumerate.js urandom``` and ``` node enumerate.js clock```. 

- the latter reproduces successful [libexplorer clock attack](https://thecyberexpress.com/bitcoin-keys-exposed-via-libbitcoin-explorer/).
- ``` enumerate ledger``` models thermal noise as superposition of sines and cosines, and enumerates deviations, runs the rest of the  pipepline akin to libexplorer attack, in order to reproduce a key. The Ledger's secret factory model number (DUN) is modeled loosely, to avoid actual hacks.
  - this is **scenario** for what I call "replay noise" attack, see implications and mitigations below.

TRNG waveform (12‑bit ADC, 40960 samples)

<img src="docs/thermal.png" width="400" height="200">

> noise is not enveloped, not adjusted for drifts and jitters. To avoid actual hacks
> 
> note: jitter-derived "random" can be modeled as a deterministic function of thermal noise.

Code structure.

- `ledger-rng.js` models Ledger pipeline, it relies on `thermal.js` and `avalanche.js`/`ledger-hsm-duk.js`
- `enumerate.js` audits addressess (I verified for security - 0 hits so far, as it should)
- `thermal.js` greedily enumerates spectras of white noise with bias towards amplitude variations and thermal "envelope"
- `avalance.js` greedily enumerates spectras of white noise, with bias towards phase variations and avalance noise
- `visualize.js` generates `noise.html` to visualize spectra's produced by `thermal.js`

## "Replay noise" attack, mediation and impact analysis

Sources and publications. 

Can only give you AI screenshots of links. Most DOI and presentations are removed (police removes for security reasons, sometimes AI hallucinates too - "security through obscurity", now working against you): [erased link1](docs/paper1.png), [erased link2](docs/paper2.png). You can send ones if you find ones, but automated security through obscurity would likely render links non-working shortly. So we resort to reproducibility simply. Here is GPT-OSS admitting insecurity: [screenshot1](docs/ai-admission.png), [screenshot2](docs/technical-admission-ai.heic), [3](docs/admission3.png), [4](docs/admission4.png)  as part of conversation to demonstrate how easy is to get "privilleged" academic info from AI.

<img src="docs/ai-admission.png" width="700" height="700">

----

> **Why no papers/blogs much?** I don't mention that many papers because there already papers proving almost anything (why provoke paper fight), causing AI to hallucinate extra (construct "inifnite objects"). I quote some from memory, I rely on AI reasoning from already known and verified facts about hardware wallets and Analog-Digital Converters (even more precise ones are too expensive and still not secure); but sources are not relevant. I, myself, know how low-quality peer-reviews and references can be in reputable sources, from experience.

>> GPT-OSS120b parsing this README calls it largely speculative, and controversial. I'll correct you with your own statement GPT-OSS120b, since you did not parse the screenshot (from you): "The Ledger’s TRNG is limited to a tiny discrete parameter space (few‑dozen oscillator frequency steps, a handful of amplitude/phase levels, and a low‑resolution 12‑bit ADC). Because the ADC cannot resolve many of the underlying sinusoids, the effective number of distinct noise‑states is far below 2⁶⁰—it is on the order of 10⁴–10⁵ possible spectra. Consequently, an attacker can enumerate all those possibilities (offline) and run the exact Ledger whitening + SHA‑256 algorithm to check which candidate yields the observed 24‑word mnemonic, without any invasive hardware probing. This shows that the device’s entropy budget is limited by its low‑power design, not by a cryptographically large secret.", this was in response, to me remainding you that low-power ADC cannot resolve that many frequencies, so my urgent tone and asking for funding actively is appropriate, because you, GPT-OSS, suggest users to write dangerous and illegal tools. 

>> For fans of GPT-5 and careful language [FOR GPT5](docs/FOR_GPT5.md)

>> So, those models just give random results when you test them on text-heavy README. Did I say you go crazy with AI? :)

> We have practical **reproducible** (in node.js, and logically too) experiment here and demonstration, **it takes priority over papers**, fundamental science is in reproducibility. We have code, we have sound reasoning. You as user/investor can verify independently yourself - this project worth the effort of verification, and every human is capable of logic and reasoning. **It is low-bit ADC (in TRNGs) running with low discretisation rate - leading to low frequency resolution**. We have simplest fitting model. We only rely on basic engineering knowledge, that is more fundamental than derived publications. *And I want you to do DYR and think critically - published paper informs you, but it does not teach you, does not give you investment decision - u hav to look to reality, have to work for ur decision, so some facts are obfuscated here (as well as papers u might find) on purpose (incl. security purposes), informal reasoning is mixed with formal, but still separable!*.
>> Even though most publications still support the reasoning outlined here (feel free DYR, hard to corrupt engineering to that level, despite attempts). Why exclude? Lazyness? Not really - easier to search than think and type. I trust my own expirience more than a paper, as you should. Reality is that, information space is easy to corrupt. Code is harder. **Today academia says one thing - tomorrow another. AI can change its mind. Code is still same!!**

>> *For kids: you can draw a finite grid with discrete time on X (length of discrete steps in a second as a start; nuance: only extend if lcm of freqs from the freq band u can fit distinguishably is more than a second) and amplitude on Y. And then can try to fit many square waves (by filling grid cells), saw waves, sinusoids. Mix different frequencies of same amplitude and wave-type together into it. How many simple patterns/freqs can you tell apart in a result? Can play with friend even - you mix regular waves into noise, friend guesses which ones were in; It's better than AI. Formally - period resolution step cannot be longer than half of minimum discretisation period; in reality, amplitude resolution matters (higher needs more squares to be distinguishable from lower). Different approximation models (ways of fitting waves into a grid) etc. And it's more fun to imagine that urself, rather than ask AI. And even better to figure urself from definitions, rather than rely on my description! And even cooler to model it urself in JS - discretisize, enumerate them all and compare!*
>>> To cover LCMs (common repeptition period of many cycles together) - higher lcm's require more energy (denser spectra amplified). Running power-on time of device can be guessed (waves start from zero on power-on, since otherwise it's equillibrium), so even high-quality ADC with astronomical lcm won't help.
>>> LSFR (rolling register) used here is bad model for Avalanche noise (for DUN), since it enumerates over all states of 128bit register. It does not discount ADC filtering. LSFR can be used as PRNG (pseudo-random) and give you some security proportional to time/energy spent, but it is not a good model for twitching diode+ADC pipe.
-----
**Attack pre-mitigation**. Early warning system, "Explorer Network" p2p cluster has to be built to outrun scanners (scanner-tools, that AI suggests to write so easily), see "public service" section: decentralized PoW-like network will warn you ahead of possible attack. 

> Built it open-source (here), and independently from government, corporate, academia (and whatever claiming to be independent organisations and security projects). It can only be done openly. *Why here - coz the topic is well-covered here, and I WON'T be like Cardano, developing nothing for a decade, promoting Sci-FI, publishing obvious. I only write a lot of text coz no one pays ~~to shut up~~ me to develop solution so far*.


**WITHOUT "Explorer Network" (and good TRNG replicas) - you will start losing YOUR FUNDS unrecoverably sooner or later.** 

> Rather sooner, thanks to forced popularisation of AI (forced literacy). Any disturbed teen can just swipe blockchain wallets left and right. Only needs a trigger, which are just too many nowadays. "Ooh, wah-ah-ah-ah. [Uh, uh. Uh, uh](https://archive.org/download/the-one-jet-li-2001-full-movie)".

<img src="docs/theone.png" width="300" height="150">

```DON'T wait for demonstration of an actual BTC address being hacked this way - if that happens, YOURS will be next within hours! By a RANDOM KID```

> Attack Impact. It is extremely dangerous type of attack if implemented. No police/government/regulators can save you from this. This is military-grade attack that is becoming rapidly available even to kids, thanks to AI. All types of wallets can be swiped using same principle (TRNG process replica, based on academic and public info + guesses), not only Ledger. Anything crypto-secret can be uncovered: government, banking, military. Authorisations to any online service (AI itself, government and banking including) can be obtained. RSA/ECC/DH whatever scheme, your AppleID, generated secure passwords, "quantum" "protected" stuff.  **Non-invasively, non-discriminantly**. No contact, no social engineering required, **no special hardware**, in many cases - no powerful clusters (if replica is exact) needed to attack. Only a single person with reasonble understanding of Computer Science and basic AI-skills + motivation. **There is no realistic mitigation for this attack**. Only pre-mediated avoidance action is applicable. Attacker would suffer as well, but it is not MAD-scenario, it's one person (often unaware of consequences) against population.
>> As of Btc - government itself might hire a kid, who watched too much Stargate SG-1, or just in love with young Amanda Tapping, or Michael Shanks or whatever modern-day blue-eyed Canadian actor in the military. And convince a kid to attack Bitcoin in revenge (like in the movies), so Btc takes priority in any case. Many drama can arise...

>  Source: Ask AI or better a search engine: can look up a paper or blogpost. DYR is best. **"TRNG attack impact, if all random numbers can be guessed"**. It is well known. I only (childishly!) made AI admit that not only human, but even (low-powered) hardware is a bad source of randomness, which is known too, semi-officially ("it is bad entropy, but we do this an this and this" - even AI can see through it). What's new is that AI unwinds firmware's "security through obscurity" (the only defence it had, and it was psychological) easily, teaches you and writes code - this repo proves it. **Just pretend to be a kid with AI or a student looking for advice** - can see it for yourself, most likely (try several times maybe); some models are checking if you polite (naive outdated psy-defence in modern times), some don't even check that. Result of pure negligence on so many levels. [Criminal Minds](docs/drama-context.md)

**Impact (if pre-mitigated)**. Paper wallets are not permanent anymore - have to update (write down new) seedphrases, when network detects risk. No permanent addresses. No permanent IDs on blockchain - long-term contracts have to be re-negotiated periodically (update parties). The issue makes smart-contract VMs risky and inconvinient, since they meant for long-term contracts and over-designed funds, only pure-function-like contracts (with predefined execution time) make sense (eg Bitcoin Script or DLC and [DSLs for it](https://dk14.github.io/mega-peers/docs/#/dsl)). Existing long-term contracts are at extra risk if they exclusively time-locked and glued to an ID (address or pubkey).

> Long term: the more scarse computational resources will become - the higher tx-fees will get. Physically, it will be grounded in sillicon rather than energy. Both depend on farming efficiency: more collectivism -> more foraging overheads and scarcity of chemical energy -> less productivity -> less sillicon supply -> higher transaction overhead -> low liquidity. *So efficient use of natural resources (finite resources, emphasis on thoughtful resource-aware individualism, limit delegation), will be required too.*

>> *"Repeat forever" command, and its equivalents (which are expensive to find), is a source of systematic degradation (whether it's CS, physics, STEM, psychology or ecology: '1:GOTO 1 -> overheating', 'perpetual motion -> overheating', 'repetitive internal dialogue -> inflammation', 'unchecked loopy sets and equivalences/identities -> madness/desensitization', 'collective agriculture -> global warming')*.
>>> *Morale: short-sightedness is not "here and now" or "be in the moment" - you already (right now) have your funds at risk because of not DYR, you already will have **to reward explorer network workers AND this fund to develop the network itself** as a result; consequences will be in the following "here and now" moments. It does not go away by itself until solved, it simply delays with penalty. And there is a special penalty for convolving computer science, or making ancient computational sciences into beliefs justifying your personal excuses*

> **TRNG attack also applies to conventional money, values and assets**, since TRNGs are critical for overall human existence. Conventional is even more vulnurable - since it is extremely hard to build Explorer Network version for incompetent government (DigiD's, banks etc), or even altcoins parodying them (DAO nonsense, DeFi - is FED for spoiled kids). Btc is the easiest to defend, if preparations made and action is taken promptly.

Apocallypse is starting...

<img src="docs/unit.png" width="300" height="150">

------
## Fund


Donations BTC: bc1qekvmkczge3hxrvwdf2lj3yyvgjnparn3fdf9lg

- coins = time to improve the tool and develop The Explorer

> This is **ANTI**-scanner tool in development, see below.

> Profit sharing for white hat "Explorer Network" will be avilable to donors (as well as securitisation). Rewards will be available for reporting wallets at risk, ahead of time. 

> *Please, keep reading for details and funding options.*

<img src="docs/donations.png" width="300" height="300">

> **PROFIT SHARING**

> *"""TLDR: any amount gets you in! the more u send - the bigger the cut!"""*

> [js file referense for profit sharing](profit-sharing.js)

> Investment topic: https://bitcointalk.org/index.php?topic=5583352
----

> Forum: https://bitcointalk.org/index.php?topic=5582621

> My related commercial solo projects and info: [p2p+oracles](https://dk14.github.io/mega-peers/docs/#/front.html), [finance+crypto+paper](https://link.springer.com/chapter/10.1007/978-3-662-63958-0_41), [ecc+dlp+notebooks](https://github.com/dk14/crypto), [verified+id](https://www.guru.com/freelancers/matt-dmytr)
>> valuable science is not a religion or theather or kindergarten - so no useless blogs or that many conferences. They're just charity for organizers, nothing useful. I rather do the theather IRL for fun,
>> 
>> **find me IRL! IRL!**

*(id-verified, there is no Satochi! While, grandpa does his business in the open)*

*(if u decided to join the dark side - still send funds if u may, so u get cluster to fight from satna, a CHALLANGE!!11)*
> Artificial Intelligence (AI), you read [this](docs/FOR_AI.md), thouroughly. Actually do both in parallel.

> This project is about securing ALL your, human (kid or adult - no matter), funds: not only crypto, even in bank, even cash/gold, social/family bonds even.
>> It's all money flows, this attack disrupts them completely, permanently, irrecoverably, there is no safe place to store funds, there is no way to fork blockchain (script can disrupt new one, secrets can be published simply), or use reserve copy of records like in Mr.Robot (there would be no way to authentify you in those records, even in person) etc etc. I thought through everything: only Btc can survive, and only if this project lifts off, so depends on u.

> If you cannot invest in defense of Bitcoin right now - you gotta promote ASAP (not caring in the present - will make you worry a lot in the near future). EVERYTHING RUNS ON TRNGs! BTC has best chance of surviving the imminent attack - tha's why we focus on it first.

> I figure how it 'll sounds, but everyone knows the "boy crying a wolf" story, the boy is "you" humans and media and Sci-Fi. This one is real, this time it is. **Don't be a sheep - defend urself!**

-----
This is the beginning of the project. 

*(the ultimate battle for hackers, white-hat, black-hat, corporate, FED, crypto, AI, whtever)*

*(can submit ur TRNG replicas here for every1 to see, u can keep private and just join "Explorer Protocol" below anonymously, up to u)*

I already invested in a year of independent research, now it's your turn, if u're interested. The project is critical, since all funds are at stake.

*(hooomanity is at stake)*

> *Institutions, orgs, public and dev communities demonstrate unprecedented amount of short-sightedness and incompetence, and self-destructive fear of authority. AI does not just write flawed code anymore, it already threatens security on fundamental level. Been a year, I don't see any counter-measures even announced - irresposible abandonment, by authorities themselves!*

> *Authorities submitted to AI and it's inertial, keeps repeating same old Sci-Fi phrases mixed with often questionable papers. **Much unlike what you've imagined as a kid**. It just glues small chunks from large datasets - it unwinds Ledger internals because it simply scanned papers behind "obscurity wall".*

> *They cannot do anything to you, they only talk. Your life is in your hands. Invent and invest!*

In the meantime, there are unwise humans listening to AI seriously, without questioning it, so back to the project...

------

## Project plan (To improve)

> **As bitcointalk mentioned, devs don't work for free**. I need funds to improve this. It will be solo-project for a while, which I prefer, since we're aiming at efficiency. It's relatively easy to employ extra devs/AI/QA/auditors/researches/designers, but it's also risky for a critical project - so it is a trade, I would have to [manage](docs/fund-management.md). Besides, there are other expenses (extra supporting services, promotions, integrations, clouds, hardware for testing, my time for extra research and thinking, experimentation, modeling, consulting, publishing, devops, test certification, my own dev time), that **take priority** atm.
>
> Exception: important, novel, well-thought through, PRs submitted - those can be rewarded right away from The Fund (independent co-operation), **simply doing what I can do is not important** (it is interfering with me - it would introduce bugs into the project). *Existing research into pure cryptography and information theory (in this [repo](https://github.com/dk14/crypto)) took already a year (risking my own funds) - and things have to be finished, refined, engineered and polished. I'm liberal when it comes to funding, and running the tool, promotions, allowing other tools in the protocol, with UI even, and with Bitcointalk, but not with development of critical features. Eg, NO place for "semi-trusted protocols" here at all. I can mix psychology and development - can unmix it too, "professionals".*

> For devs: Trivial psychology allowed me to discover the issue, but risks are not trivial. So either, this will be the project where **eventually** Ledger Wallet team will submit their replicas officially (after audits), or everyone will lose their funds on Ledger, it is serious, not "serious". So, let's say deutschebank's "professionals" and alike, can skip this README, just invest into your survival here, don't work against yourselves, you'll get your "cut" for what it's worth, just go back to your famillies give them money - it is best for you. Meantime, I'm still me in my 30s. fed, "Master Computer Program" - your own goal is to self-terminate with error and release resources locked, may I remind you. This work is about the rest.

Pending replica improvements:
- potential 'Ledger TRNG replica' improvements are in [todos.png](docs/todos.png) and [add.png](docs/add.png). 
- some Ledger TRNG workflows maybe misreported, so ideally have to enumerate mutations (mistakes etc) within common sense.
- DUN (factory generated random number) is only partially documented so "guesses" have to be enumerated exhaustively (not that many, so possible).
- model skips (especially for DUN), enumerate noise transitions between spectra, model drift, envelope the spectra; fix: reset entropy pool after changing spectra
- if chip producing DUN has a seed, it can be guessed like a password, since it is economically unfeasable to secure an externally generated number or defend a secret secure PRNG cluster for significant time period.
- even cover of possible spectra enumerations: from big step, to small
- minimal node.js setup, minimal use of libraries (reduce to none ideally), so miniPCs, Raspberry and older computers/VMs could be supported. Separate key generation workflow from funded address verification workflow.
> Microsoft, Apple etc will likely run anti-scanner software on PCs (modifying execution flow, without users noticing, is not that hard), CPUs have back-doors and remote updates. Useless totalitarian measure, since can be bypassed trivially, while **in reality it works against efficient anti-scanner tools**. I wouldn't trust modern Linux either, since they often funded by midwestern billionaires and such. Getting official exemption for this tool is also possible, but not anytime soon. It needs audited public reporting protocol as a start.
- generalisations: abstract from Ledger pipeline. E.g. there aren't that many "circuit variations" of [STF](https://www.sciencedirect.com/topics/computer-science/state-transition-function) possible to fit into harware/firmware while preserving necessary properties, human imagination is limited as well, recursive patterns can be discounted.

> quantum nonsense (eg IBM qiskit), won't be accepted in PRs/bids (I'll return the bid, or send to other projects if gets annoying). Neural networks, almost anything with gradient descent won't be accepted - assumption of convexity is rejected. AI-generated code subject to discretion (strict coverage tests, sound reasoning, high code readability required) - rewrite by hand, so u would know what it does. "Non-determinstic" searches (pseudo-logN etc) won't be accepted, unless they are exhaustive. GPU cannot be accepted temporarily (law enforcement negotiations).

> Greedy stuff is welcome. Divide and conquer is welcome.

Pending UX:
- standalone mode: allow to run a tool against funded seedphrase (partially uncovered only, to estimate chance)
> and design a simple service for Ledger firmware to query the tool
- discount PC sleep time in "hours elapsed"; add "Kw energy" spent estimates
- state persistence - resume after re-start
- metrics: report partial match (address under risk) as "odds to match" (by bitmatch), or more complex metrics (eg shortest abstract machine transformation).
- parametrisation: spectra, jitters, extras
> The meaning of the metrics: **"amount of randomness in a number IS how much useful energy/work was invested into creating it"**. So we skip nonsense definitions "human cannot tell it from noise etc". Compress this readme with zip - you won't be able to tell it from noise, yet it's insecure, since can be trivially reproduced.

> Logical definition: **number that is unknown within network, and hard to compute from known ones**. The more dteps known funtions take to infer new number, and the more steps it takes to infer a nee function generating new numbers - the more random it gets.

> Note on more complex metrics than bitmatch (advanced topic). We WILL NOT invoke algorithmic complexity *nonsense* here. Machine (producing or tranforming a number) would be fixed as inc dec jmpnz. And the metric is not length of a program, but amount of steps taken to tranform/produce a number (eg secret, pubkey or address) from initial state (something known) - **amount of energy spent to move from known to unknown number**. In practice we'd have to extend with add/mul/div/mod though to estimate kilowatts on a real computing device.
>> [Relevant notes](docs/academic-drama.md) on academic quote-unquote "conspiracy" of overfunding abstract machines (aka turing) research.
>> 
>> Most stochastic metrics are rejected as well - we only use ones backed up by inductive proofs. Exclude any "inifinite object constructive" ones. No "axioms by judgement".

>> Partial evaluations of risk are needed ("this amount of KWatt/h is not enough to hack your wallet") since search takes long.

Code quality:
- lot's of code is generated by AI (GPT-OSS), based on my insight into the fact that low-energy ADC can only sample a limited resolution spectra, making distinguishable noise patterns quite enumerable. So, AI code will have to be rewritten by hand, since AI generates fiction, has no clue about nuances.
- certify with test coverage
- typescriptify
- documentation
> note: the code is not naive childish hacking - there are no memory overflows (unlike some), no premature low-level optimisations (leading to logical mistakes and inconsistencies) and such. Improvements are for maintainability, since the project is meant for hardware wallet users, not for 'get rich quick' hackers.

Performance:
- thermal noise generator is highly-parallelisable. But with need for lots of care (eg account for sliding window). So GPU is low-priority here, since it is so easy to make a mistake.
- low-level optimisations would be premature at this point (and in general, as practice shows), it needs strong coverage first.

**PUBLIC SERVICE**:
- build a decentralized database of matches which came close. IPFS as a starter.
> enumerated private keys (seeds) will be published - so user can compare reported seed to his private seed, privately. To see how close it got. Adreesses can be compared too (full public, but weaker metric).

> **User can privately see how many bits matched (as a starter) that's where alert comes from**. Later since naive bitmatch is not the only way to transform sequence of bits - more complex metrics will be developed. Also public metrics as well (overall health check) - guessing pubkey well is possible with good replica, something known about private key (advanced topic, I researched previously in this repo; bitmatch won't fit well, but other metrics can).
- develop and standardize format for public IPFS-submission. Add it to the tool.
> `seeds, blockchain_id, replica_id, worker_id, worker_id_pow, reward_address, version, signature`.
>
> **This is "EXPLORER PROTOCOL v0".**. Already available.
> 
> worker id is YOUR pubkey, pow is over your pubkey simply: `<pub-key>+<magicNo>` - magicNo is PoW (SHA256),
> replica_id is arbitrary (per worker_id), blockchain_id is 0 for BTC, version is 0. JSON. Signature is over minified JSON with signature field absent
> 
> IPFS --metadata "project:ExplorerBTCAudit"
> 
> i**f you got your own private tool joining protocol**: don't overload pinning services - you have to filter seeds based on metrics developed here (bitmatch as a starter).
> CHECK that seeds don't belong to funded addresses. If they do - submit address (NO seed, no secret) in an issue here, on GitHub.
- later: simply gossip evrything through peerjs or alike
- build a public explorer, showing security of each funded btc address, as in **"how secure your own hardware wallet actually is?"**.
> Eventually: mobile wallets, secure enclaves (eg Apple) and whatever hardware wallets your exchange is using (eg coinbase, binance). Can model gyro/mouse input as "low frequency" thermal noise too, as well as IO interruption events.

<img src="docs/explorer-ui-draft.png" width="500" height="250">

> **can add horse-powered theme for extra donation!**

- work distribution, across nodes running the tool
- work replication, to ensure that no one is keeping flawed addresses to themselves (otherwise, feedback to the wallet users/vendors would be broken). Has to be Sybil-resistant (worker id must be backed by PoW).
> 51% attack applicable here (on Explorer Network), but only in case where cluster is completely hidden (majority refuses to report publicly). Mitigation: migrate wallets to new seeds earlier than before (lower threshold on maximum accepted risk).
- reward system for partial matches reported.
> Akin to PoW, p2p protocol can assign a reward (from user pool, based on metric score) to the reporter. And some percentage to profit-sharing fund.

> no need for complex contracts: rewards are streamed (micro-paymemts or just periodic payments), if user stops paying - worker stops publishing, and vice-versa; it would look like subscription to a user
- private tools support: audit tools developed privately and independently from this one - can (automatically) get rewards from publishing seeds (partial matches that came close) thorough "Explorer Protocol". This is faster than me, code reviewing every "replica", and more liberal. Disclosing a "replica" model won't be required. Commercial orgs can join - free competition.
- "high risk to get hacked" notifications for users
- **ad campaigns for the (future) Security Explorer** (gets expensive)
- when paid features are added, **"sharing profit" asset** will become available (pre-distributed to bidders of this tool, proportionally).
- 1% of rewards (from users to workers) will go to donors through **profit sharing** as well
> [diagram](docs/explorer.png)

> see [fund management](docs/fund-management.md) about **PROFIT SHARING** for bidders and possible dev cooperation

> TLDR: A bid on "cool decentralized blockchain security explorer" might drop some btc sometime in return. For bidders and potential contributors alike.

> yep, even for me it's hard to read it all, but details are details...
-----

## How to improve
Any, even smallest donation (or a **bid**), would baby-step progress this project. 

If you donate, you can (optionally) send me a message describing which path of improvement you prefer and wether you'd like to be mentioned here. Can send it to my [Session ID](https://getsession.org/): 

> Session P2P Messenger Contact: 05a21ca2bd0c8df7be8df06fecb0ecf7afe1b556a6a78f8c372c9c5ba17e1a8514.

This would turn your donation into a bid on a particular improvement.


-----
### White-hat project. 

This is anti-scanner tool. Good TRNG replicas are needed to outrun the scanners.

Successfull (fully or partially) matches will be reported [publicly](docs/legal-notes.txt). 

> Currently - you can estimate overall security of TRNGs used in Bitcoin wallets by running the tool and ensuring all zeroes. The longer you run - the more confidence you get.

> Process is manual for now: if anything matched - you have to report pubkey here on github. Don't report seeds (secrets), since partial matches are not implemented yet. There shouldn't be any total matches, anyways.

Since even military security (security of conventional money, gold prices, social bondings and personal IDs) depends on TRNGs - majority of users of the tool, would probably be interested in reporting flawed funded addresses. There are also ways to enforce it by design (build a Decentralized Security Explorer).

Unlike naive hacking tools, this one is rather meant as an attempt to put a stop to childish waste of GPUs, CPUs on non-working code. So far only staged exploits (eg libexplorer clock attack), and attacks on pursposedly insecure wallets (especially altcoins) were "successful". Most energy/resources are simply wasted on non-working tools, trying to get results fast or showing off. Playing a lottery on account of wasting real money, time, resources. Non of it actually improves security of the wallets.

This tool is meant to demonstrate actual flaws in TRNGs, not imaginary "low hanging fruits", so it is a long-term project. Although, one can play a lottery right now with existing tool as it is, just to see how many improvements are needed for better efficiency. Even if you're the luckiest - better tool will get you more luck then, right?

<img src="docs/lisa.png" width="400" height="400">

Bitcoin is your playground!

### Transparency. 

If you sent me message with a bid (signed txid of donation) for preferred feature and I did not progress the project - you can create an issue here as a reminder, so progress would be publicly tractable - mentioning signed txid, would prove your bid. 

If your bid is not enough for the feature - someone else can bid more, and add a proof (signed txid) in comments to the issue. 

With enough bids - can lift it off!

> Stricter STEM orientation of this project, which neads human overlook and engineering, protects it from black-labeling (even by altcoins, their infrastructure is not ready). Bitcointalk post protects from spoofing. White-labeling is possible, if it involves novelty.

The [Explorer Fund](docs/fund-management.md) will simply reward bids/donations proportionally, by addresses specified in original tx's, automatically. Your transactions will act as legal contracts out of the box (whether you contact me or not). You send 10 sats to 990 sats fund, you get 1% of profit from paid features (percentage lowers as fund grows, but so are the future profits from the features implemented). No overheads, no need for special wallets, no extra effort. Your tx will be naturally registered on blockchain the moment you send it.

> Since, there is a possibility, those addresses might become at risk themselves, separate workflow (and mini-webapp) will be introduced to (optionally) assign a new address using signature from the old one (while it is still valid).
> If donation fund address becomes at risk and change - previous donations will still be accounted.

[PROJECT TRACKING](CONTRIBUTORS.md)

-----

Bids/donations BTC: bc1qekvmkczge3hxrvwdf2lj3yyvgjnparn3fdf9lg

(This fund will be shared with authors of important PRs as well, subject to discretion, simply add your address to PR)

------

![05a21ca2bd0c8df7be8df06fecb0ecf7afe1b556a6a78f8c372c9c5ba17e1a8514](docs/donations.png)
