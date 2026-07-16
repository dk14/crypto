# Yaqui.js API Reference

**Version:** 0.1 PoC  
**Status:** Experimental / Development Checkpoint

---

# 1. Overview

Yaqui.js is an indexing and retrieval engine designed to organize structured and unstructured information and provide a lightweight knowledge interface.

Primary goals:

- local-first indexing
- deterministic retrieval
- searchable knowledge representation
- modular architecture
- future integration with predictive systems such as Enigma Predictor

Yaqui acts as an information layer between raw data sources and higher-level reasoning systems.

Architecture:

```
Data Sources
      |
      v
+-------------+
| Yaqui Index |
+-------------+
      |
      +----------------+
      |                |
      v                v
 Search Interface   External Systems
                    (Enigma Predictor)
```

---

# 2. Installation

## Browser

```html
<script src="yaqui.js"></script>
```

## Node.js

```javascript
import Yaqui from "./yaqui.js";
```

---

# 3. Initialization

Create a Yaqui instance:

```javascript
const yaqui = new Yaqui({
    storage: "local",
    ranking: "default"
});
```

Configuration object:

```javascript
{
    storage,
    ranking,
    indexPath,
    maxEntries,
    debug
}
```

---

# 4. Lifecycle API

## Start

```javascript
await yaqui.start();
```

Initializes:

- index
- storage layer
- internal caches
- search subsystem

---

## Stop

```javascript
await yaqui.stop();
```

Gracefully shuts down Yaqui.

---

# 5. Index Management

## Add Entry

```javascript
await yaqui.add(entry);
```

Example:

```javascript
await yaqui.add({
    id: "example-001",
    title: "Entropy Research",
    text: "Sample knowledge entry"
});
```

---

## Remove Entry

```javascript
await yaqui.remove(id);
```

---

## Update Entry

```javascript
await yaqui.update(id, data);
```

---

## Get Entry

```javascript
const item = await yaqui.get(id);
```

---

# 6. Search API

## Basic Search

```javascript
const results = await yaqui.search("entropy");
```

Returns:

```javascript
[
    {
        id,
        title,
        text,
        score
    }
]
```

---

## Search Options

```javascript
await yaqui.search(
    query,
    {
        limit: 10,
        threshold: 0.5
    }
);
```

Options:

| Parameter | Description |
|---|---|
| limit | Maximum number of results |
| threshold | Minimum relevance score |
| sort | Ranking method |

---

# 7. Ranking System

Yaqui separates retrieval from ranking.

Pipeline:

```
Query
 |
 v
Candidate Retrieval
 |
 v
Ranking Function
 |
 v
Results
```

Ranking API:

```javascript
yaqui.rank(results);
```

Potential ranking signals:

- keyword relevance
- source reliability
- verification score
- historical accuracy
- network consensus

---

# 8. Content Processing

## Hash Content

```javascript
const hash = await yaqui.hash(content);
```

Used for:

- identity
- deduplication
- reproducibility

Example:

```javascript
{
    hash: "sha256...",
    size: 12345
}
```

---

## Normalize Content

```javascript
yaqui.normalize(content);
```

Possible operations:

- encoding normalization
- whitespace cleanup
- metadata extraction

---

# 9. Data Model

A Yaqui entry:

```javascript
{
    id,
    title,
    text,

    metadata: {
        source,
        timestamp,
        author,
        tags
    }
}
```

---

# 10. Import / Export

## Export Index

```javascript
const dump = await yaqui.export();
```

---

## Import Index

```javascript
await yaqui.import(dump);
```

---

# 11. Feedback System

Yaqui supports external evaluation signals.

## Positive Feedback

```javascript
yaqui.feedback(id, "positive");
```

---

## Negative Feedback

```javascript
yaqui.feedback(id, "negative");
```

Possible uses:

- ranking adaptation
- quality estimation
- anomaly detection

---

# 12. Statistics API

Get index statistics:

```javascript
yaqui.stats();
```

Example:

```javascript
{
    entries: 1000,
    size: "20MB",
    lastUpdate: "timestamp"
}
```

---

# 13. Event System

Example:

```javascript
yaqui.on(
    "indexed",
    callback
);
```

Supported events:

| Event | Description |
|---|---|
| indexed | New entry added |
| removed | Entry deleted |
| updated | Entry modified |
| searched | Search executed |

---

# 14. Storage Interface

Storage backend abstraction:

```javascript
{
    save(),
    load(),
    remove(),
    list()
}
```

Possible backends:

- memory
- browser storage
- filesystem
- distributed storage

---

# 15. Network Extension

Future distributed architecture:

```
Yaqui Node
     |
     |
Explorer Network
     |
     |
Other Yaqui Nodes
```

Potential API:

```javascript
yaqui.publish(entry);

yaqui.sync(node);

yaqui.verify(hash);
```

---

# 16. Enigma Predictor Integration

Yaqui provides the indexing and retrieval layer.

Architecture:

```
Raw Information
        |
        v
+---------------+
| Yaqui Index   |
+---------------+
        |
        v
+---------------+
| Enigma Engine |
+---------------+
        |
        v
Prediction / Analysis
```

Responsibilities:

## Yaqui

- collect information
- normalize data
- create index
- retrieve relevant knowledge
- rank results

## Enigma Predictor

- analyze indexed information
- detect patterns
- generate predictions
- evaluate hypotheses

---

# 17. Security Considerations

Future versions should include:

- cryptographic content identity
- provenance tracking
- reproducible indexing
- tamper detection
- verification mechanisms

---

# 18. Development Roadmap

## v0.1

Implemented:

- basic index
- keyword search
- browser UI
- local operation

---

## v0.2

Planned:

- improved ranking
- fuzzy search
- metadata graph
- better visualization

---

## v0.3

Planned:

- Enigma Predictor integration
- predictive indexing
- distributed Yaqui nodes

---

# 19. API Stability

This document describes the experimental Yaqui.js API.

The interface is a development checkpoint and may change as the implementation evolves.
