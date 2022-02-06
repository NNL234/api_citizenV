const cron = require('node-cron');
const updateStaticalInfo = require('./updateStaticalInfo');
// const updateAddresses = require('./updateAddresses');
cron.schedule(' 1 * * * *', function() { //every 1 min
    console.log('running a task every hour');
    updateStaticalInfo.refreshStatisticsData();
    // updateAddresses();
  });
  module.exports = cron;
// Real world : server update at 23:59
