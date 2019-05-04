# API Documentation for @convenience/store

- [Store](#store)
- [Cache](#cache)

----

# Store

`Store` is a class that represents access to the data store that allows for managing buckets, and creating, retrieving, updating, and deleting items in those buckets.

### Constructor

```javascript
const store = new Store(path, {options})
```

Creates an instance of a store.

#### Parameters

- `path`: the file path to persist the data to disk. __(required)__
- `options`: this are optional settings that change the behaviour for the store. _(optional)_
    - `compress`: [Boolean] If `true` it data written to disk will be compressed or no compression if `false`.  _(optional, defaults to false)_ 
    - `password`: [String] Password for Cipher.  If not set, no encryption is used when writting to disk. _(optional, defaults to undefined)_
    - `cache`: [BaseCache] Instance of caching object. Included are:
       - `NoCache`: No caching, disk is hit for all gets.
       - `MemoeryCache`: Holds all gets/sets in memory, no invalidation. __(default)__ 
       - `LRUCache`: An in-memory cahce that is very configurable: [Read more](https://www.npmjs.com/package/lru-cache)

----

## Instance Methods

### __store.createBucket__
```javascript
store.createBucket(bucket, type)
```
Creates a bucket for items.
#### Paramters
  - `bukcet`: [string] Name of bucket __(required)__
  - `type`: [Avro.Type|Object] Either an Avro type definition or an example object Avro can refect to create an object. __(required)__

----

### __store.deleteBucket__
```javascript
store.deleteBucket(bucket)
```
Deletes a bucket.
#### Paramters
  - `bukcet`: [string] Name of bucket __(required)__

----

### __store.compress__
```javascript
store.compress(bucket)
```
Shrinks data files by removing the empty spaces left by deleted items.
#### Paramters
  - `bukcet`: [string] Name of bucket __(required)__

----

### __store.create__
```javascript
store.create(bucket, item)
```
Adds an item to the bucket.
#### Paramters
  - `bukcet`: [string] Name of bucket __(required)__
  - `item`: [Object] The item to add to the bucket. _This item must be serializable based on the type passed to the bucket creation._  If the item has a `id` property, that will be used to key it in the bucket, otherwise a random string is used. __(required)__
#### Returns
This functions returns the `id` used to store item in the bucket.
#### Throws
This functions throws an error if the `id` is already used by an existing item in the bucket.

----

### __store.get__
```javascript
store.get(bucket, id)
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
store.update(bucket, id, item)
```
Updates an existing item in a bucket.
#### Paramters
  - `bukcet`: [string] Name of bucket __(required)__
  - `id`: [string|number|[value]] The `id` of the item to update. If this is different than the `id` property of the item it will item's `id` will be overwritten by this value. __(required)__
  - `item`: [Object] The item to replace in the bucket.  _This item must be serializable based on the type passed to the bucket creation._ __(required)__
#### Throws
This functions throws an error if the `id` is does not exist for an item in the bucket.

----

### __store.delete__
```javascript
store.delete(bucket, id)
```
Removes an existing item from a bucket.
#### Paramters
  - `bukcet`: [string] Name of bucket __(required)__
  - `id`: [string|number|[value]] The `id` of the item to delete. __(required)

----

### __store.getItems__
```javascript
store.getItems(bucket, {options})
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
store.filterItems(bucket, filter, {options})
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
store.resetCache()
```
Resets the cache for the store, clearing all items from cache.

----

# Cache

## BaseCache

`BaseCache` is a an unimplemented class that can be extended to create a new cache provider. Your class must implement the `get`, `set`, `del`, and `clear` methods. The constructor takes an `options` parameter. Example:

```javascript
const {BaseCache} = require('@convenience/store')
const Fancy = require('some-fancy-cache-thing')

class FancyCache extends BaseCache {
  constructor (options) {
    super(options)
    this.cache = new Fancy(options)
  }
  get (key) { return this.cache.goGetThe(key) }
  set (key, item) { this.cache.setThe(key,item) }
  del (key) { this.cache.deleteThe(key) }
  clear () { this.cache.eraseEverthing() }
}
```

## NoCache

`NoCache` is a noop cache.  When used, it does nothing. The store will always read from disk. To disable caching in your store, initialize like this:
```javascript
const {Store, NoCache} = require('@convenience/store')

const store = new Store('some/path', {cache: new NoCache()})
```

## MemoryCache

`MemoryCache` is an in-memory cache with no expiration. It just grows until you run out of memory or call `store.resetCache()`.  Great for smaller stores like configurations and such. To use this basic memory caching in your store, initialize like this:
```javascript
const {Store, MemoryCache} = require('@convenience/store')

const store = new Store('some/path', {cache: new MemoryCache()})
```

## LRUCache

`LRUCache` uses [lru-cache](https://www.npmjs.com/package/lru-cache) for an in-memory cache that has all the bells and whistles.  It takes in the options for the lru-cache, or just defaults to the 100 most used items. To use this basic memory caching in your store, initialize like this:
```javascript
const {Store, LRUCache} = require('@convenience/store')
const options = { max: 500, maxAge: 1000 * 60 * 60 } // 500 items, expire in an hour
const store = new Store('some/path', {cache: new LRUCache(options)})
```

----

