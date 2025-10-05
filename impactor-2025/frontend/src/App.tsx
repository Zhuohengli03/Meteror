/**
 * Main App component
 */

import { useEffect, useState, createContext, useContext, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Globe3D from './components/Globe3D';
import ImpactMap from './components/ImpactMap';
import ControlsPanel from './components/ControlsPanel';
import OutcomeCards from './components/OutcomeCards';
import ErrorBoundary from './components/ErrorBoundary';
import { useSimulationStore } from './lib/store/simulation';
import { apiClient } from './lib/api/client';
import './styles/global.css';

function HomePage() {
  const [demoScenario, setDemoScenario] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadDemoScenario = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getDemoScenario();
      if (response.data) {
        setDemoScenario(response.data);
      }
    } catch (error) {
      console.error('Failed to load demo scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Defend Earth</h1>
        <p>Interactive Asteroid Impact Simulation & Planetary Defense</p>
        <button 
          className="btn btn-primary btn-large"
          onClick={loadDemoScenario}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Run Demo Scenario'}
        </button>
      </div>

      {demoScenario && (
        <div className="demo-info">
          <h2>{demoScenario.name}</h2>
          <p>{demoScenario.description}</p>
          <div className="demo-actions">
            <button className="btn btn-secondary">
              View Details
            </button>
            <button className="btn btn-primary">
              Start Simulation
            </button>
          </div>
        </div>
      )}

      <div className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>3D Visualization</h3>
            <p>Interactive 3D Earth with asteroid orbits and impact trajectories</p>
          </div>
          <div className="feature-card">
            <h3>Impact Analysis</h3>
            <p>Scientific models for crater formation, seismic effects, and tsunamis</p>
          </div>
          <div className="feature-card">
            <h3>Deflection Strategies</h3>
            <p>Compare different planetary defense approaches and their effectiveness</p>
          </div>
          <div className="feature-card">
            <h3>Real-time Data</h3>
            <p>Integration with NASA NEO API for current asteroid data</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScenarioPage() {
  const { isSimulating } = useSimulationStore();
  const [customSettingsExpanded, setCustomSettingsExpanded] = useState(false);

  // Listen for custom settings state changes from ControlsPanel
  useEffect(() => {
    const handleCustomSettingsChange = (event: CustomEvent) => {
      setCustomSettingsExpanded(event.detail.expanded);
    };
    
    window.addEventListener('customSettingsChanged', handleCustomSettingsChange as EventListener);
    
    return () => {
      window.removeEventListener('customSettingsChanged', handleCustomSettingsChange as EventListener);
    };
  }, []);

  return (
    <div className="scenario-page">
      <div className="scenario-header">
        <h1>Asteroid Impact Simulation</h1>
      </div>

      {/* Main content area */}
      <div className="scenario-main">
        {/* Left side - Asteroid Settings */}
        <div className="asteroid-settings">
          <ControlsPanel />
        </div>

                {/* Right side - 3D and 2D Maps */}
                <div className={`maps-section ${customSettingsExpanded ? 'custom-expanded' : 'custom-collapsed'}`}>
                  {/* 3D Globe */}
                  <div className="globe-container">
                    <h3>3D Earth View</h3>
                    <ErrorBoundary>
                      <Globe3D 
                        width="100%" 
                        height={customSettingsExpanded ? "500px" : "700px"} 
                      />
                    </ErrorBoundary>
                  </div>
                  
                  {/* 2D Map */}
                  <div className="map-container">
                    <h3>2D Impact Map</h3>
                    <ErrorBoundary>
                      <ImpactMap 
                        width="100%" 
                        height={customSettingsExpanded ? "500px" : "300px"} 
                      />
                    </ErrorBoundary>
                  </div>
                </div>
      </div>

      {/* Bottom section - Impact Analysis */}
      <div className="analysis-section">
        <h2>Impact Analysis Results</h2>
        <div className="results-container">
          <OutcomeCards />
        </div>
      </div>

      {isSimulating && (
        <div className="simulation-overlay">
          <div className="simulation-modal">
            <h3>Running Simulation</h3>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            <p>Calculating impact effects and deflection strategies...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DemoPage() {
  const [demoData, setDemoData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const loadDemo = async () => {
      try {
        const response = await apiClient.getDemoScenario();
        if (response.data) {
          setDemoData(response.data);
        }
      } catch (error) {
        console.error('Failed to load demo:', error);
      }
    };

    loadDemo();
  }, []);

  const triggerPulse = () => {
    setShowPulse(false);
    requestAnimationFrame(() => setShowPulse(true));
    setTimeout(() => setShowPulse(false), 900);
  };

  const scheduleNext = (from: number) => {
    if (!demoData) return;
    // stop at last step (no auto loop)
    if (from >= demoData.timeline.length - 1) {
      setIsPlaying(false);
      timerRef.current && clearTimeout(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = window.setTimeout(() => {
      const next = from + 1;
      setCurrentStep(next);
      triggerPulse();
      scheduleNext(next);
    }, 2200); // smoother节奏，比3s更紧凑
  };

  const playDemo = () => {
    if (!demoData) return;
    
    setIsPlaying(true);
    // 如果已在最后一步，重头开始
    const startIndex = currentStep >= demoData.timeline.length - 1 ? 0 : currentStep;
    setCurrentStep(startIndex);
    triggerPulse();
    scheduleNext(startIndex);
  };

  const pauseDemo = () => {
    setIsPlaying(false);
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const nextStep = () => {
    if (!demoData) return;
    pauseDemo();
    setCurrentStep((s) => Math.min(s + 1, demoData.timeline.length - 1));
    triggerPulse();
  };

  const prevStep = () => {
    if (!demoData) return;
    pauseDemo();
    setCurrentStep((s) => Math.max(s - 1, 0));
    triggerPulse();
  };

  useEffect(() => {
    return () => {
      // cleanup on unmount
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };
  }, []);

  if (!demoData) {
    return (
      <div className="demo-page">
        <div className="loading">Loading demo scenario...</div>
      </div>
    );
  }

  const currentEvent = demoData.timeline[currentStep];

  return (
    <div className="demo-page">
      <div className="demo-header">
        <h1>{demoData.name}</h1>
        <p>{demoData.description}</p>
        <div className="demo-controls">
          <button className="btn" onClick={prevStep} disabled={!demoData}>Prev</button>
          {!isPlaying ? (
            <button className="btn btn-primary" onClick={playDemo} disabled={!demoData}>Play</button>
          ) : (
            <button className="btn" onClick={pauseDemo}>Pause</button>
          )}
          <button className="btn" onClick={nextStep} disabled={!demoData}>Next</button>
        </div>
      </div>

      <div className="demo-content">
        <div className="demo-timeline">
          <h3>Timeline</h3>
          <div className="timeline-steps">
            {demoData.timeline.map((event: any, index: number) => (
              <div 
                key={index}
                className={`timeline-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              >
                <div className="step-time">T{event.time}</div>
                <div className="step-event">{event.event}</div>
                <div className="step-description">{event.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="demo-visualization">
          <h3>Current Event: {currentEvent?.event}</h3>
          <p>{currentEvent?.description}</p>
          
          <div className="demo-globe" style={{ width: 'clamp(360px, 40vw, 640px)', height: 'clamp(360px, 40vw, 640px)', position: 'relative' }}>
            <Globe3D width={'100%'} height={'100%'} fullBleed={false} />
            {showPulse && (
              <div className="demo-pulse-overlay" />
            )}
          </div>
        </div>
      </div>

      <div className="demo-educational">
        <h3>Educational Notes</h3>
        <ul>
          {demoData.educational_notes.map((note: string, index: number) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="about-page">
      <h1>About Defend Earth</h1>
      
      <div className="about-content">
        <section>
          <h2>Mission</h2>
          <p>
            Defend Earth is an interactive web application designed to educate and demonstrate 
            the science behind asteroid impact simulation and planetary defense strategies. 
            Our goal is to make complex astrophysical concepts accessible through engaging 
            visualizations and real-time simulations.
          </p>
        </section>

        <section>
          <h2>Science</h2>
          <p>
            The application uses scientifically accurate models for:
          </p>
          <ul>
            <li>Orbital mechanics and Kepler's laws</li>
            <li>Impact crater formation (π-scaling)</li>
            <li>Seismic wave propagation and magnitude calculation</li>
            <li>Tsunami generation and propagation</li>
            <li>Population exposure and economic impact assessment</li>
            <li>Deflection strategy effectiveness</li>
          </ul>
        </section>

        <section>
          <h2>Data Sources</h2>
          <ul>
            <li>NASA Near-Earth Object (NEO) API</li>
            <li>USGS Earthquake and Tsunami Data</li>
            <li>WorldPop Population Density Data</li>
            <li>Natural Earth Geographic Data</li>
          </ul>
        </section>

        <section>
          <h2>Technology</h2>
          <p>
            Built with modern web technologies including React, TypeScript, Three.js, 
            and Leaflet for interactive 3D and 2D visualizations.
          </p>
        </section>

        <section>
          <h2>Disclaimer</h2>
          <p>
            This application is for educational and demonstration purposes only. 
            It should not be used for actual planetary defense planning or emergency response.
          </p>
        </section>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="app-nav">
          <div className="nav-brand">
            <h2>Defend Earth</h2>
          </div>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/scenario">Simulation</Link>
            <Link to="/demo">Demo</Link>
            <Link to="/about">About</Link>
          </div>
        </nav>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/scenario" element={<ScenarioPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>&copy; 2024 Defend Earth. Educational simulation for planetary defense awareness.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;