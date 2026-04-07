export interface ManufacturerInfo {
  description: string;
  founded?: number;
  headquarters?: string;
  website?: string;
}

const MANUFACTURER_CONTENT: Record<string, ManufacturerInfo> = {
  'CATERPILLAR': {
    description: 'Caterpillar is a global leader in construction and forestry equipment, producing feller bunchers, skidders, harvesters, and track-type tractors used throughout the timber industry.',
    founded: 1925,
    headquarters: 'Irving, Texas, USA',
    website: 'https://www.caterpillar.com',
  },
  'JOHN DEERE': {
    description: 'John Deere manufactures a full line of forestry machines including wheeled and tracked harvesters, forwarders, feller bunchers, and skidders trusted by logging operations worldwide.',
    founded: 1837,
    headquarters: 'Moline, Illinois, USA',
    website: 'https://www.deere.com',
  },
  'TIGERCAT': {
    description: 'Tigercat is a Canadian manufacturer specializing in purpose-built forestry equipment including feller bunchers, skidders, harvesters, forwarders, and mulchers for demanding logging conditions.',
    founded: 1992,
    headquarters: 'Brantford, Ontario, Canada',
    website: 'https://www.tigercat.com',
  },
  'TIMBERPRO': {
    description: 'TimberPro produces tracked harvesters, feller bunchers, and forwarders designed specifically for forestry applications, known for their durability in harsh logging environments.',
    founded: 2003,
    headquarters: 'Shawano, Wisconsin, USA',
    website: 'https://www.timberpro.com',
  },
  'PONSSE': {
    description: 'Ponsse is a Finnish manufacturer of cut-to-length forestry machines including harvesters, forwarders, and harvester heads, recognized for innovation in sustainable logging technology.',
    founded: 1970,
    headquarters: 'Vieremä, Finland',
    website: 'https://www.ponsse.com',
  },
  'KOMATSU': {
    description: 'Komatsu produces forestry excavators, harvesters, forwarders, and feller bunchers used in logging and land clearing operations across North America and globally.',
    founded: 1921,
    headquarters: 'Tokyo, Japan',
    website: 'https://www.komatsu.com',
  },
  'BARKO': {
    description: 'Barko manufactures hydraulic log loaders, harvesters, and forestry carriers designed for the logging and wood processing industry.',
    founded: 1963,
    headquarters: 'Superior, Wisconsin, USA',
    website: 'https://www.bfrgroup.com',
  },
  'WARATAH': {
    description: 'Waratah is a leading manufacturer of harvester heads and processing equipment used in mechanized logging operations worldwide.',
    headquarters: 'Tokoroa, New Zealand',
    website: 'https://www.waratah.com',
  },
  'LOG MAX': {
    description: 'Log Max manufactures harvester heads and forestry processing attachments known for their reliability in Scandinavian and North American timber harvesting.',
    headquarters: 'Umeå, Sweden',
    website: 'https://www.logmax.com',
  },
  'VOLVO': {
    description: 'Volvo Construction Equipment produces excavators, wheel loaders, and articulated haulers widely used in forestry, land clearing, and timber transport applications.',
    founded: 1832,
    headquarters: 'Gothenburg, Sweden',
    website: 'https://www.volvoce.com',
  },
  'HITACHI': {
    description: 'Hitachi manufactures excavators and forestry-configured machines used for log loading, processing, and land clearing throughout the timber industry.',
    founded: 1910,
    headquarters: 'Tokyo, Japan',
    website: 'https://www.hitachicm.com',
  },
  'CASE': {
    description: 'CASE Construction Equipment produces compact track loaders, excavators, and dozers used in land clearing, site preparation, and forestry mulching applications.',
    founded: 1842,
    headquarters: 'Racine, Wisconsin, USA',
    website: 'https://www.casece.com',
  },
  'FECON': {
    description: 'Fecon manufactures forestry mulchers, brush cutters, and land clearing equipment used for vegetation management, right-of-way clearing, and site preparation.',
    founded: 1992,
    headquarters: 'Lebanon, Ohio, USA',
    website: 'https://www.fecon.com',
  },
  'FAE': {
    description: 'FAE produces forestry mulchers, stump grinders, and land clearing attachments for skid steers, excavators, and tractors used in vegetation management and site prep.',
    founded: 1989,
    headquarters: 'Campo di Trens, Italy',
    website: 'https://www.fae-group.com',
  },
  'RAYCO': {
    description: 'Rayco manufactures stump cutters, forestry mulchers, and brush chippers used by tree service companies and land clearing contractors.',
    founded: 1978,
    headquarters: 'Wooster, Ohio, USA',
    website: 'https://www.raycomfg.com',
  },
  'TAKEUCHI': {
    description: 'Takeuchi manufactures compact track loaders and mini excavators widely used in tree service, land clearing, and site preparation work.',
    founded: 1963,
    headquarters: 'Nagano, Japan',
    website: 'https://www.takeuchi-us.com',
  },
  'KUBOTA': {
    description: 'Kubota produces compact excavators, track loaders, and utility vehicles used in tree care, small-scale land clearing, and forestry maintenance.',
    founded: 1890,
    headquarters: 'Osaka, Japan',
    website: 'https://www.kubotausa.com',
  },
  'BOBCAT': {
    description: 'Bobcat manufactures compact track loaders, skid steers, and mini excavators commonly configured with forestry mulcher and brush cutter attachments.',
    founded: 1947,
    headquarters: 'West Fargo, North Dakota, USA',
    website: 'https://www.bobcat.com',
  },
  'VERMEER': {
    description: 'Vermeer produces horizontal grinders, stump cutters, brush chippers, and whole tree chippers used by tree service companies and biomass processors.',
    founded: 1948,
    headquarters: 'Pella, Iowa, USA',
    website: 'https://www.vermeer.com',
  },
  'MORBARK': {
    description: 'Morbark manufactures industrial wood grinders, whole tree chippers, brush chippers, and flail debarkers for the forestry and biomass industries.',
    founded: 1957,
    headquarters: 'Winn, Michigan, USA',
    website: 'https://www.morbark.com',
  },
  'BANDIT': {
    description: 'Bandit Industries produces brush chippers, stump grinders, whole tree chippers, and horizontal grinders for tree care, logging, and biomass processing.',
    founded: 1983,
    headquarters: 'Remus, Michigan, USA',
    website: 'https://www.banditchippers.com',
  },
  'WOOD-MIZER': {
    description: 'Wood-Mizer manufactures portable and industrial sawmills, edgers, and wood processing equipment used by sawyers and lumber producers worldwide.',
    founded: 1982,
    headquarters: 'Indianapolis, Indiana, USA',
    website: 'https://www.woodmizer.com',
  },
  'PETERBILT': {
    description: 'Peterbilt produces heavy-duty trucks widely used as log trucks, chip vans, and equipment haulers throughout the forestry and timber transport industry.',
    founded: 1939,
    headquarters: 'Denton, Texas, USA',
    website: 'https://www.peterbilt.com',
  },
  'KENWORTH': {
    description: 'Kenworth manufactures heavy-duty trucks used extensively as log trucks, lowboys, and flatbed haulers in the timber and forestry equipment transport industry.',
    founded: 1923,
    headquarters: 'Kirkland, Washington, USA',
    website: 'https://www.kenworth.com',
  },
  'FREIGHTLINER': {
    description: 'Freightliner produces Class 6-8 trucks used as log trucks, chip vans, and equipment haulers across the forestry and timber transport sectors.',
    founded: 1942,
    headquarters: 'Portland, Oregon, USA',
    website: 'https://www.freightliner.com',
  },
  'PRENTICE': {
    description: 'Prentice manufactures knuckleboom log loaders and forestry carriers widely used for log loading, sorting, and truck-mounted forestry operations.',
    headquarters: 'Grangeville, Idaho, USA',
  },
  'DENIS CIMAF': {
    description: 'Denis Cimaf manufactures forestry mulcher heads and brush cutting attachments for excavators used in land clearing and right-of-way maintenance.',
    headquarters: 'Quebec, Canada',
    website: 'https://www.deniscimaf.com',
  },
  'DYNA SC': {
    description: 'Dyna Products manufactures firewood processors, log splitters, and conveyors designed for commercial and residential firewood production.',
    headquarters: 'Wilton, Wisconsin, USA',
  },
  'MULTITEK': {
    description: 'Multitek manufactures firewood processors, log splitters, and conveyors for commercial firewood producers and logging operations.',
    headquarters: 'Prentice, Wisconsin, USA',
    website: 'https://www.multitekinc.com',
  },
  'CORD KING': {
    description: 'Cord King produces firewood processors and conveyors designed for high-volume commercial firewood production operations.',
    headquarters: 'Ontario, Canada',
  },
  'HAKKIPILKE': {
    description: 'Hakkipilke manufactures firewood processors engineered for efficient, high-volume firewood production in commercial and industrial settings.',
    headquarters: 'Kannus, Finland',
    website: 'https://www.hfrg.fi',
  },
  'PALAX': {
    description: 'Palax produces firewood processors known for their reliability and efficiency in commercial firewood production across Europe and North America.',
    headquarters: 'Kauhava, Finland',
    website: 'https://www.palax.fi',
  },
  'ALTEC': {
    description: 'Altec manufactures aerial lifts, bucket trucks, and forestry equipment used by tree service companies, utilities, and arborists.',
    founded: 1929,
    headquarters: 'Birmingham, Alabama, USA',
    website: 'https://www.altec.com',
  },
  'HUSQVARNA': {
    description: 'Husqvarna produces chainsaws, brush cutters, and power equipment used by professional arborists, tree service companies, and forestry workers.',
    founded: 1689,
    headquarters: 'Stockholm, Sweden',
    website: 'https://www.husqvarna.com',
  },
  'STIHL': {
    description: 'Stihl manufactures chainsaws, brush cutters, and power equipment trusted by forestry professionals, arborists, and logging operations worldwide.',
    founded: 1926,
    headquarters: 'Waiblingen, Germany',
    website: 'https://www.stihl.com',
  },
  'PETERSON': {
    description: 'Peterson manufactures horizontal grinders, debarkers, and sawmill equipment used in lumber production and forestry residual processing.',
    headquarters: 'Eugene, Oregon, USA',
    website: 'https://www.petersonpacific.com',
  },
  'NORWOOD': {
    description: 'Norwood manufactures portable sawmills and lumber-making equipment for small-scale sawyers, hobbyists, and commercial lumber producers.',
    headquarters: 'Elora, Ontario, Canada',
    website: 'https://www.norwoodsawmills.com',
  },
  'TALBERT': {
    description: 'Talbert manufactures heavy haul trailers, lowboys, and equipment trailers used for transporting forestry machines, construction equipment, and oversize loads.',
    founded: 1938,
    headquarters: 'Rensselaer, Indiana, USA',
    website: 'https://www.talbertmfg.com',
  },
  'TRAIL KING': {
    description: 'Trail King produces trailers including lowboys, drop-decks, and equipment haulers used for transporting heavy forestry and construction machinery.',
    founded: 1974,
    headquarters: 'Mitchell, South Dakota, USA',
    website: 'https://www.trailking.com',
  },
  'FONTAINE': {
    description: 'Fontaine Trailer Company manufactures flatbed, drop-deck, and specialized trailers used for hauling forestry equipment, lumber, and timber products.',
    founded: 1945,
    headquarters: 'Jasper, Alabama, USA',
    website: 'https://www.fontainetrailer.com',
  },
  'ROTTNE': {
    description: 'Rottne manufactures harvesters and forwarders designed for Scandinavian-style cut-to-length logging operations.',
    founded: 1955,
    headquarters: 'Rottne, Sweden',
    website: 'https://www.rottne.com',
  },
  'TIMBERWOLF': {
    description: 'Timberwolf manufactures log splitters, firewood processors, and brush chippers for professional firewood production and tree service operations.',
    headquarters: 'Suffolk, United Kingdom',
    website: 'https://www.timberwolf-uk.com',
  },
  'MAC': {
    description: 'MAC Trailer manufactures dump trailers, flatbeds, and specialized hauling equipment used in forestry, construction, and aggregate transport.',
    founded: 1981,
    headquarters: 'Alliance, Ohio, USA',
    website: 'https://www.mactrailer.com',
  },
};

export function getManufacturerContent(name: string): ManufacturerInfo {
  const key = name.toUpperCase();
  return MANUFACTURER_CONTENT[key] || {
    description: `Browse ${name} forestry equipment for sale. Shop live ${name} inventory from dealers and private sellers across North America on Forestry Equipment Sales.`,
  };
}
