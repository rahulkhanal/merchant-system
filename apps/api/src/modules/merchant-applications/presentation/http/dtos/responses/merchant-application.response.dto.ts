import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OwnerInfoResponseDto } from './owner-info.response.dto.js';

export class MerchantApplicationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) createdById!: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) assignedReviewerId!: string | null;
  @ApiProperty({ enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'INFO_REQUESTED'] }) status!: string;
  @ApiPropertyOptional({ enum: ['PENDING', 'APPROVED', 'FLAGGED', 'REJECTED', 'FAILED'], nullable: true }) riskStatus!: string | null;
  @ApiProperty() submissionCount!: number;
  @ApiPropertyOptional({ nullable: true }) businessName!: string | null;
  @ApiPropertyOptional({ nullable: true }) legalBusinessName!: string | null;
  @ApiPropertyOptional({ nullable: true }) businessType!: string | null;
  @ApiPropertyOptional({ nullable: true }) country!: string | null;
  @ApiPropertyOptional({ nullable: true }) mcc!: string | null;
  @ApiPropertyOptional({ nullable: true }) monthlyVolume!: number | null;
  @ApiPropertyOptional({ type: OwnerInfoResponseDto, nullable: true }) ownerInfo!: OwnerInfoResponseDto | null;
  @ApiPropertyOptional({ nullable: true, description: 'Masked — last 4 digits only' }) bankAccountNumber!: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'Masked — last 4 digits only' }) routingNumber!: string | null;
  @ApiPropertyOptional({ nullable: true }) riskScore!: number | null;
  @ApiPropertyOptional({ type: [String], nullable: true }) riskReasons!: string[] | null;
  @ApiPropertyOptional({ nullable: true }) riskReference!: string | null;
  @ApiPropertyOptional({ type: Date, nullable: true }) riskCheckedAt!: Date | null;
  @ApiPropertyOptional({ type: Date, nullable: true }) submittedAt!: Date | null;
  @ApiPropertyOptional({ type: Date, nullable: true }) decidedAt!: Date | null;
  @ApiPropertyOptional({ nullable: true }) decisionNotes!: string | null;
  @ApiProperty({ type: Date }) createdAt!: Date;
  @ApiProperty({ type: Date }) updatedAt!: Date;
  @ApiProperty() version!: number;
}
