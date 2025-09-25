import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { ArbitrationService } from './arbitration.service';
import {
  ArbitrationCaseListQuery,
  ArbitrationCaseListResponse,
  ArbitrationCaseDetail,
  HumanArbitrationDecision,
  ArbitrationStatusUpdate
} from './interfaces/arbitration.interface';
import { AdminGuard } from '../guards/admin.guard';

@Controller('api/v1/admin/arbitration-cases')
@UseGuards(AdminGuard)
export class ArbitrationController {
  constructor(private readonly arbitrationService: ArbitrationService) {}

  /**
   * 获取仲裁案件列表
   * GET /api/v1/admin/arbitration-cases
   */
  @Get()
  async getArbitrationCases(
    @Query() query: ArbitrationCaseListQuery
  ): Promise<ArbitrationCaseListResponse> {
    return this.arbitrationService.getArbitrationCases(query);
  }

  /**
   * 获取单个仲裁案件详情
   * GET /api/v1/admin/arbitration-cases/:caseId
   */
  @Get(':caseId')
  async getArbitrationCaseDetail(
    @Param('caseId') caseId: string
  ): Promise<ArbitrationCaseDetail> {
    return this.arbitrationService.getArbitrationCaseDetail(caseId);
  }

  /**
   * 更新仲裁案件状态
   * PUT /api/v1/admin/arbitration-cases/:caseId/status
   */
  @Put(':caseId/status')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateArbitrationCaseStatus(
    @Param('caseId') caseId: string,
    @Body() statusUpdate: ArbitrationStatusUpdate
  ): Promise<{ message: string; case: any }> {
    const updatedCase = await this.arbitrationService.updateArbitrationCaseStatus(
      caseId,
      statusUpdate
    );

    return {
      message: `案件 ${caseId} 状态已更新为 ${statusUpdate.status}`,
      case: updatedCase
    };
  }

  /**
   * 提交人类仲裁决策
   * POST /api/v1/admin/arbitration-cases/:caseId/decision
   */
  @Post(':caseId/decision')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async submitHumanArbitrationDecision(
    @Param('caseId') caseId: string,
    @Body() decision: HumanArbitrationDecision
  ): Promise<{ message: string; case: any }> {
    const updatedCase = await this.arbitrationService.submitHumanArbitrationDecision(
      caseId,
      decision
    );

    return {
      message: `案件 ${caseId} 的仲裁决策已提交`,
      case: updatedCase
    };
  }

  /**
   * 获取仲裁案件统计信息
   * GET /api/v1/admin/arbitration-cases/statistics
   */
  @Get('statistics')
  async getArbitrationStatistics(): Promise<{
    totalCases: number;
    pendingCases: number;
    arbitratedCases: number;
    ignoredCases: number;
    averageProcessingTime: number;
  }> {
    return this.arbitrationService.getArbitrationStatistics();
  }

  /**
   * 批量忽略案件
   * POST /api/v1/admin/arbitration-cases/batch-ignore
   */
  @Post('batch-ignore')
  @HttpCode(HttpStatus.OK)
  async batchIgnoreCases(
    @Body() body: { caseIds: string[]; reason?: string }
  ): Promise<{ message: string; processedCount: number }> {
    const { caseIds, reason } = body;

    if (!caseIds || caseIds.length === 0) {
      throw new Error('案件ID列表不能为空');
    }

    let processedCount = 0;
    const errors: string[] = [];

    for (const caseId of caseIds) {
      try {
        await this.arbitrationService.updateArbitrationCaseStatus(caseId, {
          status: 'IGNORED',
          reason
        });
        processedCount++;
      } catch (error) {
        errors.push(`案件 ${caseId}: ${error.message}`);
      }
    }

    return {
      message: `批量处理完成，成功处理 ${processedCount} 个案件${errors.length > 0 ? `，失败 ${errors.length} 个` : ''}`,
      processedCount
    };
  }

  /**
   * 获取高优先级案件
   * GET /api/v1/admin/arbitration-cases/high-priority
   */
  @Get('high-priority')
  async getHighPriorityCases(
    @Query('limit') limit: number = 10
  ): Promise<ArbitrationCaseListResponse> {
    return this.arbitrationService.getArbitrationCases({
      status: 'PENDING_HUMAN',
      sortBy: 'priority_score',
      sortOrder: 'DESC',
      limit: Math.min(limit, 50) // 限制最大数量
    });
  }

  /**
   * 获取待处理案件数量
   * GET /api/v1/admin/arbitration-cases/pending-count
   */
  @Get('pending-count')
  async getPendingCasesCount(): Promise<{ count: number }> {
    const stats = await this.arbitrationService.getArbitrationStatistics();
    return { count: stats.pendingCases };
  }
}
