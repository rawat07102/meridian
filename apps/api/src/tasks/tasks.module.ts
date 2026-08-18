import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { TasksController } from './tasks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task]), PermissionsModule],
  providers: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}
