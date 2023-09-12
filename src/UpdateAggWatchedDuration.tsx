export default function calculateAggWatchedDuration(data) {
  // Sort the intervals based on start time
  data.sort((a, b) => a.start - b.start);
  let totalDuration = 0;
  let lastEnd = 0;
  for (let interval of data) {
    // If the current interval's start is greater than the last end, then no overlap
    if (interval.start > lastEnd) {
      totalDuration += interval.end - interval.start;
    } else if (interval.end > lastEnd) {
      // Else, if there's a new portion in this interval, add that to the total
      totalDuration += interval.end - lastEnd;
    }
    // Update the lastEnd to the end of the current interval
    lastEnd = Math.max(lastEnd, interval.end);
  }
  return totalDuration;
}
