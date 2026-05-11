> legal meaning of "asset is possible for public service". I can commit to profit sharing asset, if enough funds (bids) provided to build an explorer, promote it and add paid features. Public service is MVP-level project that may involve extra contributors (and time) for a final product. As long as "10Ks" (of sats?) are accumulated for building it - shared-profit asset logic (proportionally directing user payments to original btc addresses of bidders) can be hardcoded into the paid features (features can be suggested through bids as well, example: complex security metrics). Securitisation of the asset (issue lightning assets to make it tradable and send it, proportionally, to the bidders as "initial offering") would be the next step.

> (Un)necessary legal disclaimer: Dev fund won't take more than 5-10% of the initial asset fund, depending on amount of extra contributors (and parties) co-operating in development (not in funding). I prefer to minimize that amount (to zero) and can guarantee no scammers, no tankies, no commies of all sorts, no unproductives, no "detached from reality", no cleargreen, no farang/gringo people, no web3 fanatics at the least, lol. And no reverse psychology. Psychology in Computer Science is the root cause of crypto insecurity. *Only some of potential PR contributors to the tool can be co-operators owning parts of dev fund*.
>> As it stands now - I don't like the idea of dev asset fund as incentive (future profits are most often illusory), since extra-contributions can be managed through regular bids in real-time. Reality is not that predictable, so had to write an annoying disclaimer, and increase [awareness](https://www.upwork.com/services/product/development-it-yaqui-p2p-search-engine-standalone-web-2007000568819406128) of [cranial muscles](https://dk14.github.io/mega-peers/docs/#/dsl) a bit.

>> Co-operation semantics. In reality, Explorer webapp only needs to represent data comitted to (let's say) IPFS as a table (with search) and expose it as OpenAPI-documented service - proper representation needs single person focus on it, me. If anyone contributes independent feature to the tool (examples: new TRNG model, new metric) - they may need to contribute a feature to the Explorer. If it is a valuable feature (bidder requested it, or close enough) - it makes sense to reward those bids, and if it is a paid feature of the Explorer app (suggested by bidders) - give a little of dev part of "profit sharing" fund (`5-10% * share_of_bid_requesting_paid_feature`) to the contributor, when the "profit sharing" fund is created.

>> "My discretion" semantics: while I, personally, don't welcome many naive features, eg "statistical measures" (not backed up by inductive proofs, or without clear meaning or value to the user, even KL-divergence) - I cannot reject a feature if there is a signinficant bid on it. There could be cases where I could refund a bid, or reject naive low-quality implementation. They can be tracked here, on github.

>> Temporarily, I cannot accept any PRs with GPU-implemntations, wthout coordinating it with wallet vendors and literally police. GPU-implemntations are shut down automatically as soon as discovered. Full externally audited public "Security Explorer" would be required in order to get immunity to that.


So 3 types:

- original fund, that is currently in existence (simply referred as Fund).
- profit sharing fund (needs Explorer up and runnning)
- securitized profit sharing fund (needs Explorer and paid features up and running)


How complex cases will be handled. 

For instance, "we" (entity) want to audit our own group of wallets publicly. Then "we" can create a big issue on GitHub here with a set (package) of features specified and corresponding allocations (10% on documentation analysis, 30% on TRNG replica, etc) of whatever fund or stream of coins you send. 

In more complex cases, some public or private Trellos/JIRAs can be attached for separate tracking. I prefer to not overplan, however - it creates illusion of either complexity or simplicity.

More complex workflows. While I currently don't have any funds. In the future, as current fund fills and features completed, it is possible to experiment with escrow contracts. I put something as a commitment, you put something as a commitment. It could be an overkill since I got credentials (no anonimity) and genuine interest, still a fun option though.
