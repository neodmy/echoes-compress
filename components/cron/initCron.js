const { CronJob } = require('cron');

const { getPreviousDay } = require('../../util/util');

module.exports = () => {
  let initDailyJob;
  const start = async ({ config, compressor }) => {
    const { schedule } = config;
    initDailyJob = new CronJob(schedule, async () => {
      const filename = getPreviousDay();
      await compressor.handleCompression(filename);
    });

    return initDailyJob;
  };

  const stop = async () => {
    initDailyJob.stop();
  };

  return { start, stop };
};
