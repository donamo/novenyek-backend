import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { EnabledUserGuard } from '../auth/guards/enabled-user.guard';
import { DeleteResponse } from '../common/graphql/models/delete-response.model';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomModel } from './models/room.model';
import { RoomsService } from './rooms.service';

@Resolver(() => RoomModel)
@UseGuards(EnabledUserGuard)
export class RoomsResolver {
  constructor(private readonly roomsService: RoomsService) {}

  @Query(() => [RoomModel])
  rooms(@CurrentUser() user: AuthenticatedUser) {
    return this.roomsService.findAll(user.id);
  }

  @Query(() => RoomModel)
  room(@CurrentUser() user: AuthenticatedUser, @Args('id', { type: () => ID }) id: string) {
    return this.roomsService.findOne(user.id, id);
  }

  @Mutation(() => RoomModel)
  createRoom(@CurrentUser() user: AuthenticatedUser, @Args('input') input: CreateRoomDto) {
    return this.roomsService.create(user.id, input);
  }

  @Mutation(() => RoomModel)
  updateRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateRoomDto,
  ) {
    return this.roomsService.update(user.id, id, input);
  }

  @Mutation(() => DeleteResponse)
  deleteRoom(@CurrentUser() user: AuthenticatedUser, @Args('id', { type: () => ID }) id: string) {
    return this.roomsService.remove(user.id, id);
  }
}
