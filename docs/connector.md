# Network

  * [Events](#events)
    * [connect](#connect)
    * [disconnect](#disconnect)
    * [error](#error)
    * [newReadyState](#newreadystate)
    * [newBlock](#newblock)
    * [touchAddress](#touchaddress)
  * [Methods](#methods)
    * [constructor](#constructor)
    * [connect](#connect)
    * [disconnect](#disconnect)
    * [isConnected](#isconnected)
    * [getCurrentActiveRequests](#getcurrentactiverequests)
    * [getTimeFromLastResponse](#gettimefromlastresponse)
    * [getHeader](#getheader)
    * [headersQuery](#headersquery)
    * [getTx](#gettx)
    * [getTxMerkle](#gettxmerkle)
    * [sendTx](#sendtx)
    * [addressesQuery](#addressesquery)
    * [subscribe](#subscribe)
  * Properties
    * networkName
    * READY_STATE
      * CONNECTING
      * OPEN
      * CLOSING
      * CLOSED
    * readyState
  * Inheritance
    * [Chromanode](#chromanode)

## Events

### error

  * `Error` error

### connect

### disconnect

### newReadyState

  * `number` readyState
  * `number` prevReadyState

### newBlock

  * `string` blockid
  * `number` height

### touchAddress

  * `string` address
  * `string` txid

## Methods

### constructor

  * `Object` opts
    * `string` networkName

### connect

### disconnect

### isConnected

**return**: `boolean`

### getCurrentActiveRequests

**return**: `number`

### getTimeFromLastResponse

**return**: `number`

### getHeader

  * `(number|string)` id `blockid`, `height` or special keyword `latest` for best block

**return**: `Promise<Object>` `Object` is [HeaderObject](#headerobject)

**return**: `Promise<errors.Header.NotFound>` if couldn't find block

### headersQuery

  \* *maximum 2016 headers (one chunk)*

  \* *half-open interval for [from-to)*

  * `string` from
  * `string` [to]
  * `number` [count]

**return**: `Promise<Object>` `Object` is [HeadersQueryObject](#headersqueryobject)

**return**: `Promise<errors.Header.NotFound>` if couldn't find block for `from` or `to`

**return**: `Promise<errors.Header.InvalidCount>` if count (or distance between `to` and `from`) less than 1 or more than 2016

### getTx

  * `string` txid

**return**: `Promise<string>` Raw transaction as hex string

**return**: `Promise<errors.Transaction.NotFound>` if couldn't find transaction for `txid`

### getTxBlockId

  * `string` txid

**return**: `Promise<Object>` `Object` is [TxBlockIdObject](#txblockidobject)

**return**: `Promise<errors.Transaction.NotFound>` if couldn't find transaction for `txid`

### sendTx

  * `string` rawtx

**return**: `Promise`

### addressesQuery

  \* *half-close interval for (from-to]*

  * `string[]` addresses
  * `string` [source] `blocks` or `mempool`
  * `(string|number)` [from] `blockid` or `height`
  * `(string|number)` [to] `blockid` or `height`
  * `string` [status] `unspent` for affected transactions with unspent outputs

**return**: `Promise<Object>` `Object` is [AddressesQueryObject](#addressesqueryobject)

### subscribe

  * `Object` opts
    * `string` event May be `newBlock` or `touchAddress`
    * `string` address Only for `touchAddress` type

**return**: `Promise`

## Chromanode

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0 // for self-signed cert.
```

  * Static properties
    * `Object` SOURCES keys is networkName, value is array of urls
    * `function` getSources return array of sources for given networkName

### constructor

  * `Object` opts
    * `string` networkName
    * `string` url
    * `number` requestTimeout

## Objects

### HeaderObject

  * `string` blockid
  * `number` height
  * `number` version
  * `string` prevblockid
  * `string` merkleroot
  * `number` time
  * `number` bits
  * `number` nonce

### HeadersQueryObject

  * `number` from
  * `string` headers Concatenated headers in raw format encoded in hex. See [Block hashing algorithm](https://en.bitcoin.it/wiki/Block_hashing_algorithm) for details.

### TxBlockIdObject

  * `string` source `blocks` for confirmed or `mempool` for unconfirmed
  * `Object` [data] defined only for confirmed transactions
    * `number` height
    * `string` blockid
    * `?string[]` merkle
    * `?number` index

### AddressesQueryObject

  * `Array.<{txid: string, height: number}>` transactions
  * `Object` latest
    * `number` height
    * `string` blockid