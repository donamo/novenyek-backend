import { PartialType } from '@nestjs/graphql';
import { CreateRoomDto } from './create-room.dto';

import { InputType } from '@nestjs/graphql';

@InputType()
export class UpdateRoomDto extends PartialType(CreateRoomDto) {}
