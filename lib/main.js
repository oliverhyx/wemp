//#region import
const {
  setConfig,
  resetConfig,
  getConfig,
} = require('./config');
const Base = require('./class/Base');
const Web = require('./class/Web');
const SubscriptionMessage = require('./class/SubscriptionMessage')
//#endregion

module.exports = {
  Base,
  setConfig,
  resetConfig,
  getConfig,
  Web,
  SubscriptionMessage
};