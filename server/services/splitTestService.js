const SplitTest = require("../models/SplitTest");
const { calculateConfidenceInterval, calculateSignificance } = require("../utils/statistics");

class SplitTestService {
  async getTests(projectId, status = 'active') {
    return await SplitTest.find({ projectId, status })
      .sort({ startDate: -1 });
  }

  async createTest(testData) {
    // Validate weights sum to 100%
    const totalWeight = testData.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      throw new Error("Variant weights must sum to 100%");
    }

    // Initialize metrics for each variant
    const variantMetrics = testData.variants.map(v => ({
      variantName: v.name,
      visitors: 0,
      conversions: 0,
      conversionRate: 0
    }));

    testData.metrics = {
      totalVisitors: 0,
      variantMetrics
    };

    const test = new SplitTest(testData);
    return await test.save();
  }

  async updateTest(id, updates) {
    if (updates.variants) {
      const totalWeight = updates.variants.reduce((sum, v) => sum + v.weight, 0);
      if (totalWeight !== 100) {
        throw new Error("Variant weights must sum to 100%");
      }

      // Preserve existing metrics when updating variants
      const test = await SplitTest.findById(id);
      if (test) {
        const existingMetrics = test.metrics.variantMetrics;
        const updatedMetrics = updates.variants.map(v => {
          const existing = existingMetrics.find(m => m.variantName === v.name);
          return existing || {
            variantName: v.name,
            visitors: 0,
            conversions: 0,
            conversionRate: 0
          };
        });
        updates.metrics = {
          totalVisitors: test.metrics.totalVisitors,
          variantMetrics: updatedMetrics
        };
      }
    }
    return await SplitTest.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteTest(id) {
    return await SplitTest.findByIdAndDelete(id);
  }

  async updateVariantWeight(testId, variantName, weight) {
    const test = await SplitTest.findById(testId);
    if (!test) throw new Error("Test not found");

    // Find the variant to update
    const variantIndex = test.variants.findIndex(v => v.name === variantName);
    if (variantIndex === -1) throw new Error("Variant not found");

    // Calculate new weights
    const oldWeight = test.variants[variantIndex].weight;
    const weightDiff = weight - oldWeight;
    
    // Adjust other variants proportionally
    const otherVariants = test.variants.filter((_, i) => i !== variantIndex);
    const totalOtherWeight = otherVariants.reduce((sum, v) => sum + v.weight, 0);
    
    test.variants.forEach((variant, i) => {
      if (i === variantIndex) {
        variant.weight = weight;
      } else {
        const proportion = variant.weight / totalOtherWeight;
        variant.weight = Math.max(0, variant.weight - (weightDiff * proportion));
      }
    });

    return await test.save();
  }

  async recordVisit(testId, variantName) {
    const test = await SplitTest.findById(testId);
    if (!test || test.status !== 'active') throw new Error("Test not active");

    const variantMetrics = test.metrics.variantMetrics.find(
      vm => vm.variantName === variantName
    );
    if (!variantMetrics) throw new Error("Variant metrics not found");

    variantMetrics.visitors += 1;
    test.metrics.totalVisitors += 1;
    
    // Update conversion rate
    if (variantMetrics.visitors > 0) {
      variantMetrics.conversionRate = (
        (variantMetrics.conversions / variantMetrics.visitors) * 100
      ).toFixed(2);
    }

    await test.save();

    // Check if test should complete based on statistical significance
    await this.checkTestCompletion(test);

    return test;
  }

  async recordConversion(testId, variantName) {
    const test = await SplitTest.findById(testId);
    if (!test || test.status !== 'active') throw new Error("Test not active");

    const variantMetrics = test.metrics.variantMetrics.find(
      vm => vm.variantName === variantName
    );
    if (!variantMetrics) throw new Error("Variant metrics not found");

    variantMetrics.conversions += 1;
    variantMetrics.conversionRate = (
      (variantMetrics.conversions / variantMetrics.visitors) * 100
    ).toFixed(2);

    await test.save();

    // Check if test should complete based on statistical significance
    await this.checkTestCompletion(test);

    return test;
  }

  async getTestMetrics(testId) {
    const test = await SplitTest.findById(testId);
    if (!test) throw new Error("Test not found");

    const metrics = {
      totalVisitors: test.metrics.totalVisitors,
      variants: test.metrics.variantMetrics.map(vm => {
        const variant = test.variants.find(v => v.name === vm.variantName);
        const confidence = calculateConfidenceInterval(
          vm.conversions,
          vm.visitors,
          0.95 // 95% confidence level
        );

        return {
          name: vm.variantName,
          path: variant.path,
          weight: variant.weight,
          visitors: vm.visitors,
          conversions: vm.conversions,
          conversionRate: parseFloat(vm.conversionRate),
          confidence
        };
      })
    };

    // Add significance testing against control
    if (metrics.variants.length > 1) {
      const control = metrics.variants[0]; // First variant is control
      metrics.variants.slice(1).forEach(variant => {
        variant.significance = calculateSignificance(
          { conversions: control.conversions, visitors: control.visitors },
          { conversions: variant.conversions, visitors: variant.visitors },
          0.95
        );
      });
    }

    return metrics;
  }

  async checkTestCompletion(test) {
    if (test.status !== 'active') return;

    const metrics = await this.getTestMetrics(test._id);
    if (!metrics.variants.length) return;

    // Minimum requirements for completion
    const minVisitors = 100; // Minimum visitors per variant
    const minConversions = 10; // Minimum conversions per variant
    
    // Check if all variants meet minimum requirements
    const meetsMinimums = metrics.variants.every(v => 
      v.visitors >= minVisitors && v.conversions >= minConversions
    );

    if (!meetsMinimums) return;

    // Check if we have a statistically significant winner
    const control = metrics.variants[0];
    const betterVariants = metrics.variants.slice(1).filter(variant => 
      variant.significance.isSignificant && variant.conversionRate > control.conversionRate
    );

    // If we have significant results, complete the test
    if (betterVariants.length > 0) {
      test.status = 'completed';
      test.endDate = new Date();
      await test.save();
    }
  }

  selectVariant(test, userId) {
    // Use consistent hashing to assign variant
    const hash = this.hashUserId(userId);
    const normalizedHash = hash / Math.pow(2, 32); // Normalize to 0-1

    let cumulativeWeight = 0;
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight / 100;
      if (normalizedHash < cumulativeWeight) {
        return variant;
      }
    }

    return test.variants[0]; // Fallback to first variant
  }

  hashUserId(userId) {
    const crypto = require("crypto");
    const hash = crypto.createHash("md5").update(userId).digest();
    return hash.readUInt32BE(0);
  }
}

module.exports = new SplitTestService()