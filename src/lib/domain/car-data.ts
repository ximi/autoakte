// Curated popular car brands and their common models for autocomplete.
// Deliberately not exhaustive — the form always accepts free text, so this
// only needs to cover what most users will type.

export const CAR_BRANDS: Record<string, string[]> = {
	'Alfa Romeo': ['Giulia', 'Giulietta', 'Stelvio', 'Tonale', 'MiTo', '147', '159'],
	Audi: [
		'A1',
		'A3',
		'A4',
		'A5',
		'A6',
		'A7',
		'A8',
		'Q2',
		'Q3',
		'Q4 e-tron',
		'Q5',
		'Q7',
		'Q8',
		'TT',
		'e-tron'
	],
	BMW: [
		'1 Series',
		'2 Series',
		'3 Series',
		'4 Series',
		'5 Series',
		'7 Series',
		'X1',
		'X2',
		'X3',
		'X4',
		'X5',
		'X6',
		'i3',
		'i4',
		'iX',
		'Z4'
	],
	Chevrolet: ['Spark', 'Aveo', 'Cruze', 'Camaro', 'Corvette'],
	Citroën: ['C1', 'C3', 'C3 Aircross', 'C4', 'C5 Aircross', 'C5 X', 'Berlingo', 'ë-C4'],
	Cupra: ['Born', 'Formentor', 'Leon', 'Ateca', 'Tavascan'],
	Dacia: ['Sandero', 'Duster', 'Logan', 'Jogger', 'Spring', 'Lodgy'],
	Fiat: ['500', '500e', '500X', 'Panda', 'Tipo', 'Punto', 'Ducato', 'Doblo'],
	Ford: [
		'Fiesta',
		'Focus',
		'Puma',
		'Kuga',
		'Mondeo',
		'Mustang',
		'Mustang Mach-E',
		'EcoSport',
		'Galaxy',
		'S-Max',
		'Transit',
		'Ranger',
		'Ka'
	],
	Honda: ['Civic', 'Jazz', 'CR-V', 'HR-V', 'e:Ny1', 'Accord'],
	Hyundai: ['i10', 'i20', 'i30', 'Kona', 'Tucson', 'Santa Fe', 'Ioniq 5', 'Ioniq 6', 'Bayon'],
	Jaguar: ['XE', 'XF', 'E-Pace', 'F-Pace', 'I-Pace', 'F-Type'],
	Jeep: ['Renegade', 'Compass', 'Avenger', 'Wrangler', 'Grand Cherokee'],
	Kia: ['Picanto', 'Rio', 'Ceed', 'XCeed', 'Sportage', 'Sorento', 'Niro', 'EV6', 'EV9', 'Stonic'],
	'Land Rover': [
		'Defender',
		'Discovery',
		'Discovery Sport',
		'Range Rover',
		'Range Rover Sport',
		'Range Rover Evoque',
		'Range Rover Velar'
	],
	Lexus: ['CT', 'IS', 'ES', 'NX', 'RX', 'UX'],
	Mazda: ['2', '3', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'MX-5', 'MX-30'],
	'Mercedes-Benz': [
		'A-Class',
		'B-Class',
		'C-Class',
		'E-Class',
		'S-Class',
		'CLA',
		'GLA',
		'GLB',
		'GLC',
		'GLE',
		'EQA',
		'EQB',
		'EQC',
		'EQE',
		'V-Class',
		'Sprinter',
		'Vito'
	],
	MG: ['MG4', 'MG5', 'ZS', 'HS', 'Marvel R'],
	Mini: ['Cooper', 'Cooper S', 'One', 'Clubman', 'Countryman', 'Electric'],
	Mitsubishi: ['Space Star', 'ASX', 'Eclipse Cross', 'Outlander', 'Colt'],
	Nissan: ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Leaf', 'Ariya', 'Note'],
	Opel: [
		'Corsa',
		'Astra',
		'Insignia',
		'Mokka',
		'Crossland',
		'Grandland',
		'Zafira',
		'Meriva',
		'Adam',
		'Combo'
	],
	Peugeot: [
		'108',
		'208',
		'2008',
		'308',
		'3008',
		'408',
		'508',
		'5008',
		'Partner',
		'Rifter',
		'e-208'
	],
	Polestar: ['1', '2', '3', '4'],
	Porsche: ['911', 'Boxster', 'Cayman', 'Panamera', 'Macan', 'Cayenne', 'Taycan'],
	Renault: [
		'Clio',
		'Captur',
		'Mégane',
		'Mégane E-Tech',
		'Arkana',
		'Austral',
		'Kadjar',
		'Scénic',
		'Twingo',
		'Zoe',
		'Kangoo',
		'Trafic'
	],
	Seat: ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco', 'Alhambra', 'Mii'],
	Škoda: [
		'Fabia',
		'Octavia',
		'Superb',
		'Kamiq',
		'Karoq',
		'Kodiaq',
		'Scala',
		'Enyaq',
		'Citigo',
		'Rapid'
	],
	Smart: ['ForTwo', 'ForFour', '#1', '#3'],
	Subaru: ['Impreza', 'XV', 'Forester', 'Outback', 'Solterra'],
	Suzuki: ['Swift', 'Ignis', 'Vitara', 'S-Cross', 'Jimny', 'Celerio'],
	Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X'],
	Toyota: [
		'Aygo',
		'Aygo X',
		'Yaris',
		'Yaris Cross',
		'Corolla',
		'C-HR',
		'RAV4',
		'Camry',
		'Prius',
		'bZ4X',
		'Land Cruiser',
		'Hilux',
		'Auris',
		'Avensis'
	],
	Volkswagen: [
		'Up',
		'Polo',
		'Golf',
		'ID.3',
		'ID.4',
		'ID.5',
		'ID.7',
		'ID. Buzz',
		'T-Cross',
		'T-Roc',
		'Taigo',
		'Tiguan',
		'Touran',
		'Touareg',
		'Passat',
		'Arteon',
		'Sharan',
		'Caddy',
		'Transporter',
		'Multivan',
		'Beetle'
	],
	Volvo: ['XC40', 'XC60', 'XC90', 'EX30', 'EX90', 'S60', 'S90', 'V40', 'V60', 'V90', 'C40']
};

export const BRAND_NAMES = Object.keys(CAR_BRANDS).sort((a, b) => a.localeCompare(b));

/** Models for a brand, tolerant of case and common aliases (e.g. "VW"). */
export function modelsForBrand(brand: string): string[] {
	const needle = brand.trim().toLowerCase();
	if (!needle) return [];
	const ALIASES: Record<string, string> = {
		vw: 'Volkswagen',
		mercedes: 'Mercedes-Benz',
		benz: 'Mercedes-Benz',
		skoda: 'Škoda',
		citroen: 'Citroën'
	};
	const resolved = ALIASES[needle];
	const match = BRAND_NAMES.find(
		(b) => b.toLowerCase() === (resolved ?? brand.trim()).toLowerCase()
	);
	return match ? CAR_BRANDS[match] : [];
}
