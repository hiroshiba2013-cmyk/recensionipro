import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface LocationFiltersProps {
  selectedRegion: string;
  selectedProvince: string;
  selectedCity: string;
  onRegionChange: (region: string) => void;
  onProvinceChange: (province: string) => void;
  onCityChange: (city: string) => void;
  showAllOption?: boolean;
  label?: string;
}

const ITALIAN_REGIONS = [
  'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
  'Trentino-Alto Adige', 'Umbria', 'Valle d\'Aosta', 'Veneto'
];

const PROVINCES_BY_REGION: Record<string, string[]> = {
  'Lombardia': ['Milano', 'Bergamo', 'Brescia', 'Como', 'Cremona', 'Lecco', 'Lodi', 'Mantova', 'Monza e Brianza', 'Pavia', 'Sondrio', 'Varese'],
  'Lazio': ['Roma', 'Frosinone', 'Latina', 'Rieti', 'Viterbo'],
  'Campania': ['Napoli', 'Avellino', 'Benevento', 'Caserta', 'Salerno'],
  'Sicilia': ['Palermo', 'Catania', 'Messina', 'Siracusa', 'Trapani', 'Ragusa', 'Caltanissetta', 'Agrigento', 'Enna'],
  'Veneto': ['Venezia', 'Verona', 'Padova', 'Vicenza', 'Treviso', 'Rovigo', 'Belluno'],
  'Emilia-Romagna': ['Bologna', 'Modena', 'Parma', 'Reggio Emilia', 'Ravenna', 'Ferrara', 'Forlì-Cesena', 'Piacenza', 'Rimini'],
  'Piemonte': ['Torino', 'Alessandria', 'Asti', 'Biella', 'Cuneo', 'Novara', 'Verbano-Cusio-Ossola', 'Vercelli'],
  'Puglia': ['Bari', 'Brindisi', 'Foggia', 'Lecce', 'Taranto', 'Barletta-Andria-Trani'],
  'Toscana': ['Firenze', 'Pisa', 'Livorno', 'Arezzo', 'Siena', 'Lucca', 'Pistoia', 'Grosseto', 'Prato', 'Massa-Carrara'],
  'Calabria': ['Catanzaro', 'Cosenza', 'Crotone', 'Reggio Calabria', 'Vibo Valentia'],
  'Sardegna': ['Cagliari', 'Sassari', 'Nuoro', 'Oristano', 'Sud Sardegna'],
  'Liguria': ['Genova', 'Imperia', 'Savona', 'La Spezia'],
  'Marche': ['Ancona', 'Ascoli Piceno', 'Fermo', 'Macerata', 'Pesaro e Urbino'],
  'Abruzzo': ['L\'Aquila', 'Chieti', 'Pescara', 'Teramo'],
  'Friuli-Venezia Giulia': ['Trieste', 'Gorizia', 'Udine', 'Pordenone'],
  'Trentino-Alto Adige': ['Trento', 'Bolzano'],
  'Umbria': ['Perugia', 'Terni'],
  'Basilicata': ['Potenza', 'Matera'],
  'Molise': ['Campobasso', 'Isernia'],
  'Valle d\'Aosta': ['Aosta']
};

const CITIES_BY_PROVINCE: Record<string, string[]> = {
  'Milano': ['Milano', 'Monza', 'Sesto San Giovanni', 'Cinisello Balsamo', 'Rho', 'Cologno Monzese', 'Paderno Dugnano', 'Bollate', 'Corsico', 'Segrate'],
  'Roma': ['Roma', 'Guidonia Montecelio', 'Fiumicino', 'Ardea', 'Pomezia', 'Anzio', 'Ciampino', 'Monterotondo', 'Velletri', 'Civitavecchia'],
  'Napoli': ['Napoli', 'Giugliano in Campania', 'Torre del Greco', 'Pozzuoli', 'Casoria', 'Marano di Napoli', 'Afragola', 'Acerra', 'Castellammare di Stabia', 'Portici'],
  'Torino': ['Torino', 'Moncalieri', 'Collegno', 'Rivoli', 'Settimo Torinese', 'Nichelino', 'Chieri', 'Ivrea', 'Pinerolo', 'Venaria Reale'],
  'Palermo': ['Palermo', 'Bagheria', 'Carini', 'Monreale', 'Partinico', 'Misilmeri', 'Termini Imerese', 'Cefalù', 'Corleone', 'Casteldaccia'],
  'Genova': ['Genova', 'Rapallo', 'Chiavari', 'Sestri Levante', 'Lavagna', 'Arenzano', 'Recco', 'Camogli', 'Santa Margherita Ligure', 'Cogoleto'],
  'Bologna': ['Bologna', 'Imola', 'Casalecchio di Reno', 'San Lazzaro di Savena', 'Castenaso', 'Pianoro', 'Zola Predosa', 'Granarolo dell\'Emilia', 'Borgo Panigale', 'San Giovanni in Persiceto'],
  'Firenze': ['Firenze', 'Prato', 'Empoli', 'Scandicci', 'Sesto Fiorentino', 'Campi Bisenzio', 'Pistoia', 'Bagno a Ripoli', 'Figline e Incisa Valdarno', 'Pontassieve'],
  'Bari': ['Bari', 'Altamura', 'Monopoli', 'Molfetta', 'Bitonto', 'Conversano', 'Triggiano', 'Corato', 'Modugno', 'Putignano'],
  'Catania': ['Catania', 'Acireale', 'Misterbianco', 'Paternò', 'Adrano', 'Mascalucia', 'Belpasso', 'Caltagirone', 'Giarre', 'Gravina di Catania'],
  'Venezia': ['Venezia', 'Mestre', 'Mira', 'Spinea', 'Marghera', 'Chioggia', 'San Donà di Piave', 'Portogruaro', 'Jesolo', 'Mirano'],
  'Verona': ['Verona', 'San Bonifacio', 'Villafranca di Verona', 'Legnago', 'Bussolengo', 'San Giovanni Lupatoto', 'Sona', 'Sommacampagna', 'Pescantina', 'Negrar'],
  'Padova': ['Padova', 'Abano Terme', 'Cittadella', 'Cadoneghe', 'Vigonza', 'Albignasego', 'Rubano', 'Selvazzano Dentro', 'Limena', 'Piove di Sacco'],
  'Trieste': ['Trieste', 'Muggia', 'Duino-Aurisina', 'San Dorligo della Valle', 'Sgonico', 'Monrupino'],
  'Varese': ['Varese', 'Busto Arsizio', 'Gallarate', 'Saronno', 'Castellanza', 'Tradate', 'Malnate', 'Luino', 'Cassano Magnago', 'Arcisate'],
  'Bergamo': ['Bergamo', 'Treviglio', 'Seriate', 'Dalmine', 'Romano di Lombardia', 'Albino', 'Caravaggio', 'Stezzano', 'Alzano Lombardo', 'Osio Sotto'],
  'Brescia': ['Brescia', 'Desenzano del Garda', 'Lumezzane', 'Montichiari', 'Chiari', 'Palazzolo sull\'Oglio', 'Manerbio', 'Rezzato', 'Ghedi', 'Concesio'],
  'Como': ['Como', 'Cantù', 'Erba', 'Mariano Comense', 'Olgiate Comasco', 'Lomazzo', 'Lurate Caccivio', 'Menaggio', 'Cernobbio', 'Lipomo'],
};

export function LocationFilters({
  selectedRegion,
  selectedProvince,
  selectedCity,
  onRegionChange,
  onProvinceChange,
  onCityChange,
  showAllOption = true,
  label = 'Filtri Geografici'
}: LocationFiltersProps) {
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (selectedRegion && selectedRegion !== '') {
      setProvinces(PROVINCES_BY_REGION[selectedRegion] || []);
      onProvinceChange('');
      onCityChange('');
    } else {
      setProvinces([]);
      setCities([]);
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedProvince && selectedProvince !== '') {
      setCities(CITIES_BY_PROVINCE[selectedProvince] || []);
      onCityChange('');
    } else {
      setCities([]);
    }
  }, [selectedProvince]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">{label}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Regione
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => onRegionChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {showAllOption && <option value="">Tutte le regioni</option>}
            {!showAllOption && <option value="">Seleziona regione</option>}
            {ITALIAN_REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provincia
          </label>
          <select
            value={selectedProvince}
            onChange={(e) => onProvinceChange(e.target.value)}
            disabled={!selectedRegion}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {showAllOption && <option value="">Tutte le province</option>}
            {!showAllOption && <option value="">Seleziona provincia</option>}
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Città
          </label>
          <select
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            disabled={!selectedProvince}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {showAllOption && <option value="">Tutte le città</option>}
            {!showAllOption && <option value="">Seleziona città</option>}
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
