/**
 * @fathom/data — shared domain data and types.
 *
 * Strait data lives as one JSON document per strait in `./straits/`;
 * knowledge-layer collections (sources, images, events, wildlife,
 * statistics, tags) live in `./knowledge/`. Everything is described by
 * the Zod schemas in `./schema` (the code form of docs/DATA_MODEL.md)
 * and served through validated, memoized loaders.
 */

// Schemas and inferred types
export {
  BridgeSchema,
  CanalSchema,
  CountriesIndexSchema,
  CountryIndexEntrySchema,
  CountrySchema,
  ENTITY_TYPES,
  DateValueSchema,
  EditorialStatusSchema,
  EntityRefSchema,
  EntityTypeSchema,
  HistoricalEventSchema,
  ImageSchema,
  MeasurementSchema,
  NameSchema,
  STRAIT_REGIONS,
  SlugSchema,
  WATER_BODY_TYPES,
  WaterBodiesIndexSchema,
  WaterBodyIndexEntrySchema,
  WaterBodySchema,
  WaterBodyTypeSchema,
  SourceSchema,
  StatisticSchema,
  StraitDimensionsSchema,
  StraitIndexEntrySchema,
  StraitRegionSchema,
  StraitSchema,
  IslandSchema,
  MaritimeRouteSchema,
  PortSchema,
  StraitsIndexSchema,
  StructureStatusSchema,
  TagSchema,
  TunnelSchema,
  TokenSchema,
  WildlifeSchema,
  entityId,
  parseEntityId,
} from './schema';
export type {
  Bridge,
  Canal,
  CountriesIndex,
  Country,
  CountryIndexEntry,
  DateValue,
  EditorialStatus,
  EntityRef,
  EntityType,
  HistoricalEvent,
  Image,
  Measurement,
  Name,
  Source,
  Statistic,
  Island,
  MaritimeRoute,
  Port,
  Strait,
  StraitDimensions,
  StructureStatus,
  Tunnel,
  StraitIndexEntry,
  StraitRegion,
  StraitsIndex,
  Tag,
  WaterBodiesIndex,
  WaterBody,
  WaterBodyIndexEntry,
  WaterBodyType,
  Wildlife,
} from './schema';

// Strait loaders
export { loadAllStraits, loadStrait, loadStraitsIndex } from './loader';

// Country loaders
export { loadAllCountries, loadCountriesIndex, loadCountry } from './countries';

// Maritime entity loaders
export {
  loadBridges,
  loadCanals,
  loadIslands,
  loadMaritimeRoutes,
  loadPorts,
  loadTunnels,
} from './maritime';

// Water body loaders
export { loadAllWaterBodies, loadWaterBodiesIndex, loadWaterBody } from './water-bodies';

// Knowledge-layer loaders
export {
  loadHistoricalEvents,
  loadImages,
  loadSources,
  loadStatistics,
  loadTags,
  loadWildlife,
} from './entities';

// Geography utilities
export { distanceKm, nearestStraits } from './geo';

// Relationship engine
export { getChildren, getEntity, getParents, getRelated, getStraitEntity } from './engine';
export type { EntityDataMap, EntityNode, NodeType, RelationshipMap } from './engine';
export { connectedWaterBodyNames, slugifyName } from './derived';
export type { RegionEntity } from './derived';
export { findBrokenReferences, loadAtlasDataset } from './integrity';
export type { AtlasDataset, BrokenReference } from './integrity';

// Utilities
export { validateEntity } from './validate';
export type { ValidationResult } from './validate';
export {
  loadImagesFor,
  loadSourcesFor,
  loadStatisticsFor,
  resolveRef,
  resolveRefs,
} from './resolve';
export type { ResolvedEntity } from './resolve';
