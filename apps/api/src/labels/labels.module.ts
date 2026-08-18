import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Label } from './entities/label.entity';
import { LabelsService } from './labels.service';
import { LabelsController } from './labels.controller';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Label]), PermissionsModule],
  providers: [LabelsService],
  controllers: [LabelsController],
})
export class LabelsModule {}
