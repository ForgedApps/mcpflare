import logger from '../utils/logger.js'

interface ExecutionMetrics {
  total_executions: number
  successful_executions: number
  failed_executions: number
  total_execution_time_ms: number
  average_execution_time_ms: number
  total_mcp_calls: number
}

interface MCPMetrics {
  mcp_id: string
  load_time_ms: number
  executions: ExecutionMetrics
}

export class MetricsCollector {
  private mcpMetrics: Map<string, MCPMetrics> = new Map()
  private globalMetrics: ExecutionMetrics = {
    total_executions: 0,
    successful_executions: 0,
    failed_executions: 0,
    total_execution_time_ms: 0,
    average_execution_time_ms: 0,
    total_mcp_calls: 0,
  }

  recordMCPLoad(mcpId: string, loadTimeMs: number): void {
    this.mcpMetrics.set(mcpId, {
      mcp_id: mcpId,
      load_time_ms: loadTimeMs,
      executions: {
        total_executions: 0,
        successful_executions: 0,
        failed_executions: 0,
        total_execution_time_ms: 0,
        average_execution_time_ms: 0,
        total_mcp_calls: 0,
      },
    })

    logger.debug({ mcpId, loadTimeMs }, 'MCP load metrics recorded')
  }

  recordExecution(
    mcpId: string,
    executionTimeMs: number,
    success: boolean,
    mcpCallsMade: number,
  ): void {
    const mcpMetric = this.mcpMetrics.get(mcpId)

    if (mcpMetric) {
      mcpMetric.executions.total_executions++

      if (success) {
        mcpMetric.executions.successful_executions++
      } else {
        mcpMetric.executions.failed_executions++
      }

      mcpMetric.executions.total_execution_time_ms += executionTimeMs
      mcpMetric.executions.average_execution_time_ms =
        mcpMetric.executions.total_execution_time_ms /
        mcpMetric.executions.total_executions

      mcpMetric.executions.total_mcp_calls += mcpCallsMade
    }

    // Update global metrics
    this.globalMetrics.total_executions++

    if (success) {
      this.globalMetrics.successful_executions++
    } else {
      this.globalMetrics.failed_executions++
    }

    this.globalMetrics.total_execution_time_ms += executionTimeMs
    this.globalMetrics.average_execution_time_ms =
      this.globalMetrics.total_execution_time_ms /
      this.globalMetrics.total_executions

    this.globalMetrics.total_mcp_calls += mcpCallsMade

    logger.debug(
      { mcpId, executionTimeMs, success, mcpCallsMade },
      'Execution metrics recorded',
    )
  }

  getMetrics() {
    const mcpMetricsArray = Array.from(this.mcpMetrics.values())

    return {
      global: this.globalMetrics,
      per_mcp: mcpMetricsArray,
      summary: {
        total_mcps_loaded: mcpMetricsArray.length,
        success_rate:
          this.globalMetrics.total_executions > 0
            ? (this.globalMetrics.successful_executions /
                this.globalMetrics.total_executions) *
              100
            : 0,
      },
    }
  }

  resetMetrics(): void {
    this.mcpMetrics.clear()
    this.globalMetrics = {
      total_executions: 0,
      successful_executions: 0,
      failed_executions: 0,
      total_execution_time_ms: 0,
      average_execution_time_ms: 0,
      total_mcp_calls: 0,
    }

    logger.info('Metrics reset')
  }
}
