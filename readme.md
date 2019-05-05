# @convenience/store
## An simple node data store that is convenient.

Convenience Store exists because I got tired of writing of simple test data stores that did not persist.  I wasn't to the point were I needed MongoDB or Postgres.  When a new project I needed some place simple to put get and iterate some object.  So I decided to write this library.  Now storing objects and getting them is as easy as this:

```javascript
const { Store, ORDER } = require('@convenience/store')
const Path = require('path')

const path = Path.join(__dirname, 'data')
const store = new Store(path) // create an instance of the store

const item = {active:true, name:'first', id:1}
store.createBucket('items',item) // create a bucket with an example item to enforce a schema

store.create('items', item) // add item to the 'items' bucket
store.create('items', {active:true, name:'second', id:2}) // add another item to the 'items' bucket

const update = Object.assign(item, {active:false}) 
store.update('items', 1, update) // update the first item in the 'items' bucket

const first = store.get('items', 1) // get item from 'items' bucket by id

const all = store.getItems('items') // get first items from 'items' bucket in the order they were added (oldest > newest)
const reverse = store.getItems('items', {order: ORDER.DESCENDING}) // get items from 'items' bucket in newest > oldest order
const page = store.getItems('items', {offset:10, take:5}) // pagination!
const active = store.filterItems('items', (i) => i.active) // filtering! this gets the active items back

store.delete('items', 1) // delete item from 'items' bucket by id

store.compress() // save disk space by removing open space left by updates and deleted files. 
```

This is pretty basic usage.  Check out the [API docs](API.md) for more detailed usage.

Some of the features include:
- Optional password based encryption to data files
- Optional compression to data files
- Fast Avro serialization for data schema protection and performance
- Optional and extensible Caching mechanisms.

Looks great! Right? Well it is not perfect, it's not for production (probably) and it has some shortcomings. The are:

- No sorting by data fields. Building and maintaining sort index was out of scope of the purpose of this project, and can get ugly.
- Everything is synchronous, so performance might be meh.  To keep thing semi-transactional, I used synchronous file IO. It may or may not be acid (I have not tested it), but it is probably close enough.
- All lists (indexes) need to fit into memory. 
- No support for clustering.  If you web app has more than one instance then the stores will be different on each instance. Though if you wrapped it in a lightweight single instance micro-service.... ;P
