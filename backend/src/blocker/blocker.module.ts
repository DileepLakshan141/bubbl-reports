import { Module } from '@nestjs/common';
import { BlockerService } from './blocker.service';

@Module({
  providers: [BlockerService],
})
export class BlockerModule {}
