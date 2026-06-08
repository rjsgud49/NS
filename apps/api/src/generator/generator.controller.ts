import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { GenerateRequest } from '@ns/shared';
import { GeneratorService } from './generator.service';

@Controller('generate')
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}

  @Post('preview')
  preview(@Body() body: GenerateRequest) {
    return this.generatorService.getFileTree(body.config);
  }

  @Post('download')
  async download(@Body() body: GenerateRequest, @Res() res: Response) {
    const zipBuffer = await this.generatorService.generateZip(body.config);
    const filename = `${body.config.name || 'project'}.zip`;

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': zipBuffer.length,
    });
    res.end(zipBuffer);
  }
}
