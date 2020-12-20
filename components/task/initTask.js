module.exports = () => {
  const start = async ({ compressor, cron }) => {
    await compressor.handleInitialCompression();
    cron.start();
  };

  return { start };
};
