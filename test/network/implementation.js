/* global describe, it, afterEach, beforeEach */
/* globals Promise:true */

var expect = require('chai').expect
var _ = require('lodash')
var bitcoin = require('bitcoinjs-lib')
var Promise = require('bluebird')

var blockchainjs = require('../../lib')
var helpers = require('../helpers')
var fixtures = require('../data/network.json')

/**
 * @param {Object} [opts]
 * @param {function} [opts.describe]
 * @param {string} [opts.description]
 * @param {function} [opts.getNetworkOpts]
 */
function implementationTest (opts) {
  opts = _.extend({
    describe: describe,
    description: 'network.' + opts.class.name,
    getNetworkOpts: _.constant({networkName: 'testnet'})
  }, opts)

  opts.describe(opts.description, function () {
    this.timeout(30000)

    var network

    beforeEach(function (done) {
      var args = [null].concat(opts.getNetworkOpts())
      var Network = Function.prototype.bind.apply(opts.class, args)
      network = new Network()
      network.on('error', helpers.ignoreNetworkErrors)
      network.once('connect', done)
      network.connect()
    })

    afterEach(function (done) {
      network.on('newReadyState', function (newState) {
        if (newState !== network.READY_STATE.CLOSED) {
          return
        }

        network.removeAllListeners()
        network.on('error', function () {})
        network = null
        done()
      })
      network.disconnect()
    })

    it('inherits Network', function () {
      expect(network).to.be.instanceof(blockchainjs.network.Network)
      expect(network).to.be.instanceof(opts.class)
    })

    it('isConnected', function () {
      expect(network.isConnected()).to.be.true
    })

    it('disconnect/connect', function (done) {
      network.once('disconnect', function () {
        network.once('connect', done)
        network.connect()
      })
      network.disconnect()
    })

    it('getCurrentActiveRequests', function (done) {
      if (network instanceof blockchainjs.network.Switcher) {
        return done()
      }

      network.getHeader('latest').done()
      setTimeout(function () {
        expect(network.getCurrentActiveRequests()).to.equal(1)
        done()
      }, 5)
    })

    it('getTimeFromLastResponse', function (done) {
      network.getHeader('latest')
        .then(function () {
          expect(network.getTimeFromLastResponse()).to.be.below(50)
        })
        .done(done, done)
    })

    it('getHeader 0 by height', function (done) {
      network.getHeader(fixtures.headers[0].height)
        .then(function (header) {
          expect(header).to.deep.equal(fixtures.headers[0])
        })
        .done(done, done)
    })

    it('getHeader 0 by hash', function (done) {
      network.getHeader(fixtures.headers[0].hash)
        .then(function (header) {
          expect(header).to.deep.equal(fixtures.headers[0])
        })
        .done(done, done)
    })

    it('getHeader 300000 by height', function (done) {
      network.getHeader(fixtures.headers[300000].height)
        .then(function (header) {
          expect(header).to.deep.equal(fixtures.headers[300000])
        })
        .done(done, done)
    })

    it('getHeader (latest keyword)', function (done) {
      network.getHeader('latest')
        .then(function (header) {
          expect(header).to.be.a('Object')
        })
        .done(done, done)
    })

    it('getHeader (not-exists -- wrong height)', function (done) {
      network.getHeader(987654)
        .then(function () { throw new Error('Unexpected Behavior') })
        .catch(function (err) {
          expect(err).to.be.instanceof(blockchainjs.errors.Header.NotFound)
          expect(err.message).to.match(/987654/)
        })
        .done(done, done)
    })

    it('getHeader (not-exists -- wrong blockHash)', function (done) {
      var blockHash = '000000008c0c4d9f3f1365dc028875bebd0344307d63feae16ec2160a50dce23'

      network.getHeader(blockHash)
        .then(function () { throw new Error('Unexpected Behavior') })
        .catch(function (err) {
          expect(err).to.be.instanceof(blockchainjs.errors.Header.NotFound)
          expect(err.message).to.match(new RegExp(blockHash))
        })
        .done(done, done)
    })

    it('getHeaders (first chunk)', function (done) {
      if (!network.isSupportSPV()) {
        return done()
      }

      var from = '000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943'
      network.getHeaders(from)
        .then(function (headers) {
          var headersHash = blockchainjs.util.hashEncode(
            blockchainjs.util.sha256x2(new Buffer(headers, 'hex')))
          expect(headersHash).to.equal('9b9a9a4d1d72d4ca173a7c659119bb6d756458d1624b7035eb63bf2f893befda')
        })
        .done(done, done)
    })

    it('getHeaders (only latest)', function (done) {
      if (!network.isSupportSPV()) {
        return done()
      }

      network.getHeader('latest')
        .then(function (lastHeader) {
          return Promise.all([lastHeader.hash, network.getHeaders(lastHeader.hash)])
        })
        .spread(function (hash, headers) {
          var headersHash = blockchainjs.util.hashEncode(
            blockchainjs.util.sha256x2(new Buffer(headers, 'hex')))
          expect(headersHash).to.equal(hash)
        })
        .done(done, done)
    })

    it('getHeaders (not found)', function (done) {
      if (!network.isSupportSPV()) {
        return done()
      }

      var from = '000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4944'
      network.getHeaders(from)
        .then(function () { throw new Error('Unexpected Behavior') })
        .catch(function (err) {
          expect(err).to.be.instanceof(blockchainjs.errors.Header.NotFound)
          expect(err.message).to.match(new RegExp(from))
        })
        .done(done, done)
    })

    it('getTx (confirmed tx)', function (done) {
      var txId = '9854bf4761024a1075ebede93d968ce1ba98d240ba282fb1f0170e555d8fdbd8'

      network.getTx(txId)
        .then(function (txHex) {
          var responseTxId = blockchainjs.util.hashEncode(
            blockchainjs.util.sha256x2(new Buffer(txHex, 'hex')))
          expect(responseTxId).to.equal(txId)
        })
        .done(done, done)
    })

    it('getTx (unconfirmed tx)', function (done) {
      helpers.getUnconfirmedTxId()
        .then(function (txId) {
          return network.getTx(txId)
            .then(function (txHex) {
              var responseTxId = blockchainjs.util.hashEncode(
                blockchainjs.util.sha256x2(new Buffer(txHex, 'hex')))
              expect(responseTxId).to.equal(txId)
            })
        })
        .done(done, done)
    })

    it('getTx (not-exists tx)', function (done) {
      var txId = '74335585dadf14f35eaf34ec72a134cd22bde390134e0f92cb7326f2a336b2bb'

      network.getTx(txId)
        .then(function () { throw new Error('Unexpected Behavior') })
        .catch(function (err) {
          expect(err).to.be.instanceof(blockchainjs.errors.Transaction.NotFound)
          expect(err.message).to.match(new RegExp(txId))
        })
        .done(done, done)
    })

    it('getTxBlockHash (confirmed tx)', function (done) {
      var txId = '9854bf4761024a1075ebede93d968ce1ba98d240ba282fb1f0170e555d8fdbd8'
      var expected = {
        status: 'confirmed',
        data: {
          blockHeight: 279774,
          blockHash: '00000000ba81453dd2839b8f91b61be98ee82bee5b7697f6dab1f6149885f1ff'
        }
      }

      if (network.isSupportSPV()) {
        expected.data.index = 4
        expected.data.merkle = [
          '289eb5dab9aad256a7f508377f8cec7df4c3eae07572a8d7273e303a81313e03',
          'fb27fb6ebf46eda58831ca296736d82eec0b51d194f6f6c94c6788ea400a0c8d',
          'f43b287ff722b4ab4d14043f732c23071a86a2ae0ea72acb4277ef0a4e250d8f',
          '2ea9db3d74a1d9a50cd87931ae455e7c037033ba734981c078b5f4dcd39c14c5',
          'b4bd6a5685959e13446d3de03f1375ee3cf37fa9c1488d25c14fb6bbdedc51dc',
          'f3ebd6145c5c8d2144e1641eb0bb4a9315cc83d7ebb2ab2199e47f344e37fc28'
        ]
      }

      network.getTxBlockHash(txId)
        .then(function (response) {
          expect(response).to.deep.equal(expected)
        })
        .done(done, done)
    })

    it('getTxBlockHash (confirmed tx, coinbase)', function (done) {
      var txId = '8acc4825f5563dc2969b81661acc6b65f3cb0e1649a7d4ee91d4acfc613d8bf2'
      var expected = {
        status: 'confirmed',
        data: {
          blockHeight: 5432,
          blockHash: '000000002697b6db85bb0748f47212e0c1eb1f4bccfe89379b07f98033a9282f'
        }
      }

      if (network.isSupportSPV()) {
        expected.data.index = 0
        expected.data.merkle = []
      }

      network.getTxBlockHash(txId)
        .then(function (response) {
          expect(response).to.deep.equal(expected)
        })
        .done(done, done)
    })

    it('getTxBlockHash (unconfirmed tx)', function (done) {
      helpers.getUnconfirmedTxId()
        .then(function (txId) {
          return network.getTxBlockHash(txId)
        })
        .then(function (response) {
          expect(response).to.deep.equal({status: 'unconfirmed', data: null})
        })
        .done(done, done)
    })

    /** @todo Find tx in orphaned block */
    it.skip('getTxBlockHash (invalid tx)', function (done) {
      var txId = 'ea9ed2900c8548d3eaf44d147fec5097f62ac52866cd5f1f8d640ab72d20c028'
      var expected = {status: 'invalid', data: null}

      network.getTxBlockHash(txId)
        .then(function (response) {
          expect(response).to.deep.equal(expected)
        })
        .done(done, done)
    })

    it('getTxBlockHash (non-exists tx)', function (done) {
      var txId = '74335585dadf14f35eaf34ec72a134cd22bde390134e0f92cb7326f2a336b2bb'

      network.getTxBlockHash(txId)
        .then(function () { throw new Error('Unexpected Behavior') })
        .catch(function (err) {
          expect(err).to.be.instanceof(blockchainjs.errors.Transaction.NotFound)
          expect(err.message).to.match(new RegExp(txId))
        })
        .done(done, done)
    })

    it('sendTx', function (done) {
      helpers.createTx()
        .then(function (tx) {
          return network.sendTx(tx.toHex())
            .then(function (txId) { expect(txId).to.equal(tx.getId()) })
        })
        .done(done, done)
    })

    it('getUnspents', function (done) {
      network.getUnspents(fixtures.unspents[0].address)
        .then(function (unspents) {
          var expected = _.sortBy(fixtures.unspents[0].unspents, 'txId')
          expect(_.sortBy(unspents, 'txId')).to.deep.equal(expected)
        })
        .done(done, done)
    })

    it('getHistory', function (done) {
      network.getHistory(fixtures.history[0].address)
        .then(function (transactions) {
          var expected = fixtures.history[0].transactions.sort()
          expect(transactions.sort()).to.deep.equal(expected)
        })
        .done(done, done)
    })

    it('subscribe on new blocks', function (done) {
      network.subscribe({event: 'newBlock'})
        .then(function () {})
        .done(done, done)
    })

    // skip for chain... (testnet notification not working on March 15?)
    it.skip('subscribe on address and wait event', function (done) {
      helpers.createTx()
        .then(function (tx) {
          var cAddress = bitcoin.Address.fromOutputScript(
            tx.outs[0].script, bitcoin.networks.testnet)
          var address = cAddress.toBase58Check()

          var deferred = Promise.defer()
          deferred.promise.done(done, done)
          network.on('touchAddress', function (touchedAddress, txId) {
            if (touchedAddress === address && txId === tx.getId()) {
              deferred.resolve()
            }
          })

          network.subscribe({event: 'touchAddress', address: address})
            .then(function () { return Promise.delay(1000) })
            .then(function () {
              return network.sendTx(tx.toHex())
            })
            .then(function (txId) {
              expect(txId).to.equal(tx.getId())
            })
            .catch(function () { deferred.reject() })
        })
        .catch(done)
    })
  })
}

module.exports = implementationTest
