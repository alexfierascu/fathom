/**
 * The straits dataset, migrated verbatim from the legacy prototype
 * (legacy/fathom.html). Values must not drift from the prototype during
 * Milestone 1; later milestones evolve this data under docs/DATA_MODEL.md.
 */

export const STRAIT_REGIONS = [
  'Europe',
  'Middle East & Africa',
  'South & Southeast Asia',
  'East Asia & Oceania',
  'Americas & Arctic',
] as const;

export type StraitRegion = (typeof STRAIT_REGIONS)[number];

export interface Strait {
  readonly id: string;
  readonly name: string;
  readonly countries: readonly string[];
  readonly region: StraitRegion;
  readonly connects: string;
  readonly lat: number;
  readonly lon: number;
  readonly note: string;
}

/* prettier-ignore */
export const STRAITS: readonly Strait[] = [
  { id: 'gibraltar', name: 'Strait of Gibraltar', countries: ['Spain', 'Morocco'], region: 'Europe', connects: 'Atlantic Ocean ↔ Mediterranean Sea', lat: 35.95, lon: -5.59, note: 'Only 13 km wide at its narrowest; ships have crossed here since antiquity.' },
  { id: 'dover', name: 'Strait of Dover', countries: ['United Kingdom', 'France'], region: 'Europe', connects: 'English Channel ↔ North Sea', lat: 51.0, lon: 1.4, note: 'The narrowest point of the Channel — the far coast is visible on a clear day.' },
  { id: 'solent', name: 'The Solent', countries: ['United Kingdom'], region: 'Europe', connects: 'Separates the Isle of Wight from mainland England', lat: 50.78, lon: -1.3, note: 'Some of the busiest recreational sailing waters in the world.' },
  { id: 'messina', name: 'Strait of Messina', countries: ['Italy'], region: 'Europe', connects: 'Tyrrhenian Sea ↔ Ionian Sea', lat: 38.25, lon: 15.63, note: 'Separates Sicily from the mainland; home of the mythical Scylla and Charybdis.' },
  { id: 'bonifacio', name: 'Strait of Bonifacio', countries: ['France', 'Italy'], region: 'Europe', connects: 'Separates Corsica from Sardinia', lat: 41.31, lon: 9.18, note: 'A UNESCO-listed marine reserve known for treacherous currents.' },
  { id: 'otranto', name: 'Strait of Otranto', countries: ['Italy', 'Albania'], region: 'Europe', connects: 'Adriatic Sea ↔ Ionian Sea', lat: 40.1, lon: 19.0, note: 'The gateway between the Adriatic and the wider Mediterranean.' },
  { id: 'bosporus', name: 'Bosporus', countries: ['Turkey'], region: 'Europe', connects: 'Black Sea ↔ Sea of Marmara', lat: 41.12, lon: 29.07, note: 'Splits Istanbul in two; forms half of the Turkish Straits.' },
  { id: 'dardanelles', name: 'Dardanelles', countries: ['Turkey'], region: 'Europe', connects: 'Sea of Marmara ↔ Aegean Sea', lat: 40.15, lon: 26.4, note: 'Site of the WWI Gallipoli campaign.' },
  { id: 'kerch', name: 'Kerch Strait', countries: ['Russia', 'Ukraine'], region: 'Europe', connects: 'Black Sea ↔ Sea of Azov', lat: 45.33, lon: 36.5, note: 'Crossed by a bridge linking Russia to Crimea.' },
  { id: 'skagerrak', name: 'Skagerrak', countries: ['Norway', 'Denmark', 'Sweden'], region: 'Europe', connects: 'North Sea ↔ Kattegat', lat: 57.8, lon: 8.5, note: 'One of the busiest and saltiest shipping straits in the world.' },
  { id: 'kattegat', name: 'Kattegat', countries: ['Denmark', 'Sweden'], region: 'Europe', connects: 'Skagerrak ↔ Baltic approaches', lat: 57.0, lon: 11.3, note: 'A shallow, sandy sea between the Skagerrak and the Baltic.' },
  { id: 'oresund', name: 'Öresund', countries: ['Denmark', 'Sweden'], region: 'Europe', connects: 'Baltic Sea ↔ Kattegat', lat: 55.63, lon: 12.7, note: 'Crossed by the Öresund Bridge linking Copenhagen and Malmö.' },
  { id: 'hormuz', name: 'Strait of Hormuz', countries: ['Iran', 'Oman'], region: 'Middle East & Africa', connects: 'Persian Gulf ↔ Gulf of Oman', lat: 26.57, lon: 56.25, note: "Roughly a fifth of the world's oil supply passes through here." },
  { id: 'bab-el-mandeb', name: 'Bab-el-Mandeb', countries: ['Yemen', 'Djibouti', 'Eritrea'], region: 'Middle East & Africa', connects: 'Red Sea ↔ Gulf of Aden', lat: 12.58, lon: 43.33, note: "Arabic for 'Gate of Grief,' named for its dangerous currents." },
  { id: 'mozambique', name: 'Mozambique Channel', countries: ['Mozambique', 'Madagascar'], region: 'Middle East & Africa', connects: 'Indian Ocean passage', lat: -18.0, lon: 41.0, note: 'One of the widest straits on Earth, over 400 km across.' },
  { id: 'palk', name: 'Palk Strait', countries: ['India', 'Sri Lanka'], region: 'South & Southeast Asia', connects: 'Bay of Bengal ↔ Palk Bay', lat: 9.7, lon: 79.6, note: 'Too shallow for large ships; separates India from Sri Lanka.' },
  { id: 'malacca', name: 'Strait of Malacca', countries: ['Indonesia', 'Malaysia', 'Singapore'], region: 'South & Southeast Asia', connects: 'Andaman Sea ↔ South China Sea', lat: 2.5, lon: 101.0, note: "Carries roughly a quarter of the world's traded goods by sea." },
  { id: 'singapore', name: 'Singapore Strait', countries: ['Singapore', 'Indonesia', 'Malaysia'], region: 'South & Southeast Asia', connects: 'Malacca Strait ↔ South China Sea', lat: 1.2, lon: 103.8, note: 'One of the busiest shipping lanes on Earth.' },
  { id: 'sunda', name: 'Sunda Strait', countries: ['Indonesia'], region: 'South & Southeast Asia', connects: 'Java Sea ↔ Indian Ocean', lat: -5.9, lon: 105.9, note: 'Between Java and Sumatra, near the volcano Krakatoa.' },
  { id: 'lombok', name: 'Lombok Strait', countries: ['Indonesia'], region: 'South & Southeast Asia', connects: 'Java Sea ↔ Indian Ocean', lat: -8.45, lon: 115.7, note: 'Marks part of the Wallace Line dividing Asian and Australian wildlife.' },
  { id: 'makassar', name: 'Makassar Strait', countries: ['Indonesia'], region: 'South & Southeast Asia', connects: 'Java Sea ↔ Celebes Sea', lat: -2.0, lon: 118.0, note: 'Between Borneo and Sulawesi.' },
  { id: 'karimata', name: 'Karimata Strait', countries: ['Indonesia'], region: 'South & Southeast Asia', connects: 'South China Sea ↔ Java Sea', lat: -1.5, lon: 108.5, note: 'Between Sumatra and Borneo.' },
  { id: 'taiwan', name: 'Taiwan Strait', countries: ['China', 'Taiwan'], region: 'East Asia & Oceania', connects: 'East China Sea ↔ South China Sea', lat: 24.5, lon: 119.5, note: 'One of the most closely watched geopolitical flashpoints today.' },
  { id: 'luzon', name: 'Luzon Strait', countries: ['Taiwan', 'Philippines'], region: 'East Asia & Oceania', connects: 'Philippine Sea ↔ South China Sea', lat: 21.0, lon: 121.0, note: 'Includes the Bashi Channel, a major undersea cable route.' },
  { id: 'korea', name: 'Korea Strait', countries: ['South Korea', 'Japan'], region: 'East Asia & Oceania', connects: 'East China Sea ↔ Sea of Japan', lat: 34.0, lon: 129.0, note: "Separates the Korean Peninsula from Japan's Kyushu island." },
  { id: 'tsugaru', name: 'Tsugaru Strait', countries: ['Japan'], region: 'East Asia & Oceania', connects: 'Sea of Japan ↔ Pacific Ocean', lat: 41.5, lon: 140.5, note: 'Separates Honshu from Hokkaido; crossed by an undersea rail tunnel.' },
  { id: 'laperouse', name: 'La Pérouse Strait', countries: ['Japan', 'Russia'], region: 'East Asia & Oceania', connects: 'Sea of Japan ↔ Sea of Okhotsk', lat: 45.75, lon: 142.0, note: "Between Hokkaido and Russia's Sakhalin Island." },
  { id: 'torres', name: 'Torres Strait', countries: ['Australia', 'Papua New Guinea'], region: 'East Asia & Oceania', connects: 'Coral Sea ↔ Arafura Sea', lat: -10.3, lon: 142.2, note: 'Dotted with dozens of small islands between Cape York and New Guinea.' },
  { id: 'bass', name: 'Bass Strait', countries: ['Australia'], region: 'East Asia & Oceania', connects: 'Southern Ocean ↔ Tasman Sea', lat: -39.5, lon: 146.0, note: 'Separates the Australian mainland from Tasmania.' },
  { id: 'cook', name: 'Cook Strait', countries: ['New Zealand'], region: 'East Asia & Oceania', connects: 'Tasman Sea ↔ Pacific Ocean', lat: -41.3, lon: 174.5, note: "Notoriously rough waters between New Zealand's two main islands." },
  { id: 'bering', name: 'Bering Strait', countries: ['United States', 'Russia'], region: 'Americas & Arctic', connects: 'Pacific Ocean ↔ Arctic Ocean', lat: 65.75, lon: -169.0, note: 'At its narrowest, only about 82 km separates Alaska from Russia.' },
  { id: 'juandefuca', name: 'Strait of Juan de Fuca', countries: ['United States', 'Canada'], region: 'Americas & Arctic', connects: 'Pacific Ocean ↔ Salish Sea', lat: 48.3, lon: -124.0, note: "Leads to Seattle and Vancouver's shared inland sea." },
  { id: 'georgia', name: 'Strait of Georgia', countries: ['Canada'], region: 'Americas & Arctic', connects: 'Part of the Salish Sea', lat: 49.3, lon: -123.8, note: 'Between Vancouver Island and mainland British Columbia.' },
  { id: 'belleisle', name: 'Strait of Belle Isle', countries: ['Canada'], region: 'Americas & Arctic', connects: 'Gulf of St. Lawrence ↔ Atlantic Ocean', lat: 51.6, lon: -56.5, note: 'Between Newfoundland and Labrador; often choked with icebergs.' },
  { id: 'northumberland', name: 'Northumberland Strait', countries: ['Canada'], region: 'Americas & Arctic', connects: 'Part of the Gulf of St. Lawrence', lat: 46.0, lon: -63.5, note: 'Separates Prince Edward Island from the Canadian mainland.' },
  { id: 'florida', name: 'Florida Straits', countries: ['United States', 'Cuba', 'Bahamas'], region: 'Americas & Arctic', connects: 'Gulf of Mexico ↔ Atlantic Ocean', lat: 24.5, lon: -81.0, note: 'Where the Gulf Stream begins its journey north.' },
  { id: 'hudson', name: 'Hudson Strait', countries: ['Canada'], region: 'Americas & Arctic', connects: 'Hudson Bay ↔ Atlantic Ocean', lat: 62.0, lon: -70.0, note: 'Between Baffin Island and northern Quebec.' },
  { id: 'davis', name: 'Davis Strait', countries: ['Canada', 'Greenland'], region: 'Americas & Arctic', connects: 'Baffin Bay ↔ Labrador Sea', lat: 66.0, lon: -58.0, note: 'Between Baffin Island and Greenland.' },
  { id: 'denmark', name: 'Denmark Strait', countries: ['Iceland', 'Greenland'], region: 'Americas & Arctic', connects: 'Greenland Sea ↔ Atlantic Ocean', lat: 66.0, lon: -27.0, note: "Site of the world's tallest underwater waterfall, the Denmark Strait cataract." },
  { id: 'nares', name: 'Nares Strait', countries: ['Canada', 'Greenland'], region: 'Americas & Arctic', connects: 'Arctic Ocean ↔ Baffin Bay', lat: 80.0, lon: -70.0, note: 'One of the northernmost straits on Earth.' },
  { id: 'magellan', name: 'Strait of Magellan', countries: ['Chile', 'Argentina'], region: 'Americas & Arctic', connects: 'Atlantic Ocean ↔ Pacific Ocean', lat: -53.5, lon: -70.0, note: "Ferdinand Magellan's 1520 passage that gave it its name." },
  { id: 'vilkitsky', name: 'Vilkitsky Strait', countries: ['Russia'], region: 'Americas & Arctic', connects: 'Kara Sea ↔ Laptev Sea', lat: 77.9, lon: 103.5, note: "A key link in Russia's Arctic Northern Sea Route." },
];
