# Data Model

This document is the canonical specification of Fathom's data model. Future TypeScript
interfaces, JSON schemas, APIs, and database designs are derived from it — never the
other way around. When a representation and this document disagree, this document wins
until it is deliberately amended.

The model is described conceptually. It is designed for the atlas Fathom intends to be
in ten years, not only for the first release: the first release populates a small part
of it (straits and what surrounds them), but nothing here should need to be unlearned
as coverage grows.

## Design principles

1. **Entities are facts about the world, not pages.** The model describes the maritime
   world; presentation, page structure, and navigation are derived from it and may
   change freely without touching the data.
2. **The atlas is a graph.** Relationships between entities are first-class, typed, and
   as important as the entities themselves. A strait that does not know which waters it
   connects is not yet data.
3. **Every claim is citable.** Sources are first-class records. Facts — especially
   numbers, dates, and disputed matters — carry their evidence with them.
4. **Identity is forever.** An entity's ID never changes and is never reused. Names,
   slugs, borders, and even classifications may change; identity does not.
5. **Localization is structural, not an afterthought.** Every human-readable value is
   localizable. Names are modeled richly enough to carry endonyms, exonyms, historical
   names, and disputed names without contortion.
6. **Uncertainty is representable.** Approximate dates, ranges, contested claims, and
   unknown values are expressible states, never silently flattened into false precision.
7. **Numbers are measurements, not decoration.** A quantity without a unit, a date, and
   a source does not belong in the dataset.
8. **Evolution is additive.** New fields and entity types may be added; the meaning of
   an existing field is never silently changed. Anything retired is deprecated, not
   repurposed.
9. **Neutrality by construction.** Where the world disagrees — names, sovereignty,
   boundaries — the model records the disagreement and its claimants rather than picking
   a side.

## Shared foundation

Every entity, regardless of type, carries a common core. The per-entity sections below
list only what is specific to each entity; the following is implied everywhere.

- **Identity** — a stable ID and a slug (see [Identity and stability](#identity-and-stability)).
- **Names** — a canonical name, plus any number of additional names, each qualified by
  language and script, and optionally by kind (official, endonym, exonym, historical,
  disputed) and period of use. Disputed names carry claimant context.
- **Summary and description** — a short summary suitable for a first glance, and a
  longer descriptive text for depth. Both localizable.
- **Tags** — any number of tags from the curated vocabulary.
- **Media** — any number of attached Images (and, in the future, other media kinds).
- **Sources** — the references supporting the entity's content. Publication requires at
  least one (see [Source attribution rules](#source-attribution-rules)).
- **Editorial state** — whether the entity is draft, published, or retired, and its
  revision history: who changed what, when, and why.

Geographic entities (Strait, Water Body, Canal, Island, Country, Region, Port, Bridge,
Tunnel, Infrastructure, Maritime Route) additionally carry **geometry**: a spatial representation
(point, line, or area) referenced from the entity rather than embedded in it, available
at more than one level of detail so the same entity can serve a world view and a close
view. The geometry format is deliberately unspecified here.

Relationships are typed, have a named inverse (a strait _connects_ water bodies; a water
body _is connected by_ straits), may be ordered where order matters (route waypoints,
the two sides of a strait), and may carry their own qualifiers and sources (a disputed
ownership relation cites the claim, not just the fact).

## Entity relationships

The maritime world, as Fathom models it:

- **Water Bodies are the nodes** of the graph — oceans at the top of a containment
  hierarchy, with seas, gulfs, and bays nested within them.
- **Straits and Canals are the edges** — the natural and artificial connections through
  which one water leads to another. This connective role is why the first release
  starts with straits: they are the joints of the maritime world.
- **Land gives the water its shape.** Countries and Islands border water bodies, flank
  straits, and host ports. Bridges and Tunnels are the places where land crosses water.
- **Ports are where land and sea meet** — anchored to a country and a water body.
- **Maritime Routes are paths through the graph** — ordered traversals of water bodies,
  straits, canals, and ports.
- **Infrastructure equips the water.** Lighthouses, wind farms, platforms, pipelines,
  cables, and monitoring stations are the fixed human presence in and beside the sea —
  distinct from the crossings and waterways that carry movement.
- **Organizations are the actors.** Authorities, agencies, and institutions administer
  ports and canals, operate infrastructure, publish sources, and sign the treaties that
  events record.
- **The knowledge layer annotates everything.** Images, Sources, Historical Events,
  Wildlife, Statistics, and Tags attach to the geographic core; they describe it and
  never alter its structure.

## Entities

### Strait

**Purpose.** A naturally formed narrow passage of water connecting two larger water
bodies and separating two areas of land. Straits are Fathom's founding entity and the
connective tissue of the atlas.

Required:

- Canonical name
- The water bodies it connects (at least two)
- The landmasses it separates (at least two: countries and/or islands)
- Summary

Optional:

- Dimensions: length, minimum and maximum width, minimum depth of the navigable channel
  (each as a sourced measurement)
- Navigational and strategic significance, including chokepoint status
- Passage regime (e.g., whether an international passage regime applies), with sources
- Known hazards and notable conditions (currents, fog, ice, traffic density)
- Historical names and former classifications

Relationships:

- Connects two or more Water Bodies
- Separates two or more land entities (Country, Island)
- Bordered by one or more Countries
- Crossed by Bridges and Tunnels
- Traversed by Maritime Routes
- Grouped into Regions; annotated by Events, Wildlife, Statistics, Images, Tags

### Water Body

**Purpose.** A named body of water: ocean, sea, gulf, bay, bight, sound, lagoon,
estuary, or fjord. Water bodies form the containment hierarchy within which everything
else is located.

Required:

- Canonical name
- Type, from a controlled list of water body kinds
- Parent water body (required for everything except oceans)
- Summary

Optional:

- Surface area, average and maximum depth, salinity character (as sourced measurements)
- Notable oceanographic character (currents, tides, seasonal ice), as descriptive text
  until such phenomena become entities of their own

Relationships:

- Contains child Water Bodies; contained by a parent
- Connected to other Water Bodies via Straits and Canals
- Bordered by Countries; contains Islands; hosts Ports
- Traversed by Maritime Routes; grouped into Regions

### Canal

**Purpose.** An artificial navigable waterway connecting water bodies — the man-made
counterpart of a strait.

Required:

- Canonical name
- The water bodies it connects (at least two)
- The countries it passes through (at least one)
- Operational status (e.g., planned, under construction, operational, closed, abandoned)
- Summary

Optional:

- Dimensions: length, width, depth, maximum permitted vessel size (sourced measurements)
- Number and arrangement of locks
- Opening date; major reconstruction dates
- Transit conditions (tolls, convoy systems, restrictions), descriptively

Relationships:

- Connects two or more Water Bodies
- Located in one or more Countries
- Administered or operated by an Organization
- Crossed by Bridges and Tunnels
- Traversed by Maritime Routes; annotated by the knowledge layer

### Island

**Purpose.** A body of land surrounded by water. Islands shape straits, host ports and
crossings, and are often the very land a strait separates.

Required:

- Canonical name
- The water body in which it lies
- Sovereignty status: the country it belongs to, a disputed status with claimants, or
  explicitly unclaimed/uninhabited
- Summary

Optional:

- Membership in an island group or archipelago
- Area and population (as sourced measurements)
- Notable physical character (volcanic, coral, tidal)

Relationships:

- Located in a Water Body
- Belongs to (or is claimed by) one or more Countries
- Flanks Straits; connected by Bridges and Tunnels; hosts Ports
- Member of island groups and Regions

### Country

**Purpose.** A sovereign state or, where relevant to the maritime world, a dependent
territory. Countries appear in Fathom for their coasts, waters, ports, and claims — not
as general-purpose encyclopedia entries.

Required:

- Canonical short name
- Standard country code where one is assigned
- Summary focused on the country's maritime character

Optional:

- Official long name
- Coastline length (as a sourced measurement)
- Maritime claims (territorial sea, exclusive economic zone), descriptively and with
  sources
- Flag imagery, via the media layer

Relationships:

- Borders Water Bodies and Straits
- Owns, administers, or claims Islands (claims carry claimant context and sources)
- Hosts Ports; traversed by Canals; connected by Bridges and Tunnels
- Member of Regions

### Region

**Purpose.** A curated grouping of entities that belong together geographically,
culturally, or thematically — "the Baltic", "the Strait-dense waters of Southeast
Asia", "the Arctic". Regions exist for orientation and browsing; they assert curation,
not hydrology.

Required:

- Canonical name
- A definition: what the region includes and by what rationale
- Its member entities (at least one)

Optional:

- Parent region, where a hierarchy is genuinely helpful
- A representative extent (geometry) for display

Relationships:

- Contains entities of any geographic type
- May nest within a parent Region

### Port

**Purpose.** A harbor or port town where land and sea meet — a place ships call, cargo
moves, and straits and routes acquire their human meaning.

Required:

- Canonical name
- The country it belongs to
- The water body (or strait or canal) it opens onto
- Summary

Optional:

- Standard port code where one is assigned
- Harbor character (natural, artificial, river port)
- Functions: cargo, container, ferry, cruise, fishing, naval
- Founding or opening dates
- Traffic and throughput, via Statistics

Relationships:

- Located in a Country; optionally on an Island
- Opens onto a Water Body, Strait, or Canal
- Administered by a port authority (an Organization)
- Called at by Maritime Routes; annotated by the knowledge layer

### Maritime Route

**Purpose.** A named path across the water: a trade lane, a ferry link, a historical
voyage corridor, or a canal transit route. Routes turn the atlas's graph into journeys.

Required:

- Canonical name
- Route type, from a controlled list (e.g., trade lane, ferry link, historical route)
- An ordered sequence of waypoints, each a reference to a Port, Strait, Canal, or Water
  Body
- Summary

Optional:

- Active period (for historical routes, when it operated; approximate dates allowed)
- Typical cargo or purpose
- Distance and typical transit time (as sourced measurements)
- Seasonal variations and constraints

Relationships:

- Passes through Water Bodies, Straits, and Canals; calls at Ports (all ordered)
- Designated or regulated by an Organization, where one is on record
- Grouped into Regions; annotated by the knowledge layer

### Bridge

**Purpose.** A fixed crossing over water. Bridges mark where the land's network crosses
the sea's, and their clearance shapes what can sail beneath.

Required:

- Canonical name
- The water feature it crosses (Strait, Canal, or Water Body)
- The land entities it connects (at least two)
- Status (planned, under construction, operational, closed, demolished)
- Summary

Optional:

- Total length and main span (sourced measurements)
- Vertical clearance for shipping (a sourced measurement of particular importance)
- Structural type; opening date; operator (an Organization)

Relationships:

- Crosses a Strait, Canal, or Water Body
- Connects Countries and/or Islands
- Annotated by the knowledge layer

### Tunnel

**Purpose.** A fixed crossing under water — the bridge's counterpart beneath the seabed.

Required:

- Canonical name
- The water feature it passes under (Strait, Canal, or Water Body)
- The land entities it connects (at least two)
- Status (planned, under construction, operational, closed)
- Summary

Optional:

- Length and maximum depth below the surface (sourced measurements)
- Mode: rail, road, mixed, utility
- Opening date; operator (an Organization)

Relationships:

- Passes under a Strait, Canal, or Water Body
- Connects Countries and/or Islands
- Annotated by the knowledge layer

### Infrastructure

**Purpose.** A fixed human-made installation in, on, or beside the sea that is not a
crossing or a waterway: lighthouses, wind farms, offshore platforms, pipelines,
submarine cables, radar and traffic-monitoring stations, breakwaters. One entity with a
type field is deliberately chosen over separate entities per kind, so that new kinds of
installation never require a model change. Bridges and Tunnels remain distinct entities
because their connective role gives them different relationships.

Required:

- Canonical name
- Infrastructure type, from a controlled, extensible list (e.g., lighthouse, wind farm,
  offshore platform, pipeline, submarine cable, radar station, breakwater)
- At least one locating relationship: the water body, strait, canal, island, or country
  where it stands or through which it runs
- Status (planned, under construction, operational, decommissioned, removed)
- Summary

Optional:

- Type-appropriate characteristics as sourced measurements (light range and height for a
  lighthouse; generating capacity for a wind farm; length and diameter for a pipeline)
- Construction and commissioning dates
- What it serves or protects (a port approach, a strait's traffic lanes), descriptively

Relationships:

- Located in or running through Water Bodies, Straits, Canals, Islands, and Countries
- Owned or operated by Organizations
- Serves Ports, Straits, and Maritime Routes
- Annotated by the knowledge layer

### Organization

**Purpose.** A body with agency in the maritime world: international organizations and
alliances (IMO, NATO, EU), national agencies and hydrographic offices, port and canal
authorities (the Suez Canal Authority), operators and research institutions.
Organizations are the actors of the atlas — they administer, regulate, build, publish,
and sign. Unlike geographic entities, they carry no geometry.

Required:

- Canonical name
- Organization type, from a controlled list (e.g., intergovernmental organization,
  alliance or bloc, national agency, port or canal authority, company or operator,
  research institution, non-governmental organization)
- Summary

Optional:

- Founding date; dissolution date for organizations that no longer exist
- Headquarters country
- Parent organization (a port authority within a ministry; an agency within a wider
  system)
- Official website

Relationships:

- Administers or operates Ports, Canals, Bridges, Tunnels, and Infrastructure
- Has member Countries (for intergovernmental bodies and alliances)
- Publishes or issues Sources
- Designates or regulates Maritime Routes
- Party to Historical Events (treaties, foundings, disputes)
- Annotated by the knowledge layer

### Image

**Purpose.** A visual record — photograph, historical chart, map extract, illustration
— attached to the entities it depicts. Images are metadata records; the binary files
they describe live in the media store (see [Media organization](#media-organization)).

Required:

- Reference to the underlying media file
- License, from the set of licenses compatible with open distribution
- Credit: author or rights holder as they are to be displayed
- Alternative text describing the image for accessibility

Optional:

- Caption (localizable)
- Capture date and location
- Provenance: the Source the image was obtained from
- Display hints: role (e.g., representative image, gallery, historical), focal point

Relationships:

- Depicts one or more entities of any type (required at publication)
- Obtained from a Source

### Source / Reference

**Purpose.** A citable origin of knowledge: a book, paper, official publication,
hydrographic office product, dataset, or website. Sources are what make the atlas
trustworthy; they are shared records, cited from anywhere, never duplicated inline.

Required:

- Source type, from a controlled list (book, journal article, official publication,
  chart, dataset, website, institution)
- Title
- Author or publisher
- A locator appropriate to the type: URL, ISBN, DOI, chart number, or archive reference
- For online sources: the date the source was last accessed

Optional:

- Publication date and edition
- Language
- License or terms governing reuse of its content
- A link to an archived copy, guarding against link rot

Relationships:

- Cited by any entity, any relationship, and any individual measurement
- Published or issued by an Organization, where one is on record

### Historical Event

**Purpose.** A dated occurrence anchored to maritime geography: a battle in a strait, a
canal's opening, a treaty, a wreck, an expedition. Events give the atlas its memory.

Required:

- Canonical name
- Date, date range, or approximate date (uncertainty is expressible, e.g., "circa")
- Summary
- At least one involved geographic entity

Optional:

- Category, from a controlled list (battle, treaty, disaster, expedition, construction,
  discovery, other)
- Participants and outcome, descriptively
- Related events (part of a larger conflict; preceded or caused by)

Relationships:

- Involves one or more geographic entities
- Involves Organizations (signatories, builders, belligerents)
- Relates to other Historical Events
- Annotated by Images, Sources, Tags

### Wildlife

**Purpose.** A species or ecological community characteristic of particular waters —
the living dimension of the atlas.

Required:

- Common name
- Scientific name
- Summary
- At least one habitat association with a geographic entity

Optional:

- Broad category (mammal, fish, bird, reptile, invertebrate, plant, community)
- Conservation status, with the assessment's source and date
- Seasonality and migration notes, including which waters at which times

Relationships:

- Inhabits or frequents Water Bodies, Straits, Regions, and Islands
- Annotated by Images, Sources, Tags

### Statistics

**Purpose.** Not a page-like entity but the atlas's mechanism for quantitative claims.
A statistic is a single measured or estimated value about one entity at one time —
ship transits per year through a strait, tonnage through a port, a measured depth.
Series emerge from statistics that share a subject and a metric.

Required:

- The subject entity
- The metric, from a controlled and documented vocabulary
- The value with its unit
- The time point or period the value describes
- The Source of the value

Optional:

- Method or basis (measured, estimated, modeled)
- Stated uncertainty or precision
- Notes on comparability (e.g., a counting methodology change between years)

Relationships:

- Describes exactly one entity; cites at least one Source

### Tags

**Purpose.** Cross-cutting labels that group entities across types — "chokepoint",
"UNESCO-listed", "polar", "historic trade". Tags are a curated vocabulary, not
free-form keywords: each tag is itself a small record with a definition, so that a tag
means the same thing everywhere it appears.

Required:

- Label
- Definition: what the tag means and when it applies

Optional:

- Localized labels
- Related tags

Relationships:

- Applied to any number of entities of any type

## Identity and stability

### Stable IDs

Every entity has exactly one ID, assigned at creation and never changed thereafter.

- IDs are globally unique across the whole atlas and are **never reused**, even after an
  entity is retired.
- An ID is composed of the entity's type and a short token derived from the canonical
  name at the moment of creation — readable enough to be workable (`strait:gibraltar`),
  but carrying **no promise of meaning**: if the entity is later renamed, the ID stays.
  The ID is a key, not a label.
- Tokens use only lowercase letters, digits, and hyphens.
- When two entities are found to be duplicates, one survives and the other is retired
  with a permanent redirect to the survivor. Retired IDs resolve forever.

### Slugs

Slugs are the human-facing, URL-facing counterpart of IDs.

- A slug is unique within its entity type, lowercase, hyphen-separated, and derived from
  the canonical name.
- Unlike IDs, slugs **may change** when an entity is renamed — but every slug an entity
  has ever had remains reserved and redirects to the current one. Links into the atlas
  must never rot.
- Slugs may be localized in the future (one slug per language); the model reserves that
  possibility, and per-language slugs will follow the same permanence rule.

## Versioning philosophy

Two things version independently: the model and the content.

**The model** (this specification and everything derived from it) versions like an
interface. Additions — new entity types, new optional fields, new relationship types —
are minor and expected. Changes to the meaning of anything that exists are major, rare,
deliberate, and shipped with a migration path. A field is never repurposed; if the
meaning must change, a new field is introduced and the old one is deprecated, documented,
and eventually retired.

**The content** versions like an edition of record:

- Every change to every entity is recorded: what changed, when, by whom, and why.
  Contested or surprising edits must be explainable from the record alone.
- The atlas is published in dated editions, so that a citation of Fathom can name the
  edition it consulted and remain verifiable later.
- Nothing is hard-deleted. Entities are retired with a stated reason and, where
  appropriate, a redirect; their history remains part of the record.

## Deprecation policy

Retirement is a process, never an event. Once schemas, APIs, and exports exist, someone
somewhere depends on every field.

- **Nothing is removed without at least one full release cycle of deprecation.** A
  field, entity type, relationship type, or metric is first marked deprecated — in this
  specification and in every derived representation — with its replacement (if any) and
  migration guidance stated at the point of deprecation.
- **Deprecated means still working.** During the deprecation window, deprecated fields
  continue to be populated and served, so existing consumers keep functioning while they
  migrate.
- **Documentation outlives the window.** Deprecated fields remain documented until all
  known consumers have migrated. After removal, the field's history — what it meant,
  when it was removed, what replaced it — moves to the model's change log rather than
  disappearing.
- **Identity is exempt.** IDs and slugs are permanent commitments and are never subject
  to deprecation or removal (see [Identity and stability](#identity-and-stability)).
- **The same policy binds future APIs.** Any public API derived from this model inherits
  these rules; endpoints and response fields get the same one-cycle courtesy as the data
  fields beneath them.

## Localization strategy

- **English is the language of record.** Every entity's canonical content exists in
  English first; an entity is publishable in English alone.
- **Every human-readable value is localizable** — names, summaries, descriptions,
  captions, tag labels, metric labels. Structured values (measurements, dates, codes,
  IDs) are locale-independent and are formatted at presentation time.
- **Names deserve more than translation.** The name model carries each name's language
  and script, its kind (official, endonym, exonym, historical, disputed), and its period
  of use. A strait may simultaneously hold a canonical English name, official names in
  the languages of its shores, historical names with eras, and disputed names with
  claimant context. Presentation policy for disputed names is editorial and neutral;
  the data's job is to carry all of them faithfully.
- **Fallback is explicit.** A reader in any language sees their language where content
  exists and English where it does not — never a gap.
- Language identification follows the established standard tags for identifying
  languages; measurements are stored in metric units and converted at presentation.

## Media organization

- **Records and files are separate.** The dataset holds Image records (metadata,
  licensing, relationships); binary files live in a media store, referenced by the
  record. The data repository never becomes an image dump.
- **Files are addressed by immutable media identifiers**, not by the entities that use
  them — entities get renamed, and a file may depict several entities. No file path
  encodes a slug.
- **Originals are immutable.** The stored original is never edited in place; a
  corrected or re-processed version is a new file, and the record's history says so.
  Display sizes and crops are derived on demand and are never the source of truth.
- **Licensing gates inclusion.** A file without a license and credit compatible with
  open distribution does not enter the media store, regardless of how good the picture
  is.
- The same organization is intended to extend to future media kinds (video, audio,
  scanned charts, 3D bathymetry) without structural change.

## Source attribution rules

1. **No unsourced publication.** Every published entity cites at least one Source.
   Draft entities may be incomplete; published ones may not be unsupported.
2. **Numbers are individually sourced.** Every Statistic, every dimension, every date of
   record carries its own citation — not a general pointer at the bottom of the page.
3. **Images always credit.** License and credit are required fields, and both are
   surfaced to readers wherever the image appears, never buried in metadata.
4. **Source quality is ranked.** Official hydrographic, governmental, and scientific
   publications outrank reputable secondary works, which outrank tertiary summaries.
   Tertiary sources alone are not sufficient basis for a published factual claim.
5. **Disagreement is recorded, not resolved by deletion.** When credible sources
   conflict, the entity records the conflict, cites both, and states which value is
   presented and why.
6. **Attribution must survive reuse.** Because the atlas is open, source and credit
   information travels with the data — any derived schema, API, or export must be able
   to carry it.
7. **No circular sourcing.** Works that derive their facts from Fathom are not valid
   sources for Fathom.

## Open questions

- **Wide channels.** Some named waters (e.g., broad channels between an island and a
  mainland) sit between "strait" and "water body". The working rule — if its defining
  role is connective, it is a Strait; otherwise a Water Body — needs testing against
  real cases during the first release.
- **Future phenomena entities.** Ocean currents and maritime boundaries are named in
  the project scope but are deliberately not yet modeled; each will get an entity
  definition here before any data is created. (Undersea cables and lighthouses,
  once on this list, are now covered as Infrastructure types.)
- **Metric vocabulary.** The controlled vocabulary for Statistics metrics (names, units,
  definitions) needs its own reference document once the first metrics are chosen.
- **Region overlap.** Whether regions may overlap freely or should form a loose
  hierarchy will be decided after the first curated regions exist.
