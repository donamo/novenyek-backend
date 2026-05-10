import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(ownerUserId: string) {
    return this.prisma.room.findMany({
      where: { ownerUserId },
      orderBy: [{ name: 'asc' }],
      include: { _count: { select: { plants: true } } },
    });
  }

  async findOne(ownerUserId: string, id: string) {
    const room = await this.prisma.room.findFirst({
      where: { id, ownerUserId },
      include: { _count: { select: { plants: true } } },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  create(ownerUserId: string, input: CreateRoomDto) {
    return this.prisma.room.create({ data: { ...input, ownerUserId } });
  }

  async update(ownerUserId: string, id: string, input: UpdateRoomDto) {
    await this.ensureExists(ownerUserId, id);
    return this.prisma.room.update({ where: { id }, data: input });
  }

  async remove(ownerUserId: string, id: string) {
    await this.ensureExists(ownerUserId, id);
    await this.prisma.room.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensureExists(ownerUserId: string, id: string): Promise<void> {
    const room = await this.prisma.room.findFirst({
      where: { id, ownerUserId },
      select: { id: true },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }
  }
}
