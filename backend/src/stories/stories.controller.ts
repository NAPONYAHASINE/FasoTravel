import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoriesService } from './stories.service';
import {
  CreateStoryDto,
  UpdateStoryDto,
  MarkViewedDto,
  CreateAdminStoryDto,
  UpdateAdminStoryDto,
} from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';

@ApiTags('Stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  /**
   * GET /stories — List all stories.
   */
  @Get()
  @Public()
  @ApiOperation({ summary: 'List all stories' })
  findAll() {
    return this.storiesService.findAll();
  }

  /**
   * POST /stories/upload — Upload story media (societe).
   */
  @Post('upload')
  @Roles(UserRole.OPERATOR_ADMIN, UserRole.RESPONSABLE, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload story media' })
  upload(
    @Body()
    body: {
      fileName: string;
      contentType: string;
      operatorId?: string;
    },
  ) {
    // Returns a pre-signed upload URL (delegated to service)
    return this.storiesService.getUploadUrl(
      body.fileName,
      body.contentType,
      body.operatorId,
    );
  }

  /**
   * GET /stories/active — Active, non-expired stories.
   */
  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Get active stories' })
  findActive() {
    return this.storiesService.findActive();
  }

  /**
   * GET /stories/viewed — Story IDs viewed by current user.
   */
  @Get('viewed')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my viewed story IDs' })
  getViewed(@CurrentUser('sub') userId: string) {
    return this.storiesService.getViewedStories(userId);
  }

  /**
   * GET /stories/:id — Story detail.
   */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get story by ID' })
  findOne(@Param('id') id: string) {
    return this.storiesService.findOne(id);
  }

  /**
   * POST /stories — Create a story (societe operator).
   */
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create operator story' })
  create(
    @CurrentUser('companyId') operatorId: string,
    @Body() dto: CreateStoryDto,
  ) {
    return this.storiesService.create(operatorId, dto);
  }

  /**
   * POST /stories/mark-viewed — Mark a story as viewed.
   */
  @Post('mark-viewed')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark story as viewed' })
  markViewed(@CurrentUser('sub') userId: string, @Body() dto: MarkViewedDto) {
    return this.storiesService.markViewed(userId, dto.storyId);
  }

  /**
   * PUT /stories/:id — Update a story.
   */
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update operator story' })
  update(
    @Param('id') id: string,
    @CurrentUser('companyId') operatorId: string,
    @Body() dto: UpdateStoryDto,
  ) {
    return this.storiesService.update(id, operatorId, dto);
  }

  /**
   * DELETE /stories/:id — Delete a story.
   */
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete operator story' })
  remove(
    @Param('id') id: string,
    @CurrentUser('companyId') operatorId: string,
  ) {
    return this.storiesService.remove(id, operatorId);
  }
}

// ========== ADMIN STORIES ==========
@ApiTags('Admin Stories')
@Controller('admin/stories')
@Roles(UserRole.SUPER_ADMIN)
export class AdminStoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all stories' })
  findAll() {
    return this.storiesService.findAllAdmin();
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: create story' })
  create(@Body() dto: CreateAdminStoryDto) {
    return this.storiesService.createAdminStory(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: update story' })
  update(@Param('id') id: string, @Body() dto: UpdateAdminStoryDto) {
    return this.storiesService.updateAdminStory(id, dto);
  }

  @Put(':id/publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: publish story' })
  publish(@Param('id') id: string) {
    return this.storiesService.publishStory(id);
  }

  @Put(':id/archive')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: archive story' })
  archive(@Param('id') id: string) {
    return this.storiesService.archiveStory(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: delete story' })
  remove(@Param('id') id: string) {
    return this.storiesService.removeAdminStory(id);
  }
}
