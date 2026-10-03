import React, { useState, useEffect, useRef } from 'react';
import { getTeamMembers, getSpeakers } from '../services/api';
import './AskTedx.css';

const ASCII_ART = `  _____ _____ ____ 
 |_   _| ____|  _ \\__  __
   | | |  _| | | | \\ \\/ /
   | | | |___| |_| |>  < 
   |_| |_____|____//_/\\_\\   BIET1`;

const TARGET_DATE = new Date('2026-10-05T09:00:00+05:30').getTime();

function getCountdownString() {
  const diff = TARGET_DATE - Date.now();
  if (diff <= 0) return 'Inauguration day is here!';
  const totalSecs = Math.floor(diff / 1000);
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

const CHIPS = ['help', 'date', 'guests', 'faces', 'team', 'faq', 'register', 'directions', 'theme'];

export default function AskTedx() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [countdown, setCountdown] = useState(getCountdownString);
  const [teamMembers, setTeamMembers] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [logs, setLogs] = useState([]);
  const outRef = useRef(null);
  const inputRef = useRef(null);
  const audioCtxRef = useRef(null);
  const speechRecRef = useRef(null);

  // Keep countdown updated
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real team members and speakers from MongoDB on load
  useEffect(() => {
    getTeamMembers()
      .then((data) => {
        if (Array.isArray(data)) setTeamMembers(data);
      })
      .catch(() => {});

    getSpeakers()
      .then((data) => {
        if (Array.isArray(data)) setSpeakers(data);
      })
      .catch(() => {});
  }, []);

  // Initial greeting matching template.html and chatbot.png
  useEffect(() => {
    setLogs([
      { type: 'art', text: ASCII_ART },
      {
        type: 'welcome',
        html: (
          <span>
            Welcome to <b style={{ color: '#fff' }}>Ask TEDx</b>. Ask about the event in plain words, or run a command.
          </span>
        ),
      },
      { type: 'kv', k: 'Event', v: 'TEDxBIET1 · 5 October 2026' },
      { type: 'kv', k: 'Status', v: 'Upcoming' },
      { type: 'kv-countdown', k: 'Countdown' },
      { type: 'gap' },
      {
        type: 'dim',
        html: (
          <span>
            Type{' '}
            <span
              className="tx-cmd"
              onClick={() => executeCommand('help')}
              style={{ borderBottom: '1px solid rgba(255,255,255,0.7)', color: '#fff', cursor: 'pointer' }}
            >
              help
            </span>{' '}
            for every command. Tap a chip below to start.
          </span>
        ),
      },
    ]);
  }, []);

  // Sound Synthesizer
  const playSound = (kind = 'key') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime;
      const isEnter = kind === 'enter';

      osc.type = isEnter ? 'triangle' : 'square';
      osc.frequency.value = isEnter ? 520 : 1300 + Math.random() * 400;

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(isEnter ? 0.05 : 0.02, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + (isEnter ? 0.09 : 0.03));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    } catch {}
  };

  // Keyboard shortcut listener: Ctrl+K or Esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    const handleCustomOpen = () => setIsOpen(true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-ask-tedx', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-ask-tedx', handleCustomOpen);
    };
  }, [isOpen]);

  // Auto-scroll output and focus input
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        if (outRef.current) {
          outRef.current.scrollTop = outRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [isOpen, logs]);

  const scrollToSection = (secId) => {
    const el = document.getElementById(secId);
    if (el) {
      setIsOpen(false);
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    }
  };

  const findMember = (query) => {
    const q = query.toLowerCase().replace(/^(who\s+is|who\s+|find\s+|look\s+up\s+)/, '').trim();
    if (!q) return null;

    // Search in DB team members
    const matched = teamMembers.find((m) => {
      const name = (m.name || '').toLowerCase();
      const slug = (m.slug || '').toLowerCase();
      const role = (m.role || '').toLowerCase();
      return name.includes(q) || slug.includes(q) || q.includes(name) || (role && role.includes(q));
    });

    if (matched) {
      return {
        name: matched.name,
        role: matched.role || `${matched.team || 'Department'} Lead`,
        event: 'TEDxBIET1 · 5 October 2026',
        initial: (matched.name || 'T')[0].toUpperCase(),
        image: matched.image || '',
      };
    }

    // Search in DB speakers
    const matchedSpeaker = speakers.find((s) => {
      const name = (s.name || '').toLowerCase();
      const topic = (s.topic || '').toLowerCase();
      return name.includes(q) || q.includes(name) || (topic && topic.includes(q));
    });

    if (matchedSpeaker) {
      return {
        name: matchedSpeaker.name,
        role: matchedSpeaker.role || 'Guest Speaker',
        event: 'TEDxBIET1 · 5 October 2026',
        initial: (matchedSpeaker.name || 'S')[0].toUpperCase(),
        image: matchedSpeaker.image || '',
      };
    }

    return null;
  };

  const executeCommand = (raw) => {
    const text = raw.trim();
    if (!text) return;

    playSound('enter');
    const cmd = text.toLowerCase();
    const newLogs = [...logs, { type: 'echo', text }];

    if (cmd === 'clear' || cmd === 'cls') {
      setLogs([]);
      setInputVal('');
      return;
    }

    if (cmd === 'exit' || cmd === 'quit' || cmd === 'close' || cmd === 'q') {
      setIsOpen(false);
      setInputVal('');
      return;
    }

    // Scroll to section command: goto <section>
    if (cmd.startsWith('goto ') || cmd.startsWith('jump ') || cmd.startsWith('open ')) {
      const target = cmd.split(/\s+/)[1];
      newLogs.push({ type: 'ok', text: `Navigating to ${target}...` });
      setLogs(newLogs);
      setInputVal('');
      scrollToSection(target);
      return;
    }

    // 1. DATE command (pixel-matching chatbot_response.png)
    if (cmd === 'date' || cmd.includes('when') || cmd.includes('countdown') || cmd.includes('time')) {
      newLogs.push(
        { type: 'gap' },
        { type: 'kv', k: 'Date', v: 'Monday, 5 October 2026' },
        { type: 'kv', k: 'Event', v: 'Inauguration of TEDxBIET1' },
        { type: 'kv', k: 'Status', v: 'Upcoming' },
        { type: 'kv-countdown', k: 'Countdown' },
        { type: 'kv', k: 'Clock target', v: '9:00 AM IST on the day' },
        { type: 'gap' },
        {
          type: 'dim',
          html: (
            <span>
              Get a reminder:{' '}
              <span
                className="tx-cmd"
                onClick={() => scrollToSection('countdown')}
                style={{ borderBottom: '1px dashed rgba(230,43,30,0.8)', color: '#fff', cursor: 'pointer' }}
              >
                goto countdown
              </span>{' '}
              and use "Notify Me At Launch".
            </span>
          ),
        },
        { type: 'gap' }
      );
    }
    // 2. Member lookup (matching chatbot_response.png)
    else if (findMember(cmd)) {
      const p = findMember(cmd);
      newLogs.push(
        { type: 'gap' },
        {
          type: 'profile',
          person: p,
        },
        { type: 'gap' }
      );
    }
    // 3. HELP command
    else if (cmd === 'help' || cmd === '?' || cmd === 'commands') {
      newLogs.push(
        { type: 'head', text: 'The Event' },
        { type: 'kv', k: 'about', v: 'What TEDxBIET is' },
        { type: 'kv', k: 'date', v: 'Date, status and live countdown' },
        { type: 'kv', k: 'guests', v: 'Inauguration guests (5 Oct)' },
        { type: 'kv', k: 'speakers', v: 'Speaker lineup details' },
        { type: 'kv', k: 'faq', v: 'Frequently asked questions' },
        { type: 'kv', k: 'register', v: 'Tickets and attending info' },
        { type: 'kv', k: 'directions', v: 'Venue map and travel route' },
        { type: 'head', text: 'The People' },
        { type: 'kv', k: 'team', v: 'The whole team & 12 departments' },
        { type: 'kv', k: 'faces', v: 'Organizers and guest profiles' },
        { type: 'kv', k: 'who <name>', v: 'Look up any member (e.g. "who manohar")' },
        { type: 'head', text: 'Preferences & Actions' },
        { type: 'kv', k: 'theme <name>', v: 'red, white, matrix, marvel, cyberpunk, maths, gotham' },
        { type: 'kv', k: 'goto <sec>', v: 'Jump to section: countdown, team, contact...' },
        { type: 'kv', k: 'spark', v: 'Generate an inspiring spark of an idea' },
        { type: 'kv', k: 'clear', v: 'Clear terminal screen' },
        { type: 'gap' },
        { type: 'dim', text: 'You can also ask normal questions like "when is the event?", "who is speaking?", or "where is it?"' }
      );
    }
    // 4. ABOUT / WHY
    else if (cmd === 'about' || cmd === 'what' || cmd === 'why') {
      newLogs.push(
        { type: 'gap' },
        {
          type: 'say',
          text: 'TEDxBIET is an independently organized TED event, held under license from TED, at Bharat Institute of Engineering and Technology in Ibrahimpatnam, Hyderabad. Students, faculty, and outside voices share a single stage — each with one idea worth spreading.',
        },
        { type: 'gap' }
      );
    }
    // 5. GUESTS / SPEAKERS
    else if (cmd === 'guests' || cmd === 'speakers' || cmd.includes('guest') || cmd.includes('speaker')) {
      newLogs.push(
        { type: 'gap' },
        { type: 'head', text: 'Inauguration Guests & Speakers · 5 Oct 2026' }
      );
      if (speakers.length > 0) {
        speakers.forEach((sp) => {
          newLogs.push({
            type: 'kv',
            k: sp.name,
            v: `${sp.role || 'Guest Speaker'}${sp.note ? ` (${sp.note})` : ''}${sp.topic ? ` — "${sp.topic}"` : ''}`,
          });
        });
      } else {
        newLogs.push({ type: 'dim', text: 'Speaker lineup will be announced as the conference nears.' });
      }
      newLogs.push(
        { type: 'dim', text: 'Additional visionary speakers will be unveiled as the conference nears.' },
        { type: 'gap' }
      );
    }
    // 6. TEAM / FACES
    else if (cmd === 'team' || cmd === 'faces' || cmd === 'leads' || cmd.includes('organizer') || cmd.includes('department')) {
      newLogs.push(
        { type: 'gap' },
        { type: 'head', text: 'Organizing Team Leadership' }
      );
      const leaders = teamMembers.filter((m) => {
        const r = (m.role || '').toLowerCase();
        const t = (m.team || '').toLowerCase();
        return r.includes('organizer') || r.includes('license') || t.includes('leadership');
      });
      if (leaders.length > 0) {
        leaders.forEach((l) => {
          newLogs.push({ type: 'kv', k: l.role || 'Leader', v: l.name });
        });
      }

      // Group departments
      const deptMap = {};
      teamMembers.forEach((m) => {
        const r = (m.role || '').toLowerCase();
        const t = (m.team || '').toLowerCase();
        if (r.includes('organizer') || r.includes('license') || t.includes('leadership')) return;
        const dept = m.team || 'General';
        if (!deptMap[dept]) deptMap[dept] = [];
        deptMap[dept].push(m.name);
      });

      const depts = Object.keys(deptMap);
      if (depts.length > 0) {
        newLogs.push({ type: 'head', text: `${depts.length} Organizing Departments` });
        depts.forEach((dept) => {
          newLogs.push({ type: 'kv', k: dept, v: deptMap[dept].join(', ') });
        });
      }
      newLogs.push(
        {
          type: 'dim',
          html: (
            <span>
              Explore all members on the homepage:{' '}
              <span
                className="tx-cmd"
                onClick={() => scrollToSection('team')}
                style={{ borderBottom: '1px dashed rgba(230,43,30,0.8)', color: '#fff', cursor: 'pointer' }}
              >
                goto team
              </span>
            </span>
          ),
        },
        { type: 'gap' }
      );
    }
    // 7. FAQ
    else if (cmd === 'faq' || cmd.includes('question')) {
      newLogs.push(
        { type: 'gap' },
        { type: 'head', text: 'Frequently Asked Questions' },
        { type: 'kv', k: '1. Who can attend?', v: 'Students, faculty, alumni, and guests from outside BIET.' },
        { type: 'kv', k: '2. Speaker nomination?', v: 'Use the "Nominate A Speaker" button or email tedx@biet.ac.in directly.' },
        { type: 'kv', k: '3. TED Affiliation?', v: 'Operated under official license from TED, abiding by all TEDx standards.' },
        { type: 'kv', k: '4. Tickets & Passes?', v: 'Attendee registration details will open soon. Sign up in the countdown section!' },
        { type: 'gap' }
      );
    }
    // 8. REGISTER / TICKETS
    else if (cmd === 'register' || cmd === 'ticket' || cmd.includes('ticket')) {
      newLogs.push(
        { type: 'gap' },
        { type: 'head', text: 'Tickets & Attendee Registration' },
        { type: 'say', text: 'Seats are strictly limited. Pass reservations will open shortly. Use "Notify Me At Launch" on the homepage to receive early notification.' },
        { type: 'kv', k: 'Inquiries', v: 'tedx@biet.ac.in' },
        { type: 'gap' }
      );
    }
    // 9. DIRECTIONS / VENUE / LOCATION
    else if (cmd === 'directions' || cmd === 'venue' || cmd.includes('where') || cmd.includes('map') || cmd.includes('location')) {
      newLogs.push(
        { type: 'gap' },
        { type: 'head', text: 'Campus Location' },
        { type: 'kv', k: 'Venue', v: 'BIET Campus, Ibrahimpatnam, Hyderabad' },
        { type: 'kv', k: 'Institute', v: 'Bharat Institute of Engineering and Technology' },
        {
          type: 'dim',
          html: (
            <span>
              Interactive campus map available in footer:{' '}
              <span
                className="tx-cmd"
                onClick={() => scrollToSection('contact')}
                style={{ borderBottom: '1px dashed rgba(230,43,30,0.8)', color: '#fff', cursor: 'pointer' }}
              >
                goto contact
              </span>
            </span>
          ),
        },
        { type: 'gap' }
      );
    }
    // 10. SPARK
    else if (cmd === 'spark' || cmd === 'quote' || cmd === 'inspire') {
      const sparks = [
        'What would you build if no one could tell you it was impossible?',
        'Which small habit of yours would change a city if everyone copied it?',
        'What did you believe at 12 that you still think was right?',
        'Which problem on your campus is everyone walking past?',
        'What is one idea you are afraid to say out loud?',
      ];
      const pick = sparks[Math.floor(Math.random() * sparks.length)];
      newLogs.push({ type: 'gap' }, { type: 'quote', text: pick }, { type: 'gap' });
    }
    // 11. THEME SWITCHER
    else if (cmd.startsWith('theme')) {
      const parts = cmd.split(/\s+/);
      const targetTheme = parts[1];
      const valid = ['red', 'white', 'matrix', 'marvel', 'cyberpunk', 'maths', 'gotham'];
      if (valid.includes(targetTheme)) {
        document.documentElement.setAttribute('data-theme', targetTheme);
        localStorage.setItem('tedx-theme', targetTheme);
        window.dispatchEvent(new CustomEvent('tedx-theme', { detail: targetTheme }));
        newLogs.push({ type: 'ok', text: `Theme set to "${targetTheme}".` });
      } else {
        const cur = document.documentElement.getAttribute('data-theme') || 'red';
        newLogs.push(
          { type: 'head', text: 'Available Themes' },
          { type: 'kv', k: 'Current Theme', v: cur },
          { type: 'dim', text: 'Available: ' + valid.join(', ') + '. Example: "theme matrix"' }
        );
      }
    }
    // 12. Fallback query
    else {
      newLogs.push(
        { type: 'gap' },
        {
          type: 'say',
          text: `Ask TEDx received your query: "${text}". Ask about the date, venue, team, guests, or type "help" for instant commands.`,
        },
        { type: 'gap' }
      );
    }

    setLogs(newLogs);
    setInputVal('');
  };

  const handleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please type your query.');
      return;
    }
    if (isListening && speechRecRef.current) {
      speechRecRef.current.stop();
      setIsListening(false);
      return;
    }
    try {
      const rec = new SpeechRecognition();
      speechRecRef.current = rec;
      rec.lang = 'en-IN';
      rec.onstart = () => {
        setIsListening(true);
        setInputVal('Listening...');
      };
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setInputVal(text);
        executeCommand(text);
      };
      rec.onerror = () => {
        setIsListening(false);
        setInputVal('');
      };
      rec.onend = () => {
        setIsListening(false);
      };
      rec.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <>
      {/* Floating launcher button at bottom-right */}
      <button
        type="button"
        id="tx-launch"
        className={`ready ${isOpen ? 'hide' : ''}`}
        aria-label="Open the Ask TEDx command prompt"
        onClick={() => setIsOpen(true)}
      >
        <span className="tx-gl">&gt;_</span>
        <span className="tx-lb">ASK TEDx</span>
        <kbd>Ctrl K</kbd>
      </button>

      {/* Terminal window modal */}
      <div
        id="tx-term"
        className={isOpen ? 'open' : ''}
        role="dialog"
        aria-modal="true"
        aria-label="Ask TEDx command prompt"
        onClick={(e) => {
          if (e.target.id === 'tx-term') setIsOpen(false);
        }}
      >
        <div className="tx-win">
          {/* Top window bar matching chatbot.png and chatbot_response.png */}
          <div className="tx-bar">
            <div className="tx-dots">
              <button
                type="button"
                className="tx-x"
                aria-label="Close command prompt"
                onClick={() => setIsOpen(false)}
              />
              <i />
              <i />
            </div>
            <div className="tx-title">TEDX@BIET1: ASK ANYTHING</div>
            <button
              type="button"
              className="tx-snd"
              id="tx-snd"
              aria-pressed={soundEnabled}
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playSound('enter');
              }}
            >
              {soundEnabled ? 'sound on' : 'sound off'}
            </button>
            <div
              className="tx-esc"
              role="button"
              tabIndex={0}
              onClick={() => setIsOpen(false)}
            >
              esc to close
            </div>
          </div>

          {/* Terminal output area */}
          <div className="tx-out" ref={outRef} aria-live="polite">
            {logs.map((log, i) => {
              if (log.type === 'art') {
                return (
                  <pre key={i} className="tx-art">
                    {log.text}
                  </pre>
                );
              }
              if (log.type === 'welcome') {
                return (
                  <div key={i} className="tx-l">
                    {log.html}
                  </div>
                );
              }
              if (log.type === 'kv') {
                return (
                  <div key={i} className="tx-l tx-kv">
                    <i>{log.k}</i>
                    <b>{log.v}</b>
                  </div>
                );
              }
              if (log.type === 'kv-countdown') {
                return (
                  <div key={i} className="tx-l tx-kv">
                    <i>{log.k}</i>
                    <b className="tx-live">{countdown}</b>
                  </div>
                );
              }
              if (log.type === 'echo') {
                return (
                  <div key={i} className="tx-l tx-echo">
                    <span className="tx-ps">
                      <b>tedx</b>
                      <span className="d">@biet1</span>
                      <span className="r"> &gt;</span>
                    </span>{' '}
                    <span className="tx-v">{log.text}</span>
                  </div>
                );
              }
              if (log.type === 'profile') {
                const p = log.person;
                return (
                  <div key={i} className="tx-l tx-prof">
                    <div className="tx-avatar-box">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="tx-avatar-img" />
                      ) : (
                        <div className="tx-avatar-ring">{p.initial || 'M'}</div>
                      )}
                    </div>
                    <div className="tx-pk">
                      <div className="tx-kv">
                        <i>Name</i>
                        <span className="tx-v">{p.name}</span>
                      </div>
                      <div className="tx-kv">
                        <i>Role</i>
                        <span style={{ color: '#e9e8e5' }}>{p.role}</span>
                      </div>
                      <div className="tx-kv">
                        <i>Event</i>
                        <span style={{ color: '#e9e8e5' }}>{p.event}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              if (log.type === 'head') {
                return (
                  <div key={i} className="tx-l">
                    <span className="tx-h">{log.text}</span>
                  </div>
                );
              }
              if (log.type === 'dim') {
                return (
                  <div key={i} className="tx-l">
                    <span className="tx-dim">{log.html || log.text}</span>
                  </div>
                );
              }
              if (log.type === 'quote') {
                return (
                  <div key={i} className="tx-l tx-quote">
                    &ldquo;{log.text}&rdquo;
                  </div>
                );
              }
              if (log.type === 'gap') {
                return <div key={i} className="tx-gap" />;
              }
              if (log.type === 'ok') {
                return (
                  <div key={i} className="tx-l tx-ok">
                    {log.text}
                  </div>
                );
              }
              if (log.type === 'err') {
                return (
                  <div key={i} className="tx-l tx-err">
                    {log.text}
                  </div>
                );
              }
              return (
                <div key={i} className="tx-l">
                  {log.text}
                </div>
              );
            })}
          </div>

          {/* Command chips row */}
          <div className="tx-chips">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="tx-chip"
                onClick={() => executeCommand(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Terminal input line */}
          <form
            className="tx-in"
            onSubmit={(e) => {
              e.preventDefault();
              executeCommand(inputVal);
            }}
          >
            <span className="tx-ps">
              <span className="full">
                <b>tedx</b>
                <span className="d">@biet1</span>
              </span>
              <span className="r"> &gt;</span>
            </span>
            <input
              ref={inputRef}
              id="tx-input"
              type="text"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              placeholder="type help, or just ask a question"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                playSound('key');
              }}
            />
            <button
              type="button"
              className={`tx-mic ${isListening ? 'listening' : ''}`}
              aria-label="Speak your question"
              onClick={handleVoice}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="16"
                height="16"
              >
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </button>
            <button type="submit" className="tx-send" aria-label="Run command">
              &#8629;
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
