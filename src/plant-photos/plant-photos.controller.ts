import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PlantPhotosService } from './plant-photos.service';

@Controller('uploads')
export class PlantPhotosController {
  constructor(private readonly plantPhotosService: PlantPhotosService) {}

  @Get('photos/:photoId')
  async getPhoto(
    @Param('photoId') photoId: string,
    @Res() response: Response,
  ) {
    const file = await this.plantPhotosService.getStoredImage(photoId, 'original');
    if (!file) {
      throw new NotFoundException('Photo not found');
    }

    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.send(file.buffer);
  }

  @Get('thumbnails/:photoId')
  async getThumbnail(
    @Param('photoId') photoId: string,
    @Res() response: Response,
  ) {
    const file = await this.plantPhotosService.getStoredImage(photoId, 'thumbnail');
    if (!file) {
      throw new NotFoundException('Photo thumbnail not found');
    }

    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.send(file.buffer);
  }
}
