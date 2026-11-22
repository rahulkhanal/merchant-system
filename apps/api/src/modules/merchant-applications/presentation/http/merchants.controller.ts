import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiAcceptedResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../identity/decorators/current-user.decorator.js';
import { JwtGuard } from '../../../identity/guards/jwt.guard.js';
import { RolesGuard } from '../../../identity/guards/roles.guard.js';
import { Roles } from '../../../identity/decorators/roles.decorator.js';
import { Role } from '../../../identity/domain/role.enum.js';
import type { JwtPayload } from '../../../identity/infrastructure/strategies/jwt.strategy.js';
import { CreateApplicationUseCase } from '../../application/use-cases/create-application.use-case.js';
import { GetApplicationUseCase } from '../../application/use-cases/get-application.use-case.js';
import { ListApplicationsUseCase } from '../../application/use-cases/list-applications.use-case.js';
import { SubmitApplicationUseCase } from '../../application/use-cases/submit-application.use-case.js';
import { UpdateApplicationUseCase } from '../../application/use-cases/update-application.use-case.js';
import { RecordDecisionUseCase } from '../../application/use-cases/record-decision.use-case.js';
import { AssignReviewerUseCase } from '../../application/use-cases/assign-reviewer.use-case.js';
import { RetryRiskUseCase } from '../../application/use-cases/retry-risk.use-case.js';
import { GetAuditLogsUseCase } from '../../../audit-log/application/use-cases/get-audit-logs.use-case.js';
import { FieldEncryptionService } from '../../infrastructure/services/field-encryption.service.js';
import { UpdateApplicationDto } from './dtos/update-application.dto.js';
import { RecordDecisionDto } from './dtos/record-decision.dto.js';
import { AssignReviewerDto } from './dtos/assign-reviewer.dto.js';
import { MerchantApplicationResponseDto } from './dtos/responses/merchant-application.response.dto.js';
import { AuditLogResponseDto } from './dtos/responses/audit-log.response.dto.js';
import { ApplicationStatus } from '../../domain/application-status.enum.js';

@ApiTags('merchants')
@ApiBearerAuth('access-token')
@Controller('merchants')
@UseGuards(JwtGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class MerchantsController {
  constructor(
    private readonly createUseCase: CreateApplicationUseCase,
    private readonly getUseCase: GetApplicationUseCase,
    private readonly listUseCase: ListApplicationsUseCase,
    private readonly updateUseCase: UpdateApplicationUseCase,
    private readonly submitUseCase: SubmitApplicationUseCase,
    private readonly recordDecisionUseCase: RecordDecisionUseCase,
    private readonly assignReviewerUseCase: AssignReviewerUseCase,
    private readonly retryRiskUseCase: RetryRiskUseCase,
    private readonly getAuditLogsUseCase: GetAuditLogsUseCase,
    private readonly encryption: FieldEncryptionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.SALES)
  @ApiOperation({ summary: 'Create a new draft application', description: 'Creates a blank merchant application in DRAFT status. Only SALES users can create applications.' })
  @ApiCreatedResponse({ type: MerchantApplicationResponseDto, description: 'Application created in DRAFT status' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  @ApiForbiddenResponse({ description: 'Requires SALES role' })
  async create(@CurrentUser() user: JwtPayload) {
    const app = await this.createUseCase.execute(user.sub);
    return this.encryption.maskApplication(app);
  }

  @Get()
  @Roles(Role.SALES, Role.REVIEWER, Role.ADMIN)
  @ApiOperation({
    summary: 'List applications (role-scoped, paginated)',
    description: 'Returns applications filtered by role:\n- **SALES**: own applications only\n- **REVIEWER**: all UNDER_REVIEW applications\n- **ADMIN**: all applications regardless of status or owner\n\nSupports pagination via `page` and `limit` and optional `status` filter.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)', example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: ApplicationStatus, description: 'Filter by application status' })
  @ApiOkResponse({ description: 'Paginated list of applications', schema: { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/MerchantApplicationResponseDto' } }, total: { type: 'number' }, page: { type: 'number' }, limit: { type: 'number' } } } })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ApplicationStatus,
  ) {
    const opts = {
      page: Math.max(1, parseInt(page ?? '1', 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20)),
      status,
    };
    const result = await this.listUseCase.execute(user.sub, user.role, opts);
    return {
      data: result.data.map((a) => this.encryption.maskApplication(a)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('audit-logs')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get audit log entries for an application', description: 'Returns the append-only audit trail for a merchant application. Requires ADMIN role.' })
  @ApiQuery({ name: 'entityId', required: true, description: 'Application UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ type: [AuditLogResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  async getAuditLogs(@Query('entityId') entityId: string) {
    return this.getAuditLogsUseCase.execute(entityId);
  }

  @Get(':id')
  @Roles(Role.SALES, Role.REVIEWER, Role.ADMIN)
  @ApiOperation({ summary: 'Get a single application', description: 'SALES users can only fetch their own applications. REVIEWER and ADMIN can fetch any application.' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Application ID' })
  @ApiOkResponse({ type: MerchantApplicationResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  @ApiForbiddenResponse({ description: 'Insufficient role or application belongs to another user' })
  @ApiNotFoundResponse({ description: 'Application not found' })
  async get(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const app = await this.getUseCase.execute(id, user.sub, user.role);
    return this.encryption.maskApplication(app);
  }

  @Patch(':id')
  @Roles(Role.SALES)
  @ApiOperation({ summary: 'Update draft application fields', description: 'Partially updates an application. Only the creator (SALES) can update. All fields are optional — only provided fields are changed.' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Application ID' })
  @ApiBody({ type: UpdateApplicationDto })
  @ApiOkResponse({ type: MerchantApplicationResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  @ApiForbiddenResponse({ description: 'Requires SALES role or application belongs to another user' })
  @ApiNotFoundResponse({ description: 'Application not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: UpdateApplicationDto,
  ) {
    const app = await this.updateUseCase.execute(id, user.sub, body);
    return this.encryption.maskApplication(app);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.ACCEPTED)
  @Roles(Role.SALES)
  @ApiOperation({
    summary: 'Submit application for KYB risk review',
    description: 'Transitions the application from DRAFT (or INFO_REQUESTED) to SUBMITTED, then enqueues an async KYB check. All required fields (businessName, legalBusinessName, businessType, country, mcc, monthlyVolume) must be filled before submitting.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Application ID' })
  @ApiAcceptedResponse({ type: MerchantApplicationResponseDto, description: 'Submitted — KYB check enqueued' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  @ApiForbiddenResponse({ description: 'Requires SALES role' })
  @ApiNotFoundResponse({ description: 'Application not found' })
  @ApiUnprocessableEntityResponse({ description: 'Application not in submittable status or missing required fields' })
  async submit(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const app = await this.submitUseCase.execute(id, user.sub);
    return this.encryption.maskApplication(app);
  }

  @Post(':id/decision')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.REVIEWER)
  @ApiOperation({
    summary: 'Record a reviewer decision (APPROVED / REJECTED / INFO_REQUESTED)',
    description: 'Records a decision on an application in UNDER_REVIEW status. INFO_REQUESTED sends the application back to the merchant for additional information. Decision and optional notes are written to the audit log.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Application ID' })
  @ApiBody({ type: RecordDecisionDto })
  @ApiOkResponse({ type: MerchantApplicationResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  @ApiForbiddenResponse({ description: 'Requires REVIEWER role' })
  @ApiNotFoundResponse({ description: 'Application not found' })
  @ApiUnprocessableEntityResponse({ description: 'Application is not in UNDER_REVIEW status' })
  async recordDecision(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: RecordDecisionDto,
  ) {
    const app = await this.recordDecisionUseCase.execute(id, user.sub, body.decision, body.notes);
    return this.encryption.maskApplication(app);
  }

  @Post(':id/reviewer')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign a reviewer to an application', description: 'Sets the assignedReviewerId on the application. Assignment is recorded in the audit log.' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Application ID' })
  @ApiBody({ type: AssignReviewerDto })
  @ApiOkResponse({ type: MerchantApplicationResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiNotFoundResponse({ description: 'Application not found' })
  async assignReviewer(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: AssignReviewerDto,
  ) {
    const app = await this.assignReviewerUseCase.execute(id, body.reviewerId, user.sub);
    return this.encryption.maskApplication(app);
  }

  @Post(':id/retry-risk')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Retry a failed KYB risk review', description: "Resets riskStatus from FAILED to PENDING and re-enqueues the KYB job. The application's riskStatus must currently be FAILED. Recorded in the audit log." })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Application ID' })
  @ApiOkResponse({ type: MerchantApplicationResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiNotFoundResponse({ description: 'Application not found' })
  @ApiUnprocessableEntityResponse({ description: 'Risk review is not in FAILED state' })
  async retryRisk(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const app = await this.retryRiskUseCase.execute(id, user.sub);
    return this.encryption.maskApplication(app);
  }
}
