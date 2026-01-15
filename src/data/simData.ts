export interface SIMData {
  id: string;
  number: string;
  formattedNumber: string;
  network: 'Mobifone' | 'Viettel' | 'Vinaphone' | 'iTelecom';
  price: number;
  types: string[];
  isVIP: boolean;
}

// SIM type detection utilities
export const detectSIMTypes = (number: string): string[] => {
  const digits = number.replace(/\D/g, '');
  const last4 = digits.slice(-4);
  const last6 = digits.slice(-6);
  const types: string[] = [];

  // Lục quý (6 same digits)
  if (/(\d)\1{5}/.test(digits)) types.push('Lục quý');
  // Ngũ quý (5 same digits)
  else if (/(\d)\1{4}/.test(digits)) types.push('Ngũ quý');
  // Tứ quý (4 same digits)
  else if (/(\d)\1{3}/.test(digits)) types.push('Tứ quý');

  // Tam hoa kép (ABC ABC)
  if (/(\d{3})\1/.test(last6)) types.push('Tam hoa kép');
  // Tam hoa (AAA)
  else if (/(\d)\1{2}/.test(last4)) types.push('Tam hoa');

  // Lộc phát patterns
  if (/68|86|688|868|886|6868/.test(last4)) types.push('Lộc phát');
  // Thần tài
  if (/39|79|3979|7939/.test(last4)) types.push('Thần tài');

  // Tiến lên (ascending)
  if (/0123|1234|2345|3456|4567|5678|6789/.test(last4)) types.push('Tiến lên');

  // Gánh đảo (ABBA)
  if (last4.length === 4 && last4[0] === last4[3] && last4[1] === last4[2]) types.push('Gánh đảo');

  // Lặp kép (AABB)
  if (/(\d)\1(\d)\2/.test(last4)) types.push('Lặp kép');

  // Năm sinh (1990-2010)
  for (let year = 1970; year <= 2010; year++) {
    if (digits.includes(year.toString())) {
      types.push('Năm sinh');
      break;
    }
  }

  // Dễ nhớ (repeating patterns)
  if (/(\d{2})\1/.test(last4) || /(\d)\1/.test(last4)) {
    if (!types.includes('Lặp kép')) types.push('Dễ nhớ');
  }

  if (types.length === 0) types.push('SIM thường');

  return types;
};

export const calculatePrice = (types: string[]): number => {
  let basePrice = 500000; // 500K default

  if (types.includes('Lục quý')) basePrice = 500000000;
  else if (types.includes('Ngũ quý')) basePrice = 100000000;
  else if (types.includes('Tứ quý')) basePrice = 50000000;
  else if (types.includes('Tam hoa kép')) basePrice = 30000000;
  else if (types.includes('Tam hoa')) basePrice = 10000000;
  else if (types.includes('Lộc phát') && types.includes('Thần tài')) basePrice = 20000000;
  else if (types.includes('Thần tài')) basePrice = 8000000;
  else if (types.includes('Lộc phát')) basePrice = 5000000;
  else if (types.includes('Tiến lên')) basePrice = 6000000;
  else if (types.includes('Gánh đảo')) basePrice = 3000000;
  else if (types.includes('Lặp kép')) basePrice = 2000000;
  else if (types.includes('Năm sinh')) basePrice = 2500000;
  else if (types.includes('Dễ nhớ')) basePrice = 1500000;

  // Round to clean numbers
  return Math.round(basePrice / 100000) * 100000;
};

export const formatSIMNumber = (number: string): string => {
  const digits = number.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`;
  }
  return number;
};

export const detectNetwork = (number: string): 'Mobifone' | 'Viettel' | 'Vinaphone' | 'iTelecom' => {
  const digits = number.replace(/\D/g, '');
  const prefix = digits.slice(0, 3);

  const mobifone = ['090', '093', '070', '076', '077', '078', '079'];
  const viettel = ['096', '097', '098', '086', '032', '033', '034', '035', '036', '037', '038', '039'];
  const vinaphone = ['091', '094', '081', '082', '083', '084', '085', '088'];
  const itelecom = ['087'];

  if (mobifone.includes(prefix)) return 'Mobifone';
  if (viettel.includes(prefix)) return 'Viettel';
  if (vinaphone.includes(prefix)) return 'Vinaphone';
  if (itelecom.includes(prefix)) return 'iTelecom';

  return 'Mobifone'; // Default
};

// Generate sample SIM data
export const generateSampleSIMs = (): SIMData[] => {
  const sampleNumbers = [
    '0909888888',
    '0936666666',
    '0937777777',
    '0902468888',
    '0933686868',
    '0909123456',
    '0903979379',
    '0906868686',
    '0907891234',
    '0909199119',
    '0935688688',
    '0938883979',
    '0901234567',
    '0909886688',
    '0932199221',
    '0936789999',
    '0907778888',
    '0909393939',
    '0904561234',
    '0938686868',
    '0905555888',
    '0909191919',
    '0903456789',
    '0907979797',
    '0909886699',
    '0936886688',
    '0901995001',
    '0909168168',
    '0938889999',
    '0905686868',
    '0909789789',
    '0903979797',
  ];

  return sampleNumbers.map((num, index) => {
    const types = detectSIMTypes(num);
    const isVIP = types.some(t => ['Lục quý', 'Ngũ quý', 'Tứ quý', 'Tam hoa kép'].includes(t));
    
    return {
      id: `sim-${index + 1}`,
      number: num,
      formattedNumber: formatSIMNumber(num),
      network: detectNetwork(num),
      price: calculatePrice(types),
      types,
      isVIP,
    };
  });
};

export const formatPrice = (price: number): string => {
  if (price >= 1000000000) {
    return `${(price / 1000000000).toFixed(0)} tỷ`;
  }
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(0)} triệu`;
  }
  return `${(price / 1000).toFixed(0)}K`;
};

export const priceRanges = [
  { label: '500K – 1 triệu', min: 500000, max: 1000000 },
  { label: '1 – 3 triệu', min: 1000000, max: 3000000 },
  { label: '3 – 5 triệu', min: 3000000, max: 5000000 },
  { label: '5 – 10 triệu', min: 5000000, max: 10000000 },
  { label: '10 – 50 triệu', min: 10000000, max: 50000000 },
  { label: '50 – 100 triệu', min: 50000000, max: 100000000 },
  { label: '100 – 200 triệu', min: 100000000, max: 200000000 },
  { label: '200 – 500 triệu', min: 200000000, max: 500000000 },
  { label: 'Trên 500 triệu', min: 500000000, max: Infinity },
];

export const simTypes = [
  'Lục quý', 'Ngũ quý', 'Tứ quý',
  'Tam hoa', 'Tam hoa kép',
  'Lộc phát', 'Thần tài',
  'Năm sinh', 'Tiến lên',
  'Gánh đảo', 'Lặp kép',
  'Dễ nhớ', 'VIP',
];

export const networks = ['Mobifone', 'Viettel', 'Vinaphone', 'iTelecom'];
