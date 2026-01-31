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

// Helper functions for tail-based quý detection (string version - keep for backward compatibility)
const onlyDigits = (num: string) => (num || '').replace(/\D/g, '');

export const isQuadTail = (num: string): boolean => {
  const digits = onlyDigits(num);
  if (digits.length < 4) return false;
  const last4 = digits.slice(-4);
  return /^(\d)\1{3}$/.test(last4);
};

export const isQuintTail = (num: string): boolean => {
  const digits = onlyDigits(num);
  if (digits.length < 5) return false;
  const last5 = digits.slice(-5);
  return /^(\d)\1{4}$/.test(last5);
};

export const isHexTail = (num: string): boolean => {
  const digits = onlyDigits(num);
  if (digits.length < 6) return false;
  const last6 = digits.slice(-6);
  return /^(\d)\1{5}$/.test(last6);
};

// NEW: Helper functions that work with SIM objects (use formattedNumber/number for display accuracy)
export const getSimDigits = (sim: { formattedNumber?: string; number?: string }) => {
  const raw = (sim.formattedNumber || sim.number || '').toString();
  return raw.replace(/\D/g, '');
};

export const isQuadTailSim = (sim: { formattedNumber?: string; number?: string }): boolean => {
  const d = getSimDigits(sim);
  if (d.length < 4) return false;
  return /^(\d)\1{3}$/.test(d.slice(-4));
};

export const isQuintTailSim = (sim: { formattedNumber?: string; number?: string }): boolean => {
  const d = getSimDigits(sim);
  if (d.length < 5) return false;
  return /^(\d)\1{4}$/.test(d.slice(-5));
};

export const isHexTailSim = (sim: { formattedNumber?: string; number?: string }): boolean => {
  const d = getSimDigits(sim);
  if (d.length < 6) return false;
  return /^(\d)\1{5}$/.test(d.slice(-6));
};

export const detectSIMTypes = (number: string): string[] => {
  const digits = number.replace(/\D/g, '');
  const last4 = digits.slice(-4);
  const last6 = digits.slice(-6);
  const types: string[] = [];

  // Lục quý (6 same digits at end) - independent check
  if (/(\d)\1{5}$/.test(digits)) types.push('Lục quý');
  // Ngũ quý (5 same digits at end) - independent check
  if (/(\d)\1{4}$/.test(digits) && !types.includes('Lục quý')) types.push('Ngũ quý');
  // Tứ quý: 4 số ĐUÔI giống nhau (không phụ thuộc độ dài số)
  const last4ForTuQuy = digits.slice(-4);
  if (
    /^(\d)\1{3}$/.test(last4ForTuQuy) &&
    !types.includes('Lục quý') &&
    !types.includes('Ngũ quý')
  ) {
    types.push('Tứ quý');
  }

  // Tam hoa / Tam hoa kép detection
  // Find all triple identical consecutive digits (xxx) anywhere in the number
  // Count distinct digits that form triples
  const tripleMatches = digits.match(/(\d)\1{2}/g) || [];
  const distinctTripleDigits = new Set<string>();
  for (const match of tripleMatches) {
    distinctTripleDigits.add(match[0]); // Add the digit that forms the triple
  }
  
  // Apply tagging logic:
  // - If 2+ distinct triple digits → "Tam hoa kép" only
  // - If exactly 1 distinct triple digit → "Tam hoa" only
  if (distinctTripleDigits.size >= 2) {
    types.push('Tam hoa kép');
  } else if (distinctTripleDigits.size === 1) {
    types.push('Tam hoa');
  }

  // Lộc phát patterns
  if (/68$|86$|688$|868$|886$|6868$/.test(digits)) types.push('Lộc phát');
  // Thần tài
  if (/39$|79$/.test(digits)) types.push('Thần tài');

  // Tiến lên (ascending)
  if (/0123$|1234$|2345$|3456$|4567$|5678$|6789$/.test(digits)) types.push('Tiến lên');

  // Gánh đảo (ABBA at end)
  if (last4.length === 4 && last4[0] === last4[3] && last4[1] === last4[2] && last4[0] !== last4[1]) types.push('Gánh đảo');

  // Lặp kép (AABB at end)
  if (/(\d)\1(\d)\2$/.test(digits) && !types.includes('Tứ quý') && !types.includes('Ngũ quý') && !types.includes('Lục quý')) types.push('Lặp kép');

  // Năm sinh (1980-2010 anywhere)
  for (let year = 1980; year <= 2010; year++) {
    if (digits.includes(year.toString())) {
      types.push('Năm sinh');
      break;
    }
  }

  // Dễ nhớ (repeating patterns like ABAB)
  if (/(\d{2})\1$/.test(last4) && !types.includes('Lặp kép') && !types.includes('Tứ quý') && !types.includes('Ngũ quý') && !types.includes('Lục quý')) {
    types.push('Dễ nhớ');
  }

  // Taxi = ABABAB or ABCABC on last 6 digits
  const tail6 = digits.slice(-6);
  const isTaxi2 = tail6.length === 6 && 
    tail6[0] === tail6[2] && tail6[2] === tail6[4] &&
    tail6[1] === tail6[3] && tail6[3] === tail6[5] &&
    tail6[0] !== tail6[1];
  const block3 = tail6.slice(0, 3);
  const isTaxi3 = tail6.length === 6 && 
    block3 === tail6.slice(3, 6) &&
    !(block3[0] === block3[1] && block3[1] === block3[2]);
  if (isTaxi2 || isTaxi3) {
    types.push('Taxi');
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
  const prefix3 = digits.slice(0, 3);
  const prefix4 = digits.slice(0, 4);

  // Mobifone prefixes
  const mobifone3 = ['090', '093', '089'];
  const mobifone4 = ['0702', '0703', '0704', '0705', '0706', '0707', '0708', '0709', 
                     '0762', '0763', '0764', '0765', '0766', '0767', '0768', '0769',
                     '0772', '0773', '0774', '0775', '0776', '0777', '0778', '0779',
                     '0782', '0783', '0784', '0785', '0786', '0787', '0788', '0789',
                     '0792', '0793', '0794', '0795', '0796', '0797', '0798', '0799'];
  
  // Viettel prefixes
  const viettel3 = ['096', '097', '098', '086'];
  const viettel4 = ['0320', '0321', '0322', '0323', '0324', '0325', '0326', '0327', '0328', '0329',
                    '0330', '0331', '0332', '0333', '0334', '0335', '0336', '0337', '0338', '0339',
                    '0340', '0341', '0342', '0343', '0344', '0345', '0346', '0347', '0348', '0349',
                    '0350', '0351', '0352', '0353', '0354', '0355', '0356', '0357', '0358', '0359',
                    '0360', '0361', '0362', '0363', '0364', '0365', '0366', '0367', '0368', '0369',
                    '0370', '0371', '0372', '0373', '0374', '0375', '0376', '0377', '0378', '0379',
                    '0380', '0381', '0382', '0383', '0384', '0385', '0386', '0387', '0388', '0389',
                    '0390', '0391', '0392', '0393', '0394', '0395', '0396', '0397', '0398', '0399'];
  
  // Vinaphone prefixes
  const vinaphone3 = ['091', '094'];
  const vinaphone4 = ['0810', '0811', '0812', '0813', '0814', '0815', '0816', '0817', '0818', '0819',
                      '0820', '0821', '0822', '0823', '0824', '0825', '0826', '0827', '0828', '0829',
                      '0830', '0831', '0832', '0833', '0834', '0835', '0836', '0837', '0838', '0839',
                      '0840', '0841', '0842', '0843', '0844', '0845', '0846', '0847', '0848', '0849',
                      '0850', '0851', '0852', '0853', '0854', '0855', '0856', '0857', '0858', '0859',
                      '0880', '0881', '0882', '0883', '0884', '0885', '0886', '0887', '0888', '0889'];
  
  // iTelecom
  const itelecom = ['087'];

  if (mobifone3.includes(prefix3) || mobifone4.includes(prefix4)) return 'Mobifone';
  if (viettel3.includes(prefix3) || viettel4.includes(prefix4)) return 'Viettel';
  if (vinaphone3.includes(prefix3) || vinaphone4.includes(prefix4)) return 'Vinaphone';
  if (itelecom.includes(prefix3)) return 'iTelecom';

  // Check for 07xx patterns (mostly Mobifone)
  if (prefix3 === '070' || prefix3 === '076' || prefix3 === '077' || prefix3 === '078' || prefix3 === '079') {
    return 'Mobifone';
  }

  // Default to Mobifone for 09x patterns
  if (prefix3.startsWith('09')) return 'Mobifone';

  return 'Mobifone'; // Default
};

// Parse price string to number
const parsePrice = (priceStr: string): number => {
  if (!priceStr) return 0;
  // Remove commas and convert to number
  const cleaned = priceStr.replace(/,/g, '').replace(/\s/g, '');
  return parseInt(cleaned, 10) || 0;
};

// Real SIM data from Excel (first 500 entries for performance)
const rawSIMData = [
  { number: '0938868868', price: 1000000000 },
  { number: '0909686686', price: 788000000 },
  { number: '0901123456', price: 639000000 },
  { number: '0933686666', price: 513000000 },
  { number: '0933116666', price: 499000000 },
  { number: '0901556666', price: 399000000 },
  { number: '0933636666', price: 419000000 },
  { number: '0909272727', price: 386000000 },
  { number: '0899898999', price: 372000000 },
  { number: '0899889888', price: 372000000 },
  { number: '0933356666', price: 368000000 },
  { number: '0937686666', price: 339000000 },
  { number: '0937796666', price: 339000000 },
  { number: '0933936666', price: 319000000 },
  { number: '0932626666', price: 278000000 },
  { number: '0938856666', price: 268000000 },
  { number: '0903933339', price: 249000000 },
  { number: '0932636666', price: 249000000 },
  { number: '0899888989', price: 225000000 },
  { number: '0934918888', price: 219000000 },
  { number: '0934115115', price: 199000000 },
  { number: '0764666888', price: 160000000 },
  { number: '0899899988', price: 156000000 },
  { number: '0899899898', price: 156000000 },
  { number: '0899899889', price: 156000000 },
  { number: '0899898998', price: 156000000 },
  { number: '0899889898', price: 156000000 },
  { number: '0899888998', price: 156000000 },
  { number: '0899886888', price: 156000000 },
  { number: '0902573333', price: 150000000 },
  { number: '0995848888', price: 150000000 },
  { number: '0777629999', price: 139000000 },
  { number: '0707779779', price: 139000000 },
  { number: '0773118888', price: 120000000 },
  { number: '0901191111', price: 120000000 },
  { number: '0896888666', price: 120000000 },
  { number: '0899866886', price: 110000000 },
  { number: '0899888686', price: 110000000 },
  { number: '0938999995', price: 113000000 },
  { number: '0903389888', price: 99000000 },
  { number: '0995846666', price: 99000000 },
  { number: '0901339779', price: 98000000 },
  { number: '0898868886', price: 88000000 },
  { number: '0995848484', price: 88000000 },
  { number: '0995807777', price: 88000000 },
  { number: '0995801234', price: 80000000 },
  { number: '0909682999', price: 79000000 },
  { number: '0902386999', price: 79000000 },
  { number: '0898868688', price: 75000000 },
  { number: '0995899998', price: 75000000 },
  { number: '0995898898', price: 72000000 },
  { number: '0815090909', price: 69000000 },
  { number: '0899922888', price: 68000000 },
  { number: '0899868666', price: 68000000 },
  { number: '0899911888', price: 68000000 },
  { number: '0995899888', price: 68000000 },
  { number: '0995892222', price: 68000000 },
  { number: '0995845678', price: 68000000 },
  { number: '0901322888', price: 62000000 },
  { number: '0898866686', price: 62000000 },
  { number: '0933698698', price: 62000000 },
  { number: '0794181818', price: 62000000 },
  { number: '0995812345', price: 60000000 },
  { number: '0931111789', price: 59000000 },
  { number: '0995855888', price: 55000000 },
  { number: '0995897979', price: 55000000 },
  { number: '0899896999', price: 52000000 },
  { number: '0899893999', price: 52000000 },
  { number: '0899897999', price: 52000000 },
  { number: '0899119888', price: 52000000 },
  { number: '0899907999', price: 50000000 },
  { number: '0899906999', price: 50000000 },
  { number: '0899905999', price: 50000000 },
  { number: '0899903999', price: 50000000 },
  { number: '0899902999', price: 50000000 },
  { number: '0899901999', price: 50000000 },
  { number: '0899885999', price: 50000000 },
  { number: '0899883999', price: 50000000 },
  { number: '0899855999', price: 50000000 },
  { number: '0899133999', price: 50000000 },
  { number: '0899115888', price: 50000000 },
  { number: '0899122999', price: 50000000 },
  { number: '0899116999', price: 50000000 },
  { number: '0899113888', price: 50000000 },
  { number: '0899877888', price: 50000000 },
  { number: '0899113999', price: 50000000 },
  { number: '0899935999', price: 50000000 },
  { number: '0899927999', price: 50000000 },
  { number: '0899923999', price: 50000000 },
  { number: '0899917999', price: 50000000 },
  { number: '0899916999', price: 50000000 },
  { number: '0899915999', price: 50000000 },
  { number: '0899913999', price: 50000000 },
  { number: '0899912999', price: 50000000 },
  { number: '0899139888', price: 50000000 },
  { number: '0899112999', price: 50000000 },
  { number: '0899895999', price: 50000000 },
  { number: '0899892999', price: 50000000 },
  { number: '0899891999', price: 50000000 },
  { number: '0995892345', price: 50000000 },
  { number: '0995856868', price: 50000000 },
  { number: '0995846789', price: 50000000 },
  { number: '0995819819', price: 48000000 },
  { number: '0707070726', price: 45000000 },
  { number: '0899133888', price: 45000000 },
  { number: '0773113333', price: 45000000 },
  { number: '0995806888', price: 45000000 },
  { number: '0899922666', price: 40000000 },
  { number: '0899939666', price: 40000000 },
  { number: '0908364444', price: 40000000 },
  { number: '0909534444', price: 40000000 },
  { number: '0995855666', price: 40000000 },
  { number: '0995858858', price: 40000000 },
  { number: '0995818999', price: 40000000 },
  { number: '0995852999', price: 40000000 },
  { number: '0995896999', price: 40000000 },
  { number: '0995818818', price: 40000000 },
  { number: '0995895999', price: 40000000 },
  { number: '0995895678', price: 40000000 },
  { number: '0995811999', price: 40000000 },
  { number: '0995891999', price: 40000000 },
  { number: '0995811888', price: 40000000 },
  { number: '0995893999', price: 40000000 },
  { number: '0938000789', price: 39000000 },
  { number: '0707073838', price: 39000000 },
  { number: '0778997999', price: 39000000 },
  { number: '0767898668', price: 39000000 },
  { number: '0938050000', price: 38000000 },
  { number: '0938590000', price: 38000000 },
  { number: '0762101010', price: 38000000 },
  { number: '0899138999', price: 38000000 },
  { number: '0938033666', price: 38000000 },
  { number: '0995898789', price: 36000000 },
  { number: '0902370000', price: 35000000 },
  { number: '0931317878', price: 32000000 },
  { number: '0907778555', price: 32000000 },
  { number: '0906374444', price: 32000000 },
  { number: '0906870000', price: 32000000 },
  { number: '0937564444', price: 32000000 },
  { number: '0937964444', price: 32000000 },
  { number: '0938888840', price: 32000000 },
  { number: '0938888841', price: 32000000 },
  { number: '0938888842', price: 32000000 },
  { number: '0899912888', price: 32000000 },
  { number: '0899915888', price: 32000000 },
  { number: '0899931888', price: 32000000 },
  { number: '0899932888', price: 32000000 },
  { number: '0899935888', price: 32000000 },
  { number: '0899905888', price: 32000000 },
  { number: '0899946999', price: 32000000 },
  { number: '0899903888', price: 32000000 },
  { number: '0899902888', price: 32000000 },
  { number: '0704662222', price: 32000000 },
  { number: '0765323333', price: 32000000 },
  { number: '0767563333', price: 32000000 },
  { number: '0773892222', price: 32000000 },
  { number: '0777602222', price: 32000000 },
  { number: '0932122666', price: 32000000 },
  { number: '0934040888', price: 32000000 },
  { number: '0934091999', price: 32000000 },
  { number: '0938853888', price: 32000000 },
  { number: '0932664567', price: 32000000 },
  { number: '0909274999', price: 32000000 },
  { number: '0932671999', price: 32000000 },
  { number: '0934099666', price: 32000000 },
  { number: '0938684888', price: 32000000 },
  { number: '0932713456', price: 32000000 },
  { number: '0934004567', price: 32000000 },
  { number: '0902878668', price: 32000000 },
  { number: '0899921999', price: 30000000 },
  { number: '0899122888', price: 30000000 },
  { number: '0899944888', price: 30000000 },
  { number: '0899884888', price: 30000000 },
  { number: '0898486888', price: 30000000 },
  { number: '0899906888', price: 30000000 },
  { number: '0899927888', price: 30000000 },
  { number: '0898499888', price: 30000000 },
  { number: '0898484888', price: 30000000 },
  { number: '0899930999', price: 30000000 },
  { number: '0899920999', price: 30000000 },
  { number: '0899888388', price: 40000000 },
  { number: '0899969798', price: 30000000 },
  { number: '0907041999', price: 30000000 },
  { number: '0898115888', price: 30000000 },
  { number: '0777123666', price: 30000000 },
  { number: '0777179888', price: 30000000 },
  { number: '0707141414', price: 40000000 },
  { number: '0995817779', price: 30000000 },
  { number: '0995805888', price: 30000000 },
  { number: '0995899889', price: 30000000 },
  { number: '0995893456', price: 30000000 },
  { number: '0995858868', price: 30000000 },
  { number: '0995898666', price: 30000000 },
  { number: '0995893939', price: 30000000 },
  { number: '0995898998', price: 30000000 },
  { number: '0995890999', price: 30000000 },
  { number: '0995857979', price: 30000000 },
  { number: '0995898899', price: 30000000 },
  { number: '0899893888', price: 28000000 },
  { number: '0899892888', price: 28000000 },
  { number: '0899890888', price: 28000000 },
  { number: '0899888588', price: 40000000 },
  { number: '0899888788', price: 40000000 },
  { number: '0899888288', price: 40000000 },
  { number: '0899888088', price: 35000000 },
  { number: '0708868999', price: 28000000 },
  { number: '0767443333', price: 28000000 },
  { number: '0934127999', price: 28000000 },
  { number: '0902300666', price: 28000000 },
  { number: '0931779789', price: 26000000 },
  { number: '0909165656', price: 26000000 },
  { number: '0901111165', price: 26000000 },
  { number: '0899901888', price: 25000000 },
  { number: '0899911199', price: 25000000 },
  { number: '0899899599', price: 25000000 },
  { number: '0903652666', price: 25000000 },
  { number: '0934060666', price: 25000000 },
  { number: '0938888874', price: 25000000 },
  { number: '0938888814', price: 25000000 },
  { number: '0777716888', price: 25000000 },
  { number: '0909766555', price: 25000000 },
  { number: '0909855777', price: 25000000 },
  { number: '0909399988', price: 25000000 },
  { number: '0902396979', price: 25000000 },
  { number: '0776681111', price: 25000000 },
  { number: '0773939888', price: 25000000 },
  { number: '0779723333', price: 25000000 },
  { number: '0776991111', price: 25000000 },
  { number: '0707994999', price: 25000000 },
  { number: '0707070754', price: 25000000 },
  { number: '0899110999', price: 25000000 },
  { number: '0899865999', price: 25000000 },
  { number: '0899121888', price: 25000000 },
  { number: '0899110888', price: 25000000 },
  { number: '0898489888', price: 25000000 },
  { number: '0899937888', price: 25000000 },
  { number: '0899904888', price: 25000000 },
  { number: '0899911777', price: 25000000 },
  { number: '0899933777', price: 25000000 },
  { number: '0899861888', price: 25000000 },
  { number: '0899863888', price: 25000000 },
  { number: '0899865888', price: 25000000 },
  { number: '0899867888', price: 25000000 },
  { number: '0899917888', price: 25000000 },
  { number: '0899939777', price: 25000000 },
  { number: '0909705666', price: 25000000 },
  { number: '0899132888', price: 25000000 },
  { number: '0899853888', price: 25000000 },
  { number: '0899857888', price: 25000000 },
  { number: '0899872888', price: 25000000 },
  { number: '0899943999', price: 25000000 },
  { number: '0899941999', price: 25000000 },
  { number: '0899947999', price: 25000000 },
  { number: '0899942999', price: 25000000 },
  { number: '0899924999', price: 25000000 },
  { number: '0901824999', price: 25000000 },
  { number: '0932062999', price: 25000000 },
  { number: '0938364888', price: 25000000 },
  { number: '0708334444', price: 25000000 },
  { number: '0707942222', price: 25000000 },
  { number: '0707342222', price: 25000000 },
  { number: '0779753333', price: 25000000 },
  { number: '0708652222', price: 25000000 },
  { number: '0768672222', price: 25000000 },
  { number: '0707784444', price: 25000000 },
  { number: '0764404444', price: 25000000 },
  { number: '0769660000', price: 25000000 },
  { number: '0902614999', price: 25000000 },
  { number: '0932790888', price: 25000000 },
  { number: '0938064999', price: 25000000 },
  { number: '0938374888', price: 25000000 },
  { number: '0938742888', price: 25000000 },
  { number: '0932176886', price: 25000000 },
  { number: '0932120888', price: 25000000 },
  { number: '0934085999', price: 25000000 },
  { number: '0934170999', price: 25000000 },
  { number: '0938254999', price: 25000000 },
  { number: '0938762666', price: 25000000 },
  { number: '0901424567', price: 25000000 },
  { number: '0708569569', price: 25000000 },
  { number: '0931319696', price: 25000000 },
  { number: '0776667979', price: 25000000 },
  { number: '0995893893', price: 25000000 },
  { number: '0995857999', price: 25000000 },
  { number: '0995854444', price: 25000000 },
  { number: '0995815999', price: 25000000 },
  { number: '0995818989', price: 25000000 },
  { number: '0995890888', price: 25000000 },
  { number: '0995891989', price: 25000000 },
  { number: '0995813888', price: 25000000 },
  { number: '0995803999', price: 25000000 },
  { number: '0995810999', price: 25000000 },
  { number: '0995852852', price: 25000000 },
  { number: '0995859859', price: 25000000 },
  { number: '0903338966', price: 22000000 },
  { number: '0899116888', price: 22000000 },
  { number: '0899896888', price: 22000000 },
  { number: '0932170999', price: 22000000 },
  { number: '0937168699', price: 22000000 },
  { number: '0934073999', price: 22000000 },
  { number: '0938514999', price: 22000000 },
  { number: '0901762999', price: 22000000 },
  { number: '0938704999', price: 22000000 },
  { number: '0902384999', price: 22000000 },
  { number: '0899963888', price: 22000000 },
  { number: '0899961888', price: 22000000 },
  { number: '0708663333', price: 22000000 },
  { number: '0769543333', price: 22000000 },
  { number: '0704434444', price: 22000000 },
  { number: '0769822222', price: 22000000 },
  { number: '0767542222', price: 22000000 },
  { number: '0995819999', price: 22000000 },
  { number: '0995896868', price: 22000000 },
  { number: '0995858688', price: 22000000 },
  { number: '0995816888', price: 22000000 },
  { number: '0995812888', price: 22000000 },
  { number: '0995807979', price: 22000000 },
  { number: '0995801888', price: 22000000 },
  { number: '0907668866', price: 20000000 },
  { number: '0903883386', price: 20000000 },
  { number: '0907111345', price: 20000000 },
  { number: '0938588366', price: 20000000 },
  { number: '0901888689', price: 20000000 },
  { number: '0909988198', price: 20000000 },
  { number: '0938868579', price: 20000000 },
  { number: '0938667968', price: 20000000 },
  { number: '0909323979', price: 20000000 },
  { number: '0909335388', price: 20000000 },
  { number: '0899891888', price: 20000000 },
  { number: '0899897888', price: 20000000 },
  { number: '0899129888', price: 20000000 },
  { number: '0899128888', price: 20000000 },
  { number: '0899128999', price: 20000000 },
  { number: '0899131999', price: 20000000 },
  { number: '0899132999', price: 20000000 },
  { number: '0708553333', price: 20000000 },
  { number: '0764462222', price: 20000000 },
  { number: '0764552222', price: 20000000 },
  { number: '0767722222', price: 20000000 },
  { number: '0769352222', price: 20000000 },
  { number: '0776933333', price: 20000000 },
  { number: '0909273899', price: 20000000 },
  { number: '0909268339', price: 20000000 },
  { number: '0909251939', price: 20000000 },
  { number: '0909274139', price: 20000000 },
  { number: '0938124999', price: 20000000 },
  { number: '0934062999', price: 20000000 },
  { number: '0934032999', price: 20000000 },
  { number: '0932047999', price: 20000000 },
  { number: '0932095999', price: 20000000 },
  { number: '0938234999', price: 20000000 },
  { number: '0901854999', price: 20000000 },
  { number: '0909283839', price: 20000000 },
  { number: '0909261679', price: 20000000 },
  { number: '0909263279', price: 20000000 },
  { number: '0909261379', price: 20000000 },
  { number: '0938048999', price: 20000000 },
  { number: '0901372999', price: 20000000 },
  { number: '0899962888', price: 20000000 },
  { number: '0899967888', price: 20000000 },
  { number: '0899956999', price: 20000000 },
  { number: '0899951999', price: 20000000 },
  { number: '0899867999', price: 20000000 },
  { number: '0899863999', price: 20000000 },
  { number: '0899861999', price: 20000000 },
  { number: '0899871888', price: 20000000 },
  { number: '0899951888', price: 20000000 },
  { number: '0899957888', price: 20000000 },
  { number: '0899952888', price: 20000000 },
  { number: '0899953888', price: 20000000 },
  { number: '0777118768', price: 20000000 },
  { number: '0777115579', price: 20000000 },
  { number: '0899857999', price: 20000000 },
  { number: '0899855888', price: 20000000 },
  { number: '0899852888', price: 20000000 },
  { number: '0899851999', price: 20000000 },
  { number: '0899871999', price: 20000000 },
  { number: '0899872999', price: 20000000 },
  { number: '0899873888', price: 20000000 },
  { number: '0899875999', price: 20000000 },
  { number: '0899876888', price: 20000000 },
  { number: '0899126999', price: 20000000 },
  { number: '0899935888', price: 20000000 },
  { number: '0899127999', price: 20000000 },
  { number: '0899129999', price: 20000000 },
  { number: '0899125888', price: 20000000 },
  { number: '0899126888', price: 20000000 },
  { number: '0899127888', price: 20000000 },
  { number: '0899130888', price: 20000000 },
  { number: '0899136888', price: 20000000 },
  { number: '0899135999', price: 20000000 },
  { number: '0899137888', price: 20000000 },
  { number: '0899125999', price: 20000000 },
  { number: '0899137999', price: 20000000 },
  { number: '0764764764', price: 20000000 },
  { number: '0995802888', price: 20000000 },
  { number: '0995851999', price: 20000000 },
  { number: '0995853888', price: 20000000 },
  { number: '0995851888', price: 20000000 },
  { number: '0995803888', price: 20000000 },
  { number: '0995852888', price: 20000000 },
  { number: '0995817888', price: 20000000 },
  { number: '0995815888', price: 20000000 },
  { number: '0995897888', price: 20000000 },
  { number: '0708878899', price: 18000000 },
  { number: '0708855777', price: 18000000 },
  { number: '0708668688', price: 18000000 },
  { number: '0909251679', price: 18000000 },
  { number: '0909281679', price: 18000000 },
  { number: '0909273979', price: 18000000 },
  { number: '0909267979', price: 18000000 },
  { number: '0903358899', price: 18000000 },
  { number: '0901342999', price: 18000000 },
  { number: '0934058999', price: 18000000 },
  { number: '0934082888', price: 18000000 },
  { number: '0901532888', price: 18000000 },
  { number: '0901372888', price: 18000000 },
  { number: '0934078999', price: 18000000 },
  { number: '0934054999', price: 18000000 },
  { number: '0932057888', price: 18000000 },
  { number: '0934027999', price: 18000000 },
  { number: '0932047888', price: 18000000 },
  { number: '0899965888', price: 18000000 },
  { number: '0899952999', price: 18000000 },
  { number: '0899953999', price: 18000000 },
  { number: '0899957999', price: 18000000 },
  { number: '0899962999', price: 18000000 },
  { number: '0899963999', price: 18000000 },
  { number: '0899965999', price: 18000000 },
  { number: '0899967999', price: 18000000 },
  { number: '0769862222', price: 18000000 },
  { number: '0767243333', price: 18000000 },
  { number: '0767633333', price: 18000000 },
  { number: '0764584444', price: 18000000 },
  { number: '0899126888', price: 18000000 },
  { number: '0899875888', price: 18000000 },
  { number: '0899876999', price: 18000000 },
  { number: '0899851888', price: 18000000 },
  { number: '0899856888', price: 18000000 },
  { number: '0899856999', price: 18000000 },
  { number: '0899131888', price: 18000000 },
  { number: '0899135888', price: 18000000 },
  { number: '0899136999', price: 18000000 },
  { number: '0899130999', price: 18000000 },
  { number: '0764623333', price: 18000000 },
  { number: '0707983333', price: 18000000 },
  { number: '0769523333', price: 18000000 },
  { number: '0708893333', price: 18000000 },
  { number: '0932027999', price: 18000000 },
  { number: '0932024999', price: 18000000 },
  { number: '0932038888', price: 18000000 },
  { number: '0995810888', price: 18000000 },
  { number: '0995850888', price: 18000000 },
  { number: '0995856999', price: 18000000 },
  { number: '0995857888', price: 18000000 },
  { number: '0938091234', price: 16000000 },
  { number: '0903332089', price: 16000000 },
  { number: '0938939838', price: 16000000 },
  { number: '0909284588', price: 16000000 },
  { number: '0909267939', price: 16000000 },
  { number: '0909272879', price: 16000000 },
  { number: '0909274079', price: 16000000 },
  { number: '0909253679', price: 16000000 },
  { number: '0934014999', price: 16000000 },
  { number: '0934024888', price: 16000000 },
  { number: '0901834888', price: 16000000 },
  { number: '0932014888', price: 16000000 },
  { number: '0934051888', price: 16000000 },
  { number: '0934024999', price: 16000000 },
  { number: '0932052888', price: 16000000 },
  { number: '0932067888', price: 16000000 },
  { number: '0932026888', price: 16000000 },
  { number: '0709682222', price: 16000000 },
  { number: '0708592222', price: 16000000 },
  { number: '0708942222', price: 16000000 },
  { number: '0708922222', price: 16000000 },
  { number: '0709622222', price: 16000000 },
  { number: '0765142222', price: 16000000 },
  { number: '0769232222', price: 16000000 },
  { number: '0768923333', price: 16000000 },
  { number: '0768753333', price: 16000000 },
  { number: '0764383333', price: 16000000 },
  { number: '0769283333', price: 16000000 },
  { number: '0769833333', price: 16000000 },
  { number: '0766943333', price: 16000000 },
  { number: '0766783333', price: 16000000 },
  { number: '0767173333', price: 16000000 },
  { number: '0764783333', price: 16000000 },
  { number: '0769973333', price: 16000000 },
  { number: '0764633333', price: 16000000 },
  { number: '0708393333', price: 16000000 },
  { number: '0707523333', price: 16000000 },
  { number: '0767483333', price: 16000000 },
  { number: '0767523333', price: 16000000 },
  { number: '0764514444', price: 16000000 },
  { number: '0707574444', price: 16000000 },
  { number: '0779854444', price: 16000000 },
  { number: '0779874444', price: 16000000 },
  { number: '0769964444', price: 16000000 },
  { number: '0769874444', price: 16000000 },
  { number: '0767524444', price: 16000000 },
  { number: '0779844444', price: 16000000 },
  { number: '0768174444', price: 16000000 },
  { number: '0708594444', price: 16000000 },
  { number: '0768844444', price: 16000000 },
  { number: '0995850999', price: 16000000 },
  { number: '0707565353', price: 15000000 },
  { number: '0909275979', price: 15000000 },
  { number: '0909256339', price: 15000000 },
  { number: '0909264839', price: 15000000 },
  { number: '0909283839', price: 15000000 },
  { number: '0909267939', price: 15000000 },
  { number: '0938304999', price: 15000000 },
  { number: '0934025888', price: 15000000 },
  { number: '0901837888', price: 15000000 },
  { number: '0901376888', price: 15000000 },
  { number: '0938204888', price: 15000000 },
  { number: '0901582888', price: 15000000 },
  { number: '0901654888', price: 15000000 },
  { number: '0709693333', price: 15000000 },
  { number: '0708752222', price: 15000000 },
  { number: '0708642222', price: 15000000 },
];

// Generate SIM data from raw data
export const generateSampleSIMs = (): SIMData[] => {
  return rawSIMData.map((item, index) => {
    const types = detectSIMTypes(item.number);
    const isVIP = types.some(t => ['Lục quý', 'Ngũ quý', 'Tứ quý', 'Tam hoa kép'].includes(t)) || item.price >= 100000000;
    
    return {
      id: `sim-${index + 1}`,
      number: item.number,
      formattedNumber: formatSIMNumber(item.number),
      network: detectNetwork(item.number),
      price: item.price,
      types,
      isVIP,
    };
  });
};

export const formatPrice = (price: number): string => {
  if (price >= 1000000000) {
    const value = price / 1000000000;
    return value === Math.floor(value) ? `${value} tỷ` : `${value.toFixed(1)} tỷ`;
  }
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(0)} triệu`;
  }
  return `${(price / 1000).toFixed(0)}K`;
};

export const priceRanges = [
  { label: '500K – 1 Tr', min: 500000, max: 1000000 },
  { label: '1 – 3 Tr', min: 1000000, max: 3000000 },
  { label: '3 – 5 Tr', min: 3000000, max: 5000000 },
  { label: '5 – 10 Tr', min: 5000000, max: 10000000 },
  { label: '10 – 50 Tr', min: 10000000, max: 50000000 },
  { label: '50 – 100 Tr', min: 50000000, max: 100000000 },
  { label: '100 – 200 Tr', min: 100000000, max: 200000000 },
  { label: '200 – 500 Tr', min: 200000000, max: 500000000 },
  { label: 'Trên 500 Tr', min: 500000000, max: Infinity },
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
