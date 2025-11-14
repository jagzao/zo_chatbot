/**
 * Queue metrics for monitoring and debugging
 */

export interface QueueMetrics {
  totalProcessed: number;
  totalSucceeded: number;
  totalFailed: number;
  totalRetried: number;
  averageProcessingTime: number;
  lastProcessedAt: Date | null;
}

class MetricsCollector {
  private metrics: Map<string, QueueMetrics> = new Map();

  getMetrics(organizationId: string): QueueMetrics {
    if (!this.metrics.has(organizationId)) {
      this.metrics.set(organizationId, {
        totalProcessed: 0,
        totalSucceeded: 0,
        totalFailed: 0,
        totalRetried: 0,
        averageProcessingTime: 0,
        lastProcessedAt: null,
      });
    }
    return this.metrics.get(organizationId)!;
  }

  recordSuccess(organizationId: string, processingTimeMs: number): void {
    const metrics = this.getMetrics(organizationId);
    metrics.totalProcessed++;
    metrics.totalSucceeded++;
    metrics.lastProcessedAt = new Date();

    // Update running average
    const total = metrics.totalProcessed;
    metrics.averageProcessingTime =
      (metrics.averageProcessingTime * (total - 1) + processingTimeMs) / total;
  }

  recordFailure(organizationId: string, isRetry: boolean): void {
    const metrics = this.getMetrics(organizationId);
    metrics.totalProcessed++;
    metrics.totalFailed++;
    metrics.lastProcessedAt = new Date();

    if (isRetry) {
      metrics.totalRetried++;
    }
  }

  getAllMetrics(): Map<string, QueueMetrics> {
    return this.metrics;
  }

  resetMetrics(organizationId: string): void {
    this.metrics.delete(organizationId);
  }
}

export const metricsCollector = new MetricsCollector();
