import { useState, useEffect, useMemo, useCallback } from 'react';
import { loadCharacters, loadVocab, loadGrammar, loadLessons, loadGlossary } from './lib/data';
import { buildDict, charDetails } from './lib/gloss';
import { GlossProvider, PinyinToggle } from './components/Zh';
import ReviewSession from './components/ReviewSession';
import ExercisesView from './components/ExercisesView';
import StrokePractice from './components/StrokePractice';
import CharacterPopup from './components/CharacterPopup';
import Dashboard from './components/Dashboard';
import BrowseView from './components/BrowseView';
import LessonView from './components/LessonView';
import HomeworkView from './components/HomeworkView';
import ExamPrepView from './components/ExamPrepView';

const TABS = [
  { id: 'home', label: 'Accueil' },
  { id: 'browse', label: 'Explorer' },
  { id: 'dashboard', label: 'Progrès' },
];

function App() {
  const [tab, setTab] = useState('home');
  const [studyMode, setStudyMode] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters] = useState({
    directions: ['recognition', 'production', 'dictation'],
  });
  const [popupChar, setPopupChar] = useState(null);

  const dict = useMemo(() => (data ? buildDict(data) : null), [data]);

  // Any character opens the stroke-order popup; the 361-character bank is enriched with lesson and CEDICT data.
  const handleCharClick = useCallback((ch) => {
    if (!dict) return;
    setPopupChar(charDetails(ch, dict));
  }, [dict]);

  useEffect(() => {
    Promise.all([loadCharacters(), loadVocab(), loadGrammar(), loadLessons(), loadGlossary()])
      .then(([characters, vocab, grammar, lessons, glossary]) => {
        setData({ characters, vocab, grammar, lessons, glossary });
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

  const goHome = () => { setStudyMode(null); setActiveLesson(null); setTab('home'); };

  const openLesson = (lesson) => {
    setActiveLesson(lesson);
    setStudyMode(null);
    setTab('lesson');
  };

  return (
    <GlossProvider dict={dict} onCharClick={handleCharClick}>
    <div className="min-h-screen flex flex-col">
      <header className="bg-surface-alt border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={goHome} className="text-xl font-semibold hanzi-display hover:opacity-80 transition-opacity">
            <span className="text-primary">中文</span> Révision
          </button>
          <nav className="flex gap-1 items-center">
            <PinyinToggle />
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setStudyMode(null); setActiveLesson(null); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t.id && !studyMode && !activeLesson
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
        {activeLesson && (
          <div>
            <button onClick={goHome} className="text-sm text-accent mb-4 hover:underline">&larr; Retour</button>
            <LessonView lesson={activeLesson} appData={data} onCharClick={handleCharClick} />
          </div>
        )}
        {!activeLesson && studyMode === 'review' && (
          <div>
            <button onClick={goHome} className="text-sm text-accent mb-4 hover:underline">&larr; Retour</button>
            <ReviewSession data={data} filters={filters} mode="review" onCharClick={handleCharClick} />
          </div>
        )}
        {!activeLesson && studyMode === 'b1study' && (
          <div>
            <button onClick={goHome} className="text-sm text-accent mb-4 hover:underline">&larr; Retour</button>
            <ReviewSession data={data} filters={filters} mode="b1study" onCharClick={handleCharClick} />
          </div>
        )}
        {!activeLesson && studyMode === 'exercises' && (
          <div>
            <button onClick={goHome} className="text-sm text-accent mb-4 hover:underline">&larr; Retour</button>
            <ExercisesView data={data} />
          </div>
        )}
        {!activeLesson && studyMode === 'strokes' && (
          <div>
            <button onClick={goHome} className="text-sm text-accent mb-4 hover:underline">&larr; Retour</button>
            <StrokePractice data={data} onCharClick={handleCharClick} />
          </div>
        )}
        {!activeLesson && studyMode === 'exam1' && (
          <div>
            <button onClick={goHome} className="text-sm text-accent mb-4 hover:underline">&larr; Retour</button>
            <ExamPrepView data={data} />
          </div>
        )}
        {!activeLesson && studyMode === 'homework1' && (
          <div>
            <button onClick={goHome} className="text-sm text-accent mb-4 hover:underline">&larr; Retour</button>
            <HomeworkView />
          </div>
        )}
        {!activeLesson && !studyMode && tab === 'home' && (
          <HomeView data={data} onSelectMode={setStudyMode} onOpenLesson={openLesson} />
        )}
        {!activeLesson && !studyMode && tab === 'browse' && <BrowseView data={data} onCharClick={handleCharClick} />}
        {!activeLesson && !studyMode && tab === 'dashboard' && <Dashboard data={data} />}
      </main>

      {popupChar && (
        <CharacterPopup
          character={popupChar.hanzi}
          charData={popupChar}
          onClose={() => setPopupChar(null)}
        />
      )}
    </div>
    </GlossProvider>
  );
}

function HomeView({ data, onSelectMode, onOpenLesson }) {
  const charCountA1A2 = data.characters.filter(c => c.intro_tier === 'A1' || c.intro_tier === 'A2').length;
  const charCountB1 = data.characters.filter(c => c.intro_tier === 'B1').length;

  return (
    <div>
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-1">Évaluations</h2>
        <p className="text-muted mb-5">Examen et devoirs : entraînement ciblé.</p>
        <button onClick={() => onSelectMode('exam1')}
          className="w-full mb-3 bg-surface-alt border-2 border-primary/50 rounded-2xl p-5 text-left hover:shadow-md hover:border-primary transition-all group">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white text-lg font-bold hanzi-display">考</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary mb-0.5">Examen le mercredi 14 octobre</p>
              <p className="text-lg font-semibold group-hover:text-primary transition-colors">Préparation à l'examen</p>
              <p className="text-sm text-muted">Examen blanc sur 20, 14 thèmes d'entraînement, 20 caractères à tracer</p>
              <p className="text-xs text-muted mt-1">Semaines 1 à 4 &middot; leçons L01 à L05</p>
            </div>
          </div>
        </button>
        <button onClick={() => onSelectMode('homework1')}
          className="w-full bg-surface-alt border border-primary/30 rounded-2xl p-5 text-left hover:shadow-md hover:border-primary/60 transition-all group">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white text-lg font-bold hanzi-display">作</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary mb-0.5">À rendre le 6 octobre</p>
              <p className="text-lg font-semibold hanzi-display group-hover:text-primary transition-colors">中文作业 1</p>
              <p className="text-sm text-muted">Examen blanc noté sur 20, variantes et corrigé</p>
              <p className="text-xs text-muted mt-1">5 parties &middot; questions, ordre des mots, 选词填空, 量词, lecture</p>
            </div>
          </div>
        </button>
      </section>

      {data.lessons && data.lessons.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-1">Cours</h2>
          <p className="text-muted mb-5">Vos leçons de classe — lecture, vocabulaire et grammaire en contexte.</p>

          <div className="grid gap-3 sm:grid-cols-2">
            {data.lessons.map(lesson => (
              <button key={lesson.id} onClick={() => onOpenLesson(lesson)}
                className="bg-surface-alt border border-border rounded-2xl p-5 text-left hover:shadow-md hover:border-accent/30 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-white text-lg font-bold hanzi-display">{lesson.title[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-accent mb-0.5">Semaine {lesson.week}</p>
                    <p className="text-lg font-semibold group-hover:text-accent transition-colors truncate">
                      {lesson.title_fr}
                    </p>
                    <p className="text-sm text-muted">{lesson.theme}</p>
                    <p className="text-xs text-muted mt-1">
                      {lesson.vocab.length} mots &middot; {lesson.grammar.length} points de grammaire
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-1">Outils d'étude</h2>
        <p className="text-muted mb-5">Entraînement libre — flashcards, exercices et tracé.</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ToolCard
            title="Révision A1-A2"
            subtitle={`${charCountA1A2} caractères + vocabulaire`}
            description="Flashcards SRS pour les acquis A1-A2."
            color="bg-a2"
            onClick={() => onSelectMode('review')}
          />
          <ToolCard
            title="Étude B1"
            subtitle={`${charCountB1} nouveaux caractères`}
            description="Découvrez les caractères du niveau B1."
            color="bg-b1"
            onClick={() => onSelectMode('b1study')}
          />
          <ToolCard
            title="Exercices"
            subtitle="5 types d'activités"
            description="Complétez, traduisez, ordonnez."
            color="bg-accent"
            onClick={() => onSelectMode('exercises')}
          />
          <ToolCard
            title="Tracé"
            subtitle="Ordre des traits"
            description="Animation, guidage et ardoise libre."
            color="bg-success"
            onClick={() => onSelectMode('strokes')}
          />
        </div>
      </section>
    </div>
  );
}

function ToolCard({ title, subtitle, description, color, onClick }) {
  return (
    <button onClick={onClick}
      className="bg-surface-alt border border-border rounded-2xl p-5 text-left hover:shadow-md hover:border-accent/30 transition-all group">
      <div className={`w-9 h-9 ${color} rounded-lg mb-3 flex items-center justify-center`}>
        <span className="text-white text-sm font-bold">{title[0]}</span>
      </div>
      <p className="font-semibold mb-0.5 group-hover:text-accent transition-colors">{title}</p>
      <p className="text-xs text-muted mb-1">{subtitle}</p>
      <p className="text-xs text-muted">{description}</p>
    </button>
  );
}

export default App;
