import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignReviewerDto {
  @ApiProperty({ format: 'uuid', description: 'ID of the REVIEWER user to assign' })
  @IsUUID()
  reviewerId!: string;
}
