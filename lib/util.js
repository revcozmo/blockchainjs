var crypto = require('crypto')

var _ = require('lodash')
var Q = require('q')

var yatc = require('./yatc')

/**
 * @throws {TypeError}
 */
function isBufferCheck (buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('Expect buffer, got ' + Object.prototype.toString.call(buffer))
  }
}

/**
 * @param {Buffer} buffer
 * @return {Buffer}
 */
function sha256 (buffer) {
  isBufferCheck(buffer)
  return crypto.createHash('sha256').update(buffer).digest()
}

/**
 * @param {Buffer} buffer
 * @return {Buffer}
 */
function sha256x2 (buffer) {
  return sha256(sha256(buffer))
}

/**
 * @param {Buffer} buffer
 * @return {Buffer}
 */
function reverse (buffer) {
  isBufferCheck(buffer)
  return Array.prototype.reverse.call(new Buffer(buffer))
}

/**
 * Reverse buffer and transform to hex string
 *
 * @param {Buffer} s
 * @return {string}
 */
function hashEncode (s) {
  isBufferCheck(s)
  return Array.prototype.reverse.call(new Buffer(s)).toString('hex')
}

/**
 * Transform hex string to buffer and reverse it
 *
 * @param {string} s
 * @return {Buffer}
 */
function hashDecode (s) {
  yatc.verify('HexString', s)
  return Array.prototype.reverse.call(new Buffer(s, 'hex'))
}

/**
 * Revert bytes order
 *
 * @param {string} s
 * @return {string}
 */
function revHex (s) {
  return hashDecode(s).toString('hex')
}

/**
 * @typedef {Object} BitcoinHeader
 * @param {number} version
 * @param {string} prevBlockHash
 * @param {string} merkleRoot
 * @param {number} timestamp
 * @param {number} bits
 * @param {number} nonce
 */

/**
 * @param {BitcoinHeader} header
 * @return {Buffer}
 */
function header2buffer (header) {
  yatc.verify('BitcoinHeader', header)

  var buffer = new Buffer(80)
  buffer.writeUInt32LE(header.version, 0)
  buffer.write(revHex(header.prevBlockHash), 4, 32, 'hex')
  buffer.write(revHex(header.merkleRoot), 36, 32, 'hex')
  buffer.writeUInt32LE(header.timestamp, 68)
  buffer.writeUInt32LE(header.bits, 72)
  buffer.writeUInt32LE(header.nonce, 76)

  return buffer
}

/**
 * @param {Buffer} buffer
 * @return {BitcoinHeader}
 */
function buffer2header (buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length !== 80) {
    throw new TypeError('Expect buffer with length 80, got ' + Object.prototype.toString.call(buffer))
  }

  return {
    version: buffer.readUInt32LE(0),
    prevBlockHash: revHex(buffer.slice(4, 36).toString('hex')),
    merkleRoot: revHex(buffer.slice(36, 68).toString('hex')),
    timestamp: buffer.readUInt32LE(68),
    bits: buffer.readUInt32LE(72),
    nonce: buffer.readUInt32LE(76)
  }
}

/**
 * @param {function} fn
 * @return {function}
 */
function makeSerial (fn) {
  yatc.verify('Function', fn)

  var queue = []

  return function () {
    var ctx = this
    var args = _.slice(arguments)

    var deferred = Q.defer()

    queue.push(deferred)
    if (queue.length === 1) {
      queue[0].resolve()
    }

    return deferred.promise
      .then(function () { return fn.apply(ctx, args) })
      .finally(function () {
        queue.shift()
        if (queue.length > 0) {
          queue[0].resolve()
        }
      })
  }
}

/**
 * @param {*} obj
 * @param {number} size
 * @return {string}
 */
function zfill (obj, size) {
  yatc.verify('PositiveNumber', size)

  var result = obj.toString()
  for (var count = size - result.length; count > 0; --count) {
    result = '0' + result
  }

  return result
}

module.exports = {
  sha256: sha256,
  sha256x2: sha256x2,
  reverse: reverse,
  hashEncode: hashEncode,
  hashDecode: hashDecode,
  header2buffer: header2buffer,
  buffer2header: buffer2header,

  makeSerial: makeSerial,

  zfill: zfill
}