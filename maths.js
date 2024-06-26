module.exports = {
  getAverage: (nums) => {
    const initialValue = 0;
    const total = nums.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      initialValue
    );
    return total / nums.length;
  },
  getMean: (nums) => {
    const middle = (nums.length + 1) / 2;

    // Avoid mutating when sorting
    const sorted = [...nums].sort((a, b) => a - b);
    const isEven = sorted.length % 2 === 0;

    return isEven
      ? (sorted[middle - 1.5] + sorted[middle - 0.5]) / 2
      : sorted[middle - 1];
  },
  ifNaN: (num, defaultNum) => {
    return isNaN(num) ? defaultNum : num;
  },
};
