const ChipTimingDNA = {
  name: 'ChipTiming v4',
  format: 'json_nextjs',
  fields: {
    event: ['event.code', 'event.officialName', 'event.date', 'event.city', 'event.state'],
    athlete: ['name', 'gender', 'age', 'bibNumber'],
    result: ['netTime', 'time', 'place', 'ageGroup', 'teamName', 'modality.distance']
  },
  keys: {
    event: 'event.code',
    athlete: 'bibNumber_name'
  },
  parsers: ['fetchEventPage', 'fetchListEntries', 'selectLists'],
  normalization: {
    time: 'fmtTime',
    distance: 'normDist',
    pace: 'timeSec_km',
    name: 'UPPERCASE'
  },
  sanityChecks: ['pace_min_2:31_per_km', 'pace_max_20:00'],
  dependencies: ['https', 'crypto', 'dotenv'],
  adapter: 'adapters/chiptiming.js'
};

export const dna = ChipTimingDNA;
