import { MapPin, Facebook, Instagram, Mail } from 'lucide-react';
import { useNavigate } from '../Router';

export function Footer() {
  const navigate = useNavigate();

  const columns = [
    {
      title: 'Navigazione',
      links: [
        { label: 'Solidarietà', href: '/solidarity' },
        { label: 'Piani', href: '/subscription' },
        { label: 'Regole', href: '/rules' },
      ],
    },
    {
      title: 'Azienda',
      links: [
        { label: 'Contatti', href: '/contact' },
        { label: 'Chi siamo', href: '/contact' },
      ],
    },
    {
      title: 'Supporto',
      links: [
        { label: 'Domande frequenti', href: '/rules#faq' },
        { label: 'Privacy e Cookie', href: '/rules' },
      ],
    },
    {
      title: 'Legale',
      links: [
        { label: 'Termini di servizio', href: '/rules' },
        { label: 'Privacy Policy', href: '/rules' },
        { label: "Condizioni d'uso", href: '/rules' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-white pt-14 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-8 mb-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">Trovafacile</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              La piattaforma che connette persone e attività locali in tutta Italia.
            </p>
            <div className="flex gap-3">
              <button className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4 text-gray-400" />
              </button>
              <button className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4 text-gray-400" />
              </button>
              <button className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                <Mail className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {columns.map(col => (
            <div key={col.title}>
              <h4 className="font-semibold text-sm mb-3 text-gray-300">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.href)}
                      className="text-gray-400 hover:text-white text-sm transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-6 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Trovafacile. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
}
