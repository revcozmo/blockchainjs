var _ = require('lodash')

var blockchainjs = require('../../src')

var implementationTest = require('./implementation.js')


implementationTest({
  class:          blockchainjs.network.Switcher,
  describe:       describe,
  description:    'network.Switcher: One source',
  getNetworkOpts: function () {
    var electrumNetwork = new blockchainjs.network.ElectrumJS({testnet: true})
    return [[electrumNetwork]]
  }
})

implementationTest({
  class:          blockchainjs.network.Switcher,
  describe:       describe,
  description:    'network.Switcher: Two sources',
  getNetworkOpts: function () {
    var electrumNetwork = new blockchainjs.network.ElectrumJS({testnet: true})
    var chainNetwork = new blockchainjs.network.Chain({testnet: true})
    return [[electrumNetwork, chainNetwork]]
  }
})

implementationTest({
  class:          blockchainjs.network.Switcher,
  describe:       describe,
  description:    'network.Switcher: Two sources (first doesn\'t work)',
  getNetworkOpts: function () {
    var electrumNetwork = new blockchainjs.network.ElectrumJS({testnet: true})
    var chainNetwork = new blockchainjs.network.Chain({testnet: true})
    // not connected
    electrumNetwork.isConnected = function () { return false }
    // not emit `connect` & `disconnect`
    electrumNetwork.emit = function (eventName) {
      if (eventName !== 'connect' && eventName !== 'disconnect') {
        Object.getPrototypeOf(this).emit.apply(this, _.slice(arguments))
      }
    }

    return [[electrumNetwork, chainNetwork]]
  }
})