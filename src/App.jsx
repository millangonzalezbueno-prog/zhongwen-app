import { useState, useEffect } from 'react';
import { loadCharacters, loadVocab, loadGrammar } from './lib/data';
import ReviewSession from './components/ReviewSession';
import ExercisesView from './components/ExercisesView';
import Dashboard from './components/Dashboard';
import BrowseView from './components/BrowseView';

const TABS = [
  { id: 'home', label: 'Accueil' },
  { id: 'browse', label: 'Explorer' },
  { id: 'dashboard', label: 'Progrès' },
];

function App() {
  const [tab, setTab] = useState('home');
  const [studyMode, setStudyMode] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters] = useState({
    directions: ['recognition', 'production', 'dictation'],
  });

  useEffect(() => {
    Promise.all([loadCharacters(), loadVocab(), loadGrammar()])
      .then(([characters, vocab, grammar]) => {
        setData({ characters, vocab, grammar });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted">Chargement des données...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-primary mb-2">Erreur de chargement</p>
          <p className="text-muted text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const goHome = () => { setStudyMode(null); setTab('home'); };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-surface-alt border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={goHome} className="text-xl font-semibold hanzi-display hover:opacity-80 transition-opacity">
            <span className="text-primary">中文</span> Révision
          </button>
          <nav className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setStudyMode(null); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t.id && !studyMode
                    ? 'bg-accent text-white'
                    : 'text-muted hover:bg-border/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {studyMode === 'review' && (
          <div>
            <button onClick={goHome} className="text-sm text-accent mb-4 hover:underline">&larr; Retour</button>
            <ReviewSession data={data} filters={filters} mode="review" />
          </div>
        )}
        {studyMode === 'b1study' && (
          <div>
            <button onClick={goHome} className="text-sm text-accent mb-4 hover:underline">&larr; Retour</button>
            <ReviewSession data={data} filters={filters} mode="b1study" />
          </div>
        )}
        {studyMode === 'exercises' && (
          <div>
            <button onClick={goHome} className="text-sm text-accent mb-4 hover:underline">&larr; Retour</button>
            <ExercisesView data={data} />
          </div>
        )}
        {!studyMode && tab === 'home' && (
          <HomeView
            data={data}
            onSelectMode={setStudyMode}
          />
        )}
        {!studyMode && tab === 'browse' && <BrowseView data={data} />}
        {!studyMode && tab === 'dashboard' && <Dashboard data={data} />}
      </main>
    </div>
  );
}

function HomeView({ data, onSelectMode }) {
  const charCountA1A2 = data.characters.filter(c => c.intro_tier === 'A1' || c.intro_tier === 'A2').length;
  const charCountB1 = data.characters.filter(c => c.intro_tier === 'B1').length;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-1">Bienvenue</h2>
      <p className="text-muted mb-8">Choisissez votre mode d'étude.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ModeCard
          title="Révision A1-A2"
          subtitle={`${charCountA1A2} caractères + vocabulaire`}
          description="Révisez les caractères et mots déjà appris avec des flashcards SRS."
          color="bg-a2"
          onClick={() => onSelectMode('review')}
        />
        <ModeCard
          title="Étude B1"
          subtitle={`${charCountB1} nouveaux caractères`}
          description="Découvrez et mémorisez les caractères du niveau B1."
          color="bg-b1"
          onClick={() => onSelectMode('b1study')}
        />
        <ModeCard
          title="Exercices"
          subtitle="4 types d'activités"
          description="Complétez des phrases, traduisez, identifiez les pinyin et plus."
          color="bg-accent"
          onClick={() => onSelectMode('exercises')}
        />
      </div>
    </div>
  );
}

function ModeCard({ title, subtitle, description, color, onClick }) {
  return (
    <button onClick={onClick}
      className="bg-surface-alt border border-border rounded-2xl p-6 text-left hover:shadow-md hover:border-accent/30 transition-all group">
      <div className={`w-10 h-10 ${color} rounded-xl mb-4 flex items-center justify-center`}>
        <span className="text-white text-lg font-bold">{title[0]}</span>
      </div>
      <p className="text-lg font-semibold mb-1 group-hover:text-accent transition-colors">{title}</p>
      <p className="text-xs text-muted mb-2">{subtitle}</p>
      <p className="text-sm text-muted">{description}</p>
    </button>
  );
}

export default App;
