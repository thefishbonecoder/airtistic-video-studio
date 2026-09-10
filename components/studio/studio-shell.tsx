import type { CSSProperties, ReactNode } from "react";
import {
  Aperture, ChevronDown, Cloud, Download, Film, ImageIcon, Layers3,
  LogIn, Maximize2, Mic2, Music2, Play, Redo2, RotateCcw, Save,
  Scissors, Search, SlidersHorizontal, Sparkles, SquareSplitHorizontal,
  Type, Undo2, Upload, WandSparkles,
} from "lucide-react";

const tools = [
  ["Medien", Film], ["Text", Type], ["Übergänge", SquareSplitHorizontal],
  ["Filter", Aperture], ["Effekte", WandSparkles], ["Audio", Music2],
  ["Elemente", Layers3],
] as const;

const media = ["Berglicht", "Neonhimmel", "Filmclip", "Lichtspur"];
const filters = ["Kino", "Neon", "Vintage", "Film", "VHS", "Cyberpunk"];

function LockedButton({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <button type="button" aria-label={label} aria-disabled="true" className={`locked-control ${className}`}>{children}</button>;
}

export function StudioShell({ locked, owner }: { locked: boolean; owner: boolean }) {
  return (
    <section className="studio-shell" aria-label="AIrtistic Video Studio" data-locked={locked ? "true" : "false"}>
      <header className="studio-topbar">
        <div className="brand" aria-label="AIrtistic">
          <span className="brand-mark">AI</span>
          <span className="brand-copy"><strong>rtistic</strong><small>VIDEO STUDIO</small></span>
        </div>
        <div className="project-title">
          <span className="save-state"><Cloud size={13} /> Präsentationsprojekt</span>
          <button type="button" aria-disabled="true">AIrtistic Demo <ChevronDown size={14} /></button>
        </div>
        <div className="top-actions">
          <LockedButton label="Rückgängig"><Undo2 size={17} /></LockedButton>
          <LockedButton label="Wiederholen"><Redo2 size={17} /></LockedButton>
          <LockedButton label="Speichern"><Save size={17} /><span>Speichern</span></LockedButton>
          <LockedButton label="Exportieren" className="export-button"><Download size={17} /><span>Export</span></LockedButton>
          <button type="button" className="login-button"><LogIn size={17} /><span>{owner ? "Abmelden" : "Anmelden"}</span></button>
        </div>
      </header>

      <div className="studio-workspace">
        <nav className="tool-rail" aria-label="Werkzeuge">
          {tools.map(([label, Icon], index) => (
            <LockedButton key={label} label={label} className={index === 0 ? "active" : ""}><Icon size={19} /><span>{label}</span></LockedButton>
          ))}
        </nav>

        <aside className="media-panel" aria-label="Medienbibliothek">
          <div className="panel-heading">
            <div><span className="eyebrow">Bibliothek</span><h2>Medien</h2></div>
            <LockedButton label="Medien hochladen"><Upload size={16} /></LockedButton>
          </div>
          <div className="search-box"><Search size={15} /><span>Medien durchsuchen</span></div>
          <div className="media-tabs"><button className="selected">Alle</button><button>Video</button><button>Audio</button></div>
          <div className="media-grid">
            {media.map((item, index) => (
              <button type="button" aria-disabled="true" className="media-card" key={item}>
                <span className={`media-thumb media-thumb-${index + 1}`} />
                <span className="media-type">{index === 3 ? <ImageIcon size={11} /> : <Film size={11} />}</span>
                <small>{item}</small>
              </button>
            ))}
          </div>
          <div className="upload-drop"><Upload size={20} /><strong>Dateien ablegen</strong><span>Video, Bild oder Audio</span></div>
        </aside>

        <section className="preview-area" aria-label="Vorschau">
          <div className="preview-stage">
            <div className="preview-image" role="img" aria-label="AIrtistic Präsentationsclip">
              <div className="preview-shade" />
              <div className="preview-copy"><span>AIrtistic</span><strong>Video Studio</strong><small>GESTALTE DEINE GESCHICHTE</small></div>
              <button type="button" className="preview-play" aria-label="Präsentationsclip abspielen"><Play size={24} fill="currentColor" /></button>
            </div>
          </div>
          <div className="transport">
            <LockedButton label="Zum Anfang"><RotateCcw size={15} /></LockedButton>
            <LockedButton label="Abspielen"><Play size={17} fill="currentColor" /></LockedButton>
            <span className="timecode"><b>00:00:12</b> / 00:00:30</span><div className="transport-spacer" /><span>Fit</span>
            <LockedButton label="Vollbild"><Maximize2 size={16} /></LockedButton>
          </div>
        </section>

        <aside className="inspector" aria-label="Eigenschaften">
          <div className="inspector-title"><SlidersHorizontal size={17} /><strong>Eigenschaften</strong></div>
          <div className="inspector-section">
            <div className="section-heading"><span>Farbkorrektur</span><ChevronDown size={14} /></div>
            <div className="color-wheels">
              {[["Schatten", "#7766ff"], ["Mitteltöne", "#25d4ff"], ["Lichter", "#e753ff"]].map(([label, color]) => (
                <div key={label}><span className="color-wheel" style={{ "--wheel": color } as CSSProperties} /><small>{label}</small></div>
              ))}
            </div>
            {["Helligkeit", "Kontrast", "Sättigung"].map((label, index) => (
              <label className="slider-row" key={label}><span>{label}</span><i><b style={{ width: `${45 + index * 14}%` }} /></i><small>{index === 1 ? "+12" : "0"}</small></label>
            ))}
          </div>
          <div className="inspector-section">
            <div className="section-heading"><span>Filter und Looks</span><ChevronDown size={14} /></div>
            <div className="filter-grid">{filters.map((filter, index) => <button type="button" aria-disabled="true" key={filter} className={index === 1 ? "selected" : ""}><span /><small>{filter}</small></button>)}</div>
          </div>
          <div className="inspector-section compact">
            {["Glow", "Filmkorn", "Vignette"].map((effect, index) => <div className="effect-toggle" key={effect}><Sparkles size={13} /><span>{effect}</span><i className={index < 2 ? "on" : ""} /></div>)}
          </div>
        </aside>

        <section className="timeline" aria-label="Timeline">
          <div className="timeline-toolbar">
            <LockedButton label="Schneiden"><Scissors size={15} /></LockedButton><LockedButton label="Mikrofonaufnahme"><Mic2 size={15} /></LockedButton>
            <span className="timeline-time">00:00:12:08</span><div className="zoom-line"><span /></div>
          </div>
          <div className="timeline-body">
            <div className="track-labels"><span><Film size={13} /> V1</span><span><Type size={13} /> T1</span><span><Music2 size={13} /> A1</span><span><Mic2 size={13} /> A2</span></div>
            <div className="tracks">
              <div className="ruler">{["00:00", "00:05", "00:10", "00:15", "00:20", "00:25"].map(time => <span key={time}>{time}</span>)}</div>
              <div className="track video-track"><div className="clip clip-one"><span>Berglicht</span></div><div className="clip clip-two"><span>Neonhimmel</span></div><div className="clip clip-three"><span>Lichtspur</span></div></div>
              <div className="track text-track"><div className="text-clip">AIrtistic Video Studio</div></div>
              <div className="track audio-track"><div className="audio-clip"><span className="waveform">▂▄▆▃▇▅▂▆▄▇▃▅▇▂▄▆▃▇▅▂▆▄▇▃▅</span></div></div>
              <div className="track voice-track"><div className="voice-clip"><span className="waveform">▂▃▅▇▄▂▆▃▅▇▂▄▆▃▇▅</span></div></div>
              <div className="playhead"><span /></div>
            </div>
          </div>
        </section>
      </div>
      {locked && <div className="locked-status"><span className="status-dot" />Präsentationsmodus</div>}
    </section>
  );
}
