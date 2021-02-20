const asyncForEach = async (array, callback) => {
  // eslint-disable-next-line no-plusplus
  for (let index = 0; index < array.length; index++) {
    // eslint-disable-next-line no-await-in-loop
    await callback(array[index], index, array);
  }
};

const getPreviousDay = () => {
  const dateToProcess = new Date();
  dateToProcess.setDate(dateToProcess.getDate() - 1);
  return dateToProcess.toISOString().split('T')[0];
};

const shouldRemove = (filename, removalOffset) => {
  if (!removalOffset) return false;
  const removalDate = new Date();
  removalDate.setDate(removalDate.getDate() - removalOffset);
  const fileDate = new Date(filename);
  return removalDate > fileDate;
};

module.exports = {
  asyncForEach,
  getPreviousDay,
  shouldRemove,
};
