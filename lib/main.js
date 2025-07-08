//#region import
const {
  setConfig,
  resetConfig,
  getConfig,
} = require('./config');
const Base = require('./class/Base');
const Web = require('./class/Web');
const User = require('./class/User');
const SubscriptionMessage = require('./class/SubscriptionMessage')
const Menu = require('./class/Menu')
const Message = require('./class/Message')
//#endregion

module.exports = {
  Base,
  setConfig,
  resetConfig,
  getConfig,
  Web,
  User,
  SubscriptionMessage,
  Menu,
  Message
};