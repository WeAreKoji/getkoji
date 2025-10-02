/**
 * Performance monitoring utility for tracking key metrics
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100;

  /**
   * Track the duration of an async operation
   */
  async track<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name,
        duration,
        timestamp: new Date(),
        metadata: { ...metadata, success: true },
      });
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name,
        duration,
        timestamp: new Date(),
        metadata: { ...metadata, success: false, error: String(error) },
      });
      
      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get average duration for a specific operation
   */
  getAverageDuration(name: string): number | null {
    const operationMetrics = this.metrics.filter(m => m.name === name);
    
    if (operationMetrics.length === 0) return null;
    
    const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / operationMetrics.length;
  }

  /**
   * Get all metrics for a specific operation
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  /**
   * Get success rate for a specific operation
   */
  getSuccessRate(name: string): number | null {
    const operationMetrics = this.metrics.filter(m => m.name === name);
    
    if (operationMetrics.length === 0) return null;
    
    const successCount = operationMetrics.filter(
      m => m.metadata?.success === true
    ).length;
    
    return (successCount / operationMetrics.length) * 100;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, { avgDuration: number; successRate: number; count: number }> {
    const summary: Record<string, { avgDuration: number; successRate: number; count: number }> = {};
    
    const uniqueNames = [...new Set(this.metrics.map(m => m.name))];
    
    uniqueNames.forEach(name => {
      const avg = this.getAverageDuration(name);
      const rate = this.getSuccessRate(name);
      const count = this.metrics.filter(m => m.name === name).length;
      
      if (avg !== null && rate !== null) {
        summary[name] = {
          avgDuration: avg,
          successRate: rate,
          count,
        };
      }
    });
    
    return summary;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
