import React from 'react';
import {
  AbsoluteFill,
  Html5Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';

type BaseScene = {
  type: 'hook' | 'split' | 'flow' | 'risk' | 'evidence' | 'conclusion';
  startFrame: number;
  durationFrames: number;
  voice: string;
  eyebrow?: string;
  headline?: string;
  subline?: string;
  emphasis?: string;
};

type SplitScene = BaseScene & {
  type: 'split';
  left?: {label: string; detail?: string};
  right?: {label: string; detail?: string};
  center?: string;
};

type FlowScene = BaseScene & {
  type: 'flow';
  steps?: Array<{label: string; detail?: string}>;
};

type RiskScene = BaseScene & {
  type: 'risk';
  items?: Array<{label: string; state?: 'bad' | 'good' | 'neutral'}>;
};

type EvidenceScene = BaseScene & {
  type: 'evidence';
  quote?: string;
  sourceLabel?: string;
};

type ConclusionScene = BaseScene & {
  type: 'conclusion';
  points?: string[];
};

export type Scene = BaseScene | SplitScene | FlowScene | RiskScene | EvidenceScene | ConclusionScene;

export type ShortProps = {
  id: string;
  title: string;
  source: string;
  accent?: string;
  audioFile: string;
  totalFrames: number;
  scenes: Scene[];
};

const BG = '#08111F';
const PANEL = '#101D2F';
const TEXT = '#F5F8FC';
const MUTED = '#AFC0D4';
const CYAN = '#4EB5FF';
const GREEN = '#64E0A3';
const RED = '#FF6C7B';
const YELLOW = '#FFD36A';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const fadeForScene = (frame: number, duration: number) => {
  const fadeIn = interpolate(frame, [0, 10], [0, 1], clamp);
  const fadeOut = interpolate(frame, [Math.max(duration - 10, 10), duration], [1, 0], clamp);
  return Math.min(fadeIn, fadeOut);
};

const enter = (frame: number, fps: number, delay = 0) => {
  const value = spring({
    frame: frame - delay,
    fps,
    config: {damping: 18, stiffness: 155, mass: 0.8},
    durationInFrames: 22
  });
  return {
    opacity: interpolate(value, [0, 1], [0, 1], clamp),
    transform: 'translateY(' + interpolate(value, [0, 1], [28, 0], clamp) + 'px)'
  };
};

const SafeBackground: React.FC<{accent: string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame % 240, [0, 240], [-30, 30]);
  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 22% 10%, ' + accent + '22 0, transparent 28%),' +
            'radial-gradient(circle at 88% 72%, #3F6EFF18 0, transparent 30%),' +
            'linear-gradient(180deg, #0A1526 0%, #07101C 100%)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 780,
          height: 780,
          right: -360 + drift,
          top: 180,
          borderRadius: '50%',
          border: '2px solid ' + accent + '20'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 540,
          height: 540,
          left: -300 - drift,
          bottom: 260,
          borderRadius: '50%',
          border: '2px solid #FFFFFF0B'
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.12,
          backgroundImage:
            'linear-gradient(#FFFFFF10 1px, transparent 1px), linear-gradient(90deg, #FFFFFF10 1px, transparent 1px)',
          backgroundSize: '64px 64px'
        }}
      />
    </AbsoluteFill>
  );
};

const BrandBar: React.FC<{accent: string; progress: number}> = ({accent, progress}) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: 72,
        right: 150,
        top: 66,
        height: 46,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        color: MUTED,
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: 2
      }}
    >
      <span style={{width: 12, height: 12, borderRadius: 99, background: accent, boxShadow: '0 0 24px ' + accent}} />
      PTA適正化推進委員会
    </div>
    <div
      style={{
        position: 'absolute',
        left: 72,
        right: 150,
        top: 126,
        height: 5,
        borderRadius: 999,
        overflow: 'hidden',
        background: '#FFFFFF12'
      }}
    >
      <div style={{width: Math.max(0, Math.min(100, progress * 100)) + '%', height: '100%', background: accent}} />
    </div>
  </>
);

const Footer: React.FC<{source: string; index: number; count: number}> = ({source, index, count}) => (
  <div
    style={{
      position: 'absolute',
      left: 72,
      right: 150,
      bottom: 52,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: '#8FA4BC',
      fontSize: 23,
      fontWeight: 600
    }}
  >
    <span>{source.replace(/^https?:\/\//, '')}</span>
    <span>{String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</span>
  </div>
);

const Caption: React.FC<{text: string; accent: string}> = ({text, accent}) => {
  if (!text) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 72,
        right: 150,
        bottom: 150,
        minHeight: 150,
        padding: '24px 34px',
        borderRadius: 26,
        background: '#07111DEB',
        border: '1px solid #FFFFFF1B',
        boxShadow: '0 20px 70px #00000055',
        display: 'flex',
        alignItems: 'center',
        color: TEXT,
        fontSize: 39,
        lineHeight: 1.5,
        fontWeight: 800
      }}
    >
      <div style={{width: 6, alignSelf: 'stretch', borderRadius: 999, background: accent, marginRight: 24}} />
      <div>{text}</div>
    </div>
  );
};

const SchoolIcon: React.FC<{accent: string}> = ({accent}) => (
  <svg width="270" height="230" viewBox="0 0 270 230" fill="none">
    <path d="M25 95L135 28L245 95" stroke={accent} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="48" y="92" width="174" height="112" rx="12" fill="#FFFFFF08" stroke="#DDEBFA" strokeWidth="10"/>
    <rect x="112" y="139" width="46" height="65" rx="8" fill={accent + '40'} stroke={accent} strokeWidth="8"/>
    <rect x="72" y="116" width="24" height="24" rx="4" fill="#DDEBFA"/>
    <rect x="174" y="116" width="24" height="24" rx="4" fill="#DDEBFA"/>
  </svg>
);

const GroupIcon: React.FC<{accent: string}> = ({accent}) => (
  <svg width="290" height="230" viewBox="0 0 290 230" fill="none">
    <circle cx="145" cy="66" r="36" fill={accent + '55'} stroke={accent} strokeWidth="9"/>
    <circle cx="72" cy="91" r="28" fill="#FFFFFF18" stroke="#DDEBFA" strokeWidth="8"/>
    <circle cx="218" cy="91" r="28" fill="#FFFFFF18" stroke="#DDEBFA" strokeWidth="8"/>
    <path d="M86 188C86 145 110 124 145 124C180 124 204 145 204 188" stroke={accent} strokeWidth="14" strokeLinecap="round"/>
    <path d="M26 190C26 156 44 138 72 138C92 138 108 147 117 165" stroke="#DDEBFA" strokeWidth="11" strokeLinecap="round"/>
    <path d="M264 190C264 156 246 138 218 138C198 138 182 147 173 165" stroke="#DDEBFA" strokeWidth="11" strokeLinecap="round"/>
  </svg>
);

const FormIcon: React.FC<{accent: string}> = ({accent}) => (
  <svg width="270" height="260" viewBox="0 0 270 260" fill="none">
    <rect x="48" y="20" width="174" height="220" rx="18" fill="#FFFFFF08" stroke="#DDEBFA" strokeWidth="9"/>
    <path d="M83 78H185" stroke="#8398B1" strokeWidth="10" strokeLinecap="round"/>
    <path d="M83 112H174" stroke="#8398B1" strokeWidth="10" strokeLinecap="round"/>
    <rect x="82" y="154" width="38" height="38" rx="8" stroke={accent} strokeWidth="8"/>
    <path d="M91 173L104 185L132 148" stroke={accent} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M140 173H187" stroke="#DDEBFA" strokeWidth="10" strokeLinecap="round"/>
  </svg>
);

const WarningIcon: React.FC = () => (
  <svg width="260" height="235" viewBox="0 0 260 235" fill="none">
    <path d="M130 25L238 207H22L130 25Z" fill="#FF6C7B22" stroke={RED} strokeWidth="12" strokeLinejoin="round"/>
    <path d="M130 82V143" stroke={RED} strokeWidth="16" strokeLinecap="round"/>
    <circle cx="130" cy="176" r="9" fill={RED}/>
  </svg>
);

const Heading: React.FC<{eyebrow?: string; headline?: string; accent: string; frame: number; fps: number}> = ({
  eyebrow,
  headline,
  accent,
  frame,
  fps
}) => (
  <div style={{position: 'absolute', left: 72, right: 150, top: 190}}>
    {eyebrow ? (
      <div
        style={{
          ...enter(frame, fps, 0),
          color: accent,
          fontSize: 31,
          fontWeight: 900,
          letterSpacing: 2,
          marginBottom: 22
        }}
      >
        {eyebrow}
      </div>
    ) : null}
    {headline ? (
      <div
        style={{
          ...enter(frame, fps, 5),
          color: TEXT,
          fontSize: 82,
          fontWeight: 900,
          lineHeight: 1.16,
          letterSpacing: -3,
          whiteSpace: 'pre-line'
        }}
      >
        {headline}
      </div>
    ) : null}
  </div>
);

const HookScene: React.FC<{scene: Scene; accent: string}> = ({scene, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ring = spring({frame: frame - 11, fps, config: {damping: 12, stiffness: 135}, durationInFrames: 26});
  return (
    <>
      <Heading eyebrow={scene.eyebrow} headline={scene.headline} accent={accent} frame={frame} fps={fps}/>
      <div
        style={{
          position: 'absolute',
          left: 72,
          right: 150,
          top: 660,
          height: 565,
          borderRadius: 42,
          background: 'linear-gradient(145deg, #112239E8, #0C1727E8)',
          border: '1px solid #FFFFFF18',
          boxShadow: '0 34px 100px #00000055',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          overflow: 'hidden',
          ...enter(frame, fps, 9)
        }}
      >
        <div style={{transform: 'translateY(20px)'}}><SchoolIcon accent={accent}/></div>
        <div
          style={{
            width: 250,
            height: 250,
            borderRadius: '50%',
            border: '18px solid ' + RED,
            transform: 'scale(' + interpolate(ring, [0, 1], [0.15, 1], clamp) + ') rotate(-8deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: RED,
            fontSize: 84,
            fontWeight: 1000,
            boxShadow: '0 0 80px #FF6C7B22'
          }}
        >
          ?
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 112,
          right: 190,
          top: 1270,
          padding: '26px 38px',
          borderRadius: 999,
          background: RED,
          color: '#18070A',
          fontSize: 42,
          fontWeight: 1000,
          textAlign: 'center',
          letterSpacing: 1,
          ...enter(frame, fps, 18)
        }}
      >
        {scene.subline || scene.emphasis || '自動ではありません'}
      </div>
    </>
  );
};

const SplitSceneView: React.FC<{scene: SplitScene; accent: string}> = ({scene, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const left = scene.left || {label: '学校', detail: '在籍'};
  const right = scene.right || {label: 'PTA', detail: '加入'};
  return (
    <>
      <Heading eyebrow={scene.eyebrow} headline={scene.headline} accent={accent} frame={frame} fps={fps}/>
      <div style={{position: 'absolute', left: 72, right: 150, top: 600, display: 'flex', gap: 28, alignItems: 'stretch'}}>
        <div style={{flex: 1, height: 590, borderRadius: 40, background: PANEL, border: '1px solid #FFFFFF18', padding: 40, ...enter(frame, fps, 6)}}>
          <div style={{height: 290, display: 'flex', justifyContent: 'center', alignItems: 'center'}}><SchoolIcon accent={accent}/></div>
          <div style={{fontSize: 54, fontWeight: 1000, color: TEXT, textAlign: 'center'}}>{left.label}</div>
          <div style={{fontSize: 31, fontWeight: 800, color: MUTED, textAlign: 'center', marginTop: 12}}>{left.detail}</div>
        </div>
        <div style={{width: 125, display: 'flex', alignItems: 'center', justifyContent: 'center', color: YELLOW, fontSize: 110, fontWeight: 1000, ...enter(frame, fps, 13)}}>
          {scene.center || '≠'}
        </div>
        <div style={{flex: 1, height: 590, borderRadius: 40, background: PANEL, border: '1px solid #FFFFFF18', padding: 40, ...enter(frame, fps, 20)}}>
          <div style={{height: 290, display: 'flex', justifyContent: 'center', alignItems: 'center'}}><GroupIcon accent={GREEN}/></div>
          <div style={{fontSize: 54, fontWeight: 1000, color: TEXT, textAlign: 'center'}}>{right.label}</div>
          <div style={{fontSize: 31, fontWeight: 800, color: MUTED, textAlign: 'center', marginTop: 12}}>{right.detail}</div>
        </div>
      </div>
    </>
  );
};

const FlowSceneView: React.FC<{scene: FlowScene; accent: string}> = ({scene, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const steps = scene.steps || [
    {label: '保護者'},
    {label: '加入意思'},
    {label: 'PTA会員'}
  ];
  return (
    <>
      <Heading eyebrow={scene.eyebrow} headline={scene.headline} accent={accent} frame={frame} fps={fps}/>
      <div style={{position: 'absolute', left: 94, right: 172, top: 650}}>
        {steps.map((step, i) => (
          <React.Fragment key={step.label + i}>
            <div
              style={{
                height: 205,
                borderRadius: 34,
                background: i === 1 ? accent + '20' : PANEL,
                border: '2px solid ' + (i === 1 ? accent : '#FFFFFF18'),
                display: 'flex',
                alignItems: 'center',
                padding: '0 46px',
                gap: 36,
                ...enter(frame, fps, i * 12 + 6)
              }}
            >
              <div style={{width: 100, height: 100, borderRadius: 28, background: i === 1 ? accent : '#FFFFFF10', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {i === 1 ? <FormIcon accent={BG}/> : i === 0 ? <GroupIcon accent={i === 0 ? accent : GREEN}/> : <GroupIcon accent={GREEN}/>}
              </div>
              <div>
                <div style={{fontSize: 51, color: TEXT, fontWeight: 1000}}>{step.label}</div>
                {step.detail ? <div style={{fontSize: 29, color: MUTED, marginTop: 7, fontWeight: 700}}>{step.detail}</div> : null}
              </div>
            </div>
            {i < steps.length - 1 ? (
              <div style={{height: 72, display: 'flex', justifyContent: 'center', alignItems: 'center', color: accent, fontSize: 54, fontWeight: 900, opacity: interpolate(frame, [i * 12 + 15, i * 12 + 28], [0, 1], clamp)}}>↓</div>
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

const RiskSceneView: React.FC<{scene: RiskScene; accent: string}> = ({scene, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const items = scene.items || [];
  return (
    <>
      <Heading eyebrow={scene.eyebrow} headline={scene.headline} accent={accent} frame={frame} fps={fps}/>
      <div style={{position: 'absolute', left: 72, top: 635, width: 300, height: 310, display: 'flex', alignItems: 'center', justifyContent: 'center', ...enter(frame, fps, 7)}}>
        <WarningIcon/>
      </div>
      <div style={{position: 'absolute', left: 395, right: 150, top: 600, display: 'flex', flexDirection: 'column', gap: 24}}>
        {items.map((item, i) => {
          const color = item.state === 'good' ? GREEN : item.state === 'neutral' ? YELLOW : RED;
          return (
            <div
              key={item.label + i}
              style={{
                minHeight: 150,
                borderRadius: 30,
                background: '#0F1D30E8',
                border: '1px solid ' + color + '55',
                padding: '26px 30px',
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                ...enter(frame, fps, 9 + i * 10)
              }}
            >
              <div style={{width: 55, height: 55, flex: '0 0 auto', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BG, fontSize: 31, fontWeight: 1000}}>
                {item.state === 'good' ? '✓' : '!'}
              </div>
              <div style={{fontSize: 37, color: TEXT, lineHeight: 1.35, fontWeight: 900}}>{item.label}</div>
            </div>
          );
        })}
      </div>
      {scene.subline ? (
        <div style={{position: 'absolute', left: 72, right: 150, top: 1240, padding: '28px 36px', borderLeft: '7px solid ' + accent, color: MUTED, fontSize: 34, lineHeight: 1.55, background: '#FFFFFF08', ...enter(frame, fps, 38)}}>
          {scene.subline}
        </div>
      ) : null}
    </>
  );
};

const EvidenceSceneView: React.FC<{scene: EvidenceScene; accent: string}> = ({scene, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <>
      <Heading eyebrow={scene.eyebrow} headline={scene.headline} accent={accent} frame={frame} fps={fps}/>
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 158,
          top: 580,
          height: 690,
          borderRadius: 36,
          background: '#F7F9FC',
          color: '#132033',
          overflow: 'hidden',
          boxShadow: '0 36px 100px #00000066',
          ...enter(frame, fps, 7)
        }}
      >
        <div style={{height: 72, background: '#E8EEF5', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12}}>
          <span style={{width: 14, height: 14, borderRadius: 99, background: '#FF766B'}}/>
          <span style={{width: 14, height: 14, borderRadius: 99, background: '#FFD36A'}}/>
          <span style={{width: 14, height: 14, borderRadius: 99, background: '#64E0A3'}}/>
          <div style={{marginLeft: 20, padding: '10px 18px', borderRadius: 10, background: '#DDE5EF', color: '#60758D', fontSize: 20, fontWeight: 700}}>
            {scene.sourceLabel || 'ptaorg.com'}
          </div>
        </div>
        <div style={{padding: '46px 50px'}}>
          <div style={{fontSize: 25, color: '#65768B', fontWeight: 800, marginBottom: 18}}>確認ポイント</div>
          <div style={{fontSize: 48, lineHeight: 1.45, fontWeight: 1000, letterSpacing: -1}}>
            {scene.quote || scene.subline || '学校への在籍とPTAへの加入は、同じことではありません。'}
          </div>
          <div
            style={{
              marginTop: 38,
              height: 18,
              width: interpolate(frame, [18, 48], [0, 100], clamp) + '%',
              background: accent + '66',
              borderRadius: 999
            }}
          />
          <div style={{marginTop: 44, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
            {['在籍', '加入意思', '会員資格', '会費・役員'].map((t, i) => (
              <div key={t} style={{padding: '18px 20px', borderRadius: 16, background: i === 1 ? accent + '25' : '#EAF0F6', fontSize: 27, fontWeight: 900, color: i === 1 ? '#005D9D' : '#33465B'}}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 118, right: 196, top: 1315, color: MUTED, fontSize: 28, lineHeight: 1.5, ...enter(frame, fps, 34)}}>
        出典を画面に残し、断定部分を元記事と照合できる設計です。
      </div>
    </>
  );
};

const ConclusionSceneView: React.FC<{scene: ConclusionScene; accent: string}> = ({scene, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const points = scene.points || [];
  return (
    <>
      <Heading eyebrow={scene.eyebrow} headline={scene.headline} accent={accent} frame={frame} fps={fps}/>
      <div style={{position: 'absolute', left: 72, right: 150, top: 660, display: 'flex', gap: 28, alignItems: 'center'}}>
        <div style={{width: 300, height: 330, borderRadius: 42, background: accent + '1C', border: '2px solid ' + accent + '55', display: 'flex', alignItems: 'center', justifyContent: 'center', ...enter(frame, fps, 8)}}>
          <FormIcon accent={accent}/>
        </div>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 20}}>
          {points.map((p, i) => (
            <div key={p + i} style={{padding: '24px 28px', borderRadius: 26, background: PANEL, border: '1px solid #FFFFFF16', color: TEXT, fontSize: 34, lineHeight: 1.35, fontWeight: 900, ...enter(frame, fps, 12 + i * 9)}}>
              <span style={{color: accent, marginRight: 14}}>✓</span>{p}
            </div>
          ))}
        </div>
      </div>
      <div style={{position: 'absolute', left: 72, right: 150, top: 1115, padding: '40px 42px', borderRadius: 34, background: 'linear-gradient(135deg, ' + accent + ', #6FE4C4)', color: '#07111D', ...enter(frame, fps, 38)}}>
        <div style={{fontSize: 30, fontWeight: 900, opacity: 0.75}}>詳しい資料・相談窓口</div>
        <div style={{fontSize: 58, fontWeight: 1000, marginTop: 9, letterSpacing: -1}}>ptaorg.com</div>
      </div>
      {scene.subline ? <div style={{position: 'absolute', left: 72, right: 150, top: 1345, color: MUTED, fontSize: 31, lineHeight: 1.5, textAlign: 'center', ...enter(frame, fps, 48)}}>{scene.subline}</div> : null}
    </>
  );
};

const SceneRenderer: React.FC<{scene: Scene; accent: string}> = ({scene, accent}) => {
  if (scene.type === 'hook') return <HookScene scene={scene} accent={accent}/>;
  if (scene.type === 'split') return <SplitSceneView scene={scene as SplitScene} accent={accent}/>;
  if (scene.type === 'flow') return <FlowSceneView scene={scene as FlowScene} accent={accent}/>;
  if (scene.type === 'risk') return <RiskSceneView scene={scene as RiskScene} accent={accent}/>;
  if (scene.type === 'evidence') return <EvidenceSceneView scene={scene as EvidenceScene} accent={accent}/>;
  return <ConclusionSceneView scene={scene as ConclusionScene} accent={accent}/>;
};

export const PTAShort: React.FC<ShortProps> = (props) => {
  const frame = useCurrentFrame();
  const accent = props.accent || CYAN;
  const activeIndex = Math.max(
    0,
    props.scenes.findIndex((scene, i) => {
      const next = props.scenes[i + 1];
      return frame >= scene.startFrame && (!next || frame < next.startFrame);
    })
  );
  const progress = props.totalFrames > 0 ? frame / props.totalFrames : 0;

  return (
    <AbsoluteFill style={{fontFamily: '"Noto Sans CJK JP","Noto Sans JP","Yu Gothic",sans-serif'}}>
      <SafeBackground accent={accent}/>
      {props.audioFile ? <Html5Audio src={staticFile(props.audioFile)}/> : null}
      <BrandBar accent={accent} progress={progress}/>
      {props.scenes.map((scene, index) => (
        <Sequence key={props.id + '-' + index} from={scene.startFrame} durationInFrames={scene.durationFrames}>
          <div style={{position: 'absolute', inset: 0, opacity: fadeForScene(useCurrentFrame(), scene.durationFrames)}}>
            <SceneRenderer scene={scene} accent={accent}/>
            <Caption text={scene.voice} accent={accent}/>
            <Footer source={props.source} index={index} count={props.scenes.length}/>
          </div>
        </Sequence>
      ))}
      <div style={{position: 'absolute', right: 30, top: 350, bottom: 300, width: 70, borderLeft: '1px dashed #FFFFFF08', opacity: 0.3}}/>
      <div style={{position: 'absolute', left: 72, top: 1665, right: 150, height: 1, background: '#FFFFFF08'}}/>
      <div style={{display: 'none'}}>{activeIndex}</div>
    </AbsoluteFill>
  );
};
