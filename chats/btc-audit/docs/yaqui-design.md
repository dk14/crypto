# YaQui Search
## Distributed Query-Centric Search Engine

*Draft architecture checkpoint*

---

# Philosophy

YaQui is not a distributed web crawler.

It is a **distributed query → evidence database**.

The Web is merely one source of information. The primary object is **content**, identified by its SHA-256 hash, rather than URLs.

Unlike conventional search engines:

```
keyword
    ↓
URL
```

YaQui stores

```
query
    ↓
content hash
    ↓
content / mirrors
```

URLs become metadata.

---

# Core Concepts

## Query

A query is arbitrary JavaScript source code.

Examples

```javascript
page => page.findAll("apple").length
```

```javascript
page => page.title.match(/entropy/i) ? 100 : 0
```

```javascript
page => {
    return page.findAll(/ledger/i).length * 5;
}
```

The return value is interpreted as

```
0      -> no match

>0     -> match score
```

Words are simply a special case.

```
page => page.findAll("apple").length
```

Therefore YaQui has no dedicated keyword index.

Everything is a query.

---

# Query Identity

Queries are normalized and hashed.

```
queryHash = SHA256(normalized query source)
```

The hash is the primary key.

The original source is stored for execution and display.

This provides

- constant-time lookup
- duplicate elimination
- compact network messages

---

# Reverse Query Index

```
queryHash
    ↓
{
    source,
    results[]
}
```

Each result

```
{
    sha256,
    score,
    magicPlus[],
    magicMinus[]
}
```

where

- score is returned by the query
- magicPlus contains independent positive PoW proofs
- magicMinus contains independent negative PoW proofs

Each proof is stored separately.

Counters are never modified directly.

---

# Content Database

```
sha256
    ↓
{
    links[],
    blobs[],
    mime,
    size,
    metadata
}
```

Multiple mirrors naturally map to identical content.

```
sha256

├── mirror A
├── mirror B
├── mirror C
└── local blob
```

---

# Blobs

Blobs are optional.

They enable decentralized hosting.

Search results are fundamentally

```
query

↓

sha256
```

Actual content can later be obtained

- from mirrors
- from local storage
- from peers

This makes YaQui capable of decentralized web hosting without depending on original URLs.

---

# Crawling

The crawler begins when the user submits a query.

Workflow

```
search

↓

existing database

↓

display matches

↓

crawler starts

↓

new pages discovered

↓

queries evaluated

↓

new matches stored

↓

results update live
```

Crawler behavior

- starts from configured seed URLs
- recursively follows every discovered URI
- extracts URLs from
    - href
    - src
    - fetch(...)
    - XMLHttpRequest(...)
    - location
    - window.open(...)
    - parsable URLs inside JavaScript strings
- ignores robots.txt
- ignores sitemap.xml

---

# Ranking

Each result has

```
positive PoW

negative PoW
```

Search ranking

```
rankingScore

=

Σpositive

-

Σnegative
```

Search results are ordered by

1. rankingScore
2. query score
3. simple textual relevance

---

# Announcement Propagation

Network announcements contain

```
queryHash

sha256

score

positive PoW

negative PoW
```

Nodes prioritize announcements by

```
announcementScore

=

Σpositive

+

Σnegative
```

Absolute PoW prevents controversial entries from disappearing due to coordinated downvoting.

---

# Blob Replication

Blob storage follows a different policy.

```
pinScore

=

max(0, netPoW)

/

blobSize
```

where

```
netPoW

=

Σpositive

-

Σnegative
```

Large unpopular blobs are discarded first.

Small highly valued blobs survive almost indefinitely.

Announcements remain available even if blobs are evicted.

---

# Mempool

Two logical pools exist.

## Announcement Pool

```
queryHash

↓

sha256
```

Small.

Replicated aggressively.

---

## Blob Pool

```
sha256

↓

blob
```

Large.

Transferred only on demand.

May be garbage-collected according to pinScore.

---

# Persistent Storage

IndexedDB stores

```
Queries

Content database

Crawler queue

Visited URLs

Peer list

Announcement mempool

Blob cache
```

Everything survives browser restart.

---

# P2P Networking

Communication uses WebRTC.

Peers are discovered from a configurable seed list.

Announcements are broadcast.

Nodes do not rebroadcast

- already-seen announcements
- announcements below propagation threshold

This prevents feedback loops.

---

# Search Execution

When the user submits a query

1. Normalize query.
2. Compute queryHash.
3. Search local reverse index.
4. Execute query on existing cached pages.
5. Display ranked results.
6. Begin crawling.
7. Execute query on newly discovered pages.
8. Insert new matches.
9. Broadcast announcements.
10. Update UI continuously.

---

# Duplicate Elimination

Content identity is determined solely by

```
SHA256(content)
```

Multiple URLs referring to identical content produce only one stored entry.

This naturally supports mirrored websites.

---

# Future Extension

The query model allows specialized analyzers.

Instead of exact matching, analyzers may produce similarity scores for

- modified images
- modified audio
- reformatted text
- near-duplicate documents

This enables future eviction and moderation policies that detect slightly modified republishes of previously indexed content while preserving the same query-centric architecture.

---

# Architectural Summary

YaQui consists of three largely independent layers.

```
                 Query Layer
         (queryHash → sha256)

                     │

                     ▼

              Content Layer
         (sha256 → mirrors/blobs)

                     │

                     ▼

              Transport Layer
     (WebRTC announcement + blob exchange)
```

Each layer has an independent optimization goal.

| Layer | Optimization Goal |
|--------|-------------------|
| Query Layer | Fast search, duplicate query detection, anti-censorship announcements |
| Content Layer | Content-addressable storage and decentralized mirroring |
| Transport Layer | Efficient propagation and adaptive blob replication |

This separation allows search relevance, censorship resistance, and storage efficiency to evolve independently while remaining compatible with the same underlying data model.