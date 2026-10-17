import { RevalidateModule } from '@common/revalidate/revalidate.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ContentAdminController,
  ContentController,
} from './content.controller';
import {
  CoupleShowcaseRepository,
  FaqRepository,
  SiteStatRepository,
} from './content.repository';
import { ContentService } from './content.service';
import { CoupleShowcase } from './couple-showcase.entity';
import { Faq } from './faq.entity';
import { SiteStat } from './site-stat.entity';

@Module({
  imports: [
    RevalidateModule,
    TypeOrmModule.forFeature([Faq, CoupleShowcase, SiteStat]),
  ],
  controllers: [ContentController, ContentAdminController],
  providers: [
    ContentService,
    FaqRepository,
    CoupleShowcaseRepository,
    SiteStatRepository,
  ],
  exports: [ContentService],
})
export class ContentModule {}
