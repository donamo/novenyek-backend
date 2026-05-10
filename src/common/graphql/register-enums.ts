import { registerEnumType } from '@nestjs/graphql';
import {
  AiConfidence,
  AiProvider,
  HumidityLevel,
  LightLevel,
  OverallStatus,
  PestSuspicion,
  PlantEventType,
  PlantSize,
  PlantStatus,
  RoomOrientation,
} from '@prisma/client';

registerEnumType(RoomOrientation, { name: 'RoomOrientation' });
registerEnumType(LightLevel, { name: 'LightLevel' });
registerEnumType(HumidityLevel, { name: 'HumidityLevel' });
registerEnumType(PlantSize, { name: 'PlantSize' });
registerEnumType(PlantStatus, { name: 'PlantStatus' });
registerEnumType(PlantEventType, { name: 'PlantEventType' });
registerEnumType(OverallStatus, { name: 'OverallStatus' });
registerEnumType(PestSuspicion, { name: 'PestSuspicion' });
registerEnumType(AiProvider, { name: 'AiProvider' });
registerEnumType(AiConfidence, { name: 'AiConfidence' });
