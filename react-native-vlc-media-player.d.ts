declare module "react-native-vlc-media-player" {
  import { Component } from "react";
  import { ViewProps } from "react-native";

  export interface VLCPlayerProps extends ViewProps {
    source: { uri: string };
    autoplay?: boolean;
    resizeMode?: string;
    onBuffering?: (event: { isBuffering: boolean }) => void;
    onError?: () => void;
    onPlaying?: () => void;
    onEndReached?: () => void;
    autoAspectRatio?: boolean;
    mediaOptions?: any;
  }

  export class VLCPlayer extends Component<VLCPlayerProps> {
    resume(): void;
    pause(): void;
    seek(time: number): void;
  }
}
