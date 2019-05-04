# Store

`Store` is a class that represents access to the data store that allows for managing buckets, and creating, retrieving, updating, and deleting items in those buckets.

## Constructor

```javascript
new Store(path, options)
```

Creates an instance of a store.

### Parameters

- `path`: the file path to persist the data to disk. __(required)__
- `options`: this are optional settings that change the behaviour for the store. _(optional)_
    - `compress`: [Boolean|BaseCompresser] If an instance of `BaseCompresser` is passed it will use that, otherwise if `true` it will use the default compressor (using [snappy](https://www.npmjs.com/package/snappy)) or no compression if `false`.  _(optional, defaults to false)_ 
    - `compress`: [Boolean|BaseCompresser] If an instance of `BaseCompresser` is passed it will use that, otherwise if `true` it will use the default compressor (using [snappy](https://www.npmjs.com/package/snappy)) or no compression if `false`.  _(optional, defaults to false)_ 
    - `serializer`: [BaseSerializer] If an instance of `BaseSerializer` to turn items into buffers and buffers to items to read and write to disk. The default serializer uses  [avsc for Avro](https://www.npmjs.com/package/avsc)   _(optional, Avro)_ __Currently this is the only available one as it is coupled to the code in many places. [Issue #9](https://github.com/holmok/convenience-store/issues/9) covers this.__
     - `compress`: [Boolean|BaseCompresser] If an instance of `BaseCompresser` is passed it will use that, otherwise if `true` it will use the default compressor (using [snappy](https://www.npmjs.com/package/snappy)) or no compression if `false`.  _(optional, defaults to false)_ 
     - `password`: [String] Password for Cipher.  Must be include for encryption along with `salt`. _(optional)_
     - `salt`: [String] Salt for Cipher.  Must be include for encryption along with `password`. _(optional)_     
     - `algorithm`: [String] Algorithm for Cipher. _(optional, defaults to 'AES-256-CBC')_  
     - `cache`: [BaseCache] Instance of caching object. Included are:
       - `NoCache`: No caching, disk is hit for all gets.
       - `MemoeryCache`: Holds all gets/sets in memory, no invalidation. __(default)__ 
       - `LRUCache`: An in-memory cahce that is very configurable: [Read more](https://www.npmjs.com/package/lru-cache)