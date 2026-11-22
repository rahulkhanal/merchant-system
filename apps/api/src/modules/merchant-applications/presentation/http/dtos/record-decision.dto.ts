import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

enum DecisionType {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  INFO_REQUESTED = 'INFO_REQUESTED',
}

export class RecordDecisionDto {
  @ApiProperty({ enum: DecisionType, description: 'Decision to record on the application' })
  @IsEnum(DecisionType)
  decision!: 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED';

  @ApiPropertyOptional({ description: 'Optional notes explaining the decision' })
  @IsOptional()
  @IsString()
  notes?: string;
}
