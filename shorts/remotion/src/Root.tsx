import React from 'react';
import {Composition} from 'remotion';
import {PTAShort, type ShortProps} from './PTAShort';

const defaultProps: ShortProps = {
  id: 'preview',
  title: 'PTA Shorts Preview',
  source: 'ptaorg.com',
  accent: '#4EB5FF',
  audioFile: '',
  totalFrames: 1800,
  scenes: [
    {
      type: 'hook',
      startFrame: 0,
      durationFrames: 1800,
      voice: 'プレビュー',
      eyebrow: 'PTA適正化推進委員会',
      headline: 'PTA Shorts',
      subline: 'Remotion template',
      emphasis: 'PREVIEW'
    }
  ]
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PTAShort"
      component={PTAShort}
      durationInFrames={1800}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};
