import React from 'react';
import {useCurrentFrame, useVideoConfig, interpolate, spring, Audio, staticFile} from 'remotion';

// ── Frame conversion ──────────────────────────────────────────
const s2f = (s: number) => Math.round(s * 30);

// ── All timestamps → frames ───────────────────────────────────
const F = {
  // Camera phase transitions
  timelineFocus: s2f(9.12),   //  274  "look at this line"
  spFocus:       s2f(18.02),  //  541  "first the simple present"
  spHabits:      s2f(46.58),  // 1397  "habits"
  pcFocus:       s2f(69.92),  // 2098  "now let's look"
  pcTemp:        s2f(94.44),  // 2833  "also for temporary"
  outro:         s2f(127.26), // 3818  "great work"

  // Title pulses (first utterance in intro)
  titleSP:       s2f(6.08),   //  182  "simple"
  titlePC:       s2f(7.74),   //  232  "progressive"

  // Timeline element pulses
  tlPast:        s2f(11.74),  //  352
  tlFuture:      s2f(13.12),  //  394
  tlNow:         s2f(15.02),  //  451

  // Section head pulses (first utterance)
  shFacts:       s2f(32.22),  //  967
  shHabits:      s2f(46.58),  // 1397
  shProgressive: s2f(71.10),  // 2133
  shTemp:        s2f(96.48),  // 2894

  // Example reveals
  exWater:       s2f(21.74),
  exWorld:       s2f(24.78),
  exSun:         s2f(36.66),
  exDogs:        s2f(38.50),
  exIce:         s2f(40.66),
  exGetUp:       s2f(49.50),
  exEatSalad:    s2f(51.48),
  exDrinks:      s2f(59.26),
  exWalks:       s2f(61.56),
  exWatch:       s2f(63.48),
  exStudents:    s2f(74.32),
  exRaining:     s2f(77.08),
  exWatching:    s2f(82.46),
  exCooking:     s2f(84.46),
  exPlaying:     s2f(86.16),
  exTaking:      s2f(101.90),
  exStaying:     s2f(108.24),
  exWorking:     s2f(110.76),
  exLiving:      s2f(113.20),

  // Verb highlights
  vConsists:     s2f(22.14),
  vIsRound:      s2f(25.04),
  vRises:        s2f(36.92),
  vHave:         s2f(38.88),
  vIsCold:       s2f(40.96),
  vGetUp:        s2f(49.78),
  vEat:          s2f(52.08),
  vDrinks:       s2f(59.42),
  vWalks:        s2f(61.76),
  vWatch:        s2f(63.68),
  vSitting:      s2f(75.04),
  vRaining:      s2f(77.50),
  vWatching:     s2f(82.68),
  vCooking:      s2f(84.88),
  vPlaying:      s2f(86.56),
  vTaking:       s2f(102.26),
  vStaying:      s2f(108.68),
  vWorking:      s2f(111.20),
  vLiving:       s2f(113.68),

  // Outro section references
  outroSP:       s2f(130.22), // 3907
  outroHabits:   s2f(133.64), // 4009
  outroPC:       s2f(136.96), // 4109
  outroTemp:     s2f(140.20), // 4206
};

// ── Colors ────────────────────────────────────────────────────
const c = {
  bg:        '#F5F1E9',
  text:      '#1A1610',
  textSec:   '#7A7068',
  accent:    '#B83A1A',
  divider:   '#DDD6CC',
  calloutBg: '#EDE8DF',
  glowWarm:  'rgba(255,195,100,',
};

const clamp = {extrapolateLeft:'clamp' as const, extrapolateRight:'clamp' as const};
const ip = (frame:number, input:number[], output:number[]) =>
  interpolate(frame, input, output, clamp);

// ── Verb/pulse animation: springs large → settles at 1.0 ─────
const pulse = (frame:number, fps:number, atFrame:number) => {
  if (frame < atFrame) return {scale:1, brightness:1, glow:0};
  const s = spring({frame:frame-atFrame, fps, config:{damping:9, stiffness:280}});
  const capped = Math.min(s, 1.25);
  const brightness = 1 + ip(frame, [atFrame, atFrame+9], [0.8, 0]);
  return {
    scale:      1 + (1-capped)*0.42,
    brightness,
    glow:       Math.max(0, brightness-1),
  };
};

// ── Example reveal: frame-math opacity + translateY ───────────
const exReveal = (frame:number, atFrame:number, isActive:boolean) => ({
  opacity:     ip(frame, [atFrame, atFrame+14], [0, 1]),
  transform:   `translateY(${ip(frame, [atFrame, atFrame+14], [14, 0])}px)`,
  paddingLeft: 12,
  borderLeft:  `2.5px solid ${isActive ? c.accent : c.divider}`,
  fontSize:    14, lineHeight:1.65, color:c.text,
});

// ── Label pulse style ─────────────────────────────────────────
const labelPulseStyle = (frame:number, fps:number, atFrame:number) => {
  const p = pulse(frame, fps, atFrame);
  if (p.glow < 0.01) return {color:c.textSec};
  return {
    color:       c.accent,
    textShadow:  `0 0 ${p.glow*18}px rgba(184,58,26,0.65)`,
    filter:      `brightness(${p.brightness})`,
  };
};

// ── Master Timeline SVG ───────────────────────────────────────
const MasterTimeline: React.FC<{frame:number; fps:number}> = ({frame, fps}) => {
  const lineOp  = ip(frame, [20, 55], [0, 1]);
  const arrOp   = ip(frame, [40, 80], [0, 1]);
  const nowOp   = ip(frame, [65,110], [0, 1]);
  const labOp   = ip(frame, [55, 90], [0, 1]);
  const ringR   = ip(frame, [70,130], [0, 24]);
  const ringOp  = ip(frame, [70,100,130], [0.8, 0.35, 0]);

  const pastP   = pulse(frame, fps, F.tlPast);
  const futureP = pulse(frame, fps, F.tlFuture);
  const nowP    = pulse(frame, fps, F.tlNow);

  const tStyle = (p:{brightness:number}) =>
    ({style:{filter:`brightness(${p.brightness})`}} as React.SVGProps<SVGTextElement>);

  return (
    <svg viewBox="0 0 200 44" width="268" height="59">
      <line x1="16" y1="24" x2="184" y2="24" stroke={c.text} strokeWidth="1.4" opacity={lineOp}/>
      <polygon points="16,24 24,19 24,29"   fill={c.text} opacity={arrOp}/>
      <polygon points="184,24 176,19 176,29" fill={c.text} opacity={arrOp}/>
      <circle cx="100" cy="24" r={ringR} fill="none" stroke={c.accent} strokeWidth="1.5" opacity={ringOp}/>
      <line x1="100" y1="6" x2="100" y2="32" stroke={c.accent} strokeWidth="2.5" opacity={nowOp}/>
      <polygon points="100,6 96,14 104,14" fill={c.accent} opacity={nowOp}/>
      <text x="22"  y="16" fontSize="8.5" fontFamily="Jost,sans-serif"
        fill={pastP.glow>0.01?c.accent:c.textSec} opacity={labOp}
        {...tStyle(pastP)}>past</text>
      <text x="178" y="16" textAnchor="end" fontSize="8.5" fontFamily="Jost,sans-serif"
        fill={futureP.glow>0.01?c.accent:c.textSec} opacity={labOp}
        {...tStyle(futureP)}>future</text>
      <text x="100" y="43" textAnchor="middle" fontSize="8" fontFamily="Jost,sans-serif"
        fill={c.accent} fontWeight="600" opacity={nowOp}
        style={{filter:`brightness(${nowP.brightness})`}}>NOW</text>
    </svg>
  );
};

// ── Simple Present SVG — ticks ripple from NOW ────────────────
const SimplePresentSVG: React.FC<{frame:number; sf:number}> = ({frame, sf}) => {
  const ticks  = [28,50,72,94,116,138,160,182,204];
  const nowIdx = 4;
  const svgOp  = ip(frame, [sf, sf+10], [0, 1]);
  const ringR  = ip(frame, [sf+2, sf+38], [0, 18]);
  const ringOp = ip(frame, [sf+2, sf+18, sf+38], [0.9, 0.45, 0]);
  return (
    <svg viewBox="0 0 240 50" width="320" height="67" opacity={svgOp}>
      <line x1="12" y1="28" x2="228" y2="28" stroke={c.text} strokeWidth="1.2"/>
      <polygon points="12,28 20,23 20,33" fill={c.text}/>
      <polygon points="228,28 220,23 220,33" fill={c.text}/>
      <circle cx="116" cy="28" r={ringR} fill="none" stroke={c.accent} strokeWidth="1.5" opacity={ringOp}/>
      {ticks.map((x,i)=>{
        const dist=Math.abs(i-nowIdx);
        const at=sf+dist*4;
        return(
          <line key={x}
            x1={x} y1={i===nowIdx?13:19} x2={x} y2={i===nowIdx?43:37}
            stroke={i===nowIdx?c.accent:c.text} strokeWidth={i===nowIdx?2.5:1}
            opacity={ip(frame,[at,at+8],[0,i===nowIdx?1:0.42])}/>
        );
      })}
      <text x="14"  y="13" fontSize="7.5" fontFamily="Jost,sans-serif" fill={c.textSec}
        opacity={ip(frame,[sf+8,sf+22],[0,0.7])}>past</text>
      <text x="226" y="13" textAnchor="end" fontSize="7.5" fontFamily="Jost,sans-serif" fill={c.textSec}
        opacity={ip(frame,[sf+8,sf+22],[0,0.7])}>future</text>
      <text x="116" y="50" textAnchor="middle" fontSize="7.5" fontFamily="Jost,sans-serif"
        fill={c.accent} fontWeight="600" opacity={ip(frame,[sf+12,sf+28],[0,1])}>now</text>
    </svg>
  );
};

// ── Present Progressive SVG — arc with traveling dot + trail ──
const PresentProgressiveSVG: React.FC<{frame:number; sf:number}> = ({frame, sf}) => {
  const drawn=frame>=sf;
  const arcLen=162, dur=42;
  const prog=drawn?Math.min(1,(frame-sf)/dur):0;
  const bx=(t:number)=>(1-t)*(1-t)*60+2*(1-t)*t*130+t*t*200;
  const by=(t:number)=>(1-t)*(1-t)*38+2*(1-t)*t*6+t*t*38;
  const trailP=drawn?Math.max(0,Math.min(1,(frame-sf-8)/dur)):0;
  const showDot=prog>0.02&&prog<0.97;
  const showTrail=trailP>0.02&&trailP<0.97&&showDot;
  const eo=(d:number)=>ip(frame,[sf+d,sf+d+12],[0,1]);
  return(
    <svg viewBox="0 0 240 62" width="320" height="83">
      <line x1="12" y1="38" x2="228" y2="38" stroke={c.text} strokeWidth="1" opacity={eo(0)*0.2}/>
      <polygon points="12,38 20,33 20,43" fill={c.text} opacity={eo(0)*0.2}/>
      <polygon points="228,38 220,33 220,43" fill={c.text} opacity={eo(0)*0.2}/>
      {showTrail&&<circle cx={bx(trailP)} cy={by(trailP)} r="6" fill={c.accent} opacity="0.13"/>}
      <path d="M 60,38 Q 130,6 200,38"
        stroke={c.accent} strokeWidth="2.2" fill="none" strokeLinecap="round"
        strokeDasharray={arcLen} strokeDashoffset={(1-prog)*arcLen}/>
      {showDot&&<>
        <circle cx={bx(prog)} cy={by(prog)} r="10" fill={c.accent} opacity="0.14"/>
        <circle cx={bx(prog)} cy={by(prog)} r="5"  fill={c.accent}/>
      </>}
      <circle cx="60"  cy="38" r="3.5" fill={c.text} opacity={eo(14)}/>
      <circle cx="200" cy="38" r="3.5" fill="none" stroke={c.text}
        strokeWidth="1.5" strokeDasharray="2.5,1.5" opacity={eo(36)}/>
      <line x1="130" y1="8" x2="130" y2="52" stroke={c.accent} strokeWidth="1.5"
        strokeDasharray="3,2.5" opacity={ip(frame,[sf+22,sf+36],[0,0.6])}/>
      <text x="14"  y="28" fontSize="7.5" fontFamily="Jost,sans-serif" fill={c.textSec} opacity={eo(4)*0.5}>past</text>
      <text x="226" y="28" textAnchor="end" fontSize="7.5" fontFamily="Jost,sans-serif" fill={c.textSec} opacity={eo(4)*0.5}>future</text>
      <text x="60"  y="58" textAnchor="middle" fontSize="7.5" fontFamily="Jost,sans-serif" fill={c.textSec} opacity={eo(40)}>start</text>
      <text x="130" y="62" textAnchor="middle" fontSize="7.5" fontFamily="Jost,sans-serif"
        fill={c.accent} fontWeight="600" opacity={eo(28)}>now</text>
      <text x="200" y="58" textAnchor="middle" fontSize="7.5" fontFamily="Jost,sans-serif" fill={c.textSec} opacity={eo(40)}>finish?</text>
    </svg>
  );
};

// ── Main composition ──────────────────────────────────────────
export const GrammarChart: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // ── Section ────────────────────────────────────────────────
  const section =
    frame < F.timelineFocus ? 'intro'     :
    frame < F.spFocus       ? 'timeline'  :
    frame < F.spHabits      ? 'sp-facts'  :
    frame < F.pcFocus       ? 'sp-habits' :
    frame < F.pcTemp        ? 'pc-now'    :
    frame < F.outro         ? 'pc-temp'   : 'outro';

  const isSP = section==='sp-facts'||section==='sp-habits';
  const isPC = section==='pc-now'  ||section==='pc-temp';
  const isSpFacts  = section==='sp-facts';
  const isSpHabits = section==='sp-habits';
  const isPcNow    = section==='pc-now';
  const isPcTemp   = section==='pc-temp';
  const isOutro    = section==='outro';

  // ── Springs (one per camera phase transition) ──────────────
  const sp = (atFrame:number, cfg={}) =>
    frame>=atFrame
      ? spring({frame:frame-atFrame, fps, config:{damping:16,stiffness:110,...cfg}})
      : 0;

  const s0 = Math.min(sp(F.timelineFocus,{damping:15,stiffness:100}),1.08); // overview→timeline
  const s1 = Math.min(sp(F.spFocus,      {damping:15,stiffness:105}),1.08); // timeline→sp-facts
  const s2 = Math.min(sp(F.spHabits,     {damping:18,stiffness: 90}),1.08); // sp-facts→sp-habits
  const s3 = Math.min(sp(F.pcFocus,      {damping:16,stiffness: 88}),1.08); // sp-habits→pc-now
  const s4 = Math.min(sp(F.pcTemp,       {damping:18,stiffness: 90}),1.08); // pc-now→pc-temp
  const s5 = Math.min(sp(F.outro,        {damping:15,stiffness:105}),1.08); // pc-temp→overview

  // ── Camera (accumulated springs, verified math) ────────────
  // Phase targets:
  //   intro:     camZ=1.0, camTX=640,  camTY=360
  //   timeline:  camZ=2.0, camTX=960,  camTY=66   (right half of header, timeline SVG)
  //   sp-facts:  camZ=3.0, camTX=257,  camTY=355  (left col, 40px left margin)
  //   sp-habits: camZ=3.0, camTX=257,  camTY=538
  //   pc-now:    camZ=3.0, camTX=866,  camTY=371  (right col, 40px left margin)
  //   pc-temp:   camZ=3.0, camTX=866,  camTY=554
  //   outro:     camZ=1.0, camTX=640,  camTY=360

  const camZ  = 1   + s0*1.0  + s1*1.0  - s5*2.0;
  const camTX = 640 + s0*320  - s1*703  + s3*609  - s5*226;
  const camTY = 360 - s0*294  + s1*289  + s2*183  - s3*167  + s4*183  - s5*194;

  const camMatrix =
    `matrix(${camZ},0,0,${camZ},${640-camTX*camZ},${360-camTY*camZ})`;

  // ── Section flash ──────────────────────────────────────────
  const flashOp = (at:number) =>
    ip(frame, [at,at+8,at+40,at+52], [0,1,1,0]);
  const spFlash = flashOp(F.spFocus);
  const pcFlash = flashOp(F.pcFocus);
  const activeFlash = Math.max(spFlash, pcFlash);
  const flashText = spFlash>pcFlash ? 'Present Simple' : 'Present Progressive';
  const flashLineW = spFlash>pcFlash
    ? ip(frame, [F.spFocus+10, F.spFocus+32], [0,240])
    : ip(frame, [F.pcFocus+10, F.pcFocus+32], [0,240]);

  // ── Title pulses ───────────────────────────────────────────
  const titleSPp  = pulse(frame, fps, F.titleSP);
  const titlePCp  = pulse(frame, fps, F.titlePC);

  // ── Section head pulses ────────────────────────────────────
  const shFactsStyle  = labelPulseStyle(frame, fps, F.shFacts);
  const shHabitsStyle = labelPulseStyle(frame, fps, F.shHabits);
  const shProgStyle   = labelPulseStyle(frame, fps, F.shProgressive);
  const shTempStyle   = labelPulseStyle(frame, fps, F.shTemp);

  // ── Outro column glows ─────────────────────────────────────
  const glow = (at:number, strength=1) =>
    ip(frame, [at, at+10, at+35, at+55], [0, strength, strength, 0]);
  const spGlow  = Math.min(1, glow(F.outroSP) + glow(F.outroHabits, 0.7));
  const pcGlow  = Math.min(1, glow(F.outroPC) + glow(F.outroTemp,   0.7));

  // ── Verb render function ───────────────────────────────────
  const V = (text:string, atFrame:number): JSX.Element => {
    const p = pulse(frame, fps, atFrame);
    return (
      <em style={{
        color:c.accent, fontStyle:'italic', fontWeight:500,
        display:'inline-block',
        transform:`scale(${p.scale})`,
        filter:`brightness(${p.brightness})`,
      }}>{text}</em>
    );
  };

  // ── Subsection opacity ─────────────────────────────────────
  const subOp = (sk:string) => {
    if (section==='intro'||section==='outro') return 1;
    if (section==='timeline') return 0.45;
    if (section===sk) return 1;
    const sameCol=(isSP&&(sk==='sp-facts'||sk==='sp-habits'))
               ||(isPC&&(sk==='pc-now'  ||sk==='pc-temp'));
    return sameCol ? 0.28 : 1;
  };

  // ── Callout opacity ────────────────────────────────────────
  const calloutSP = (isSP||isOutro)
    ? ip(frame,[F.exWater+20,F.exWater+45],[0,1]) : 0;
  const calloutPC = (isPC||isOutro)
    ? ip(frame,[F.exStudents+20,F.exStudents+45],[0,1]) : 0;

  // ── Chart enter ────────────────────────────────────────────
  const chartEnterOp = ip(frame,[0,20],[0,1]);
  const chartEnterY  = ip(frame,[0,20],[30,0]);

  return (
    <div style={{width:1280,height:720,background:'#18140F',position:'relative',overflow:'hidden'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700&family=Jost:ital,wght@0,300;0,400;0,500;1,400&display=swap');
      `}</style>

      <Audio src={staticFile('audio.mp3')}/>

      {/* ── CHART — camera transform ───────────────────────── */}
      <div style={{
        width:1280, height:720, position:'absolute', top:0, left:0,
        transform:camMatrix, transformOrigin:'0 0',
        opacity:chartEnterOp, willChange:'transform',
      }}>
        <div style={{
          width:1280, height:720, background:c.bg,
          display:'flex', flexDirection:'column',
          fontFamily:"'Jost',Georgia,sans-serif",
          transform:`translateY(${chartEnterY}px)`,
          position:'relative',
        }}>
          {/* Grain */}
          <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:30,
            backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`}}/>
          {/* Vignette */}
          <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:25,
            background:'radial-gradient(ellipse 88% 82% at 50% 50%,transparent 50%,rgba(14,10,6,0.22) 100%)'}}/>

          {/* Accent bar */}
          <div style={{height:5,background:c.accent,flexShrink:0}}/>

          {/* ── HEADER ────────────────────────────────────── */}
          <div style={{
            padding:'18px 48px 15px', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'space-between',
            borderBottom:`1px solid ${c.divider}`,
          }}>
            <div>
              <div style={{fontSize:11,fontWeight:400,letterSpacing:'2.5px',
                textTransform:'uppercase',color:c.textSec,marginBottom:6}}>
                English Grammar · Present Tenses
              </div>
              {/* Title with individual term pulses */}
              <h1 style={{
                fontFamily:"'Cormorant Garamond',Georgia,serif",
                fontSize:34,fontWeight:700,color:c.text,letterSpacing:'-0.3px',lineHeight:1.1,
              }}>
                <span style={{
                  display:'inline-block',
                  filter:`brightness(${titleSPp.brightness})`,
                  textShadow:titleSPp.glow>0.01?`0 0 ${titleSPp.glow*28}px rgba(184,58,26,0.55)`:undefined,
                }}>Simple Present</span>
                <br/>
                <span style={{color:c.accent}}>&</span>{' '}
                <span style={{
                  display:'inline-block',
                  filter:`brightness(${titlePCp.brightness})`,
                  textShadow:titlePCp.glow>0.01?`0 0 ${titlePCp.glow*28}px rgba(184,58,26,0.55)`:undefined,
                }}>Present Progressive</span>
              </h1>
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
              <div style={{fontSize:10,letterSpacing:'1.8px',textTransform:'uppercase',color:c.textSec,marginBottom:4}}>
                Time Reference
              </div>
              <MasterTimeline frame={frame} fps={fps}/>
            </div>
          </div>

          {/* ── TWO COLUMNS ─────────────────────────────────── */}
          <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr',overflow:'hidden'}}>

            {/* ════ LEFT: Present Simple ════════════════════ */}
            <div style={{borderRight:`1px solid ${c.divider}`,position:'relative',overflow:'hidden'}}>
              {/* Outro warm glow overlay */}
              {isOutro&&spGlow>0.01&&(
                <div style={{
                  position:'absolute',inset:0,zIndex:6,pointerEvents:'none',
                  background:`${c.glowWarm}${spGlow*0.13})`,
                  boxShadow:`inset 0 0 50px ${c.glowWarm}${spGlow*0.09})`,
                }}/>
              )}
              <div style={{padding:'15px 26px 14px 44px',display:'flex',flexDirection:'column',gap:9,height:'100%'}}>
                <div>
                  <div style={{fontSize:10,fontWeight:500,letterSpacing:'2px',
                    textTransform:'uppercase',color:c.accent,marginBottom:4}}>Tense 01</div>
                  <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",
                    fontSize:22,fontWeight:600,color:c.text,lineHeight:1}}>Present Simple</div>
                </div>
                <SimplePresentSVG frame={frame} sf={F.spFocus}/>

                {/* Facts subsection */}
                <div style={{
                  background:isSpFacts?'rgba(184,58,26,0.07)':'transparent',
                  borderRadius:6,padding:'8px 10px',opacity:subOp('sp-facts'),
                }}>
                  <div style={{fontSize:10,fontWeight:500,letterSpacing:'1.5px',
                    textTransform:'uppercase',marginBottom:7,...shFactsStyle}}>
                    Facts & General Truths
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    <div style={exReveal(frame,F.exWater,   isSpFacts)}>Water {V('consists',F.vConsists)} of hydrogen and oxygen.</div>
                    <div style={exReveal(frame,F.exWorld,   isSpFacts)}>The world {V('is',F.vIsRound)} round.</div>
                    <div style={exReveal(frame,F.exSun,     isSpFacts)}>The sun {V('rises',F.vRises)} in the east.</div>
                    <div style={exReveal(frame,F.exDogs,    isSpFacts)}>Dogs {V('have',F.vHave)} four legs.</div>
                    <div style={exReveal(frame,F.exIce,     isSpFacts)}>Ice {V('is',F.vIsCold)} cold.</div>
                  </div>
                </div>

                {/* Habits subsection */}
                <div style={{
                  background:isSpHabits?'rgba(184,58,26,0.07)':'transparent',
                  borderRadius:6,padding:'8px 10px',opacity:subOp('sp-habits'),
                }}>
                  <div style={{fontSize:10,fontWeight:500,letterSpacing:'1.5px',
                    textTransform:'uppercase',marginBottom:7,...shHabitsStyle}}>
                    Habits & Routine
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    <div style={exReveal(frame,F.exGetUp,   isSpHabits)}>I {V('get up',F.vGetUp)} at seven every morning.</div>
                    <div style={exReveal(frame,F.exEatSalad,isSpHabits)}>I always {V('eat',F.vEat)} a salad for lunch.</div>
                    <div style={exReveal(frame,F.exDrinks,  isSpHabits)}>She {V('drinks',F.vDrinks)} coffee every morning.</div>
                    <div style={exReveal(frame,F.exWalks,   isSpHabits)}>He {V('walks',F.vWalks)} to school every day.</div>
                    <div style={exReveal(frame,F.exWatch,   isSpHabits)}>We {V('watch',F.vWatch)} TV on Sundays.</div>
                  </div>
                </div>

                <div style={{
                  background:c.calloutBg,borderLeft:`3px solid ${c.accent}`,
                  padding:'10px 14px',fontSize:13,lineHeight:1.55,
                  color:'#3C3530',fontStyle:'italic',marginTop:'auto',
                  opacity:calloutSP,transform:`translateY(${(1-calloutSP)*8}px)`,
                }}>
                  Always true — past, present, and future. Use for facts and regular, repeated actions.
                </div>
              </div>
            </div>

            {/* ════ RIGHT: Present Progressive ══════════════ */}
            <div style={{position:'relative',overflow:'hidden'}}>
              {/* Outro warm glow overlay */}
              {isOutro&&pcGlow>0.01&&(
                <div style={{
                  position:'absolute',inset:0,zIndex:6,pointerEvents:'none',
                  background:`${c.glowWarm}${pcGlow*0.13})`,
                  boxShadow:`inset 0 0 50px ${c.glowWarm}${pcGlow*0.09})`,
                }}/>
              )}
              <div style={{padding:'15px 44px 14px 26px',display:'flex',flexDirection:'column',gap:9,height:'100%'}}>
                <div>
                  <div style={{fontSize:10,fontWeight:500,letterSpacing:'2px',
                    textTransform:'uppercase',color:c.accent,marginBottom:4}}>Tense 02</div>
                  <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",
                    fontSize:22,fontWeight:600,color:c.text,lineHeight:1,...shProgStyle}}>
                    Present Progressive
                  </div>
                </div>
                <PresentProgressiveSVG frame={frame} sf={F.pcFocus}/>

                {/* Now subsection */}
                <div style={{
                  background:isPcNow?'rgba(184,58,26,0.07)':'transparent',
                  borderRadius:6,padding:'8px 10px',opacity:subOp('pc-now'),
                }}>
                  <div style={{fontSize:10,fontWeight:500,letterSpacing:'1.5px',
                    textTransform:'uppercase',marginBottom:7,...(isPcNow?shProgStyle:{color:c.textSec})}}>
                    Happening Right Now
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    <div style={exReveal(frame,F.exStudents,isPcNow)}>The students {V('are sitting',F.vSitting)} at their desks.</div>
                    <div style={exReveal(frame,F.exRaining, isPcNow)}>It {V('is raining',F.vRaining)}.</div>
                    <div style={exReveal(frame,F.exWatching,isPcNow)}>I {V('am watching',F.vWatching)} a video right now.</div>
                    <div style={exReveal(frame,F.exCooking, isPcNow)}>She {V('is cooking',F.vCooking)} dinner.</div>
                    <div style={exReveal(frame,F.exPlaying, isPcNow)}>They {V('are playing',F.vPlaying)} football in the garden.</div>
                  </div>
                </div>

                {/* Temp subsection */}
                <div style={{
                  background:isPcTemp?'rgba(184,58,26,0.07)':'transparent',
                  borderRadius:6,padding:'8px 10px',opacity:subOp('pc-temp'),
                }}>
                  <div style={{fontSize:10,fontWeight:500,letterSpacing:'1.5px',
                    textTransform:'uppercase',marginBottom:7,...shTempStyle}}>
                    Temporary Situations
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    <div style={exReveal(frame,F.exTaking, isPcTemp)}>I {V('am taking',F.vTaking)} five courses this semester.</div>
                    <div style={exReveal(frame,F.exStaying,isPcTemp)}>He {V('is staying',F.vStaying)} with his parents this month.</div>
                    <div style={exReveal(frame,F.exWorking,isPcTemp)}>She {V('is working',F.vWorking)} at a café this summer.</div>
                    <div style={exReveal(frame,F.exLiving, isPcTemp)}>They {V('are living',F.vLiving)} in a small apartment right now.</div>
                  </div>
                </div>

                <div style={{
                  background:c.calloutBg,borderLeft:`3px solid ${c.accent}`,
                  padding:'10px 14px',fontSize:13,lineHeight:1.55,
                  color:'#3C3530',fontStyle:'italic',marginTop:'auto',
                  opacity:calloutPC,transform:`translateY(${(1-calloutPC)*8}px)`,
                }}>
                  In progress right now, or temporary — started in the past, will end in the future.
                </div>
              </div>
            </div>

          </div>

          {/* ── FOOTER ──────────────────────────────────────── */}
          <div style={{
            padding:'6px 48px',flexShrink:0,
            borderTop:`1px solid ${c.divider}`,
            display:'flex',justifyContent:'space-between',alignItems:'center',
          }}>
            <span style={{fontSize:10,color:c.textSec}}>
              Verb forms shown in <em style={{color:c.accent}}>italic</em> — pay attention to spelling and conjugation
            </span>
            <span style={{fontSize:10,color:c.textSec,letterSpacing:'1px',textTransform:'uppercase'}}>
              English Grammar Series
            </span>
          </div>
        </div>
      </div>

      {/* ── SECTION FLASH — outside camera transform ──────── */}
      {activeFlash>0.01&&(
        <div style={{
          position:'absolute',inset:0,zIndex:50,
          display:'flex',alignItems:'center',justifyContent:'center',
          background:`rgba(245,241,233,${activeFlash*0.97})`,
          pointerEvents:'none',
        }}>
          <div style={{textAlign:'center',opacity:activeFlash}}>
            <div style={{
              fontFamily:"'Cormorant Garamond',Georgia,serif",
              fontSize:72,fontWeight:700,color:c.text,
              letterSpacing:'0.04em',lineHeight:1,
            }}>
              {flashText}
            </div>
            <div style={{height:4,background:c.accent,margin:'14px auto 0',width:flashLineW}}/>
          </div>
        </div>
      )}

    </div>
  );
};
