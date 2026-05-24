import type { HTMLAttributes } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement>;
        src?: string;
        'ios-src'?: string;
        alt?: string;
        ar?: boolean;
        'ar-modes'?: string;
        exposure?: string;
        'environment-image'?: string;
        'auto-rotate'?: boolean;
        'camera-controls'?: boolean;
        poster?: string;
        children?: React.ReactNode;
      };
    }
  }
}
