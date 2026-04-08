import { PrismaModule } from '@ghostfolio/api/services/prisma/prisma.module';

import { Module } from '@nestjs/common';

import { CellMappingLegacyController } from './cell-mapping-legacy.controller';
import { K1BoxDefinitionController } from './k1-box-definition.controller';
import { K1BoxDefinitionService } from './k1-box-definition.service';

@Module({
  controllers: [CellMappingLegacyController, K1BoxDefinitionController],
  exports: [K1BoxDefinitionService],
  imports: [PrismaModule],
  providers: [K1BoxDefinitionService]
})
export class K1BoxDefinitionModule {}
