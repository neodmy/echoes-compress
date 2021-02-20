const { CronJob } = require('cron');

module.exports = () => {
  let initDailyJob;
  const start = async ({ config, controller, logger }) => {
    const { schedule } = config;
    initDailyJob = new CronJob(schedule, async () => {
      await controller.handleBatchProcess();
    });
    logger.info(`Setting cronjob with expression ${schedule}`);
    initDailyJob.start();
  };

  const stop = async () => {
    initDailyJob.stop();
  };

  return { start, stop };
};
