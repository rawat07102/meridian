import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('tasks/:taskId/comments')
  create(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(taskId, user.id, dto);
  }

  @Get('tasks/:taskId/comments')
  findAllForTask(@Param('taskId', ParseUUIDPipe) taskId: string, @CurrentUser() user: User) {
    return this.commentsService.findAllForTask(taskId, user);
  }

  @Patch('comments/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, user.id, dto);
  }

  @Delete('comments/:id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.commentsService.remove(id, user.id);
  }
}
