# Enigma Predictor Design

**Version:** 0.1 Design Checkpoint  
**Status:** Experimental Architecture

---

# 1. Overview

Enigma Predictor is a general-purpose sequence prediction system based on searching for compact executable explanations of observed data.

Instead of directly fitting statistical parameters, Enigma searches for small computational programs capable of reproducing observed input/output relationships and extending them to unseen future data.

Core principle:

> Find the smallest executable process that generalizes observed relationships.

The system is based on:

- universal Turing machine execution (`executeTuring`)
- automated program search
- input/output generalization testing
- partial-match evaluation
- executable model validation

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
Validation + Ranking
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
s1             -> s2...sn

s1s2           -> s3...sn

s1s2s3         -> s4...sn

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
- prediction accuracy
- generalization score

---

# 5. Input-Enabled Turing Machines

Previous versions considered machines producing outputs without input.

The new Enigma model allows:

```
Input sequence
       |
       v
Turing Program
       |
       v
Predicted sequence
```

Example:

Input:

```
"hello wor"
```

Output:

```
"ld"
```

The program is evaluated by whether it discovers the transformation, not by memorizing examples.

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
accuracy(P) >= threshold
```

Optimization targets:

Primary:

- minimum program complexity

Secondary:

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

Produces:

```
Input       Output

A           BCDEF

AB          CDEF

ABC         DEF

ABCD        EF

ABCDE       F
```

A valid predictor must generalize across multiple splits.

---

# 8. Partial Matching

Exact matching is not required during exploration.

Candidates can receive partial scores.

Example:

```
Candidate Program A

Split 1: 100%
Split 2: 100%
Split 3: 80%
Split 4: 0%

Total:
70%
```

Partial matching enables:

- candidate ranking
- search optimization
- gradual discovery
- exploratory prediction modes

---

# 9. Candidate Ranking

Candidate score combines:

- prediction accuracy
- program complexity
- execution cost

Conceptual score:

```
Score =
    Accuracy
    -
    Complexity Penalty
    -
    Execution Penalty
```

Alternative:

```
Score =
    Successful Matches / Program Complexity
```

The preferred predictor is:

- simple
- accurate
- general

---

# 10. Verification Pipeline

Candidate validation:

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
- candidate validation

Future optimizations:

- reachability analysis
- search pruning
- architecture mapping

---

# 11. Predictor Runtime

After discovery, the selected program becomes the predictor.

Runtime:

```
Previous Sequence
        |
        v
Enigma Predictor
        |
        v
Future Sequence
```

Example:

Input:

```
me Carol, me? Carol.
me Anna, me? Anna.
me Matt, me?
```

Prediction:

```
Matt
```

The predictor stores the discovered computational rule rather than the example itself.

---

# 12. Emergent Transform Grammars

Because predictors are complete executable programs, grammar-like behavior can naturally emerge.

Examples:

```
question -> answer

name pattern -> response

symbol transformation -> continuation
```

No explicit grammar rules are required.

The grammar is a consequence of the discovered computation.

---

# 13. Context Awareness

Context can emerge from program structure.

Example:

Input:

```
me Carol, me? Carol.
me Anna, me? Anna.
me Matt, me?
```

Output:

```
Matt
```

The same mechanism may generalize to:

- conversations
- symbolic systems
- structured sequences
- game interactions

---

# 14. Strict and Exploratory Modes

## Strict Mode

Requires:

- complete validation
- strong matches
- reproducible predictions

Purpose:

- reliable prediction

---

## Exploratory Mode

Allows:

- partial matches
- lower confidence candidates
- unusual continuations

Purpose:

- hypothesis generation
- creative exploration

---

# 15. Fun & Profit Integration

Enigma Predictor will support interactive environments.

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

# 16. Implementation Components

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

# 17. Development Roadmap

## v0.1

Implement:

- input-enabled Turing programs
- split generation
- candidate evaluation
- ranking system

---

## v0.2

Improve:

- search efficiency
- reachability pruning
- execution optimization

---

## v0.3

Integrate:

- Enigma runtime predictor
- Fun & Profit mini-games
- Yaqui indexing layer

---

# 18. Design Principles

Enigma Predictor prioritizes:

1. Computational transparency

Every prediction originates from an executable program.

2. Reproducibility

The same program should produce the same result.

3. Generalization

The goal is not memorization but discovering reusable transformations.

4. Minimality

Prefer simpler explanations when predictive ability is comparable.

---

# 19. Status

This document defines the conceptual architecture of Enigma Predictor v0.1.

Implementation details may evolve as:

- executeTuring improves
- search algorithms mature
- prediction benchmarks are developed
- Fun & Profit integration requirements emerge