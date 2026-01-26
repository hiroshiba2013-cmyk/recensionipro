import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Header } from './components/layout/Header';
import { Router } from './components/Router';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Router />
        </div>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
