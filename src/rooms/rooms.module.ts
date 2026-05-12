import { Module } from '@nestjs/common';
import { RoomsResolver } from './rooms.resolver';
import { RoomsService } from './rooms.service';

@Module({
  providers: [RoomsResolver, RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
