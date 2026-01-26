import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'it' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  it: {
    // Header
    'header.search': 'Cerca attività...',
    'header.home': 'Home',
    'header.products': 'Prodotti',
    'header.classifieds': 'Annunci',
    'header.jobs': 'Lavoro',
    'header.discounts': 'Sconti',
    'header.solidarity': 'Solidarietà',
    'header.leaderboard': 'Classifica',
    'header.notifications': 'Notifiche',
    'header.messages': 'Messaggi',
    'header.profile': 'Profilo',
    'header.dashboard': 'Dashboard',
    'header.logout': 'Esci',
    'header.login': 'Accedi',
    'header.register': 'Registrati',
    'header.contact': 'Contatti',
    'header.contacts': 'Contatti',
    'header.plans': 'Piani',
    'header.subscription': 'Abbonamenti',
    'header.rules': 'Regole',
    'header.myProfile': 'Mio Profilo',
    'header.location': 'Sede',
    'header.selectedLocation': 'Sede selezionata',

    // Leaderboard
    'leaderboard.title': 'Classifica & Premi',
    'leaderboard.subtitle': 'Visualizza la tua posizione nella classifica Top 20 e scopri i premi disponibili',
    'leaderboard.tab.leaderboard': 'Classifica',
    'leaderboard.tab.activity': 'La Mia Attività',
    'leaderboard.tab.rewards': 'Premi',
    'leaderboard.yourPosition': 'La tua posizione',
    'leaderboard.points': 'punti',
    'leaderboard.reviews': 'recensioni',
    'leaderboard.prizesTitle': 'Premi in Palio',
    'leaderboard.prizesDescription': 'I migliori 20 utenti privati dell\'anno riceveranno gift card da 50€ a 500€. La classifica è pubblica per garantire massima trasparenza nella competizione. Continua a scrivere recensioni verificate per scalare la classifica e vincere premi fantastici!',
    'leaderboard.top20': 'Top 20 Utenti',
    'leaderboard.filter.all': 'Tutti',
    'leaderboard.filter.private': 'Privati',
    'leaderboard.filter.business': 'Professionisti',
    'leaderboard.noUsers': 'Nessun utente in classifica',
    'leaderboard.loading': 'Caricamento classifica...',
    'leaderboard.howToEarnCustomer': 'Come Guadagnare Punti - Utenti Privati e Membri Famiglia',
    'leaderboard.howToEarnBusiness': 'Come Guadagnare Punti - Professionisti',
    'leaderboard.allUsersEarn': 'Tutti gli utenti (profilo principale e membri della famiglia) guadagnano punti allo stesso modo:',
    'leaderboard.businessEarn': 'I professionisti guadagnano punti in base alle recensioni ricevute dai clienti e alle attività pubblicate.',
    'leaderboard.pointsNote': 'I punti delle recensioni vengono assegnati dopo l\'approvazione dello staff. Ogni utente compete individualmente nella classifica, inclusi i membri della famiglia.',
    'leaderboard.businessNote': 'I punti delle recensioni vengono assegnati solo dopo l\'approvazione dello staff. Maggiore è la qualità del servizio, maggiori saranno i punti guadagnati.',

    // Points
    'points.completeReview': 'per recensione completa (con valutazioni dettagliate)',
    'points.referral': 'quando un amico si abbona usando il tuo nickname',
    'points.basicReview': 'per recensione base (solo voto finale)',
    'points.addBusiness': 'per inserimento di un\'attività non presente',
    'points.addProduct': 'per ogni prodotto inserito',
    'points.addClassified': 'per ogni annuncio pubblicato',
    'points.review1star': 'per recensione a 1 stella ricevuta',
    'points.review2star': 'per recensione a 2 stelle ricevuta',
    'points.review3star': 'per recensione a 3 stelle ricevuta',
    'points.review4star': 'per recensione a 4 stelle ricevuta',
    'points.review5star': 'per recensione a 5 stelle ricevuta',
    'points.jobPosting': 'per ogni annuncio di lavoro pubblicato',

    // Rewards
    'rewards.customersTitle': 'Premi per Utenti Privati',
    'rewards.customersDescription': 'I migliori 20 utenti privati dell\'anno riceveranno fantastici premi in gift card.',
    'rewards.customersSubtitle': 'Continua a guadagnare punti scrivendo recensioni verificate con foto e dettagli. Maggiore è il tuo contributo alla community, maggiori saranno le tue possibilità di vincere!',
    'rewards.businessTitle': 'Premi per Professionisti',
    'rewards.businessDescription': 'I migliori 20 professionisti dell\'anno riceveranno riconoscimenti speciali per la loro eccellenza nel servizio clienti.',
    'rewards.businessSubtitle': 'Ricevi recensioni positive e scala la classifica per ottenere visibilità e premi esclusivi!',
    'rewards.1stPlace': '1° Posto',
    'rewards.2ndPlace': '2° Posto',
    'rewards.3rdPlace': '3° Posto',
    'rewards.4to5Place': '4° - 5° Posto',
    'rewards.6to10Place': '6° - 10° Posto',
    'rewards.11to20Place': '11° - 20° Posto',
    'rewards.2to5Place': '2° - 5° Posto',
    'rewards.6to20Place': '6° - 20° Posto',
    'rewards.giftCard500': 'Gift card da 500€',
    'rewards.giftCard200': 'Gift card da 200€',
    'rewards.giftCard150': 'Gift card da 150€',
    'rewards.giftCard100': 'Gift card da 100€',
    'rewards.giftCard75': 'Gift card da 75€',
    'rewards.giftCard50': 'Gift card da 50€',
    'rewards.giftCardNote': 'Le gift card potranno essere scelte tra una lista di brand e servizi che verrà pubblicata in seguito.',
    'rewards.excellenceCertificate': 'Certificato Eccellenza + Visibilità Premium',
    'rewards.qualityBadge': 'Badge Qualità + Promozione Premium',
    'rewards.recognitionBadge': 'Badge Riconoscimento + Visibilità Extra',
    'rewards.availableBadges': 'Badge Disponibili',
    'rewards.pointsRequired': 'punti richiesti',

    // Common
    'common.loading': 'Caricamento...',
    'common.error': 'Errore',
    'common.success': 'Successo',
    'common.save': 'Salva',
    'common.cancel': 'Annulla',
    'common.delete': 'Elimina',
    'common.edit': 'Modifica',
    'common.close': 'Chiudi',
    'common.search': 'Cerca',
    'common.filter': 'Filtra',
  },
  en: {
    // Header
    'header.search': 'Search business...',
    'header.home': 'Home',
    'header.products': 'Products',
    'header.classifieds': 'Classifieds',
    'header.jobs': 'Jobs',
    'header.discounts': 'Discounts',
    'header.solidarity': 'Solidarity',
    'header.leaderboard': 'Leaderboard',
    'header.notifications': 'Notifications',
    'header.messages': 'Messages',
    'header.profile': 'Profile',
    'header.dashboard': 'Dashboard',
    'header.logout': 'Logout',
    'header.login': 'Login',
    'header.register': 'Register',
    'header.contact': 'Contact',
    'header.contacts': 'Contacts',
    'header.plans': 'Plans',
    'header.subscription': 'Subscription',
    'header.rules': 'Rules',
    'header.myProfile': 'My Profile',
    'header.location': 'Location',
    'header.selectedLocation': 'Selected location',

    // Leaderboard
    'leaderboard.title': 'Leaderboard & Prizes',
    'leaderboard.subtitle': 'View your position in the Top 20 leaderboard and discover available prizes',
    'leaderboard.tab.leaderboard': 'Leaderboard',
    'leaderboard.tab.activity': 'My Activity',
    'leaderboard.tab.rewards': 'Rewards',
    'leaderboard.yourPosition': 'Your position',
    'leaderboard.points': 'points',
    'leaderboard.reviews': 'reviews',
    'leaderboard.prizesTitle': 'Prizes Available',
    'leaderboard.prizesDescription': 'The top 20 private users of the year will receive gift cards from €50 to €500. The leaderboard is public to ensure maximum transparency in the competition. Keep writing verified reviews to climb the leaderboard and win amazing prizes!',
    'leaderboard.top20': 'Top 20 Users',
    'leaderboard.filter.all': 'All',
    'leaderboard.filter.private': 'Private',
    'leaderboard.filter.business': 'Business',
    'leaderboard.noUsers': 'No users in leaderboard',
    'leaderboard.loading': 'Loading leaderboard...',
    'leaderboard.howToEarnCustomer': 'How to Earn Points - Private Users and Family Members',
    'leaderboard.howToEarnBusiness': 'How to Earn Points - Professionals',
    'leaderboard.allUsersEarn': 'All users (main profile and family members) earn points the same way:',
    'leaderboard.businessEarn': 'Professionals earn points based on customer reviews received and activities published.',
    'leaderboard.pointsNote': 'Review points are awarded after staff approval. Each user competes individually in the leaderboard, including family members.',
    'leaderboard.businessNote': 'Review points are awarded only after staff approval. The higher the quality of service, the more points earned.',

    // Points
    'points.completeReview': 'for complete review (with detailed ratings)',
    'points.referral': 'when a friend subscribes using your nickname',
    'points.basicReview': 'for basic review (final rating only)',
    'points.addBusiness': 'for adding a business not present',
    'points.addProduct': 'for each product added',
    'points.addClassified': 'for each ad published',
    'points.review1star': 'for 1-star review received',
    'points.review2star': 'for 2-star review received',
    'points.review3star': 'for 3-star review received',
    'points.review4star': 'for 4-star review received',
    'points.review5star': 'for 5-star review received',
    'points.jobPosting': 'for each job posting published',

    // Rewards
    'rewards.customersTitle': 'Rewards for Private Users',
    'rewards.customersDescription': 'The top 20 private users of the year will receive amazing gift card prizes.',
    'rewards.customersSubtitle': 'Keep earning points by writing verified reviews with photos and details. The greater your contribution to the community, the better your chances of winning!',
    'rewards.businessTitle': 'Rewards for Professionals',
    'rewards.businessDescription': 'The top 20 professionals of the year will receive special recognition for their excellence in customer service.',
    'rewards.businessSubtitle': 'Receive positive reviews and climb the leaderboard to gain visibility and exclusive rewards!',
    'rewards.1stPlace': '1st Place',
    'rewards.2ndPlace': '2nd Place',
    'rewards.3rdPlace': '3rd Place',
    'rewards.4to5Place': '4th - 5th Place',
    'rewards.6to10Place': '6th - 10th Place',
    'rewards.11to20Place': '11th - 20th Place',
    'rewards.2to5Place': '2nd - 5th Place',
    'rewards.6to20Place': '6th - 20th Place',
    'rewards.giftCard500': '€500 gift card',
    'rewards.giftCard200': '€200 gift card',
    'rewards.giftCard150': '€150 gift card',
    'rewards.giftCard100': '€100 gift card',
    'rewards.giftCard75': '€75 gift card',
    'rewards.giftCard50': '€50 gift card',
    'rewards.giftCardNote': 'Gift cards can be chosen from a list of brands and services that will be published later.',
    'rewards.excellenceCertificate': 'Excellence Certificate + Premium Visibility',
    'rewards.qualityBadge': 'Quality Badge + Premium Promotion',
    'rewards.recognitionBadge': 'Recognition Badge + Extra Visibility',
    'rewards.availableBadges': 'Available Badges',
    'rewards.pointsRequired': 'points required',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.filter': 'Filter',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'it';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['it']] || key;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
