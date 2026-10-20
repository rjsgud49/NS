import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { GenerateRequest } from '@ns/shared';
import { GeneratorService } from './generator.service';
import { sanitizeDownloadName } from './services/zip-path';
import { validateProjectConfig } from './validate-config';

@Controller('generate')
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}

  @Post('preview')
  preview(@Body() body: GenerateRequest) {
    return this.generatorService.getFileTree(validateProjectConfig(body?.config));
  }

  @Post('download')
  async download(@Body() body: GenerateRequest, @Res() res: Response) {
    const config = validateProjectConfig(body?.config);
    const zipBuffer = await this.generatorService.generateZip(config);
    const filename = sanitizeDownloadName(config.name);

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': zipBuffer.length,
    });
    res.end(zipBuffer);
  }
}
