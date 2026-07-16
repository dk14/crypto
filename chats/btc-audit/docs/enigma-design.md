# Enigma Predictor Design

**Version:** 0.1 Design Checkpoint  
**Status:** Experimental Architecture

---

# 1. Overview

Enigma Predictor is a general-purpose sequence prediction system based on searching for compact executable explanations of observed data.

Instead of directly fitting statistical parameters, Enigma searches for small executable programs capable of reproducing observed input/output relationships and extending them to unseen future data.

Core principle:

> Find the smallest executable process that generalizes observed relationships.

The system is based on:

- universal Turing machine execution (`executeTuring`)
- automated program search
- input/output generalization testing
- exact split validation
- partial-match evaluation
- executable model verification

---

# 2. High-Level Architecture

```
Observed Data
      |
      v
Past/Future Split Generator
      |
      v
Turing Program Search
      |
      v
Candidate Programs
      |
      v
Execution + Validation
      |
      v
Structured Ranking
      |
      v
Selected Predictor
      |
      v
Future Sequence Generation
```

---

# 3. Core Prediction Model

Given an observed sequence:

```
S = s1 s2 s3 ... sn
```

Enigma creates training examples by splitting the sequence into:

```
Past -> Future
```

Examples:

```
s1          -> s2...sn

s1s2        -> s3...sn

s1s2s3      -> s4...sn

...
```

The objective is to find a program:

```
P(input) -> output
```

such that:

```
P(past) = future
```

for many observed splits.

---

# 4. Turing Program Representation

Candidate predictors are represented as executable abstract machines.

Each candidate consists of:

```
Turing Program
       |
       v
executeTuring()
       |
       v
Output Sequence
```

Candidate properties:

- program description
- program size
- execution cost
- termination status
- exact prediction performance
- partial prediction performance
- generalization score

---

# 5. Input-Enabled Turing Machines

Unlike previous output-only enumeration, Enigma predictors accept inputs.

Model:

```
Input Sequence
       |
       v
Turing Program
       |
       v
Predicted Future
```

Example:

Input:

```
hello wor
```

Output:

```
ld
```

The goal is not memorization.

The goal is discovering a computational transformation capable of reproducing the relationship.

---

# 6. Program Search

The search objective:

Find:

```
P*
```

where:

```
P* = smallest program satisfying prediction requirements
```

subject to:

```
Generalization(P*) >= threshold
```

Primary optimization:

- minimum program complexity

Secondary optimization:

- execution speed
- prediction horizon
- stability
- confidence

---

# 7. Training Split Generation

Example sequence:

```
ABCDEF
```

Generated dataset:

```
Input       Expected Output

A           BCDEF

AB          CDEF

ABC         DEF

ABCD        EF

ABCDE       F
```

Each candidate program is tested against the complete generated split set.

---

# 8. Split-Based Evaluation

A candidate program is evaluated independently on every split.

Evaluation pipeline:

```
Candidate Program
        |
        v
Execute on split 1
Execute on split 2
Execute on split 3
...
        |
        v
Collect structured results
```

The score is not a single opaque value.

The system preserves:

- which splits were solved
- which splits failed
- how close failed predictions were
- computational cost

---

# 9. Primary Evaluation: Exact Split Matches

A split is successful only when:

```
P(past) == future
```

exactly.

Example:

```
Expected:

abcdef


Program output:

abcdef
```

Result:

```
MATCH
```

---

Example:

```
Expected:

abcdef


Program output:

abcxyz
```

Result:

```
FAIL
```

---

Primary score:

```
ExactScore =
number of fully matched splits
/
number of evaluated splits
```

Example:

```
100 splits tested

73 exact matches

ExactScore = 0.73
```

Exact matches are the primary indicator of discovered structure.

---

# 10. Secondary Evaluation: Partial Matching

Partial matching is a relaxation layer.

It evaluates unsuccessful splits by measuring similarity between:

```
Expected Future
        |
        v
Predicted Future
```

Example:

Expected:

```
abcdef
```

Prediction:

```
abcxyz
```

The candidate receives partial similarity credit.

Partial matching is useful for:

- large datasets
- noisy observations
- incomplete information
- candidate exploration
- ranking near-miss programs

However:

```
PartialScore does not replace ExactScore
```

Exact computational reproduction remains the primary objective.

---

# 11. Structured Candidate Score

The candidate score contains multiple dimensions.

Structure:

```
Candidate Evaluation

        |
        +-- Exact Matches
        |
        +-- Partial Similarity
        |
        +-- Program Complexity
        |
        +-- Execution Cost
```

Conceptual scoring:

```
Score =

ExactScore

+

(relaxation * PartialScore)

-

ComplexityPenalty

-

ExecutionPenalty
```

Default behavior:

```
Exact matches dominate.
Partial matches provide secondary guidance.
```

---

# 12. Candidate Evaluation Output

The caller should receive the complete evaluation structure.

Example:

```javascript
{
    exactMatches: 83,
    totalSplits: 100,

    exactScore: 0.83,

    partialScore: 0.41,

    programSize: 120,

    executionCost: 4500
}
```

A single number is insufficient because higher-level systems may use the structure differently.

---

# 13. Why Preserve Score Structure

The internal structure of prediction confidence is important.

Different callers may require different tradeoffs.

Examples:

Strict scientific validation:

```
maximize ExactScore
```

Large-scale discovery:

```
use PartialScore for search guidance
```

Interactive systems:

```
map confidence structure into user choices
```

---

# 14. HCI Integration

The structured prediction score enables future Human-Computer Interaction layers.

Example:

```
High exact confidence

        |
        v

Deterministic prediction


Mixed exact + partial confidence

        |
        v

Exploration choices


Low confidence

        |
        v

Creative generation mode
```

The prediction object is therefore:

```javascript
{
    output,

    confidence: {
        exactScore,
        partialScore
    },

    modelCharacteristics,

    searchInformation
}
```

---

# 15. Strict and Exploratory Modes

## Strict Mode

Requires:

- high exact split coverage
- strong validation
- reproducible execution

Purpose:

- reliable prediction
- scientific evaluation


---

## Exploratory Mode

Allows:

- partial matches
- weaker candidates
- broader search

Purpose:

- hypothesis discovery
- creative generation
- interactive experiences

---

# 16. Emergent Transform Grammars

Because predictors are complete executable programs, grammar-like behavior can emerge naturally.

Examples:

```
question -> answer

name pattern -> response

symbol sequence -> continuation
```

No explicit grammar rules are required.

The transformation grammar is a consequence of the discovered computation.

---

# 17. Context Awareness

Context can emerge from program structure.

Example:

Input:

```
me Carol, me? Carol.

me Anna, me? Anna.

me Matt, me?
```

Expected prediction:

```
Matt
```

The predictor discovers the underlying transformation rather than storing individual examples.

Potential applications:

- dialogue patterns
- symbolic reasoning
- structured interaction
- game mechanics

---

# 18. Termination and Verification

Candidate programs require execution validation.

Pipeline:

```
Candidate Program
        |
        v
Termination Check
        |
        v
executeTuring()
        |
        v
Output Comparison
        |
        v
Ranking
```

The design assumes termination checking for the selected abstract machine model.

Existing Enigma components:

- universal execution checker
- candidate validation framework

Future optimizations:

- reachability analysis
- search pruning
- architecture mapping

---

# 19. Exploratory Program Generation

Because partial evaluation exists, Enigma can explore a wider computational space.

Process:

```
Program Space
      |
      v
Generate Candidate
      |
      v
executeTuring()
      |
      v
Evaluate:
    - exact matches
    - partial matches
    - complexity
```

Benefits:

- discovering unexpected transformations
- supporting interactive exploration
- generating diverse candidates

while maintaining exact validation as the foundation.

---

# 20. Fun & Profit Integration

Enigma Predictor supports interactive environments.

Possible applications:

- adaptive narratives
- mini-games
- procedural events
- NPC behavior
- puzzle generation

Architecture:

```
Fun & Profit
      |
      v
Enigma Predictor
      |
      v
Yaqui Knowledge Layer
```

---

# 21. Implementation Components

Core modules:

```
executeTuring.js

Program Enumerator

Past/Future Split Generator

Candidate Evaluator

Termination Checker

Ranking Engine

Predictor Runtime
```

---

# 22. Development Roadmap

## v0.1

Implement:

- input-enabled Turing programs
- split generation
- exact evaluation
- partial evaluation
- structured ranking


## v0.2

Improve:

- search efficiency
- reachability pruning
- execution optimization
- candidate caching


## v0.3

Integrate:

- Enigma runtime predictor
- Fun & Profit mini-games
- Yaqui indexed knowledge layer

---

# 23. Design Principles

## Computational Transparency

Every prediction originates from an executable program.

## Reproducibility

The same program should produce the same output.

## Generalization

The goal is discovering reusable transformations, not memorization.

## Minimality

Prefer simpler computational explanations when predictive performance is comparable.

## Structured Confidence

Prediction quality must remain inspectable.

---

# 24. Status

This document defines the conceptual architecture of Enigma Predictor v0.1.

Implementation details may evolve as:

- executeTuring improves
- search algorithms mature
- benchmarks are developed
- HCI integration requirements emerge