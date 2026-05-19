import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { SystemHealthService } from './system-health.service';

@Controller()
export class SystemController {
  constructor(private readonly systemHealthService: SystemHealthService) {}

  @Get('health')
  async health(@Res({ passthrough: true }) response: Response) {
    const health = await this.systemHealthService.getHealth();

    response
      .status(health.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
      .set('Cache-Control', 'public, max-age=3');

    return health;
  }
}
