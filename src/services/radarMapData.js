// Bangalore FIR Geographic Map Outlines & Tactical Landmark Dataset
// Contains metropolitan boundaries, ring roads, expressways, lakes, airfields, and regional towns

export const BANGALORE_METRO_BOUNDARY = [
  // Outer perimeter of Greater Bangalore (Devanahalli north down to Sarjapur/Attibele, E-City, Kengeri, Nelamangala)
  [13.2650, 77.7150], // North of Devanahalli
  [13.2380, 77.7850], // Sulibele road
  [13.1620, 77.8200], // North Hoskote
  [13.0850, 77.8250], // Hoskote East
  [13.0150, 77.8050], // Kadugodi outskirts
  [12.9650, 77.7820], // Whitefield East (Hope Farm / ECC)
  [12.9150, 77.7780], // Gunjur / Varthur East
  [12.8550, 77.7850], // Sarjapur Town
  [12.7950, 77.7650], // Attibele Border
  [12.7650, 77.7050], // Anekal East
  [12.7480, 77.6250], // Anekal Town
  [12.7650, 77.5650], // Jigani Industrial Outskirts
  [12.8050, 77.5500], // Bannerghatta National Park North
  [12.8450, 77.5150], // Kaggalipura / Kanakapura Rd Outskirts
  [12.8850, 77.4650], // Kengeri South / Mysore Rd
  [12.9250, 77.4250], // Tavarekere / Magadi Rd
  [12.9750, 77.3950], // Magadi Road West
  [13.0550, 77.3850], // Nelamangala South
  [13.1250, 77.3950], // Nelamangala Town / NH48
  [13.1850, 77.4450], // Hesaraghatta North
  [13.2250, 77.5150], // Rajankunte / Doddaballapura Rd
  [13.2550, 77.6250], // Kundana / Airport West
  [13.2650, 77.7150], // Closing back at North Devanahalli
];

export const BANGALORE_INNER_BOUNDARY = [
  // Core Bangalore Urban Ring (BBMP Core)
  [13.0358, 77.5970], // Hebbal
  [13.0210, 77.6250], // Nagawara
  [13.0016, 77.6627], // Kasturi Nagar
  [12.9750, 77.6550], // Indiranagar East
  [12.9450, 77.6450], // Domlur / Ejipura
  [12.9250, 77.6250], // Koramangala
  [12.9145, 77.6083], // BTM Layout
  [12.9180, 77.5750], // Jayanagar / Banashankari
  [12.9350, 77.5500], // Padmanabhanagar
  [12.9550, 77.5350], // Vijayanagar / RPC Layout
  [12.9950, 77.5450], // Rajajinagar
  [13.0250, 77.5550], // Yeshwantpur
  [13.0358, 77.5970], // Hebbal
];

export const RING_ROADS = {
  outerRingRoad: [
    [13.0358, 77.5970], // Hebbal Flyover
    [13.0232, 77.6212], // Nagawara
    [13.0163, 77.6432], // Kalyan Nagar / HRBR
    [13.0016, 77.6627], // Kasturi Nagar
    [12.9982, 77.6766], // KR Puram Hanging Bridge
    [12.9830, 77.6910], // Mahadevapura
    [12.9569, 77.7011], // Marathahalli Bridge
    [12.9360, 77.6920], // Kadubeesanahalli / JP Morgan
    [12.9260, 77.6762], // Bellandur EcoSpace
    [12.9210, 77.6630], // Iblur Junction
    [12.9172, 77.6508], // Sarjapur Road Junction
    [12.9177, 77.6238], // Silk Board Junction
    [12.9145, 77.6083], // BTM Layout
    [12.9150, 77.5910], // Jayadeva Hospital Flyover
    [12.9167, 77.5739], // Banashankari
    [12.9280, 77.5500], // Padmanabhanagar
    [12.9460, 77.5217], // Nayandahalli
    [12.9538, 77.5255], // Mysore Road Junction
    [12.9750, 77.5280], // Nagarabhavi
    [13.0020, 77.5330], // Kanteerava Studio / Peenya
    [13.0285, 77.5458], // Goraguntepalya
    [13.0330, 77.5680], // BEL Circle
    [13.0358, 77.5970], // Back to Hebbal
  ],
  niceRoad: [
    [12.8398, 77.6770], // Electronic City Phase 1 Toll
    [12.8480, 77.6400], // Begur / Chandapura Link
    [12.8631, 77.5912], // Bannerghatta Road Toll
    [12.8753, 77.5422], // Kanakapura Road Toll
    [12.8870, 77.5100], // Sompura Cloverleaf
    [12.8986, 77.4883], // Mysore Road / Kengeri Toll
    [12.9350, 77.4800], // Magadi Road Link
    [12.9734, 77.4764], // Magadi Road Toll
    [13.0200, 77.4820], // Nagasandra Link
    [13.0560, 77.4887], // Tumkur Road / Madavara BIEC Toll
  ],
};

export const MAJOR_ARTERIALS = [
  {
    name: 'NH44 Airport Expressway (North)',
    code: 'NH44-N',
    points: [
      [13.0358, 77.5970], // Hebbal
      [13.0640, 77.5960], // Kodigehalli
      [13.0780, 77.5990], // Jakkur
      [13.1007, 77.5963], // Yelahanka Bypass
      [13.1380, 77.6150], // Kogilu
      [13.1750, 77.6420], // Vidyanagar
      [13.1986, 77.6850], // Airport Trumpet Interchange
      [13.2483, 77.7126], // Devanahalli
      [13.3100, 77.7200], // Nandi Hills road junction
      [13.4325, 77.7275], // Chikkaballapur
    ],
  },
  {
    name: 'NH44 Hosur Expressway (South)',
    code: 'NH44-S',
    points: [
      [12.9177, 77.6238], // Silk Board
      [12.9050, 77.6350], // Bommanahalli
      [12.8890, 77.6460], // Kudlu Gate
      [12.8452, 77.6602], // Electronic City
      [12.8120, 77.6900], // Chandapura
      [12.7750, 77.7400], // Attibele Toll
      [12.7409, 77.8253], // Hosur
    ],
  },
  {
    name: 'NH75 Kolar Expressway (East)',
    code: 'NH75',
    points: [
      [12.9982, 77.6766], // KR Puram
      [13.0150, 77.7100], // Medahalli
      [13.0712, 77.7981], // Hoskote
      [13.1100, 77.9500], // Narasapura Industrial
      [13.1367, 78.1340], // Kolar
    ],
  },
  {
    name: 'NH275 Mysore Expressway (West)',
    code: 'NH275',
    points: [
      [12.9538, 77.5255], // Mysore Road
      [12.9177, 77.4838], // Kengeri
      [12.8650, 77.4350], // Kumbalgodu
      [12.7950, 77.3850], // Bidadi
      [12.7209, 77.2799], // Ramanagara
      [12.5950, 77.0450], // Channapatna
      [12.5242, 76.8958], // Mandya
      [12.2958, 76.6394], // Mysore
    ],
  },
  {
    name: 'NH48 Tumkur Expressway (Northwest)',
    code: 'NH48',
    points: [
      [13.0285, 77.5458], // Goraguntepalya
      [13.0320, 77.5150], // Peenya
      [13.0560, 77.4887], // Madavara BIEC
      [13.0980, 77.3950], // Nelamangala
      [13.2050, 77.2500], // Dabaspet
      [13.3409, 77.1010], // Tumkur
    ],
  },
  {
    name: 'SH35 Whitefield-Sarjapur Corridor',
    code: 'SH35',
    points: [
      [13.0712, 77.7981], // Hoskote
      [13.0050, 77.7600], // Kadugodi
      [12.9698, 77.7499], // Whitefield Hope Farm
      [12.9300, 77.7480], // Varthur
      [12.8600, 77.7600], // Sarjapur
    ],
  },
];

export const WATER_BODIES = [
  {
    name: 'Bellandur Lake',
    points: [
      [12.9380, 77.6580],
      [12.9360, 77.6740],
      [12.9280, 77.6780],
      [12.9240, 77.6690],
      [12.9290, 77.6550],
      [12.9380, 77.6580],
    ],
  },
  {
    name: 'Varthur Lake',
    points: [
      [12.9460, 77.7380],
      [12.9440, 77.7520],
      [12.9350, 77.7550],
      [12.9320, 77.7420],
      [12.9400, 77.7360],
      [12.9460, 77.7380],
    ],
  },
  {
    name: 'Hesaraghatta Lake',
    points: [
      [13.1650, 77.4780],
      [13.1620, 77.4980],
      [13.1480, 77.5020],
      [13.1420, 77.4850],
      [13.1520, 77.4720],
      [13.1650, 77.4780],
    ],
  },
  {
    name: 'Ulsoor Lake',
    points: [
      [12.9860, 77.6180],
      [12.9850, 77.6250],
      [12.9790, 77.6240],
      [12.9800, 77.6170],
      [12.9860, 77.6180],
    ],
  },
  {
    name: 'Sankey Tank',
    points: [
      [13.0110, 77.5710],
      [13.0090, 77.5750],
      [13.0040, 77.5740],
      [13.0060, 77.5700],
      [13.0110, 77.5710],
    ],
  },
  {
    name: 'TG Halli Reservoir',
    points: [
      [12.9820, 77.3350],
      [12.9780, 77.3550],
      [12.9600, 77.3580],
      [12.9520, 77.3420],
      [12.9650, 77.3300],
      [12.9820, 77.3350],
    ],
  },
];

export const AIRFIELDS = [
  {
    id: 'VOBL',
    name: 'Kempegowda Int. Airport',
    code: 'VOBL',
    lat: 13.1986,
    lon: 77.7066,
    runways: [
      { id: '09L/27R', heading: 92, lengthKm: 4.0, offsetLat: 0.005, offsetLon: 0 },
      { id: '09R/27L', heading: 92, lengthKm: 4.0, offsetLat: -0.005, offsetLon: 0 },
    ],
  },
  {
    id: 'VOBG',
    name: 'HAL Airport',
    code: 'VOBG (HAL)',
    lat: 12.9500,
    lon: 77.6682,
    runways: [
      { id: '09/27', heading: 90, lengthKm: 3.3, offsetLat: 0, offsetLon: 0 },
    ],
  },
  {
    id: 'VOJK',
    name: 'Yelahanka Air Force Station',
    code: 'VOJK (IAF)',
    lat: 13.1355,
    lon: 77.6061,
    runways: [
      { id: '09/27', heading: 89, lengthKm: 2.7, offsetLat: 0, offsetLon: 0 },
    ],
  },
  {
    id: 'JAKKUR',
    name: 'Jakkur Aerodrome',
    code: 'JAKKUR',
    lat: 13.0781,
    lon: 77.6025,
    runways: [
      { id: '08/26', heading: 85, lengthKm: 1.1, offsetLat: 0, offsetLon: 0 },
    ],
  },
  {
    id: 'VO95',
    name: 'Hosur Aerodrome',
    code: 'VO95',
    lat: 12.6828,
    lon: 77.8183,
    runways: [
      { id: '09/27', heading: 90, lengthKm: 2.1, offsetLat: 0, offsetLon: 0 },
    ],
  },
];

export const LANDMARK_HUBS = [
  // Tier 1: Core Sector Anchors (Spaced far apart across the 4 cardinal quadrants)
  { name: 'BENGALURU CITY', short: 'BLR CITY', lat: 12.9756, lon: 77.6066, tier: 1, minRange: 0, maxRange: 150 },
  { name: 'WHITEFIELD', short: 'WHITEFIELD', lat: 12.9698, lon: 77.7499, tier: 1, minRange: 0, maxRange: 120 },
  { name: 'ELECTRONIC CITY', short: 'E-CITY', lat: 12.8452, lon: 77.6602, tier: 1, minRange: 0, maxRange: 120 },
  { name: 'HEBBAL', short: 'HEBBAL', lat: 13.0358, lon: 77.5970, tier: 1, minRange: 0, maxRange: 100 },

  // Tier 2: Sub-sector Anchors (Only shown in close-up tactical views <= 60km)
  { name: 'KENGERI', short: 'KENGERI', lat: 12.9177, lon: 77.4838, tier: 2, minRange: 0, maxRange: 60 },
  { name: 'YELAHANKA', short: 'YELAHANKA', lat: 13.1007, lon: 77.5963, tier: 2, minRange: 0, maxRange: 60 },

  // Tier 3: Regional Hubs (Well-spaced perimeter anchors for 100km+ views)
  { name: 'HOSUR', short: 'HOSUR', lat: 12.7409, lon: 77.8253, tier: 3, minRange: 70, maxRange: 220 },
  { name: 'TUMKUR', short: 'TUMKUR', lat: 13.3409, lon: 77.1010, tier: 3, minRange: 90, maxRange: 220 },
  { name: 'KOLAR', short: 'KOLAR', lat: 13.1367, lon: 78.1340, tier: 3, minRange: 90, maxRange: 220 },
  { name: 'MYSORE', short: 'MYSORE', lat: 12.2958, lon: 76.6394, tier: 3, minRange: 120, maxRange: 220 },
];

export const AIRSPACE_WAYPOINTS = [
  { name: 'PUKAN', lat: 13.5000, lon: 77.2500, type: 'ENTRY_EXIT' },
  { name: 'ADMOL', lat: 13.3500, lon: 78.2000, type: 'ARRIVAL' },
  { name: 'SULUR', lat: 12.5000, lon: 77.2000, type: 'FEEDER' },
  { name: 'GUNIM', lat: 12.8000, lon: 78.3000, type: 'TRANSITION' },
  { name: 'BIA VOR', lat: 13.2050, lon: 77.7110, type: 'NAVAID' },
];
