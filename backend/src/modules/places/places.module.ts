import { Module } from '@nestjs/common';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';
import { MapLinkService } from './map-link.service';
import { PhotonProvider } from './photon.provider';

@Module({
  controllers: [PlacesController],
  providers: [PlacesService, MapLinkService, PhotonProvider],
  exports: [PlacesService, MapLinkService],
})
export class PlacesModule {}
