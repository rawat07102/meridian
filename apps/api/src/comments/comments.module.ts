import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Task } from 'src/tasks/entities/task.entity';
import { Project } from 'src/projects/entities/project.entity';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { Comment } from './entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Task, Project]), PermissionsModule],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}
