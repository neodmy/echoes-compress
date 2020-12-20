const { CronJob } = require('cron');

module.exports = () => {
  let initDailyJob;
  const start = async ({ config, compressor }) => {
    const { schedule } = config;
    initDailyJob = new CronJob(schedule, async () => {
      const today = new Date().toISOString().split('T')[0];
      await compressor.handleCompression(today);
    });

    return initDailyJob;
  };

  const stop = async () => {
    initDailyJob.stop();
  };

  return { start, stop };
};
