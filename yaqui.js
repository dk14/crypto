/*
==============================================================================
YaQui Search
Checkpoint 0.1 - Part 1/6
Foundation
==============================================================================

MIT License

Author: YaQui Project

==============================================================================

This file intentionally contains no DOM manipulation.

Everything is exposed through the YaQui class.

Later parts extend this file without changing the API.

==============================================================================
*/

(function(global){

"use strict";

/******************************************************************************
 * Utilities
 ******************************************************************************/

function deepClone(v){
    return structuredClone(v);
}

function sleep(ms){
    return new Promise(r=>setTimeout(r,ms));
}

function randomId(len=16){

    const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let s="";

    for(let i=0;i<len;i++)
        s+=chars[Math.floor(Math.random()*chars.length)];

    return s;
}

async function sha256(text){

    const bytes =
        new TextEncoder().encode(text);

    const hash =
        await crypto.subtle.digest("SHA-256",bytes);

    return [...new Uint8Array(hash)]
        .map(x=>x.toString(16).padStart(2,"0"))
        .join("");

}

/******************************************************************************
 * EventEmitter
 ******************************************************************************/

class EventEmitter{

    constructor(){

        this.listeners=new Map();

    }

    on(event,callback){

        if(!this.listeners.has(event))
            this.listeners.set(event,new Set());

        this.listeners.get(event).add(callback);

        return this;

    }

    off(event,callback){

        const set=this.listeners.get(event);

        if(set)
            set.delete(callback);

        return this;

    }

    once(event,callback){

        const wrapper=(...args)=>{

            this.off(event,wrapper);

            callback(...args);

        };

        this.on(event,wrapper);

    }

    emit(event,...args){

        const set=this.listeners.get(event);

        if(!set)
            return;

        for(const cb of [...set]){

            try{

                cb(...args);

            }
            catch(e){

                console.error(e);

            }

        }

    }

}

/******************************************************************************
 * Query Compiler
 ******************************************************************************/

class QueryCompiler{

    static normalize(source){

        return source
            .replace(/\r/g,"")
            .trim();

    }

    static async compile(source){

        source=this.normalize(source);

        const hash=
            await sha256(source);

        let fn;

        try{

            fn=eval("(" + source + ")");

        }
        catch(e){

            throw new Error(
                "Query compilation failed:\n"+e.message
            );

        }

        if(typeof fn!=="function")
            throw new Error(
                "Query must evaluate to a function."
            );

        return{

            hash,

            source,

            execute(page){

                let score=0;

                try{

                    score=fn(page);

                }
                catch(e){

                    console.error(e);

                    score=0;

                }

                score=Number(score);

                if(!Number.isFinite(score))
                    score=0;

                return Math.max(0,score);

            }

        };

    }

}

/******************************************************************************
 * Data Classes
 ******************************************************************************/

class ContentEntry{

    constructor({

        sha256,

        url=null,

        blob=null,

        mime="text/html",

        metadata={}

    }){

        this.sha256=sha256;

        this.links=[];

        if(url)
            this.links.push(url);

        this.blobs=[];

        if(blob)
            this.blobs.push(blob);

        this.mime=mime;

        this.metadata=metadata;

        this.created=Date.now();

    }

}

class QueryResult{

    constructor({

        sha256,

        score=0

    }){

        this.sha256=sha256;

        this.score=score;

        this.magicPlus=[];

        this.magicMinus=[];

    }

    get positivePow(){

        return this.magicPlus.length;

    }

    get negativePow(){

        return this.magicMinus.length;

    }

    get netPow(){

        return this.positivePow-
               this.negativePow;

    }

    get absolutePow(){

        return this.positivePow+
               this.negativePow;

    }

}

/******************************************************************************
 * Reverse Query Index
 ******************************************************************************/

class ReverseIndex{

    constructor(){

        this.index=new Map();

    }

    has(queryHash){

        return this.index.has(queryHash);

    }

    get(queryHash){

        return this.index.get(queryHash);

    }

    ensure(queryHash,source){

        if(this.index.has(queryHash))
            return this.index.get(queryHash);

        const obj={

            hash:queryHash,

            source,

            results:new Map()

        };

        this.index.set(queryHash,obj);

        return obj;

    }

    insert(queryHash,source,result){

        const q=
            this.ensure(queryHash,source);

        q.results.set(
            result.sha256,
            result
        );

        return result;

    }

    getResult(queryHash,sha256){

        const q=
            this.index.get(queryHash);

        if(!q)
            return null;

        return q.results.get(sha256);

    }

    list(queryHash){

        const q=
            this.index.get(queryHash);

        if(!q)
            return [];

        return [...q.results.values()];

    }

}

/******************************************************************************
 * YaQui
 ******************************************************************************/

class YaQui extends EventEmitter{

    constructor(config={}){

        super();

        this.started=false;

        this.config=config;

        this.reverseIndex=
            new ReverseIndex();

        this.content=
            new Map();

        this.compiledQueries=
            new Map();

        this.peers=
            new Map();

        this.mempool=[];

        this.crawlerQueue=[];

        this.visited=
            new Set();

        this.crawlerPolicy={

            seeds:[],

            extractUris:null,

            shouldVisit:()=>true,

            maxDepth:4,

            maxConcurrent:4

        };

        this.evictionPolicy={};

        this.networkPolicy={};

        this.storagePolicy={};

    }

    async start(){

        if(this.started)
            return;

        this.started=true;

        this.emit("start");

    }

    async stop(){

        if(!this.started)
            return;

        this.started=false;

        this.emit("stop");

    }

    async destroy(){

        await this.stop();

        this.reverseIndex=
            new ReverseIndex();

        this.content.clear();

        this.compiledQueries.clear();

        this.peers.clear();

        this.mempool.length=0;

        this.crawlerQueue.length=0;

        this.visited.clear();

        this.emit("destroy");

    }

    async compileQuery(source){

        const q=
            await QueryCompiler.compile(source);

        this.compiledQueries.set(
            q.hash,
            q
        );

        return q;

    }

async hashContent(content){

    if(typeof content!=="string")
        content=JSON.stringify(content);

    return await sha256(content);

}

async addContent({

    url=null,

    blob,

    mime="text/html",

    metadata={}

}){

    const hash=
        await this.hashContent(blob);

    let entry=
        this.content.get(hash);

    if(!entry){

        entry=new ContentEntry({

            sha256:hash,

            url,

            blob,

            mime,

            metadata

        });

        this.content.set(hash,entry);

    }
    else{

        if(url && !entry.links.includes(url))
            entry.links.push(url);

        if(blob && !entry.blobs.includes(blob))
            entry.blobs.push(blob);

    }

    this.emit("content:stored",entry);

    return entry;

}

/**************************************************************************
 * Query execution
 **************************************************************************/

async query(source){

    const compiled=
        await this.compileQuery(source);

    const queryHash=
        compiled.hash;

    const results=[];

    for(const entry of this.content.values()){

        const page=this.createPageView(entry);

        const score=
            compiled.execute(page);

        if(score<=0)
            continue;

        let result=
            this.reverseIndex.getResult(
                queryHash,
                entry.sha256
            );

        if(!result){

            result=new QueryResult({

                sha256:entry.sha256,

                score

            });

            this.reverseIndex.insert(

                queryHash,

                compiled.source,

                result

            );

        }
        else{

            result.score=score;

        }

        results.push(
            this.decorateResult(
                result,
                entry
            )
        );

    }

    results.sort(
        this.compareResults.bind(this)
    );

    this.emit(

        "query:complete",

        {

            queryHash,

            source,

            results

        }

    );

    return{

        hash:queryHash,

        source,

        results

    };

}

/**************************************************************************
 * Execute all known queries against newly added page
 **************************************************************************/

async evaluateEntry(entry){

    const page=
        this.createPageView(entry);

    for(const compiled of this.compiledQueries.values()){

        const score=
            compiled.execute(page);

        if(score<=0)
            continue;

        let result=
            this.reverseIndex.getResult(

                compiled.hash,

                entry.sha256

            );

        if(!result){

            result=new QueryResult({

                sha256:entry.sha256,

                score

            });

            this.reverseIndex.insert(

                compiled.hash,

                compiled.source,

                result

            );

        }

        result.score=score;

        this.emit(

            "query:new-result",

            this.decorateResult(
                result,
                entry
            )

        );

        this.broadcastAnnouncement(

            compiled,

            result,

            entry

        );

    }

}

/**************************************************************************
 * Page helper
 **************************************************************************/

createPageView(entry){

    const text=

        typeof entry.blobs[0]==="string"

            ? entry.blobs[0]

            : "";

    return{

        hash:entry.sha256,

        url:entry.links[0]||null,

        mime:entry.mime,

        metadata:entry.metadata,

        text,

        html:text,

        findAll(pattern){

            if(pattern instanceof RegExp){

                return text.match(pattern)||[];

            }

            pattern=String(pattern);

            if(!pattern.length)
                return [];

            return text.match(

                new RegExp(

                    pattern.replace(

                        /[-\/\\^$*+?.()|[\]{}]/g,

                        "\\$&"

                    ),

                    "gi"

                )

            )||[];

        }

    };

}

/**************************************************************************
 * Ranking
 **************************************************************************/

compareResults(a,b){

    if(b.netPow!==a.netPow)
        return b.netPow-a.netPow;

    if(b.score!==a.score)
        return b.score-a.score;

    if(b.absolutePow!==a.absolutePow)
        return b.absolutePow-a.absolutePow;

    return 0;

}

decorateResult(result,entry){

    return{

        sha256:result.sha256,

        score:result.score,

        positivePow:result.positivePow,

        negativePow:result.negativePow,

        netPow:result.netPow,

        absolutePow:result.absolutePow,

        urls:[...entry.links],

        mime:entry.mime,

        metadata:deepClone(
            entry.metadata
        ),

        blob:

            entry.blobs.length

                ? entry.blobs[0]

                : null

    };

}

/**************************************************************************
 * Voting
 **************************************************************************/

async upvote(

    queryHash,

    sha256

){

    const result=

        this.reverseIndex.getResult(

            queryHash,

            sha256

        );

    if(!result)
        return false;

    result.magicPlus.push({

        id:randomId(),

        ts:Date.now()

    });

    this.emit(

        "vote",

        {

            type:"up",

            queryHash,

            sha256

        }

    );

    return true;

}

async downvote(

    queryHash,

    sha256

){

    const result=

        this.reverseIndex.getResult(

            queryHash,

            sha256

        );

    if(!result)
        return false;

    result.magicMinus.push({

        id:randomId(),

        ts:Date.now()

    });

    this.emit(

        "vote",

        {

            type:"down",

            queryHash,

            sha256

        }

    );

    return true;

}

/**************************************************************************
 * Announcement
 **************************************************************************/

broadcastAnnouncement(

    compiled,

    result,

    entry

){

    const announcement={

        queryHash:

            compiled.hash,

        querySource:

            compiled.source,

        sha256:

            entry.sha256,

        score:

            result.score,

        positivePow:

            result.positivePow,

        negativePow:

            result.negativePow,

        absolutePow:

            result.absolutePow,

        netPow:

            result.netPow,

        urls:[...entry.links],

        timestamp:

            Date.now()

    };

    this.mempool.push(
        announcement
    );

    this.emit(

        "announcement",

        announcement

    );
}


updateCrawlerPolicy(policy={}){

    Object.assign(
        this.crawlerPolicy,
        policy
    );

}

updateEvictionPolicy(policy={}){

    Object.assign(
        this.evictionPolicy,
        policy
    );

}

updateNetworkPolicy(policy={}){

    Object.assign(
        this.networkPolicy,
        policy
    );

}

updateStoragePolicy(policy={}){

    Object.assign(
        this.storagePolicy,
        policy
    );

}

/**************************************************************************
 * Seeds
 **************************************************************************/

addSeed(url){

    if(
        !this.crawlerPolicy.seeds.includes(url)
    ){
        this.crawlerPolicy.seeds.push(url);
    }

}

removeSeed(url){

    this.crawlerPolicy.seeds=

        this.crawlerPolicy.seeds.filter(

            x=>x!==url

        );

}

/**************************************************************************
 * Queue
 **************************************************************************/

enqueue(url,depth=0){

    if(this.visited.has(url))
        return false;

    this.crawlerQueue.push({

        url,

        depth

    });

    this.emit(

        "crawler:queued",

        {

            url,

            depth,

            queue:

                this.crawlerQueue.length

        }

    );

    return true;

}

async crawl(){

    for(const seed of this.crawlerPolicy.seeds){

        this.enqueue(seed,0);

    }

    return this.processCrawlerQueue();

}

async processCrawlerQueue(){

    while(

        this.started &&

        this.crawlerQueue.length

    ){

        const job=

            this.crawlerQueue.shift();

        if(!job)
            continue;

        if(

            this.visited.has(job.url)

        )
            continue;

        this.visited.add(job.url);

        try{

            await this.crawlOne(job);

        }
        catch(e){

            this.emit(

                "crawler:error",

                {

                    url:job.url,

                    error:e

                }

            );

        }

    }

    this.emit(

        "crawler:finished"

    );

}

/**************************************************************************
 * Crawl one page
 **************************************************************************/

async crawlOne(job){

    if(

        job.depth>

        this.crawlerPolicy.maxDepth

    )
        return;

    const response=

        await fetch(job.url);

    const text=

        await response.text();

    const entry=

        await this.addContent({

            url:job.url,

            blob:text,

            mime:

                response.headers.get(

                    "content-type"

                )||

                "text/html"

        });

    await this.evaluateEntry(entry);

    const uris=

        await this.extractUris(

            job.url,

            text,

            response

        );

    for(const uri of uris){

        if(

            !this.crawlerPolicy.shouldVisit(

                uri,

                job

            )

        )
            continue;

        this.enqueue(

            uri,

            job.depth+1

        );

    }

    this.emit(

        "crawler:page",

        {

            url:job.url,

            queue:

                this.crawlerQueue.length,

            discovered:

                uris.length

        }

    );

}

/**************************************************************************
 * URI extraction
 **************************************************************************/

async extractUris(

    baseUrl,

    html,

    response

){

    if(

        this.crawlerPolicy.extractUris

    ){

        return await this.crawlerPolicy.extractUris({

            baseUrl,

            html,

            response,

            defaultExtractor:

                this.defaultExtractUris.bind(this)

        });

    }

    return this.defaultExtractUris({

        baseUrl,

        html

    });

}

defaultExtractUris({

    baseUrl,

    html

}){

    const out=

        new Set();

    const add=(u)=>{

        try{

            out.add(

                new URL(

                    u,

                    baseUrl

                ).href

            );

        }
        catch(e){}

    };

    const regexes=[

        /href\s*=\s*["']([^"']+)["']/gi,

        /src\s*=\s*["']([^"']+)["']/gi,

        /fetch\s*\(\s*["']([^"']+)["']/gi,

        /window\.open\s*\(\s*["']([^"']+)["']/gi,

        /location\s*=\s*["']([^"']+)["']/gi,

        /XMLHttpRequest.*?open\s*\([^,]+,\s*["']([^"']+)["']/gis,

        /https?:\/\/[^\s"'<>]+/gi

    ];

    for(const r of regexes){

        let m;

        while(

            (m=r.exec(html))

        ){

            add(m[1]||m[0]);

        }

    }

    return [...out];

}

/**************************************************************************
 * Convenience
 **************************************************************************/

async submitQuery(source){

    const result=

        await this.query(source);

    if(

        this.started

    ){

        this.crawl();

    }

    return result;

}

clearCrawlerQueue(){

    this.crawlerQueue.length=0;

}

clearVisited(){

    this.visited.clear();

}

crawlerStats(){

    return{

        queue:

            this.crawlerQueue.length,

        visited:

            this.visited.size,

        content:

            this.content.size,

        announcements:

            this.mempool.length,

        compiledQueries:

            this.compiledQueries.size

    };

}

//------------4-----

/******************************************************************************
 * YaQui
 * Part 4/6
 *
 * Append inside class YaQui
 *
 * P2P Networking / Mempool
 *
 * NOTE:
 * This is intentionally transport-agnostic.
 * Browser WebRTC implementation can replace createTransport().
 ******************************************************************************/

/**************************************************************************
 * Peer Management
 **************************************************************************/

connectPeer(peer){

    if(!peer || !peer.id)
        throw new Error("Peer requires id.");

    this.peers.set(peer.id,{

        id:peer.id,

        transport:peer,

        connected:true,

        seen:new Set()

    });

    this.emit("peer:connected",peer.id);

}

disconnectPeer(id){

    const peer=this.peers.get(id);

    if(!peer)
        return;

    if(peer.transport.close)
        peer.transport.close();

    this.peers.delete(id);

    this.emit("peer:disconnected",id);

}

peerCount(){

    return this.peers.size;

}

/**************************************************************************
 * Transport
 **************************************************************************/

createTransport(handler){

    /*
        Future:

        WebRTC

        BroadcastChannel

        WebSocket

        etc.
    */

    return{

        send(message){

            handler(message);

        },

        close(){}

    };

}

/**************************************************************************
 * Mempool
 **************************************************************************/

mempoolContains(hash){

    return this.mempool.some(

        x=>

            x.queryHash===hash.queryHash &&

            x.sha256===hash.sha256

    );

}

addAnnouncement(msg){

    if(

        this.mempoolContains(msg)

    )
        return false;

    this.mempool.push(msg);

    this.sortMempool();

    this.emit(

        "mempool:add",

        msg

    );

    return true;

}

sortMempool(){

    this.mempool.sort(

        (a,b)=>

            b.absolutePow-

            a.absolutePow

    );

}

clearMempool(){

    this.mempool.length=0;

}

/**************************************************************************
 * Forwarding
 **************************************************************************/

forwardAnnouncement(msg){

    for(

        const peer

        of

        this.peers.values()

    ){

        if(

            peer.seen.has(

                msg.queryHash+

                msg.sha256

            )

        )
            continue;

        if(

            this.networkPolicy.shouldForward &&

            !this.networkPolicy.shouldForward(

                msg,

                peer

            )

        )
            continue;

        peer.seen.add(

            msg.queryHash+

            msg.sha256

        );

        if(

            peer.transport.send

        ){

            peer.transport.send({

                type:"announcement",

                payload:msg

            });

        }

    }

}

/**************************************************************************
 * Receive
 **************************************************************************/

receive(message){

    switch(message.type){

        case "announcement":

            this.receiveAnnouncement(

                message.payload

            );

            break;

        case "blobRequest":

            this.receiveBlobRequest(

                message.payload

            );

            break;

        case "blob":

            this.receiveBlob(

                message.payload

            );

            break;

    }

}

receiveAnnouncement(msg){

    if(

        this.networkPolicy.shouldAccept &&

        !this.networkPolicy.shouldAccept(msg)

    )
        return;

    if(

        !this.addAnnouncement(msg)

    )
        return;

    this.forwardAnnouncement(msg);

    this.emit(

        "announcement:received",

        msg

    );

}

receiveBlobRequest(req){

    const entry=

        this.content.get(req.sha256);

    if(!entry)
        return;

    const blob=

        entry.blobs[0];

    req.reply({

        type:"blob",

        payload:{

            sha256:

                req.sha256,

            mime:

                entry.mime,

            metadata:

                entry.metadata,

            blob

        }

    });

}

receiveBlob(blob){

    let entry=

        this.content.get(

            blob.sha256

        );

    if(!entry){

        entry=new ContentEntry({

            sha256:

                blob.sha256,

            blob:

                blob.blob,

            mime:

                blob.mime,

            metadata:

                blob.metadata

        });

        this.content.set(

            blob.sha256,

            entry

        );

    }
    else{

        if(

            !entry.blobs.includes(

                blob.blob

            )

        ){

            entry.blobs.push(

                blob.blob

            );

        }

    }

    this.emit(

        "blob:received",

        blob.sha256

    );

}

/**************************************************************************
 * Blob Requests
 **************************************************************************/

requestBlob(

    sha256,

    peerId

){

    const peer=

        this.peers.get(peerId);

    if(!peer)
        return;

    peer.transport.send({

        type:"blobRequest",

        payload:{

            sha256,

            reply:

                response=>

                    this.receive(response)

        }

    });

}

/**************************************************************************
 * Broadcast
 **************************************************************************/

broadcastAnnouncement(

    compiled,

    result,

    entry

){

    const msg={

        queryHash:

            compiled.hash,

        querySource:

            compiled.source,

        sha256:

            entry.sha256,

        score:

            result.score,

        positivePow:

            result.positivePow,

        negativePow:

            result.negativePow,

        netPow:

            result.netPow,

        absolutePow:

            result.absolutePow,

        timestamp:

            Date.now()

    };

    if(

        this.networkPolicy.propagationThreshold

    ){

        if(

            msg.absolutePow<

            this.networkPolicy.propagationThreshold(

                msg

            )

        ){

            return;

        }

    }

    this.addAnnouncement(msg);

    this.forwardAnnouncement(msg);

}

/**************************************************************************
 * Discovery
 **************************************************************************/

async connectSeedPeers(seedList){

    /*
        Placeholder.

        Future implementation:

            fetch seed list

                ↓

            ICE candidates

                ↓

            WebRTC

                ↓

            connectPeer()

    */

    this.emit(

        "network:discover",

        seedList

    );

}

/**************************************************************************
 * Network Stats
 **************************************************************************/

networkStats(){

    return{

        peers:

            this.peers.size,

        mempool:

            this.mempool.length,

        content:

            this.content.size,

        announcements:

            this.mempool.length

    };

}

blobSize(blob){

    if(blob==null)
        return 0;

    if(blob instanceof Blob)
        return blob.size;

    if(typeof blob==="string")
        return new TextEncoder().encode(blob).length;

    return new TextEncoder().encode(
        JSON.stringify(blob)
    ).length;

}

pinScore(queryResult,entry){

    const size=Math.max(

        1,

        this.blobSize(entry.blobs[0])

    );

    const net=

        Math.max(

            0,

            queryResult.netPow

        );

    return net/size;

}

/**************************************************************************
 * Storage Statistics
 **************************************************************************/

storageStats(){

    let blobs=0;
    let bytes=0;

    for(const e of this.content.values()){

        blobs+=e.blobs.length;

        for(const b of e.blobs)
            bytes+=this.blobSize(b);

    }

    return{

        entries:this.content.size,

        blobs,

        bytes

    };

}

/**************************************************************************
 * Blob Lookup
 **************************************************************************/

getBlob(hash){

    const e=this.content.get(hash);

    if(!e)
        return null;

    return e.blobs[0]||null;

}

putBlob(hash,blob){

    const e=this.content.get(hash);

    if(!e)
        return false;

    if(!e.blobs.includes(blob))
        e.blobs.push(blob);

    this.emit("blob:stored",hash);

    return true;

}

removeBlob(hash){

    const e=this.content.get(hash);

    if(!e)
        return false;

    e.blobs.length=0;

    this.emit("blob:removed",hash);

    return true;

}

/**************************************************************************
 * Eviction
 **************************************************************************/

evictBlobs(){

    const candidates=[];

    for(const q of this.reverseIndex.index.values()){

        for(const result of q.results.values()){

            const entry=this.content.get(result.sha256);

            if(!entry)
                continue;

            candidates.push({

                query:q.hash,

                result,

                entry,

                score:this.pinScore(

                    result,

                    entry

                )

            });

        }

    }

    candidates.sort(

        (a,b)=>

            a.score-b.score

    );

    for(const c of candidates){

        if(

            this.evictionPolicy.shouldEvictBlob

        ){

            if(

                !this.evictionPolicy.shouldEvictBlob(

                    c

                )

            ){

                continue;

            }

        }

        if(c.score>0)
            continue;

        this.removeBlob(

            c.entry.sha256

        );

        this.emit(

            "blob:evicted",

            c.entry.sha256

        );

    }

}

/**************************************************************************
 * Export
 **************************************************************************/

export(){

    const reverse=[];

    for(

        const q

        of

        this.reverseIndex.index.values()

    ){

        reverse.push({

            hash:q.hash,

            source:q.source,

            results:

                [...q.results.values()]

        });

    }

    return{

        version:1,

        created:Date.now(),

        reverse,

        content:

            [...this.content.values()],

        crawlerPolicy:

            this.crawlerPolicy,

        storagePolicy:

            {},

        networkPolicy:

            {},

        evictionPolicy:{}

    };

}

/**************************************************************************
 * Import
 **************************************************************************/

import(data){

    this.reverseIndex=

        new ReverseIndex();

    this.content.clear();

    if(data.content){

        for(const e of data.content){

            this.content.set(

                e.sha256,

                e

            );

        }

    }

    if(data.reverse){

        for(const q of data.reverse){

            this.reverseIndex.ensure(

                q.hash,

                q.source

            );

            for(

                const r

                of

                q.results

            ){

                this.reverseIndex.insert(

                    q.hash,

                    q.source,

                    Object.assign(

                        new QueryResult({}),

                        r

                    )

                );

            }

        }

    }

    this.emit(

        "import"

    );

}

/**************************************************************************
 * Persistence
 **************************************************************************/

async save(){

    /*
        Stub.

        Checkpoint 2+

        IndexedDB

            Queries

            Content

            Votes

            Blobs

            Peer cache

            Queue

    */

    return this.export();

}

async load(data){

    this.import(data);

}

/**************************************************************************
 * Maintenance
 **************************************************************************/

garbageCollect(){

    this.evictBlobs();

    this.emit(

        "gc"

    );

}

clear(){

    this.reverseIndex=

        new ReverseIndex();

    this.content.clear();

    this.compiledQueries.clear();

    this.mempool.length=0;

    this.visited.clear();

    this.crawlerQueue.length=0;

    this.emit(

        "clear"

    );

}

/**************************************************************************
 * Debug
 **************************************************************************/

dump(){

    return{

        reverse:

            this.reverseIndex,

        content:

            this.content,

        queries:

            this.compiledQueries,

        peers:

            this.peers,

        mempool:

            this.mempool,

        stats:{

            crawler:

                this.crawlerStats(),

            network:

                this.networkStats(),

            storage:

                this.storageStats()

        }

    };

}

/******************************************************************************
 * YaQui
 * Part 6/6
 *
 * Append inside class YaQui
 *
 * Public API
 * Diagnostics
 * Defaults
 ******************************************************************************/

/**************************************************************************
 * Configuration
 **************************************************************************/

configure(cfg={}){

    Object.assign(

        this.config,

        cfg

    );

    this.emit(

        "config",

        deepClone(this.config)

    );

    return this;

}

version(){

    return{

        name:"YaQui",

        version:"0.1.0",

        protocol:1

    };

}

/**************************************************************************
 * Query Helpers
 **************************************************************************/

listQueries(){

    const out=[];

    for(

        const q

        of

        this.reverseIndex.index.values()

    ){

        out.push({

            hash:q.hash,

            source:q.source,

            matches:q.results.size

        });

    }

    return out;

}

queryStats(queryHash){

    const q=

        this.reverseIndex.get(queryHash);

    if(!q)
        return null;

    let plus=0;
    let minus=0;

    for(

        const r

        of

        q.results.values()

    ){

        plus+=r.positivePow;
        minus+=r.negativePow;

    }

    return{

        hash:q.hash,

        source:q.source,

        matches:q.results.size,

        positivePow:plus,

        negativePow:minus,

        netPow:

            plus-minus

    };

}

/**************************************************************************
 * Content Helpers
 **************************************************************************/

listContent(){

    return[

        ...this.content.values()

    ];

}

getContent(hash){

    return this.content.get(hash)||null;

}

removeContent(hash){

    const ok=

        this.content.delete(hash);

    if(ok)

        this.emit(

            "content:removed",

            hash

        );

    return ok;

}

/**************************************************************************
 * Search
 **************************************************************************/

search(text){

    const out=[];

    text=

        String(text)

        .toLowerCase();

    for(

        const e

        of

        this.content.values()

    ){

        for(

            const blob

            of

            e.blobs

        ){

            if(

                typeof blob!=="string"

            )

                continue;

            if(

                blob

                .toLowerCase()

                .includes(text)

            ){

                out.push(e);

                break;

            }

        }

    }

    return out;

}

/**************************************************************************
 * Peer Helpers
 **************************************************************************/

listPeers(){

    return[

        ...this.peers.values()

    ];

}

broadcast(message){

    for(

        const peer

        of

        this.peers.values()

    ){

        if(

            peer.transport.send

        ){

            peer.transport.send(

                deepClone(message)

            );

        }

    }

}

/**************************************************************************
 * Bootstrap
 **************************************************************************/

async bootstrap(){

    await this.start();

    if(

        this.crawlerPolicy.seeds.length

    ){

        this.crawl();

    }

}

/**************************************************************************
 * Shutdown
 **************************************************************************/

async shutdown(){

    await this.stop();

    this.clearCrawlerQueue();

}

/**************************************************************************
 * Diagnostics
 **************************************************************************/

health(){

    return{

        started:this.started,

        peers:

            this.peers.size,

        queue:

            this.crawlerQueue.length,

        visited:

            this.visited.size,

        content:

            this.content.size,

        queries:

            this.compiledQueries.size,

        announcements:

            this.mempool.length

    };

}

ping(){

    return{

        ok:true,

        timestamp:

            Date.now()

    };

}

/**************************************************************************
 * Defaults
 **************************************************************************/

static defaults(){

    return{

        crawler:{

            seeds:[],

            maxDepth:4,

            maxConcurrent:4,

            revisitInterval:86400000

        },

        network:{

            propagationThreshold(){

                return 0;

            }

        },

        eviction:{

            shouldEvictBlob(c){

                return c.score<=0;

            }

        },

        storage:{}

    };

}

/**************************************************************************
 * Factory
 **************************************************************************/

static create(config={}){

    const defaults=

        YaQui.defaults();

    return new YaQui({

        ...defaults,

        ...config

    });

}
}

global.YaQui=YaQui;

})(globalThis);