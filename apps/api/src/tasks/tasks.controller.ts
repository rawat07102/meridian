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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ReorderTaskDto } from './dto/reorder-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('/projects/:projectId/tasks')
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(projectId, user.id, dto);
  }

  @Get('/projects/:projectId/tasks')
  findAllForProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.findAllForProject(projectId, user.id);
  }

  @Get('tasks/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.tasksService.findOne(id, user.id);
  }

  @Patch('tasks/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, user.id, dto);
  }

  @Delete('tasks/:id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.tasksService.remove(id, user.id);
  }

  @Patch('tasks/:id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.tasksService.updateStatus(id, user.id, dto);
  }

  @Patch('tasks/:id/reorder')
  reorder(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: ReorderTaskDto,
  ) {
    return this.tasksService.reorder(id, user.id, dto);
  }

  @Post('tasks/:id/assignees')
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: AssignTaskDto,
  ) {
    return this.tasksService.assign(id, user.id, dto.userId);
  }

  @Delete('tasks/:id/assignees/:userId')
  unassign(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.unassign(id, user.id, userId);
  }

  @Post('tasks/:id/labels/:labelId')
  attachLabel(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('labelId', ParseUUIDPipe) labelId: string,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.attachLabel(id, user.id, labelId);
  }

  @Delete('tasks/:id/labels/:labelId')
  detachLabel(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('labelId', ParseUUIDPipe) labelId: string,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.detachLabel(id, user.id, labelId);
  }
}
