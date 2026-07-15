

    // find non-overlapping occurrences of pattern in state (left-to-right)
    function findNonOverlappingOccurrences(state, pattern) {
        const n = state.length, m = pattern.length;
        if (m === 0 || m > n) return [];
        const occ = [];
        for (let i = 0; i <= n - m; ) {
            let ok = true;
            for (let j = 0; j < m; j++) {
            if (state[i + j] !== pattern[j]) { ok = false; break; }
            }
            if (ok) { occ.push(i); i += m; } else { i += 1; }
        }
        return occ;
    }

    // getPossibleIntroSections(state, zeroToken) using non-overlapping matches
    function getPossibleIntroSections(state, zeroToken) {
        if (!Array.isArray(zeroToken) || zeroToken.length === 0) return [];
        const occ = findNonOverlappingOccurrences(state, zeroToken);
        if (occ.length < 2) return [];
        const sections = [];
        const m = zeroToken.length;
        for (let k = 0; k < occ.length - 1; k++) {
            const s = occ[k] + m;       // first index after k-th match
            const e = occ[k + 1] - 1;   // last index before (k+1)-th match
            if (s <= e + 1) sections.push({ start: s, end: e, slice: state.slice(s, e + 1) });
        }
        return sections;
    }

    // helper to count occurrences of a needle (allow overlaps)
    const countOccurrences = (hay, needle) => {
        const n = hay.length, m = needle.length;
        if (m === 0) return 0;
        let c = 0;
        for (let i = 0; i + m <= n; i++) {
        let j = 0;
        while (j < m && hay[i + j] === needle[j]) j++;
        if (j === m) c++;
        }
        return c;
    };

    // input: introSection: BigInt[], state: BigInt[]
    // output: Map<string, {count: number, firstStart: number}>

    function tokenize(introSection, state) {
        const nIntro = introSection.length, nState = state.length;
        const serialize = (arr, start, len) => {
            let s = '';
            for (let i = 0; i < len; i++) { if (i) s += ','; s += arr[start + i].toString(); }
            return s;
        };

        // 1) candidates that appear >1 times in state
        const inState = new Map(); // key -> stateCount (we only need >1)
        for (let s = 0; s < nIntro; s++) {
            for (let len = 1; s + len <= nIntro; len++) {
            const key = serialize(introSection, s, len);
            if (inState.has(key)) continue;
            let cnt = 0;
            for (let i = 0; i + len <= nState; i++) {
                let j = 0;
                while (j < len && state[i + j] === introSection[s + j]) j++;
                if (j === len) cnt++;
                if (cnt > 1) break;
            }
            if (cnt > 1) inState.set(key, cnt);
            }
        }
        if (inState.size === 0) return new Map();

        // 2) collect positions inside introSection for each candidate (sorted)
        const positions = new Map(); // key -> [start indices]
        for (let s = 0; s < nIntro; s++) {
            for (let len = 1; s + len <= nIntro; len++) {
            const key = serialize(introSection, s, len);
            if (!inState.has(key)) continue;
            if (!positions.has(key)) positions.set(key, []);
            positions.get(key).push(s);
            }
        }
        for (const arr of positions.values()) arr.sort((a,b) => a-b);

        // 3) prepare candidates sorted by descending length (prefer longer tokens)
        const candidates = [];
        for (const [k, cState] of inState.entries()) {
            const len = k === '' ? 0 : k.split(',').length;
            candidates.push({ key: k, len, cState });
        }
        candidates.sort((a, b) => b.len - a.len || b.cState - a.cState || (a.key < b.key ? -1 : 1));

        // 4) select non-overlapping occurrences in introSection,
        //    and record first occurrence start for each token
        const covered = new Array(nIntro).fill(false);
        const result = new Map(); // key -> { count, firstStart }
        for (const cand of candidates) {
            const starts = positions.get(cand.key) || [];
            let taken = 0;
            let firstStart = -1;
            for (const st of starts) {
                // check if this occurrence is free (no overlap with already taken occurrences)
                let conflict = false;
                for (let p = st; p < st + cand.len; p++) {
                    if (covered[p]) { conflict = true; break; }
                }
                if (conflict) continue;
                // take it
                for (let p = st; p < st + cand.len; p++) covered[p] = true;
                if (firstStart === -1) firstStart = st;
                taken++;
            }
            if (taken > 0) result.set(cand.key, { count: countOccurrences(introSection, parseKey(cand.key)), firstStart });
        }

        return result;
    }

    const startsWith = (seq, pat) => {
        if (pat.length > seq.length) return false;
        for (let i = 0; i < pat.length; i++) { if (seq[i] !== pat[i]) return false;}
        return true;
    };

    function findUniqueSuffix(space, label, stopAt) {
        const candidates = [];
        for (let i = 0; i <= space.length - label.length; i++) {
            let match = true;
            for (let j = 0; j < label.length; j++) {
                if (space[i + j] !== label[j]) { match = false; break; }
            }
            if (!match) continue;
            const suffix = [];
            for (let k = i + label.length; k < space.length; k++) {
            let isLabel = true;
            for (let j = 0; j < label.length && k + j < space.length; j++) {
                if (space[k + j] !== label[j]) { isLabel = false; break; }
            }
            if (isLabel) break;
            if (stopAt.some(pat => startsWith(space.slice(k), pat))) break;
                suffix.push(space[k]);
            }
            if (suffix.length > 0) candidates.push(suffix);
        }
        if (candidates.length === 1) return candidates[0];
        return undefined;
    }

    const space = [1n,2n,3n,4n,5n,6n];
    const label = [2n,3n];
    const stopAt = [[5n]];

    console.log("SUFFIX:" + findUniqueSuffix(space, label, stopAt))

    function tokensCoverSection(tokens, section) {
        const startMap = new Map();
        tokens.forEach((tok, idx) => {
            const first = tok[0];
            if (!startMap.has(first)) startMap.set(first, new Set());
            startMap.get(first).add(idx);
        });

        let i = 0;                     
        const used = new Set();       

        while (i < section.length) {
            const candidates = startMap.get(section[i]);
            if (!candidates) return false;
            let matched = false;
            for (const idx of candidates) {
            const tok = tokens[idx];
            if (i + tok.length > section.length) continue;
            let ok = true;
            for (let j = 0; j < tok.length; j++) {
                if (section[i + j] !== tok[j]) { ok = false; break; }
            }
            if (!ok) continue;
            matched = true;
            i += tok.length;          
            break;                   
            }

            if (!matched) return false; 
        }
        return i === section.length;
    }

    function inferIncDec(state, zeroToken) {
        const sections = getPossibleIntroSections(state, zeroToken);

        const emptySections = sections.some(x => x.end - x.start == -1)

        if (sections.length === 0 || emptySections) return [[], [], 0, []]

        const acc = [[], [], 0, []]

        const incDecTokenIntro = state.slice(0, sections[0].start - zeroToken.length)

        for(let i = 0; i < sections.length; i++) {
            const sec = sections[i]

            const intro = sec.slice;

            const tokens = tokenize(intro, incDecTokenIntro.concat(intro)); // Map key -> {count, firstStart}
            if (tokens.size < 2) {
                //console.log(")))))" + parse(enrichSeqNo(incDecTokenIntro)))
                //console.log([...tokens.keys()].map(tk => parse(enrichSeqNo(parseKey(tk)))))
                return [[], [], -(i+1), []]
            }

            const entries = Array.from(tokens.entries());
            const incSet = new Set(), decSet = new Set();
            for (let i = 0; i < entries.length; i++) {
                for (let j = i + 1; j < entries.length; j++) {
                    const [ki, vi] = entries[i];
                    const [kj, vj] = entries[j];
                    if (vi.count > 0 && vi.count === vj.count) {
                        if (vi.firstStart <= vj.firstStart) { incSet.add(ki); decSet.add(kj); }
                        else { incSet.add(kj); decSet.add(ki); }
                    }
                }
            }
            if (incSet.size > 0 && decSet.size > 0) {
                for (const t of Array.from(incSet)) {
                    if (decSet.has(t)) { incSet.delete(t); decSet.delete(t); }
                }

                const merged = [...(new Set([...incSet, ...decSet]))].map(parseKey)
                if (!tokensCoverSection(merged, intro)){
                    return acc
                }

                acc[0] = Array.from(new Set([...(new Set(acc[0])), ...incSet]))
                acc[1] =  Array.from(new Set([...(new Set(acc[1])), ...decSet]))
                acc[2] = i + 1
                acc[3].push(sec)

                //console.log("-----" + parse(enrichSeqNo(zeroToken)))
                //console.log("++++++" + parse(enrichSeqNo(incDecTokenIntro)))

                
            } else {
                return acc
            }

        }

        return acc;
    }

    function parseKey(key) {
        return key.split(',').map(s => BigInt(s));
    }

    function countVar(state, tokenisation) {
        const [incs, decs] = tokenisation || [[], []];

        // build list of needles (arrays) from keys
        const makeNeedles = (keys) => keys.map(k => ({ key: k, arr: parseKey(k), len: k === '' ? 0 : k.split(',').length }));
        const incNeedles = makeNeedles(incs);
        const decNeedles = makeNeedles(decs);

        let count = 0;

        for (const n0 of incNeedles) count += countOccurrences(state, n0.arr);
        for (const n0 of decNeedles) count -= countOccurrences(state, n0.arr);

        return count;
    }

    const eraseSeqNo = (seq) => {
        return seq.map(x => x[0])
    }

    const enrichSeqNo = (seq) => {
        return seq.map((x, i) => [x, i])
    }

    //todo enrich original token seqNo into turing machine

    const zeroBranch = (state, seq) => {
        for (let i = 0; i < seq.length; i++) {
            const candidate = eraseSeqNo(seq.slice(0, i))
            const inference = inferIncDec(eraseSeqNo(state), candidate)
            if (inference[0].length > 0) {
                const [incs, decs, secCount, sections] = inference
                if (incs.length > 1 || decs.length > 1) {
                    continue
                }
                return {
                    varName:  parse(enrichSeqNo(candidate)),
                    zero: enrichSeqNo(candidate), 
                    incs: incs.map(x => enrichSeqNo(parseKey(x))), 
                    decs: decs.map(x => enrichSeqNo(parseKey(x))),
                    incNames: incs.map(x => parse(enrichSeqNo(parseKey(x)))),
                    decNames: decs.map(x => parse(enrichSeqNo(parseKey(x)))),
                    secCount: secCount, 
                    sections: sections
                }
            }
        }
       return undefined

    }

    const checkIfEndsWithToken = (output, tokens) => {
        for (token of tokens) {
            const strippedToken = eraseSeqNo(token)
            const strippedOutput = eraseSeqNo(output.slice(-token.length))

            if (bigIntArraysEqual(strippedToken, strippedOutput)) {
                return true
            }
        }

        return false
    }

    const parseIncDec = (inference) => {
        const [incs, decs, count] = inference
        const incsData = incs.map(inc => parse(enrichSeqNo(parseKey(inc))))
        const decsData = decs.map(dec => parse(enrichSeqNo(parseKey(dec))))

        return `incs: ${incsData}; decs: ${decsData}; sections=${count}`

    }



console.log("HELLO")
const intro = [1n,2n,3n,2n,3n];
const state2 = [1n,3n,0n,4n,1n,2n,0n, 3n,2n,1n,2n,1n,2n];
const map = tokenize(intro, state2);
for (const [k,v] of map) console.log(k, '->', v);


    const MAX_UNICODE = 0x10FFFFn;

    function entityToBigInt(fragment) {
        const decMatch = fragment.match(/^&#(\d+);$/);
        if (decMatch) return BigInt(decMatch[1]);

        const hexMatch = fragment.match(/^&#x([0-9a-fA-F]+);$/);
        if (hexMatch) return BigInt('0x' + hexMatch[1]);

        return null;
    }

    function cpToString(cp) {
        if (cp <= MAX_UNICODE) {
            return String.fromCodePoint(Number(cp));
        }
        return `&#${cp.toString()};`;
    }

    function tokenToBigInt(token) {
        const entity = entityToBigInt(token);
        if (entity !== null) return entity;

        // token is a normal character – get its code point
        const cp = token.codePointAt(0);
        return BigInt(cp);
    }

    function render(input) {
        const result = [];
        let pos = 0;
        let i = 0;

        while (i < input.length) {
            if (input[i] === '&') {
                const semi = input.indexOf(';', i + 1);
                if (semi !== -1) {
                    const candidate = input.slice(i, semi + 1);
                    const big = entityToBigInt(candidate);
                    if (big !== null) {
                    result.push([big, pos++]);
                    i = semi + 1;
                    continue;
                    }
                }
            }

            const cp = input.codePointAt(i);
            result.push([BigInt(cp), pos++]);

            i += cp > 0xFFFF ? 2 : 1;
        }

        if (result.length === 1 && !result[0]) return []
        return result;
    }

    function parse(state) {
        if (state === undefined || state.length === 0 || (state.length === 1 && !state[0])) return ''

        return state
            .map(([cp]) => cpToString(cp))
            .join('');
    }


    //turing executor and termination oracle

    function inferMembound(turing) {
        const base = turing.filter(x => x[1] !== 0n && x[1] < TURING_OFFSET).length
        return {
            currentExpansion: base,
            currentHyperop: 0n,
            hyperopBound: turing.filter(x => x[1] > TURING_OFFSET).length,
            baseBound: base,
        }

    }

    function powBigInt(base, exponent) {
        base = BigInt(base);
        exponent = BigInt(exponent);
        if (exponent < 0n) throw new RangeError('negative exponent not supported for BigInt');
        let result = 1n;
        while (exponent > 0n) {
            if (exponent & 1n) result *= base;
            base *= base;
            exponent >>= 1n;
        }
        return result;
    }

    function checkMembound(value, membound) {

        let counter = 0n
        while (membound.currentExpansion < value && membound.currentHyperop < membound.hyperopBound) {
            counter++
            if (counter > 30n) {
                console.log(membound)
                throw "check mem overflow"
            }
            membound.currentExpansion = powBigInt(membound.currentExpansion, membound.baseBound)
            membound.currentHyperop++
        }

        return membound.currentExpansion >= value

    }

    function minBigInt(arr) {
        if (arr.length === 0) return undefined
        return arr.reduce((a, b) => (a < b ? a : b));
    }

    function maxBigInt(arr) {
        if (arr.length === 0) return undefined
        return arr.reduce((a, b) => (a > b ? a : b));
    }

    const getJumpDestination = jump => jump[1] - TURING_OFFSET

    const createJumpDestination = cur => cur + TURING_OFFSET

    const getLoopVar = jump => jump[0]

    const filterCov = (coverage, start, end) => new Set([...coverage].filter(x => x >= start && x <= end))

    function checkLoopSegment(turing, coverage, jump, cursor, memory, lastLoopVarState, lastCov) {

        if (!lastLoopVarState || !lastCov) return true
        const loopStart = getJumpDestination(jump)
        const loopEnd = cursor
        if (loopStart > loopEnd) return true

        const loopVarIdx = getLoopVar(jump)
        const loopVar = memory[loopVarIdx]

        const segmentJumps = turing.slice(Number(loopStart), Number(loopEnd)).map(getJumpDestination).filter(x => x >= 0n)
        const minDest = minBigInt(segmentJumps)
        const maxDest = maxBigInt(segmentJumps) > loopEnd ? BigInt(turing.length-1) : loopEnd
        //todo improve up to any instruction that jumps above loopEnd

        const expandedStart = minDest === undefined ? loopStart : minBigInt([loopStart, minDest])
        const expandedEnd = maxDest === undefined ? loopEnd : maxBigInt([loopStart, maxDest])

        //todo check if expanded segment refers to variables in current segment

        //todo check if dec extruction mentioned for loopvar at all

        //todo exclude unreachable segments - no dec instruction for forward jmp
        
        const segmentCov = filterCov(coverage, expandedStart, expandedEnd)
        const segmentLastCov = filterCov(coverage, expandedStart, expandedEnd)


        if (BigInt(segmentCov.size) >= expandedEnd - expandedStart && loopVar >= lastLoopVarState && loopVar !== 0n) {
            return false
        }

        return true
    }

    function bigIntArraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false; // BigInt compared with ===
        }
        return true;
    }

    function checkRepeatCfg(state, cursor, history) {
        for (const x of history){
            const [pastCursor, pastState] = x
            if (pastCursor === cursor && bigIntArraysEqual(pastState, state)) {
                return false
            }
        }
        return true
    }

    const TURING_INC = 2n
    const TURING_DEC = 1n
    const TURING_OUT = 0n
    const TURING_OFFSET = 100n

    const TURING_JMP = (instrPointer) => instrPointer + TURING_OFFSET

    //input is sequence of [mem_address, instr_address]
    //instr_address past offset jmpnz mem_address (instr_address - offset)
    //other instr_address as inc dec out
    function executeTuring(turing, ctx = {}) {
  
        ctx.trace = []
        ctx.membound = inferMembound(turing)
        const membound = ctx.membound

        let cursor = 0n

        ctx.memory = []
        const memory = ctx.memory

        const output = []

        ctx.history = []
        const history = ctx.history

        ctx.coverage = new Set()
        const coverage = ctx.coverage

        const lastCoverageForJmp = {}
        const lastLoopVarStateForJmp = {}

        let safeCounter = 0n

        while (cursor < turing.length) {
            ctx.trace.push(cursor)
            safeCounter++
            if (safeCounter > 3000n) {
                console.log(ctx)
                console.log(printTuring(turing))
                throw "overflow " + cursor
            }

            const [mem, instr] = turing[cursor]

            if (instr === TURING_OUT) {
                output.push(mem)
                coverage.add(cursor)
                cursor++
            } else if (instr === TURING_INC) {
                if (memory[mem] === undefined) memory[mem] = 0n
                memory[mem]++
                if(!checkMembound(memory[mem], membound)) {

                    const loopJmp = turing.findLastIndex(x => x[1] >= TURING_OFFSET + BigInt(turing.length))
                    
                    const noOuterJumps = loopJmp !== -1 && !turing.slice(loopJmp).some(x => x[1] > TURING_OFFSET && x[1] < TURING_OFFSET + BigInt(loopJmp))
                    if (noOuterJumps) {
                        memory[turing[loopJmp][0]] = mem
                        cursor = loopJmp
                    } else {
                        console.log("LOOP HYPER: " + cursor)
                        ctx.loopHyper = cursor
                        ctx.loopState = memory[mem]
                        return output
                    }
                    
                } else {
                    coverage.add(cursor)
                    cursor++
                }
                
            } else if (instr === TURING_DEC) {
                if (memory[mem] === undefined) memory[mem] = 0n
                memory[mem]--
                if (memory[mem] < 0n) memory[mem] = 0n
                coverage.add(cursor)
                cursor++
            } else {
                if (memory[mem] === undefined) memory[mem] = 0n
                if (memory[mem] === 0n) {
                    cursor++
                } else {

                    const nextCursorShift = turing.slice(Number(cursor) + 1).findIndex(x => x[1] !== TURING_OUT)
                    const nextCursor = nextCursorShift === -1 ? turing.length + 1 : cursor + BigInt(nextCursorShift) + 1n
                    coverage.add(cursor)
                    const lastCov = lastCoverageForJmp[cursor.toString]
                    const lastLoopVarState = lastLoopVarStateForJmp[cursor.toString]
                    const nonTerminationRecovery = turing[nextCursor] && turing[nextCursor][1] - TURING_OFFSET !== cursor && turing[nextCursor][1] > TURING_OFFSET && turing[nextCursor][0] === mem //for theorem provers

                    if (!checkLoopSegment(turing, coverage, turing[cursor], cursor, memory, lastLoopVarState, lastCov)) {
                        if (nonTerminationRecovery) {
                            cursor = nextCursor
                        } else {
                            console.log("LOOP SEG: " + cursor)
                            ctx.loopSegment = cursor
                            return output
                        }  
                    } else {
                        cursor = instr - TURING_OFFSET
                        if (!checkRepeatCfg(memory, cursor, history)) {
                        
                            if (nonTerminationRecovery) {
                                cursor = nextCursor
                            } else {
                                console.log("LOOP REPEAT: " + cursor)
                                ctx.loopRepeat = cursor
                                return output
                            }
                        }
                        lastCoverageForJmp[cursor.toString] = coverage
                        lastLoopVarStateForJmp[cursor.toString] = memory[mem]

                    }
                    
                }
            }
            
        }

        return output
    }

    function genJump(turing, varIdx, label) {
        const outs = turing
            .map((x,i) => [x[0], x[1], BigInt(i)])
            .filter(x => x[1] === 0n)
            .map(x => [x[0], x[2]]) //char, line_no

            
        const instrPointer = find(outs, label)[0] //take first label
        if (instrPointer === undefined) {
            return undefined
        }
        return [varIdx, instrPointer[1] + TURING_OFFSET]
    }

    function genStubJmp(turing, varIdx) {
        return [varIdx, BigInt(turing.length) + TURING_OFFSET + 1n]
    }


    function genInc(varIdx) {
        return [varIdx, TURING_INC]
    }

    function genDec(varIdx) {
        return [varIdx, TURING_DEC]
    }

    function genOut(next) {
        return [next[0], 0n]
    }

    function printTuring(turing, parseOut=true) {
        return turing.map((x, i) => {
            if (x[1] === TURING_INC) {
                return `${i}: inc \$${x[0]}`
            } else if (x[1] === TURING_DEC) {
                return `${i}: dec \$${x[0]}`
            } else if (x[1] === TURING_OUT) {
                return `${i}: out ${parseOut ? parse([[x[0], 0]]):x[0]}`
            } else {
                return `${i}: jmp \$${x[0]} -> ${getJumpDestination(x)}`
            }
        }).join("\n")
    }

    const ctxTuring = {}
    const program = [
        [0n,   TURING_INC], 
        [0n,   TURING_JMP(0n)], 
        [0n,   TURING_JMP(4n)], 
        [20n,  TURING_OUT],
        [-1n,   TURING_OUT], 
        [0n,   TURING_INC], 
    ]

    const program2 = [
        [0n,   TURING_INC], 
        [0n,   TURING_JMP(0n)], 
        [0n,  TURING_OUT],
        [0n,   TURING_JMP(100n)], 
        [-1n,   TURING_OUT], 
    ]

    console.log("\n\nTURING TEST")

    console.log(printTuring(program, false))

    const output = executeTuring(program, ctxTuring)

    console.log("TURING OUT: " + output)

    console.log(ctxTuring)

    console.log("TURING END\n\n\n")

    //prediction

    const range = limit => Array.from({ length: limit + 1 }, (_, i) => i);

    const createMask = (length, maskCfg) => {
        return new Set()
    }

    const makeKey = (arr) => arr.map(x => x.toString()).join(",")


    const registerRule = (stateRun, patternRun, ctx, next) => {
        const stateRule   = stateRun.map(v => v.toString()).join(',');
        const patternRule = patternRun.map(v => v.toString()).join(',');

        if (!ctx.transform.has(patternRule)) {
            ctx.transform.set(patternRule, {});
            ctx.transformStr.set(parse(enrichSeqNo(patternRun)), {});
        }
        if (ctx.transform.get(patternRule)[makeKey(next)] === undefined) {
            ctx.transform.get(patternRule)[makeKey(next)] = []
            ctx.transformStr.get(parse(enrichSeqNo(patternRun)))[parse([next])] = [];
        }
        ctx.transform.get(patternRule)[makeKey(next)].push(stateRun)
        ctx.transformStr.get(parse(enrichSeqNo(patternRun)))[parse([next])].push(parse(stateRun));
    }

    const emitRules = (stateArr, patternArr, next, ctx, sMask, pMask, start) => {
        if (sMask.size === 0 && pMask.size === 0) return
        let i = 0;
        let j = 0; 

        const sections = (set) => {
            const arr = [...set].sort((a,b)=>a<b?-1:1)
            const breaks = allBreaks(arr)
            if (breaks.length === 0) {
                return [set]
            }
            breaks.push(arr.length - 1)
            const res = [];
            const pairs = [0, ...breaks].map((x, i) => [x, breaks[i]])
            return pairs.map(range => new Set(arr.slice(range[0], range[1] + 1)))
        }

        const applyMask = (mask, arr) => {
            const maskArr = [...mask].sort((a,b)=>a<b?-1:1)
            return maskArr.map(i => arr[i]).filter(x => x !== undefined)
        }

        const sMaskSect = sections(sMask)
        const pMaskSect = sections(pMask)
        //ctx.pMaskSect = pMaskSect
        //ctx.sMaskSect = sMaskSect

        for (let i = 0; i < sMaskSect.length && i < pMaskSect.length; i++) {
            const stateRun = applyMask(sMaskSect[i], stateArr)
            const patternRun = applyMask(pMaskSect[i], patternArr)
            registerRule(stateRun, patternRun, ctx, next)
        }
    };

    function allBreaks(arr) {
        const breaks = [];

        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i + 1] - arr[i] !== 1) {
                breaks.push(i);
            }
        }
        return breaks;
    }

    const find = (state, pattern, ctx = { }, fuzzy = false) => {
  
        if (!ctx.transform) ctx.transform = new Map();
        if (!ctx.simillarity) ctx.simillarity = 0;
        if (!ctx.transformStr) ctx.transformStr = new Map();

        ctx.masks = ctx.masks ?? {}
        const masks = ctx.masks 
        let sMask = masks.stateMask
        let pMask = masks.patternMask 

        const result = [];

        ctx.scores = []

        for (let start = 0; start <= state.length - pattern.length; start++) {

            //todo infer sMask and pMask from pattern vs window simillarity

            let simillarity = 0

            if (fuzzy) {
                const inferredMask = pattern.map((x, i) => x !== state[start + i][0] ? i : undefined)
                    .filter(x => x !== undefined)
                pMask = sMask = new Set(inferredMask)

                simillarity = pattern.length - inferredMask.length


                if (pMask.has(0) && simillarity > 0) {
                    inferredMask.sort((a,b) => a < b ? -1:+1)

                    //todo apply mask and look to the next unmatched repeatedly
                    //todo disallow section deletions/insertions (to keep masked sections aligned)
                    let edge = allBreaks(inferredMask)[0] ?? inferredMask.length - 1

                    if (edge !== 0) {
                       for (let shift = -edge; shift <= edge; shift++) {
                            const newMask = pattern
                                .map((x, i) => x !== (state[i <= edge ? start + i + shift : start + i] ?? [])[0] ? i : undefined)
                                .filter(x => x !== undefined)
                            const newSimillarity =  pattern.length - newMask.length
                            if (newSimillarity > simillarity) {
                                simillarity = newSimillarity
                                if (simillarity > ctx.simillarity) {
                                    ctx.edge = edge
                                    ctx.edgeStr = parse(enrichSeqNo(pattern.slice(edge + 1)))
                                    ctx.shift = shift
                                }
                                
                                pMask = new Set(newMask)
                                sMask = new Set(newMask)

                                //continue //todo fix
                                if (shift > 0) {
                                    sMask = new Set([...sMask]
                                        .map(i => i <= edge ? (i + shift <= edge? i + shift : undefined) : i)
                                        .filter(x => x !== undefined))
                                   
                                } else if (shift < 0) {
                                    sMask = new Set([...sMask]
                                        .map(i => i <= edge ? i + shift : i))
                                    for (let i = 0; i < -shift; i++) {
                                        sMask.add(edge + i)
                                    }
                                }
                            }
                        }

                    }
                    
                }
            } else {
                simillarity = pattern.every((x, i) => x === state[start + i][0]) ? pattern.length : 0
            }

            if (simillarity > 0) { 

                const origStateSeg = state
                    .slice(start, start + pattern.length)

                const origPatternSeg = pattern.slice(); 

                const nextIdx = start + pattern.length;
                const next = state[nextIdx];

                if (next && simillarity > 0) {
                    //console.log(parse(enrichSeqNo(pattern)))

                    if (simillarity > ctx.simillarity && fuzzy) {
                        ctx.transform = new Map();
                        ctx.transformStr = new Map();
                    }
                    
                    if (simillarity >= ctx.simillarity && fuzzy) {
                        
                        const inferredMask = [...pMask]
                        inferredMask.sort((a,b) => a < b ? -1:+1)
                        ctx.pattern = [...parse(enrichSeqNo(pattern))].map((x, i) => pMask.has(i) ? '*' : x).join('')
                        ctx.match = [...parse(state.slice(start, nextIdx))].map((x, i) => sMask.has(i) ? '_' : x).join('')
                        ctx.patSkip = pMask.has(0) ? allBreaks(inferredMask)[0] ?? inferredMask.length : 0
                        ctx.n = pattern.length - ctx.patSkip

                        //console.log(ctx.pattern)
                        //console.log(" ")
                        masks.patternMask = pMask
                        masks.stateMask = sMask

                        emitRules(enrichSeqNo(origPatternSeg), eraseSeqNo(origStateSeg), next, ctx, pMask, sMask, start);
                    }


                    ctx.simillarity = ctx.simillarity > simillarity ? ctx.simillarity : simillarity
                    
                    ctx.scores.push(simillarity)
                    result.push(next);
                }
            }
        }

        //const maxScore = Math.max(...ctx.scores)
        return result.filter((x, i) => ctx.scores[i] === ctx.simillarity);
    }

    function blurArray(arr, blurMask) {
        const out = [];
        let i = 0;
        while (i < arr.length) {
            if (!blurMask.has(i)) {
                out.push(arr[i]);
                i++;
                continue;
            }
            let sum = 0n;
                while (i < arr.length && blurMask.has(i)) {
                sum += arr[i];
                i++;
            }
            out.push(sum);
        }
        return out;
    }


    const inferMaskingBound = (len) => {
        return 2
    }

    const findFuzzy = (state, ctx, len, previousMany) => {
        

        const pattern = state.slice(state.length - len).map(x => x[0]) 
        const space = state.slice(0, -len)
        const matches = find(space, pattern, ctx);

        if (!matches || matches.length === 0) {
            
            if (!ctx.fuzzyBound) {
                ctx.fuzzyBound = previousMany?.length ?? 0
            }

            if (len > ctx.simillarity + ctx.fuzzyBound) {
                return []
            }  
            
            const fuzzyMatches = find(space, pattern, ctx, true);

            if (previousMany === undefined || fuzzyMatches === undefined) {
                return previousMany ?? []
            }
            if (fuzzyMatches.length > previousMany.length) {
                return previousMany
            }
            return fuzzyMatches
        }

        ctx.n = len - 1

        return matches

    }

    const predict = (state, ctx = {}) => {
        //console.log("---------")
        if (state.length === 0) return undefined;
        let previousMany = undefined;
        ctx.fuzzyBound = undefined
        ctx.simillarity = 0

        for (let len = 1; len <= state.length; len++) {

            const matches = findFuzzy(state, ctx, len, previousMany)

            

            if (matches.length === 0) {
                return previousMany
            } else {
                
                previousMany = matches;
                continue;
            }
        }

        return undefined;
    }

    function pickRelevantTransform(next, ctx) {
        if (!ctx.transform) return;
        if (!next) return;

        if (!ctx.currentTransform) ctx.currentTransform = {}
        if (!ctx.currentTransformStr) ctx.currentTransformStr = {}
        for (const [ruleIn, ruleOutMulti] of ctx.transform.entries()) {
            for (const [el, ruleOut] of Object.entries(ruleOutMulti)) {
                if (next[0] === parseKey(el)[0]) {
                    const to = ruleOut[ruleOut.length - 1]
                    ctx.currentTransform[ruleIn] = to
                    ctx.currentTransformStr[parse(enrichSeqNo(parseKey(ruleIn)))] = parse(to)

                    ruleOut.forEach(r => {
                        if (parse(to) !== parse(r)) {
                            ctx.currentTransform[makeKey(eraseSeqNo(r))] = to
                            ctx.currentTransformStr[parse(r)] = parse(to)
                        }
                    })
                }
            } 
        }
    }

    function predictDeterministic(state, ctx = {}) {
        let result = predict(state, ctx); 
        ctx.roll = false 
        ctx.nores = false
        ctx.nn = ctx.n

        if (!result || result.length === 1) {
            ctx.nores = true
            pickRelevantTransform((result ?? [])[0], ctx)
            return result?.[0] ?? result;
        }

        while (Array.isArray(result) && result.length > 1) {
            const refined = predict(result);
            if (!refined) break;
            if (refined.length === 1) {
                result = refined;
                break;
            }
            result = refined;
        }


        if (result.length > 1) {
            ctx.roll = true
        }

        pickRelevantTransform(result[0], ctx)
        return result[0]
    }

    function pairEquals(a, b) {
        return a[0] === b[0] && a[1] === b[1];
    }

    function checkRepeat(output) {
        const n = output.length;
        const period = n / 2
        const l = output.slice(0, period)
        const r = output.slice(period)
        //console.log(parse(l))
        //console.log(parse(r))
        //console.log("----")
        const c1 = bigIntArraysEqual(l.map(x => x[0]), r.map(x => x[0]))
        const c2 = bigIntArraysEqual(l.map(x => x[1]), r.map(x => x[1]))
        if (c1 && c2) {
            return period
        }
        return 0;
    }

    function maxValueBy(array, iteratee) {
        if (!Array.isArray(array) || array.length === 0) return undefined;
        const fn = typeof iteratee === 'function' ? iteratee : (o) => o[iteratee];
        let bestVal = fn(array[0]);
        for (let i = 1; i < array.length; i++) {
            const val = fn(array[i]);
            if (val > bestVal) bestVal = val;
        }
        return bestVal;
    }

    function countUniqueBy(array, predicate) {
        if (!Array.isArray(array) || array.length === 0) return 0;
        const fn = typeof predicate === 'function' ? predicate : (o) => o[predicate];
        const seen = new Set();
        for (const item of array) seen.add(fn(item));
        return seen.size;
    }

    function deleteAllOccurrences(arr, token) {
        if (token.length === 0) return [...arr];
        const result = [];
        for (let i = 0; i < arr.length; ) {
            let match = true;
            if (i + token.length <= arr.length) {
            for (let j = 0; j < token.length; j++) {
                if (arr[i + j] !== token[j]) {
                match = false;
                break;
                }
            }
            } else {
                match = false;
            }

            if (match) {
                i += token.length;
            } else {
                result.push(arr[i]);
                i += 1;
            }
        }
        return result;
    }

    function filterVars(vars) {
        // ---- step 1: keep max secCount ----
        const maxSec = Math.max(...Object.values(vars).map(v => v.secCount));
        const candidates = Object.entries(vars).filter(([, v]) => v.secCount === maxSec);

        // ---- step 2: drop vars whose sections are nested inside another var ----
        const survive = {};

        // helper: does any section of a appear inside any section of b ?
        const isNested = (a, b) => {
            for (const secA of a.sections) {
            for (const secB of b.sections) {
                if (secA.start >= secB.start && secA.end <= secB.end) {
                return true; // a's section lies within b's
                }
            }
            }
            return false;
        };

        // compare each candidate against the others
        for (const [nameA, varA] of candidates) {
            let discard = false;
            for (const [nameB, varB] of candidates) {
            if (nameA === nameB) continue;
            if (isNested(varA, varB)) {
                discard = true;          // A is inside B → remove A
                break;
            }
            }
            if (!discard) survive[nameA] = varA;
        }

        return survive;
    }


    function inlineTuring(state, output, ctx) {
        if (ctx.turing === undefined) ctx.turing = []
        if (ctx.varCount === undefined) ctx.varCount = 0n
        if (ctx.vars === undefined) ctx.vars = {}
        if (ctx.varIdx === undefined) ctx.varIdx = {}
        if (ctx.allTokensErased === undefined) ctx.allTokensErased = []
        if (ctx.unboundLabels === undefined) ctx.unboundLabels = {}
        if (ctx.unboundLabelNames === undefined) ctx.unboundLabelNames = {}
        if (ctx.labels === undefined) ctx.labels = {}

        const predictCtx = {}

        for (let i = 0; i < output.length; i++) {
            const branches = predict(output.slice(0, i), predictCtx) ?? []

            //todo consider searching for intro sections in predicted 
            const found = zeroBranch(output, output.slice(i))

            if (found !== undefined && branches.length > 0) {

                if (!ctx.vars[found.varName]) {
                    ctx.varCount++
                    ctx.vars[found.varName] = found
                    ctx.varIdx[found.varName] = ctx.varCount

                    ctx.allTokensErased.push(eraseSeqNo(found.zero))
            
                    found.incs.forEach(x => ctx.allTokensErased.push(eraseSeqNo(x)))
                    found.decs.forEach(x => ctx.allTokensErased.push(eraseSeqNo(x)))
                }
            } 
        }

        ctx.vars = ctx.vars ? filterVars(ctx.vars) : undefined

        let start = 0
        for (const [name, zero] of Object.entries(ctx.vars)) {
            for (const sec of zero.sections) {
                if (sec.end > start) {           
                    start = sec.end + zero.zero.length + 1
                }
            }
        }

        for (let i = 0; i < output.length; i++) {
            if (i < start) {
                ctx.turing.push([output[i][0], 0n])
                continue
            }
            const found = zeroBranch(output, output.slice(i))

            const prepend = found ? enrichSeqNo(deleteAllOccurrences(eraseSeqNo(output.slice(i)), eraseSeqNo(found.zero))) : []
            const space = prepend.concat(output.slice(0, i))
            const branches = predict(space, predictCtx) ?? []
            
            if (found !== undefined && branches.length > 0 && ctx.vars[found.varName]) {
                //console.log(parse(space))
  

                const varIdx = ctx.varIdx[found.varName]
                const label = output.slice(i-predictCtx.n +1, i)

                const labelSearchSpace = output.slice(0, i-predictCtx.n).concat(output.slice(i))

                const labelSuffix = findUniqueSuffix(eraseSeqNo(labelSearchSpace), eraseSeqNo(label), ctx.allTokensErased)


                if (labelSuffix) {
        
                    const labelName = label.concat(enrichSeqNo(labelSuffix))
                    
                    const jump = genJump(ctx.turing, varIdx, eraseSeqNo(labelName))
                    if (!jump) {
                        const fullLabel = label.concat(enrichSeqNo(labelSuffix))
                        ctx.unboundLabels[ctx.turing.length] = fullLabel
                        ctx.unboundLabelNames[parse(fullLabel)] = ctx.turing.length
                        ctx.turing.push(genStubJmp(ctx.turing, varIdx))
                        
                    } else {
                        ctx.labels[parse(labelName)] = jump[1] - TURING_OFFSET
                        ctx.turing.push(jump)
                    }
                    
                }
            } 
    
            
            const genIdx = (incOrDec) => {
                for (const [name, zero] of Object.entries(ctx.vars)) {
                    if (checkIfEndsWithToken(output.slice(0, i), zero[incOrDec])) {
                        if (incOrDec === "incs") {
                            ctx.turing.push(genInc(ctx.varIdx[name]))
                        } else {
                            ctx.turing.push(genDec(ctx.varIdx[name]))
                        }
                    }
                }
            }
            
            genIdx("incs")
            genIdx("decs")

            for (const [cur, label] of Object.entries(ctx.unboundLabels)) {
                //console.log("+++" + parse(label) + " " + ctx.turing.length + "(((()))) " + parse(output.slice(0, i)))
                if (checkIfEndsWithToken(output.slice(0, i), [label])) {
                    ctx.labels[parse(label)] = BigInt(ctx.turing.length)

                    ctx.turing[cur][1] = createJumpDestination(BigInt(ctx.turing.length))
                }
            }
       
            ctx.turing.push([output[i][0], 0n])
        }
    }

    function replaceAllSequences(arr, targetSeq, replacementSeq, ctx) {
        const n = targetSeq.length;
        const result = [];
        let i = 0;
        ctx.found = false

        while (i < arr.length) {
            const match = i <= arr.length - n &&
                        arr.slice(i, i + n).every((v, j) => v[0] === targetSeq[j]);

            if (match) {
                ctx.found = true
                result.push(...replacementSeq);
                i += n;               
            } else {
                result.push(arr[i]);
                i += 1;
            }
        }
        return result;
    }


    function applyMacroses(output, ctx) { 
        if (!ctx.currentTransform) return output
        const sorted = Object.entries(ctx.currentTransform)
            .map(x => [parseKey(x[0]), x[1]])
        
        sorted.sort(
            (a, b) => a[0].length < b[0].length ? 1 : -1)

        const replaced = new Set()   
        let foundOnce = true

        while (foundOnce) {
            let i = 0
            foundOnce = false
            for ([from, to] of sorted) {
                if (!replaced.has(i)) {
                    output = replaceAllSequences(output, from, to, ctx)
                    if (ctx.found) {
                        replaced.add(i)
                        foundOnce = true
                    }
                }
                i++
            }
        }
            
        delete ctx.found
        return output
    }

    function predictContinuously(initState, ctx = {}) {
        ctx.transform = undefined
        ctx.currentTransform = undefined

        let state = [...initState];
        let output = [];

        ctx.loop = false

        ctx.initialPrefix = undefined

        let counter = 0

        while (true) {
            counter++

            let next = predictDeterministic(state, ctx);

            if (ctx.initialPrefix === undefined) {
                ctx.initialPrefix = initState.slice(-ctx.nn)
            } else if (output.length > ctx.initialPrefix.length){
                const prefixRepeat = state.slice(-ctx.initialPrefix.length).every((x, i) => x[1] === ctx.initialPrefix[i][1])
                if (prefixRepeat) {
                    ctx.loop = true
                    output.splice(-ctx.initialPrefix.length)
                    break;
                }
            }

            if (ctx.order && output.length > 0) {
                if (next[1] !== output[output.length - 1][1] + 1) {
                    return output
                }
            }
    
            if (!next) break;
            output.push(next);

            

            const limit = countUniqueBy(output, x => x[1])

            //todo check if matched prefix with output
            if (counter > limit) {
                output.forEach(el => {
                    el[1] = 0
                })
            }

            if (counter > 150) {
                console.log(ctx)
                throw "overflow\n\n" + parse(output)// + "\n" + output.map(x => `${x[1]}: ${parse([x])}\n`).join('')
            }

            const repeatLen = checkRepeat(output)
            
            if (repeatLen > 0) {
                
                const keep = output.length - repeatLen; 
                output.splice(keep, repeatLen);
                if (ctx.turing) {
                    ctx.turing.splice(ctx.turing.length / 2, ctx.turing.length / 2)
                }
                ctx.loop = true
                break;                                  
            }

            //if (counter > 1000) return output.concat(render("...overflow"))
        
            state = [...state, next]; 
        }

        if (ctx.applyMacroses) {
            output = applyMacroses(output, ctx)
        }

        
        

        if (ctx.inlineTuring) {
            inlineTuring(initState, output, ctx)
        }

        if (ctx.executeTuring && ctx.turing) {
            //todo macro post-processing: invoke repeat continously but with current output and turing off
            return enrichSeqNo(executeTuring(ctx.turing, ctx))
        }

        return output  
    }

    

    function stringifyWithBigInt(obj) {
        return JSON.stringify(obj, (_, value) =>
            typeof value === "bigint" ? value.toString() : value
        );
    }


    /**
     * 
     * Usage examples:
     * 
     *  
     * 
     * const state3 = render(`
    program
    plus minus
    zeroplusminuszeroplusminuszero
    
label:
    
    plus
    labelzero
    lab2zero
    hello
lab2:
    minus
    program`)

    const state33 = render(`program
    plus minus zeroplusminuszero
label:
    plus
    labelzero
    program`)

    const state4 = render(`ran ran ran program + -0+-0 7 9+++i999-i0999999999999 777 pr78ra`)

    const state5 = render(`! name? ! name? ! name? ! name? ! name? ! name? name is xxx! name? xxx! name is fgeo1! name? `)

    const lambda = render(` -> -> -> -> -> -> -> -> -> -> -> -> -> -> -> -> ; x.yyyyy x -> yyyyy; h.l.l h 5 -> `)

    const state = state5

    console.log("N:" + state.slice(-1)[0][1])

    tg("br")
    tg("hr").style=hrstyle
    const span99 = tg("span", "res")
    span99.style.whiteSpace = 'pre-wrap'
    span99.textContent = parse(state)
    span99.style.color = "green"
    tg("hr").style=hrstyle
    tg("br")
    tg("br")

    const span2 = tg("span", "res")
    const ctxf = {}
    const str = `name is fgeh! name? `
    span2.textContent = "FIND: " + parse(find(state, render(
        str
    ).map(x => x[0]), ctxf, true)) + " --- " + str.slice(-ctxf.n)
    span2.style.color = "green"

    console.log('CTXF')
    console.log(ctxf)

    tg("br")

    const span7 = tg("span", "res")
    const ctx7 = {target:2}
    span7.textContent = "PREDICT: " + parse(predict(state, ctx7))
    span7.style.color = "green"

    console.log('CTXP')
    console.log(ctx7)

    tg("br")

    const span3 = tg("span", "res")
    const ctx = {}
    span3.textContent = "PREDICT_D: " + parse([predictDeterministic(state, ctx)]) + "; n = " + ctx.n + "; roll = " + ctx.roll + "; nores = " + ctx.nores
    span3.style.color = "green"

    tg("br")
    tg("br")
    tg("hr").style=hrstyle


    const ctx2 = {}
    ctx2.inlineTuring = true
    ctx2.executeTuring = true
    ctx2.applyMacroses = true
    console.log("STREAM")
    const span4 = tg("span", "res")
    span4.style.whiteSpace = 'pre-wrap'
    span4.textContent = parse(predictContinuously(state, ctx2)) //+ "   ;;; loop = " + ctx2.loop + " ;;; turingLength=" + ctx2.turing?.length
    span4.style.color = "green"
    
    tg("hr").style=hrstyle

    console.log(ctx2)
    console.log(printTuring(ctx2.turing))


    tg("br")
    tg("br")
    const span5= tg("span", "res")
    const ctx3 = {}
    console.log("BRANCHING")
    const st2 = eraseSeqNo(render("plus minus0plusminus0 pl:plusl0p"))
    const p2 = eraseSeqNo(render("0"))
  
    span5.style.color = "green"
     * 
     * 
     */


    function* enumerateTuringMachines() {
    let length = 0

    while (true) {
        yield* enumerateLength(length)
        length++
    }
}


function* enumerateLength(n) {

    if (n === 0) {
        yield []
        return
    }

    const instr = []

    for (const x of enumerateInstructionSequences(n, n)) {
        yield x
    }
}


function* enumerateInstructionSequences(length, programLength, prefix=[]) {

    if (prefix.length === length) {
        yield prefix
        return
    }

    const pos = prefix.length

    for (let mem = 0n; mem < BigInt(programLength); mem++) {

        // OUT
        yield* enumerateInstructionSequences(
            length,
            programLength,
            [...prefix, [mem, TURING_OUT]]
        )

        // DEC
        yield* enumerateInstructionSequences(
            length,
            programLength,
            [...prefix, [mem, TURING_DEC]]
        )

        // INC
        yield* enumerateInstructionSequences(
            length,
            programLength,
            [...prefix, [mem, TURING_INC]]
        )

        // JMPNZ
        for (let target = 0; target < programLength; target++) {

            yield* enumerateInstructionSequences(
                length,
                programLength,
                [...prefix, [
                    mem,
                    TURING_OFFSET + BigInt(target)
                ]]
            )
        }
    }
}


const outputs = []

for (const tm of enumerateTuringMachines()) {

    const out = executeTuring(tm)

    outputs.push(out)

    if (predicate(outputs)) {
        console.log("FOUND", tm)
        break
    }
}

