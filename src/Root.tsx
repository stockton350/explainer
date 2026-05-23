import {Composition} from 'remotion';
import {GrammarChart} from './Composition';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="GrammarChart"
      component={GrammarChart}
      durationInFrames={7128}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
