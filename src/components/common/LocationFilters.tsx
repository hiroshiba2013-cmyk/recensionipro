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
  'Milano': ['Milano', 'Monza', 'Sesto San Giovanni', 'Cinisello Balsamo', 'Rho', 'Cologno Monzese', 'Paderno Dugnano', 'Bollate', 'Corsico', 'Segrate', 'Pioltello', 'Gorgonzola', 'Melzo', 'Bresso', 'Cusano Milanino', 'Cormano', 'Novate Milanese', 'Legnano', 'Magenta', 'Abbiategrasso'],
  'Roma': ['Roma', 'Guidonia Montecelio', 'Fiumicino', 'Ardea', 'Pomezia', 'Anzio', 'Ciampino', 'Monterotondo', 'Velletri', 'Civitavecchia', 'Ladispoli', 'Tivoli', 'Marino', 'Colleferro', 'Albano Laziale', 'Cerveteri', 'Nettuno', 'Genzano di Roma', 'Frascati', 'Bracciano'],
  'Napoli': ['Napoli', 'Giugliano in Campania', 'Torre del Greco', 'Pozzuoli', 'Casoria', 'Marano di Napoli', 'Afragola', 'Acerra', 'Castellammare di Stabia', 'Portici', 'Ercolano', 'Quarto', 'Qualiano', 'Villaricca', 'Vico Equense', 'Somma Vesuviana', 'Pompei', 'Aversa', 'Frattamaggiore', 'Bacoli'],
  'Torino': ['Torino', 'Moncalieri', 'Collegno', 'Rivoli', 'Settimo Torinese', 'Nichelino', 'Chieri', 'Ivrea', 'Pinerolo', 'Venaria Reale', 'Grugliasco', 'Orbassano', 'Alpignano', 'Carmagnola', 'Beinasco', 'Volpiano', 'San Mauro Torinese', 'Borgaro Torinese', 'Caselle Torinese', 'Avigliana'],
  'Palermo': ['Palermo', 'Bagheria', 'Carini', 'Monreale', 'Partinico', 'Misilmeri', 'Termini Imerese', 'Cefalù', 'Corleone', 'Casteldaccia', 'Capaci', 'Villabate', 'Ficarazzi', 'Altofonte', 'Trabia', 'Isola delle Femmine', 'Cinisi', 'Petralia Sottana', 'Lercara Friddi', 'Castelbuono'],
  'Genova': ['Genova', 'Rapallo', 'Chiavari', 'Sestri Levante', 'Lavagna', 'Arenzano', 'Recco', 'Camogli', 'Santa Margherita Ligure', 'Cogoleto', 'Bogliasco', 'Nervi', 'Pegli', 'Voltri', 'Busalla', 'Ronco Scrivia', 'Cicagna', 'Zoagli', 'Bargagli', 'Torriglia'],
  'Bologna': ['Bologna', 'Imola', 'Casalecchio di Reno', 'San Lazzaro di Savena', 'Castenaso', 'Pianoro', 'Zola Predosa', 'Granarolo dell\'Emilia', 'San Giovanni in Persiceto', 'Molinella', 'Anzola dell\'Emilia', 'Calderara di Reno', 'Castel Maggiore', 'Sasso Marconi', 'Crevalcore', 'Budrio', 'Medicina', 'Minerbio', 'Castel San Pietro Terme', 'Ozzano dell\'Emilia'],
  'Firenze': ['Firenze', 'Prato', 'Empoli', 'Scandicci', 'Sesto Fiorentino', 'Campi Bisenzio', 'Pistoia', 'Bagno a Ripoli', 'Figline e Incisa Valdarno', 'Pontassieve', 'Calenzano', 'Signa', 'Lastra a Signa', 'Montespertoli', 'Certaldo', 'Castelfiorentino', 'Vinci', 'Carmignano', 'Montelupo Fiorentino', 'Barberino Val d\'Elsa'],
  'Bari': ['Bari', 'Altamura', 'Monopoli', 'Molfetta', 'Bitonto', 'Conversano', 'Triggiano', 'Corato', 'Modugno', 'Putignano', 'Acquaviva delle Fonti', 'Giovinazzo', 'Ruvo di Puglia', 'Gravina in Puglia', 'Noicattaro', 'Terlizzi', 'Polignano a Mare', 'Valenzano', 'Adelfia', 'Capurso'],
  'Catania': ['Catania', 'Acireale', 'Misterbianco', 'Paternò', 'Adrano', 'Mascalucia', 'Belpasso', 'Caltagirone', 'Giarre', 'Gravina di Catania', 'Tremestieri Etneo', 'San Giovanni La Punta', 'Pedara', 'Aci Catena', 'Aci Sant\'Antonio', 'Biancavilla', 'Bronte', 'Riposto', 'Nicolosi', 'Randazzo'],
  'Venezia': ['Venezia', 'Mestre', 'Mira', 'Spinea', 'Marghera', 'Chioggia', 'San Donà di Piave', 'Portogruaro', 'Jesolo', 'Mirano', 'Dolo', 'Noale', 'Martellago', 'Mogliano Veneto', 'Salzano', 'Scorzè', 'Fossò', 'Vigonovo', 'Caorle', 'Eraclea'],
  'Verona': ['Verona', 'San Bonifacio', 'Villafranca di Verona', 'Legnago', 'Bussolengo', 'San Giovanni Lupatoto', 'Sona', 'Sommacampagna', 'Pescantina', 'Negrar', 'Valeggio sul Mincio', 'Cerea', 'Isola della Scala', 'Castelnuovo del Garda', 'Zevio', 'Peschiera del Garda', 'Bardolino', 'Bovolone', 'San Martino Buon Albergo', 'Garda'],
  'Padova': ['Padova', 'Abano Terme', 'Cittadella', 'Cadoneghe', 'Vigonza', 'Albignasego', 'Rubano', 'Selvazzano Dentro', 'Limena', 'Piove di Sacco', 'Monselice', 'Este', 'Montegrotto Terme', 'Noventa Padovana', 'Ponte San Nicolò', 'Campodarsego', 'Villafranca Padovana', 'Casalserugo', 'Mestrino', 'Vigodarzere'],
  'Trieste': ['Trieste', 'Muggia', 'Duino-Aurisina', 'San Dorligo della Valle', 'Sgonico', 'Monrupino', 'Opicina', 'Prosecco', 'Barcola', 'Grignano'],
  'Varese': ['Varese', 'Busto Arsizio', 'Gallarate', 'Saronno', 'Castellanza', 'Tradate', 'Malnate', 'Luino', 'Cassano Magnago', 'Arcisate', 'Somma Lombardo', 'Laveno-Mombello', 'Gavirate', 'Vergiate', 'Induno Olona', 'Sesto Calende', 'Gorla Minore', 'Cocquio-Trevisago', 'Carnago', 'Caronno Pertusella'],
  'Bergamo': ['Bergamo', 'Treviglio', 'Seriate', 'Dalmine', 'Romano di Lombardia', 'Albino', 'Caravaggio', 'Stezzano', 'Alzano Lombardo', 'Osio Sotto', 'Ponte San Pietro', 'Lovere', 'Clusone', 'Zogno', 'Sarnico', 'Nembro', 'Grumello del Monte', 'Calusco d\'Adda', 'Curno', 'Ciserano'],
  'Brescia': ['Brescia', 'Desenzano del Garda', 'Lumezzane', 'Montichiari', 'Chiari', 'Palazzolo sull\'Oglio', 'Manerbio', 'Rezzato', 'Ghedi', 'Concesio', 'Gardone Val Trompia', 'Salò', 'Rovato', 'Orzinuovi', 'Gussago', 'Lonato del Garda', 'Iseo', 'Calcinato', 'Carpenedolo', 'Leno'],
  'Como': ['Como', 'Cantù', 'Erba', 'Mariano Comense', 'Olgiate Comasco', 'Lomazzo', 'Lurate Caccivio', 'Menaggio', 'Cernobbio', 'Lipomo', 'Fino Mornasco', 'Cabiate', 'Appiano Gentile', 'Turate', 'Novedrate', 'Mozzate', 'Bellagio', 'Varenna', 'Argegno', 'Gravedona'],
  'Cremona': ['Cremona', 'Crema', 'Casalmaggiore', 'Castelleone', 'Soresina', 'Pandino', 'Pizzighettone', 'Rivolta d\'Adda', 'Spino d\'Adda', 'Vailate'],
  'Lecco': ['Lecco', 'Merate', 'Calolziocorte', 'Bellano', 'Mandello del Lario', 'Oggiono', 'Valmadrera', 'Colico', 'Brivio', 'Casatenovo'],
  'Lodi': ['Lodi', 'Codogno', 'Sant\'Angelo Lodigiano', 'Casalpusterlengo', 'Lodi Vecchio', 'Tavazzano con Villavesco', 'Caselle Landi', 'Massalengo', 'Somaglia', 'Borghetto Lodigiano'],
  'Mantova': ['Mantova', 'Castiglione delle Stiviere', 'Suzzara', 'Asola', 'Viadana', 'Ostiglia', 'Castel Goffredo', 'Gonzaga', 'Porto Mantovano', 'Goito'],
  'Monza e Brianza': ['Monza', 'Desio', 'Seregno', 'Lissone', 'Vimercate', 'Cesano Maderno', 'Limbiate', 'Brugherio', 'Meda', 'Giussano', 'Carate Brianza', 'Concorezzo', 'Muggiò', 'Nova Milanese', 'Seveso', 'Agrate Brianza', 'Arcore', 'Biassono', 'Bovisio-Masciago', 'Carnate'],
  'Pavia': ['Pavia', 'Vigevano', 'Voghera', 'Stradella', 'Mortara', 'Broni', 'Garlasco', 'Casteggio', 'Belgioioso', 'Varzi'],
  'Sondrio': ['Sondrio', 'Morbegno', 'Tirano', 'Chiavenna', 'Bormio', 'Livigno', 'Aprica', 'Chiesa in Valmalenco', 'Ponte in Valtellina', 'Valdisotto'],
  'Modena': ['Modena', 'Carpi', 'Sassuolo', 'Formigine', 'Vignola', 'Castelfranco Emilia', 'Maranello', 'Mirandola', 'Fiorano Modenese', 'Pavullo nel Frignano'],
  'Parma': ['Parma', 'Fidenza', 'Salsomaggiore Terme', 'Langhirano', 'Colorno', 'Fornovo di Taro', 'Noceto', 'Medesano', 'Traversetolo', 'Collecchio'],
  'Reggio Emilia': ['Reggio Emilia', 'Correggio', 'Guastalla', 'Scandiano', 'Montecchio Emilia', 'Rubiera', 'Castelnovo ne\' Monti', 'San Martino in Rio', 'Cadelbosco di Sopra', 'Novellara'],
  'Ravenna': ['Ravenna', 'Faenza', 'Lugo', 'Cervia', 'Russi', 'Alfonsine', 'Bagnacavallo', 'Castel Bolognese', 'Massa Lombarda', 'Conselice'],
  'Ferrara': ['Ferrara', 'Cento', 'Comacchio', 'Argenta', 'Bondeno', 'Codigoro', 'Portomaggiore', 'Copparo', 'Mesola', 'Goro'],
  'Forlì-Cesena': ['Forlì', 'Cesena', 'Cesenatico', 'Savignano sul Rubicone', 'Forlimpopoli', 'Castrocaro Terme', 'Bertinoro', 'Gambettola', 'San Mauro Pascoli', 'Meldola'],
  'Piacenza': ['Piacenza', 'Fiorenzuola d\'Arda', 'Castel San Giovanni', 'Rottofreno', 'Podenzano', 'Borgonovo Val Tidone', 'Carpaneto Piacentino', 'Bobbio', 'Gragnano Trebbiense', 'Pontenure'],
  'Rimini': ['Rimini', 'Riccione', 'Cattolica', 'Bellaria-Igea Marina', 'Santarcangelo di Romagna', 'San Giovanni in Marignano', 'Novafeltria', 'Misano Adriatico', 'Coriano', 'Verucchio'],
  'Alessandria': ['Alessandria', 'Casale Monferrato', 'Novi Ligure', 'Tortona', 'Acqui Terme', 'Valenza', 'Ovada', 'Castelnuovo Scrivia', 'Arquata Scrivia', 'Cassine'],
  'Asti': ['Asti', 'Nizza Monferrato', 'Canelli', 'San Damiano d\'Asti', 'Villanova d\'Asti', 'Moncalvo', 'Costigliole d\'Asti', 'Villafranca d\'Asti', 'Castelnuovo Don Bosco', 'Baldichieri d\'Asti'],
  'Biella': ['Biella', 'Cossato', 'Candelo', 'Valdilana', 'Gaglianico', 'Trivero', 'Mosso', 'Pray', 'Vigliano Biellese', 'Cavaglià'],
  'Cuneo': ['Cuneo', 'Alba', 'Bra', 'Fossano', 'Savigliano', 'Mondovì', 'Saluzzo', 'Borgo San Dalmazzo', 'Racconigi', 'Busca'],
  'Novara': ['Novara', 'Borgomanero', 'Arona', 'Galliate', 'Trecate', 'Oleggio', 'Castelletto sopra Ticino', 'Cameri', 'Biandrate', 'Bellinzago Novarese'],
  'Verbano-Cusio-Ossola': ['Verbania', 'Domodossola', 'Gravellona Toce', 'Omegna', 'Baveno', 'Cannobio', 'Stresa', 'Villadossola', 'Premosello-Chiovenda', 'Vogogna'],
  'Vercelli': ['Vercelli', 'Borgosesia', 'Santhià', 'Trino', 'Gattinara', 'Cigliano', 'Crescentino', 'Livorno Ferraris', 'Varallo', 'Serravalle Sesia'],
  'Brindisi': ['Brindisi', 'Fasano', 'Ostuni', 'Francavilla Fontana', 'San Vito dei Normanni', 'Mesagne', 'Ceglie Messapica', 'Latiano', 'Carovigno', 'Cisternino'],
  'Foggia': ['Foggia', 'Cerignola', 'Manfredonia', 'San Severo', 'Lucera', 'Andria', 'San Giovanni Rotondo', 'Trani', 'Barletta', 'Vieste'],
  'Lecce': ['Lecce', 'Nardò', 'Copertino', 'Galatina', 'Gallipoli', 'Casarano', 'Maglie', 'Surbo', 'Trepuzzi', 'Campi Salentina'],
  'Taranto': ['Taranto', 'Martina Franca', 'Grottaglie', 'Massafra', 'Manduria', 'Ginosa', 'Castellaneta', 'Palagiano', 'Statte', 'Crispiano'],
  'Barletta-Andria-Trani': ['Barletta', 'Andria', 'Trani', 'Bisceglie', 'Canosa di Puglia', 'Margherita di Savoia', 'San Ferdinando di Puglia', 'Trinitapoli', 'Minervino Murge', 'Spinazzola'],
  'Pisa': ['Pisa', 'Pontedera', 'Volterra', 'San Giuliano Terme', 'Cascina', 'Vecchiano', 'Capannoli', 'Santa Croce sull\'Arno', 'Castelfranco di Sotto', 'Vicopisano'],
  'Livorno': ['Livorno', 'Piombino', 'Cecina', 'Rosignano Marittimo', 'Portoferraio', 'Collesalvetti', 'Campiglia Marittima', 'Venturina Terme', 'San Vincenzo', 'Capraia Isola'],
  'Arezzo': ['Arezzo', 'Cortona', 'Sansepolcro', 'Monte San Savino', 'Bibbiena', 'Montevarchi', 'Cavriglia', 'Castiglion Fiorentino', 'Terranuova Bracciolini', 'Foiano della Chiana'],
  'Siena': ['Siena', 'Poggibonsi', 'Colle di Val d\'Elsa', 'Montepulciano', 'Sinalunga', 'Chiusi', 'Abbadia San Salvatore', 'Montalcino', 'San Gimignano', 'Piancastagnaio'],
  'Lucca': ['Lucca', 'Viareggio', 'Capannori', 'Camaiore', 'Pietrasanta', 'Altopascio', 'Massarosa', 'Porcari', 'Forte dei Marmi', 'Barga'],
  'Pistoia': ['Pistoia', 'Montecatini Terme', 'Quarrata', 'Agliana', 'Monsummano Terme', 'Pescia', 'Serravalle Pistoiese', 'Montale', 'Marliana', 'Ponte Buggianese'],
  'Grosseto': ['Grosseto', 'Follonica', 'Orbetello', 'Castiglione della Pescaia', 'Massa Marittima', 'Monte Argentario', 'Roccastrada', 'Gavorrano', 'Scansano', 'Manciano'],
  'Massa-Carrara': ['Massa', 'Carrara', 'Montignoso', 'Pontremoli', 'Aulla', 'Fivizzano', 'Villafranca in Lunigiana', 'Fosdinovo', 'Licciana Nardi', 'Bagnone'],
  'Catanzaro': ['Catanzaro', 'Lamezia Terme', 'Soverato', 'Sellia Marina', 'Chiaravalle Centrale', 'Girifalco', 'Squillace', 'Davoli', 'Montepaone', 'Botricello'],
  'Cosenza': ['Cosenza', 'Rende', 'Corigliano-Rossano', 'Castrovillari', 'Paola', 'Acri', 'Crotone', 'San Giovanni in Fiore', 'Cassano allo Ionio', 'Rogliano'],
  'Crotone': ['Crotone', 'Cirò Marina', 'Isola di Capo Rizzuto', 'Cutro', 'Petilia Policastro', 'Cirò', 'Mesoraca', 'Strongoli', 'Santa Severina', 'Rocca di Neto'],
  'Reggio Calabria': ['Reggio Calabria', 'Gioia Tauro', 'Locri', 'Siderno', 'Palmi', 'Melito di Porto Salvo', 'Taurianova', 'Polistena', 'Villa San Giovanni', 'Rosarno'],
  'Vibo Valentia': ['Vibo Valentia', 'Tropea', 'Pizzo', 'Mileto', 'Serra San Bruno', 'Soriano Calabro', 'Ricadi', 'Joppolo', 'Nicotera', 'Filadelfia'],
  'Cagliari': ['Cagliari', 'Quartu Sant\'Elena', 'Assemini', 'Selargius', 'Capoterra', 'Monserrato', 'Sestu', 'Dolianova', 'Sinnai', 'Decimomannu'],
  'Sassari': ['Sassari', 'Alghero', 'Porto Torres', 'Sorso', 'Olbia', 'Tempio Pausania', 'La Maddalena', 'Arzachena', 'Ozieri', 'Valledoria'],
  'Nuoro': ['Nuoro', 'Siniscola', 'Macomer', 'Orosei', 'Tortolì', 'Dorgali', 'Bosa', 'Bitti', 'Posada', 'Lanusei'],
  'Oristano': ['Oristano', 'Terralba', 'Cabras', 'Ghilarza', 'Bosa', 'Santa Giusta', 'Marrubiu', 'Ales', 'Cuglieri', 'Santu Lussurgiu'],
  'Sud Sardegna': ['Carbonia', 'Iglesias', 'Giba', 'Sant\'Antioco', 'Carloforte', 'Portoscuso', 'Villamassargia', 'Santadi', 'Muravera', 'San Giovanni Suergiu'],
  'Imperia': ['Imperia', 'Sanremo', 'Ventimiglia', 'Bordighera', 'Taggia', 'Diano Marina', 'Vallecrosia', 'Camporosso', 'Arma di Taggia', 'Riva Ligure'],
  'Savona': ['Savona', 'Albenga', 'Finale Ligure', 'Loano', 'Varazze', 'Cairo Montenotte', 'Carcare', 'Borghetto Santo Spirito', 'Pietra Ligure', 'Albissola Marina'],
  'La Spezia': ['La Spezia', 'Sarzana', 'Lerici', 'Santo Stefano di Magra', 'Arcola', 'Levanto', 'Vezzano Ligure', 'Castelnuovo Magra', 'Portovenere', 'Ameglia'],
  'Ancona': ['Ancona', 'Jesi', 'Senigallia', 'Fabriano', 'Osimo', 'Falconara Marittima', 'Castelfidardo', 'Chiaravalle', 'Loreto', 'Camerano'],
  'Ascoli Piceno': ['Ascoli Piceno', 'San Benedetto del Tronto', 'Grottammare', 'Montegranaro', 'Cupra Marittima', 'Folignano', 'Castel di Lama', 'Acquaviva Picena', 'Offida', 'Ripatransone'],
  'Fermo': ['Fermo', 'Porto San Giorgio', 'Porto Sant\'Elpidio', 'Sant\'Elpidio a Mare', 'Montegranaro', 'Monte Urano', 'Civitanova Marche', 'Montegiorgio', 'Amandola', 'Montappone'],
  'Macerata': ['Macerata', 'Civitanova Marche', 'Corridonia', 'Recanati', 'Tolentino', 'Potenza Picena', 'Pollenza', 'Morrovalle', 'Montecosaro', 'Porto Recanati'],
  'Pesaro e Urbino': ['Pesaro', 'Fano', 'Urbino', 'Gabicce Mare', 'Cattolica', 'Mondolfo', 'Marotta', 'Fossombrone', 'Pergola', 'Cagli'],
  'L\'Aquila': ['L\'Aquila', 'Avezzano', 'Sulmona', 'Celano', 'Pratola Peligna', 'Carsoli', 'Tagliacozzo', 'Capistrello', 'Trasacco', 'Castel di Sangro'],
  'Chieti': ['Chieti', 'Lanciano', 'Vasto', 'San Salvo', 'Ortona', 'Francavilla al Mare', 'Atessa', 'Guardiagrele', 'Casoli', 'Fossacesia'],
  'Pescara': ['Pescara', 'Montesilvano', 'Spoltore', 'Città Sant\'Angelo', 'Penne', 'Popoli', 'Manoppello', 'Loreto Aprutino', 'Cappelle sul Tavo', 'Scafa'],
  'Teramo': ['Teramo', 'Giulianova', 'Roseto degli Abruzzi', 'Alba Adriatica', 'Martinsicuro', 'Pineto', 'Silvi', 'Atri', 'Sant\'Egidio alla Vibrata', 'Nereto'],
  'Gorizia': ['Gorizia', 'Monfalcone', 'Gradisca d\'Isonzo', 'Cormons', 'Ronchi dei Legionari', 'Staranzano', 'Grado', 'Fogliano Redipuglia', 'San Canzian d\'Isonzo', 'Turriaco'],
  'Udine': ['Udine', 'Codroipo', 'Cividale del Friuli', 'Gemona del Friuli', 'Tavagnacco', 'Latisana', 'San Daniele del Friuli', 'Lignano Sabbiadoro', 'Tolmezzo', 'Cervignano del Friuli'],
  'Pordenone': ['Pordenone', 'Maniago', 'Sacile', 'Spilimbergo', 'San Vito al Tagliamento', 'Azzano Decimo', 'Cordenons', 'Brugnera', 'Fontanafredda', 'Fiume Veneto'],
  'Trento': ['Trento', 'Rovereto', 'Pergine Valsugana', 'Arco', 'Riva del Garda', 'Mori', 'Lavis', 'Levico Terme', 'Ala', 'Cles'],
  'Bolzano': ['Bolzano', 'Merano', 'Bressanone', 'Brunico', 'Lana', 'Laives', 'Appiano sulla Strada del Vino', 'Vipiteno', 'Egna', 'Chiusa'],
  'Perugia': ['Perugia', 'Terni', 'Foligno', 'Città di Castello', 'Spoleto', 'Gubbio', 'Assisi', 'Bastia Umbra', 'Corciano', 'Umbertide'],
  'Terni': ['Terni', 'Orvieto', 'Narni', 'Amelia', 'Marsciano', 'Todi', 'Castiglione del Lago', 'Acquasparta', 'Gualdo Cattaneo', 'Avigliano Umbro'],
  'Potenza': ['Potenza', 'Melfi', 'Lavello', 'Rionero in Vulture', 'Venosa', 'Lauria', 'Avigliano', 'Maratea', 'Bella', 'Pignola'],
  'Matera': ['Matera', 'Policoro', 'Pisticci', 'Nova Siri', 'Montescaglioso', 'Bernalda', 'Scanzano Jonico', 'Tursi', 'Rotondella', 'Stigliano'],
  'Campobasso': ['Campobasso', 'Termoli', 'Isernia', 'Campomarino', 'Venafro', 'Larino', 'Trivento', 'Bojano', 'Riccia', 'Guglionesi'],
  'Isernia': ['Isernia', 'Venafro', 'Agnone', 'Castel di Sangro', 'Bojano', 'Miranda', 'Macchiagodena', 'Pozzilli', 'Sessano del Molise', 'Montaquila'],
  'Aosta': ['Aosta', 'Saint-Vincent', 'Courmayeur', 'Châtillon', 'Verrès', 'Morgex', 'Gressan', 'Saint-Pierre', 'Pont-Saint-Martin', 'Arnad'],
  'Vicenza': ['Vicenza', 'Bassano del Grappa', 'Schio', 'Arzignano', 'Thiene', 'Valdagno', 'Montecchio Maggiore', 'Lonigo', 'Marostica', 'Rosà'],
  'Treviso': ['Treviso', 'Conegliano', 'Castelfranco Veneto', 'Vittorio Veneto', 'Montebelluna', 'Oderzo', 'Mogliano Veneto', 'Paese', 'Villorba', 'Quinto di Treviso'],
  'Rovigo': ['Rovigo', 'Adria', 'Porto Viro', 'Badia Polesine', 'Lendinara', 'Occhiobello', 'Porto Tolle', 'Taglio di Po', 'Castelnovo Bariano', 'Arquà Polesine'],
  'Belluno': ['Belluno', 'Feltre', 'Cortina d\'Ampezzo', 'Sedico', 'Agordo', 'Pieve di Cadore', 'Mel', 'Longarone', 'Santa Giustina', 'Ponte nelle Alpi'],
  'Messina': ['Messina', 'Barcellona Pozzo di Gotto', 'Milazzo', 'Patti', 'Giardini-Naxos', 'Sant\'Agata di Militello', 'Taormina', 'Lipari', 'Capo d\'Orlando', 'Spadafora'],
  'Siracusa': ['Siracusa', 'Noto', 'Augusta', 'Avola', 'Lentini', 'Pachino', 'Rosolini', 'Priolo Gargallo', 'Floridia', 'Portopalo di Capo Passero'],
  'Trapani': ['Trapani', 'Marsala', 'Mazara del Vallo', 'Alcamo', 'Castelvetrano', 'Erice', 'Salemi', 'Favignana', 'Valderice', 'Partanna'],
  'Ragusa': ['Ragusa', 'Vittoria', 'Modica', 'Comiso', 'Pozzallo', 'Scicli', 'Acate', 'Santa Croce Camerina', 'Ispica', 'Chiaramonte Gulfi'],
  'Caltanissetta': ['Caltanissetta', 'Gela', 'Niscemi', 'Mazzarino', 'San Cataldo', 'Riesi', 'Sommatino', 'Serradifalco', 'Mussomeli', 'Butera'],
  'Agrigento': ['Agrigento', 'Licata', 'Canicattì', 'Sciacca', 'Favara', 'Ribera', 'Palma di Montechiaro', 'Menfi', 'Racalmuto', 'Campobello di Licata'],
  'Enna': ['Enna', 'Piazza Armerina', 'Leonforte', 'Nicosia', 'Barrafranca', 'Valguarnera Caropepe', 'Aidone', 'Troina', 'Agira', 'Centuripe'],
  'Frosinone': ['Frosinone', 'Cassino', 'Alatri', 'Sora', 'Ceccano', 'Ferentino', 'Anagni', 'Veroli', 'Pontecorvo', 'Monte San Giovanni Campano'],
  'Latina': ['Latina', 'Aprilia', 'Terracina', 'Formia', 'Cisterna di Latina', 'Fondi', 'Priverno', 'Minturno', 'Sabaudia', 'Sezze'],
  'Rieti': ['Rieti', 'Cittaducale', 'Poggio Mirteto', 'Fara in Sabina', 'Amatrice', 'Montopoli di Sabina', 'Leonessa', 'Cantalice', 'Magliano Sabina', 'Borgorose'],
  'Viterbo': ['Viterbo', 'Civita Castellana', 'Tarquinia', 'Montefiascone', 'Orte', 'Vetralla', 'Tuscania', 'Nepi', 'Capranica', 'Soriano nel Cimino'],
  'Avellino': ['Avellino', 'Ariano Irpino', 'Monteforte Irpino', 'Mercogliano', 'Atripalda', 'Solofra', 'Montoro', 'Grottaminarda', 'Cervinara', 'Mirabella Eclano'],
  'Benevento': ['Benevento', 'Montesarchio', 'San Giorgio del Sannio', 'Sant\'Agata de\' Goti', 'San Bartolomeo in Galdo', 'Airola', 'Apollosa', 'Apice', 'Telese Terme', 'Limatola'],
  'Caserta': ['Caserta', 'Aversa', 'Marcianise', 'Maddaloni', 'Santa Maria Capua Vetere', 'Capua', 'Orta di Atella', 'Mondragone', 'San Felice a Cancello', 'Casal di Principe'],
  'Salerno': ['Salerno', 'Battipaglia', 'Cava de\' Tirreni', 'Nocera Inferiore', 'Eboli', 'Scafati', 'Pagani', 'Agropoli', 'Sarno', 'Pontecagnano Faiano'],
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
    } else {
      setProvinces([]);
      setCities([]);
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedProvince && selectedProvince !== '') {
      setCities(CITIES_BY_PROVINCE[selectedProvince] || []);
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
