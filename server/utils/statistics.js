/**
 * Calculate confidence interval for A/B test results
 * Uses Wilson score interval for binomial proportion confidence
 * @param {number} conversions - Number of successes (conversions)
 * @param {number} visitors - Total number of trials (visitors)
 * @param {number} confidence - Confidence level (0-1), default 0.95 (95%)
 * @returns {Object} Confidence interval with lower and upper bounds
 */
function calculateConfidenceInterval(conversions, visitors, confidence = 0.95) {
  if (visitors === 0) return { lower: 0, upper: 0 };

  // Z-score for confidence level
  const z = getZScore(confidence);
  const p = conversions / visitors;
  const n = visitors;

  // Wilson score interval
  const denominator = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const adjP = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);

  return {
    lower: (centre - adjP) / denominator,
    upper: (centre + adjP) / denominator
  };
}

/**
 * Get z-score for a given confidence level
 * @param {number} confidence - Confidence level (0-1)
 * @returns {number} Z-score
 */
function getZScore(confidence) {
  // Common z-scores
  const zScores = {
    0.80: 1.28,
    0.85: 1.44,
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
    0.999: 3.291
  };

  return zScores[confidence] || 1.96; // Default to 95% confidence if not found
}

/**
 * Calculate statistical significance between two variants
 * @param {Object} control - Control variant data {conversions, visitors}
 * @param {Object} variant - Test variant data {conversions, visitors}
 * @param {number} confidence - Confidence level (0-1)
 * @returns {Object} Statistical significance results
 */
function calculateSignificance(control, variant, confidence = 0.95) {
  const controlCI = calculateConfidenceInterval(control.conversions, control.visitors, confidence);
  const variantCI = calculateConfidenceInterval(variant.conversions, variant.visitors, confidence);

  return {
    isSignificant: controlCI.upper < variantCI.lower || controlCI.lower > variantCI.upper,
    control: controlCI,
    variant: variantCI,
    improvement: ((variant.conversions / variant.visitors) / (control.conversions / control.visitors) - 1) * 100
  };
}

module.exports = {
  calculateConfidenceInterval,
  calculateSignificance,
  getZScore
};