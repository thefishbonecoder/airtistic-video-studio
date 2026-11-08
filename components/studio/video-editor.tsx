"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Download, Film, Image as ImageIcon, Pause, Play, Save, Scissors, Trash2, Type, Upload, Volume2 } from "lucide-react";

type Clip = {
  id: string; file: File; url: string; name: string; type: "video" | "image";
  duration: number; start: number; end: number; caption: string;
};
type Audio = { file: File; name: string; url: string };
type Draft = { title: string; clips: Omit<Clip, "url">[]; audio: Omit<Audio, "url"> | null; color: string; fontSize: number };
const durationOf = (c: Clip) => Math.max(0.1, c.end - c.start);
const formatTime = (n: number) => (Number.isFinite(n) ? n : 0).toFixed(1) + "s";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("airtistic-local-projects", 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains("drafts")) req.result.createObjectStore("drafts"); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function storeDraft(value: Draft) {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite");
      tx.objectStore("drafts").put(value, "current");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
async function readDraft(): Promise<Draft | undefined> {
  const db = await openDB();
  try {
    return await new Promise<Draft | undefined>((resolve, reject) => {
      const req = db.transaction("drafts", "readonly").objectStore("drafts").get("current");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally { db.close(); }
}
async function getDuration(url: string) {
  const video = document.createElement("video");
  video.preload = "metadata";
  return new Promise<number>((resolve, reject) => {
    video.onloadedmetadata = () => { const d = video.duration; video.removeAttribute("src"); video.load(); resolve(Number.isFinite(d) ? d : 0); };
    video.onerror = () => reject(new Error("Videodatei kann nicht gelesen werden"));
    video.src = url;
  });
}
function awaitMedia(media: HTMLMediaElement, name: "loadedmetadata" | "seeked", ms = 18000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => finish(new Error("Video-Ladezeit überschritten")), ms);
    const ok = () => finish();
    const fail = () => finish(new Error("Video nicht abspielbar"));
    function finish(err?: Error) {
      window.clearTimeout(timeout);
      media.removeEventListener(name, ok);
      media.removeEventListener("error", fail);
      if (err) reject(err); else resolve();
    }
    media.addEventListener(name, ok, { once: true });
    media.addEventListener("error", fail, { once: true });
  });
}
async function imageFor(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Bild kann nicht gelesen werden"));
    image.src = url;
  });
}
function paint(ctx: CanvasRenderingContext2D, source: HTMLVideoElement | HTMLImageElement | null, caption: string, color: string, fontSize: number) {
  const { width: w, height: h } = ctx.canvas;
  ctx.fillStyle = "black"; ctx.fillRect(0, 0, w, h);
  if (source) {
    const sw = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
    const sh = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
    if (sw && sh) {
      const k = Math.min(w / sw, h / sh);
      ctx.drawImage(source, (w - sw * k) / 2, (h - sh * k) / 2, sw * k, sh * k);
    }
  }
  if (!caption.trim()) return;
  ctx.fillStyle = color; ctx.strokeStyle = "rgba(0,0,0,.9)";
  ctx.lineWidth = 6; ctx.font = "bold " + fontSize + "px Arial, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "bottom";
  const lines = caption.split("\n").slice(0, 3);
  lines.forEach((line, i) => {
    const y = h - 54 - (lines.length - i - 1) * fontSize * 1.25;
    ctx.strokeText(line, w / 2, y, w - 90); ctx.fillText(line, w / 2, y, w - 90);
  });
}

export function VideoEditor() {
  const [title, setTitle] = useState("MANGMI Pocket Max Review");
  const [clips, setClips] = useState<Clip[]>([]);
  const [audio, setAudio] = useState<Audio | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(46);
  const [voiceText, setVoiceText] = useState("Welcome to our MANGMI Pocket Max PC streaming review.");
  const [status, setStatus] = useState("Medien bleiben auf deinem Gerät.");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const uploader = useRef<HTMLInputElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const audioPlayer = useRef<HTMLAudioElement>(null);
  const objectUrls = useRef<string[]>([]);
  const latestClips = useRef<Clip[]>([]);
  const latestSelection = useRef<string | null>(null);
  const exportLock = useRef(false);
  const active = clips.find(c => c.id === selected) || null;
  const total = useMemo(() => clips.reduce((sum, c) => sum + durationOf(c), 0), [clips]);

  useEffect(() => {
    latestClips.current = clips; latestSelection.current = selected;
  }, [clips, selected]);
  useEffect(() => {
    let mounted = true;
    readDraft().then(draft => {
      if (!mounted || !draft) return;
      const saved = draft.clips.map(c => {
        const url = URL.createObjectURL(c.file);
        objectUrls.current.push(url); return { ...c, url };
      });
      const savedAudio = draft.audio ? { ...draft.audio, url: URL.createObjectURL(draft.audio.file) } : null;
      if (savedAudio) objectUrls.current.push(savedAudio.url);
      setTitle(draft.title); setClips(saved); setAudio(savedAudio);
      setSelected(saved[0]?.id || null); setColor(draft.color); setFontSize(draft.fontSize);
      setStatus("Gespeichertes Projekt geladen.");
    }).catch(() => setStatus("Lokaler Projektspeicher ist nicht verfügbar."));
    return () => { mounted = false; objectUrls.current.forEach(u => URL.revokeObjectURL(u)); };
  }, []);

  async function importFiles(event: ChangeEvent<HTMLInputElement>) {
    const next: Clip[] = [];
    for (const file of Array.from(event.target.files || [])) {
      if (!/^(video|image|audio)\//.test(file.type)) continue;
      const url = URL.createObjectURL(file);
      objectUrls.current.push(url);
      try {
        if (file.type.startsWith("audio/")) {
          setAudio({ file, name: file.name, url });
        } else {
          const type = file.type.startsWith("video/") ? "video" : "image";
          const duration = type === "video" ? await getDuration(url) : 5;
          if (duration <= 0) throw new Error("Ungültige Videodauer");
          next.push({ id: crypto.randomUUID(), file, url, name: file.name, type, duration, start: 0, end: duration, caption: "" });
        }
      } catch {
        URL.revokeObjectURL(url);
        setStatus("Nicht lesbar: " + file.name);
      }
    }
    if (next.length) {
      setClips(old => [...old, ...next]);
      setSelected(current => current || next[0].id);
      setStatus(next.length + " Datei(en) importiert. Änderungen bitte speichern.");
    }
    event.target.value = "";
  }
  function updateClip(id: string, patch: Partial<Clip>) {
    setClips(old => old.map(c => c.id === id ? { ...c, ...patch } : c));
  }
  function move(id: string, offset: number) {
    setClips(old => {
      const result = [...old], i = result.findIndex(c => c.id === id), j = i + offset;
      if (i < 0 || j < 0 || j >= result.length) return old;
      [result[i], result[j]] = [result[j], result[i]];
      return result;
    });
  }
  function chooseClip(id: string) { setPlaying(false); setPosition(0); setSelected(id); }
  function nextClip() {
    const list = latestClips.current, index = list.findIndex(c => c.id === latestSelection.current);
    if (index >= 0 && index + 1 < list.length) {
      setSelected(list[index + 1].id); setPosition(0);
    } else { setPlaying(false); setPosition(0); }
  }
  useEffect(() => {
    const video = player.current;
    if (!video || active?.type !== "video") return;
    function seekStart() {
      if (!video) return;
      if (Math.abs(video.currentTime - (active?.start || 0)) > 0.12) video.currentTime = active?.start || 0;
      if (playing) video.play().catch(() => setPlaying(false));
    }
    if (video.readyState >= 1) seekStart();
    else video.addEventListener("loadedmetadata", seekStart, { once: true });
    return () => video.removeEventListener("loadedmetadata", seekStart);
    // The selected clip is the source of the preview position.
  }, [active?.id, active?.start, active?.type]);
  useEffect(() => {
    if (player.current && active?.type === "video") {
      if (playing) player.current.play().catch(() => setPlaying(false));
      else player.current.pause();
    }
    if (audioPlayer.current) {
      if (playing) audioPlayer.current.play().catch(() => undefined);
      else audioPlayer.current.pause();
    }
  }, [playing, active?.id, active?.type, audio?.url]);
  useEffect(() => {
    if (!playing || active?.type !== "image") return;
    const timer = window.setInterval(() => setPosition(p => {
      if (p + 0.1 >= durationOf(active)) { window.setTimeout(nextClip, 0); return 0; }
      return p + 0.1;
    }), 100);
    return () => clearInterval(timer);
  }, [playing, active?.id, active?.type, active?.end, active?.start]);
  function timeUpdate() {
    if (!active || !player.current) return;
    if (player.current.currentTime >= active.end - 0.05) {
      if (playing) nextClip(); else player.current.pause();
    } else setPosition(Math.max(0, player.current.currentTime - active.start));
  }
  async function save() {
    try {
      await storeDraft({
        title, clips: clips.map(({ url, ...rest }) => rest),
        audio: audio ? { file: audio.file, name: audio.name } : null,
        color, fontSize
      });
      setStatus("Projekt inklusive Medien lokal gespeichert.");
    } catch { setStatus("Speichern fehlgeschlagen: Speicherplatz oder Browserzugriff prüfen."); }
  }
  function previewVoice() {
    if (!("speechSynthesis" in window)) { setStatus("Browser unterstützt keine Sprachausgabe."); return; }
    window.speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(voiceText);
    voice.lang = "en-US"; voice.rate = 0.94;
    const english = speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith("en"));
    if (english) voice.voice = english;
    speechSynthesis.speak(voice);
    setStatus("Englische Stimmvorschau. Für den Videoexport eine MP3-Spur importieren.");
  }

  async function exportWebM() {
    if (exportLock.current || !clips.length) return;
    if (typeof MediaRecorder === "undefined") { setStatus("Videoexport wird von diesem Browser nicht unterstützt."); return; }
    const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find(MediaRecorder.isTypeSupported);
    if (!mime) { setStatus("WebM-Aufnahme nicht unterstützt."); return; }
    exportLock.current = true; setPlaying(false); setExporting(true); setProgress(0);
    setStatus("Export läuft in Echtzeit. Bitte den Tab offen lassen.");
    let recording: MediaRecorder | undefined;
    let stream: MediaStream | undefined;
    let ac: AudioContext | undefined;
    let video: HTMLVideoElement | undefined;
    let music: HTMLAudioElement | undefined;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1280; canvas.height = 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas nicht verfügbar");
      stream = canvas.captureStream(30);
      ac = new AudioContext();
      const mix = ac.createMediaStreamDestination();
      video = document.createElement("video");
      video.playsInline = true; video.preload = "auto";
      ac.createMediaElementSource(video).connect(mix);
      if (audio) {
        music = document.createElement("audio");
        music.src = audio.url; music.loop = true;
        ac.createMediaElementSource(music).connect(mix);
      }
      mix.stream.getAudioTracks().forEach(t => stream!.addTrack(t));
      await ac.resume();
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
      recording = recorder;
      const recorded = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
        recorder.onerror = () => reject(new Error("Fehler beim Aufzeichnen"));
        recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
      });
      paint(ctx, null, "", color, fontSize);
      recorder.start(1000);
      if (music) await music.play();
      let elapsed = 0;
      for (const clip of clips) {
        let source: HTMLImageElement | HTMLVideoElement;
        if (clip.type === "image") {
          source = await imageFor(clip.url);
        } else {
          video.pause(); video.src = clip.url; video.load();
          await awaitMedia(video, "loadedmetadata");
          if (clip.start > 0.01) { video.currentTime = clip.start; await awaitMedia(video, "seeked"); }
          source = video;
          await video.play();
        }
        const started = performance.now(), duration = durationOf(clip);
        while ((performance.now() - started) / 1000 < duration) {
          paint(ctx, source, clip.caption, color, fontSize);
          setProgress(Math.min(99, Math.round(100 * (elapsed + Math.min(duration, (performance.now() - started) / 1000)) / total)));
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        }
        if (clip.type === "video") video.pause();
        elapsed += duration;
      }
      recorder.stop();
      const blob = await recorded;
      if (!blob.size) throw new Error("Exportdatei ist leer");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = (title.trim() || "airtistic-review").replace(/[^\w äöüÄÖÜ-]/g, "_") + ".webm";
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      setProgress(100);
      setStatus("Video exportiert: WebM, 1280 × 720, 30 fps.");
    } catch (err) {
      setStatus("Export fehlgeschlagen: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      if (recording?.state === "recording") recording.stop();
      video?.pause(); music?.pause();
      stream?.getTracks().forEach(t => t.stop());
      if (ac) await ac.close();
      exportLock.current = false; setExporting(false);
    }
  }

  return <main className="av-studio" aria-label="AIrtistic Video Studio">
    <header className="av-top">
      <div className="av-brand"><b>AI</b>rtistic<small>VIDEO STUDIO</small></div>
      <input className="av-project" aria-label="Projektname" value={title} onChange={e => setTitle(e.target.value)} />
      <div className="av-top-actions">
        <button onClick={save} disabled={exporting}><Save size={16}/> Speichern</button>
        <button className="av-primary" onClick={exportWebM} disabled={!clips.length || exporting}><Download size={16}/> {exporting ? progress + "%" : "WebM exportieren"}</button>
      </div>
    </header>
    <div className="av-columns">
      <aside className="av-library">
        <h2><Film size={18}/> Medienbibliothek</h2>
        <input ref={uploader} hidden type="file" multiple accept="video/*,image/*,audio/*" onChange={importFiles} />
        <button className="av-import" onClick={() => uploader.current?.click()} disabled={exporting}><Upload size={18}/> Eigene Medien importieren</button>
        <p className="av-muted">Deine Dateien bleiben lokal auf diesem Gerät.</p>
        <h3>Clips</h3>
        {clips.length === 0 && <p className="av-muted">Noch keine Videos oder Bilder geladen.</p>}
        {clips.map(c => <button key={c.id} className={"av-media " + (selected === c.id ? "active" : "")} onClick={() => chooseClip(c.id)}>
          {c.type === "video" ? <Film size={17}/> : <ImageIcon size={17}/>}
          <span>{c.name}<small>{formatTime(durationOf(c))}</small></span>
        </button>)}
        <h3><Volume2 size={17}/> Englische KI-Stimme / Musik</h3>
        {audio ? <div className="av-audio"><span>{audio.name}</span><button onClick={() => setAudio(null)} title="Audiospur entfernen"><Trash2 size={16}/></button></div> : <p className="av-muted">Importiere eine WAV- oder MP3-Audiodatei als zusätzliche Tonspur.</p>}
        <label className="av-label" htmlFor="voice">Englischen Text probehören</label>
        <textarea id="voice" rows={4} value={voiceText} onChange={e => setVoiceText(e.target.value)}/>
        <button onClick={previewVoice} disabled={!voiceText.trim()}><Play size={15}/> Stimme vorhören</button>
        <p className="av-muted">Die Browser-Stimme dient nur als Vorschau und wird nicht exportiert. Für das fertige Video die Sprachaufnahme als Audio importieren.</p>
        {audio && <audio ref={audioPlayer} src={audio.url} preload="metadata"/>}
      </aside>
      <section className="av-center">
        <div className="av-preview">
          {active ? <>
            {active.type === "video" ? <video key={active.id} ref={player} src={active.url} playsInline preload="metadata" onTimeUpdate={timeUpdate} onEnded={nextClip}/> : <img src={active.url} alt={active.name}/>}
            {active.caption && <div className="av-caption" style={{ color, fontSize: Math.max(16, Math.min(36, fontSize * .7)) }}>{active.caption}</div>}
          </> : <div className="av-placeholder"><Film size={46}/><strong>Dein Video beginnt hier</strong><span>Importiere die ersten MANGMI-Aufnahmen.</span></div>}
        </div>
        <div className="av-controls">
          <button aria-label={playing ? "Pause" : "Abspielen"} disabled={!active || exporting} onClick={() => setPlaying(p => !p)}>{playing ? <Pause size={20}/> : <Play size={20}/>}</button>
          <span>{formatTime(position)} / {formatTime(active ? durationOf(active) : 0)}</span>
          <span>Gesamt: {formatTime(total)}</span>
        </div>
        <div className="av-section-heading"><h2><Scissors size={18}/> Timeline</h2><small>Clip auswählen und mit Pfeilen verschieben</small></div>
        <div className="av-timeline">
          {clips.length === 0 && <div className="av-muted">Importierte Aufnahmen erscheinen hier.</div>}
          {clips.map((c, i) => <div className={"av-track " + (selected === c.id ? "active" : "")} key={c.id}>
            <button className="av-track-title" onClick={() => chooseClip(c.id)}><b>{i + 1}</b><span>{c.name}</span><small>{formatTime(durationOf(c))}</small></button>
            <button title="Nach vorne" onClick={() => move(c.id, -1)} disabled={i === 0 || exporting}><ArrowLeft size={16}/></button>
            <button title="Nach hinten" onClick={() => move(c.id, 1)} disabled={i === clips.length - 1 || exporting}><ArrowRight size={16}/></button>
            <button title="Entfernen" onClick={() => { setClips(old => old.filter(x => x.id !== c.id)); if (selected === c.id) chooseClip(clips.find(x => x.id !== c.id)?.id || ""); }} disabled={exporting}><Trash2 size={16}/></button>
          </div>)}
        </div>
      </section>
      <aside className="av-properties">
        <h2><Type size={18}/> Eigenschaften</h2>
        {active ? <>
          <div className="av-muted">{active.name}</div>
          <label className="av-label" htmlFor="trim-start">Start in Sekunden</label>
          <input id="trim-start" type="number" step=".1" min={0} max={Math.max(0, active.end - .1)} value={Number(active.start.toFixed(1))} onChange={e => updateClip(active.id, { start: Math.max(0, Math.min(active.end - .1, Number(e.target.value))) })} />
          <label className="av-label" htmlFor="trim-end">Ende in Sekunden</label>
          <input id="trim-end" type="number" step=".1" min={active.start + .1} max={active.duration} value={Number(active.end.toFixed(1))} onChange={e => updateClip(active.id, { end: Math.min(active.duration, Math.max(active.start + .1, Number(e.target.value))) })} />
          <div className="av-muted">Originaldauer: {formatTime(active.duration)}</div>
          <label className="av-label" htmlFor="caption">Texteinblendung für diesen Clip</label>
          <textarea id="caption" rows={4} value={active.caption} onChange={e => updateClip(active.id, { caption: e.target.value })}/>
        </> : <p className="av-muted">Wähle einen Clip aus der Timeline.</p>}
        <h3>Textgestaltung</h3>
        <label className="av-label" htmlFor="caption-color">Farbe</label>
        <input id="caption-color" type="color" value={color} onChange={e => setColor(e.target.value)}/>
        <label className="av-label" htmlFor="caption-size">Grösse: {fontSize}px</label>
        <input id="caption-size" type="range" min="24" max="80" value={fontSize} onChange={e => setFontSize(Number(e.target.value))}/>
        <h3>Export</h3>
        <p className="av-muted">720p / 30 fps / WebM. Die Ausgabe wird in Echtzeit aufgezeichnet; das Exportformat MP4 ist noch nicht implementiert.</p>
        {exporting && <progress value={progress} max="100"/>}
      </aside>
    </div>
    <footer className="av-footer" role="status"><span>{status}</span><span>{clips.length} Clips · {formatTime(total)}</span></footer>
  </main>;
}
