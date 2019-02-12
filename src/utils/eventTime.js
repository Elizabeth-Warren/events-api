/**
 * Convert a String UTC timestamp into milliseconds.
 *
 * @param  {String}  timestamp
 * @param  {Boolean} [moveToEndOfDay=false] Set the date to the end of day
 * @return {Integer}
 */
module.exports = function eventTime(timestamp, moveToEndOfDay = false) {
  const date = new Date(timestamp);

  if (! moveToEndOfDay) {
    return date.getTime();
  }

  const end = date.setHours(23, 59, 59, 999);
  return end.getTime();
}
