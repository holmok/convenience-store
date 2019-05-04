# Store

`Store` is a class that represents access to the data store that allows for managing buckets, and creating, retrieving, updating, and deleting items in those buckets.

### Constructor

```javascript
const store = new Store([path], {[options]})
```

Creates an instance of a store.

#### Parameters

- `path`: the file path to persist the data to disk. __(required)__
- `options`: this are optional settings that change the behaviour for the store. _(optional)_
    - `compress`: [Boolean|BaseCompresser] If an instance of `BaseCompresser` is passed it will use that, otherwise if `true` it will use the default compressor that uses [snappy](https://www.npmjs.com/package/snappy)) or no compression if `false`.  _(optional, defaults to false)_ 
    - `serializer`: [BaseSerializer] If an instance of `BaseSerializer` to turn items into buffers and buffers to items to read and write to disk. The default serializer uses  [avsc for Avro](https://www.npmjs.com/package/avsc)   _(optional, Avro)_ __Currently this is the only available one as it is coupled to the code in many places. [Issue #9](https://github.com/holmok/convenience-store/issues/9) covers this.__
     - `compress`: [Boolean|BaseCompresser] If an instance of `BaseCompresser` is passed it will use that, otherwise if `true` it will use the default compressor (using [snappy](https://www.npmjs.com/package/snappy)) or no compression if `false`.  _(optional, defaults to false)_ 
     - `password`: [String] Password for Cipher.  Must be include for encryption along with `salt`. _(optional)_
     - `salt`: [String] Salt for Cipher.  Must be include for encryption along with `password`. _(optional)_     
     - `algorithm`: [String] Algorithm for Cipher. _(optional, defaults to 'AES-256-CBC')_  
     - `cache`: [BaseCache] Instance of caching object. Included are:
       - `NoCache`: No caching, disk is hit for all gets.
       - `MemoeryCache`: Holds all gets/sets in memory, no invalidation. __(default)__ 
       - `LRUCache`: An in-memory cahce that is very configurable: [Read more](https://www.npmjs.com/package/lru-cache)

----

## Instance Methods

### __store.createBucket__
```javascript
store.createBucket ([bucket], [type])
```
Creates a bucket for items.
#### Paramters
  - `bukcet`: [string] Name of bucket __(required)__
  - `type`: [Avro.Type|Object] Either an Avro type definition or an example object Avro can refect to create an object. __(required)__

----

### __store.deleteBucket__
```javascript
store.deleteBucket ([bucket])
```
Deletes a bucket.
#### Paramters
  - `bukcet`: [string] Name of bucket __(required)__

----

### __store.compress__
```javascript
store.compress ([bucket])
```
Shrinks data files by removing the empty spaces left by deleted items.
#### Paramters
  - `bukcet`: [string] Name of bucket __(required)__

----

### __store.create__
```javascript
store.create ([bucket], [item])
```
Adds an item to the bucket.
#### Paramters
  - `bukcet`: [string] Name of bucket __(required)__
  - `item`: [Object] The item to add to the bucket.  If the item has a `id` property, that will be used to key it in the bucket, otherwise a random string is used. __(required)__
#### Returns
This functions returns the `id` used to store item in the bucket.
#### Throws
This functions throws an error if the `id` is already used by an existing item in the bucket.

----

### __store.get__
```javascript
store.get ([bucket], [id])
```
Retrieves an item from a bucket by its `id`.
#### Paramters
  - `bukcet`: [string] Name of bucket __(required)__
  - `id`: [string|number|[value]] The `id` of the item to retrieve. __(required)__
#### Returns
This functions returns the item for the given `id` if it exists in the bucket, otherwise `undefined`.

----

### __store.update__
```javascript
store.update ([bucket], [id], [item])
```
Updates an existing item in a bucket.
#### Paramters
  - `bukcet`: [string] Name of bucket __(required)__
  - `id`: [string|number|[value]] The `id` of the item to update. If this is different than the `id` property of the item it will item's `id` will be overwritten by this value. __(required)__
  - `item`: [Object] The item to replace in the bucket. __(required)__
#### Throws
This functions throws an error if the `id` is does not exist for an item in the bucket.

----

### __store.delete__
```javascript
store.delete ([bucket], [id])
```
Removes an existing item from a bucket.
#### Paramters
  - `bukcet`: [string] Name of bucket __(required)__
  - `id`: [string|number|[value]] The `id` of the item to delete. __(required)

----

### __store.getItems__
```javascript
store.getItems ([bucket], {[options]})
```
Gets a list of items from a bucket.
#### Paramters
  - `bukcet`: [string] Name of bucket __(required)__
  - `options`: [Object] Paging and order options. _(optional)_
    - `offset`: [number] 0 based position to start list. _(optional, defaults to 0)_  
    - `take`: [number] How many items to take. _(optional, defaults to 10)_
    - `order`: [ORDER] What order (based on when the order they were added to the bucket) to return the items. _(optional, ORDER.ASCENDING)_ 
#### Returns
An object with the results: `{count,items}`
  - `count`: [number] Total number of items in the bucket.
  - `items`: [Array] List of items retrieved from bucket.

----

### __store.filterItems__
```javascript
store.filterItems ([bucket], [filter], {[options]})
```
Gets a filtered list of items from a bucket.
#### Paramters
  - `bukcet`: [string] Name of bucket __(required)__
  - `filter`: [Function] A function to evaluate against the items in the bucket. (Example: `(i) => !i.disabled` will only return items that have a `disabled` property that is "falsey") __(required)__
  - `options`: [Object] Paging and order options. _(optional)_
    - `offset`: [number] 0 based position to start list. _(optional, defaults to 0)_  
    - `take`: [number] How many items to take. _(optional, defaults to 10)_
    - `order`: [ORDER] What order (based on when the order they were added to the bucket) to return the items. _(optional, ORDER.ASCENDING)_ 
#### Returns
An object with the results: `{more,items}`
  - `more`: [boolean] Are there more items in the bucket that match this filter.
  - `items`: [Array] List of items retrieved from bucket.

----

### __store.resetCache__
```javascript
store.resetCache ()
```
Resets the cache for the store, clearing all items from cache.

