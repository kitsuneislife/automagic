import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  cancelRender,
  continueRender,
  delayRender,
  getStaticFiles,
  OffthreadVideo,
  Sequence,
  useVideoConfig,
  watchStaticFile,
  Audio,
  Composition,
  staticFile,
  registerRoot,
  spring,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { z } from "zod";
import { getVideoMetadata } from "@remotion/media-utils";
import { loadFont, BarlowCondensedBold } from "./loadfont";
import { createTikTokStyleCaptions, Caption, TikTokPage } from "@remotion/captions";
import { fitText } from "@remotion/layout-utils";
import { makeTransform, scale, translateY } from "@remotion/animation-utils";

// --- Page component ---
const fontFamily = BarlowCondensedBold;
const container: React.CSSProperties = {
  justifyContent: "center",
  alignItems: "center",
  top: undefined,
  bottom: 350,
  height: 150,
};
const DESIRED_FONT_SIZE = 120;
const HIGHLIGHT_COLOR = "#39E508";

const Page: React.FC<{
  readonly enterProgress: number;
  readonly page: TikTokPage;
}> = ({ enterProgress, page }) => {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();
  const timeInMs = (frame / fps) * 1000;

  const fittedText = fitText({
    fontFamily,
    text: page.text,
    withinWidth: width * 0.7,
    textTransform: "uppercase",
  });

  const fontSize = Math.min(DESIRED_FONT_SIZE, fittedText.fontSize);

  return (
    <AbsoluteFill style={container}>
      <div
        style={{
          fontSize,
          color: "white",
          WebkitTextStroke: "20px black",
          paintOrder: "stroke",
          transform: makeTransform([
            scale(interpolate(enterProgress, [0, 1], [0.8, 1])),
            translateY(interpolate(enterProgress, [0, 1], [50, 0])),
          ]),
          fontFamily,
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            transform: makeTransform([
              scale(interpolate(enterProgress, [0, 1], [0.8, 1])),
              translateY(interpolate(enterProgress, [0, 1], [50, 0])),
            ]),
          }}
        >
          {page.tokens.map((t) => {
            const startRelativeToSequence = t.fromMs - page.startMs;
            const endRelativeToSequence = t.toMs - page.startMs;

            const active =
              startRelativeToSequence <= timeInMs &&
              endRelativeToSequence > timeInMs;

            return (
              <span
                key={t.fromMs}
                style={{
                  display: "inline",
                  whiteSpace: "pre",
                  color: active ? HIGHLIGHT_COLOR : "white",
                }}
              >
                {t.text}
              </span>
            );
          })}
        </span>
      </div>
    </AbsoluteFill>
  );
};

// --- NoCaptionFile component ---
const NoCaptionFile: React.FC = () => (
  <AbsoluteFill
    style={{
      height: "auto",
      width: "100%",
      backgroundColor: "white",
      fontSize: 50,
      padding: 30,
      fontFamily: "sans-serif",
    }}
  >
    No caption file found in the public folder. <br /> Run `node sub.mjs` to install Whisper.cpp and create one.
  </AbsoluteFill>
);

// --- SubtitlePage component ---
const SubtitlePage: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 5 });
  return (
    <AbsoluteFill>
      <Page enterProgress={enter} page={page} />
    </AbsoluteFill>
  );
};

export type SubtitleProp = {
  startInSeconds: number;
  text: string;
};

export const captionedVideoSchema = z.object({
  src: z.string(),
  audioSrc: z.string(),
  captionsSrc: z.string(),
});

export const calculateCaptionedVideoMetadata: CalculateMetadataFunction<z.infer<typeof captionedVideoSchema>> =
  async ({ props }) => {
    const fps = 30;
    const metadata = await getVideoMetadata(props.src);
    return { fps, durationInFrames: Math.floor(metadata.durationInSeconds * fps) };
  };

const getFileExists = (file: string) =>
  Boolean(getStaticFiles().find((f) => f.src === file));

const SWITCH_CAPTIONS_EVERY_MS = 1200;

// --- CaptionedVideo component ---
export const CaptionedVideo: React.FC<{
  src: string;
  audioSrc: string;
  captionsSrc: string;
}> = ({ src, audioSrc, captionsSrc }) => {
  const [subtitles, setSubtitles] = useState<Caption[]>([]);
  const [handle] = useState(() => delayRender());
  const { fps } = useVideoConfig();

  const fetchSubtitles = useCallback(async () => {
    try {
      await loadFont();
      const res = await fetch(captionsSrc);
      setSubtitles(await res.json());
      continueRender(handle);
    } catch (e) {
      cancelRender(e);
    }
  }, [handle, captionsSrc]);

  useEffect(() => {
    fetchSubtitles();
    const c = watchStaticFile(captionsSrc, fetchSubtitles);
    return () => c.cancel();
  }, [fetchSubtitles, captionsSrc]);

  const { pages } = useMemo(() =>
    createTikTokStyleCaptions({
      combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
      captions: subtitles ?? [],
    }), [subtitles]
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "white" }}>
      <AbsoluteFill>
        <OffthreadVideo style={{ objectFit: "cover" }} src={src} />
        {audioSrc && <Audio src={audioSrc} />}
      </AbsoluteFill>
      {pages.map((page, index) => {
        const nextPage = pages[index + 1] ?? null;
        const subtitleStartFrame = (page.startMs / 1000) * fps;
        const subtitleEndFrame = Math.min(
          nextPage ? (nextPage.startMs / 1000) * fps : Infinity,
          subtitleStartFrame + SWITCH_CAPTIONS_EVERY_MS,
        );
        const durationInFrames = subtitleEndFrame - subtitleStartFrame;
        if (durationInFrames <= 0) return null;
        return (
          <Sequence
            key={index}
            from={subtitleStartFrame}
            durationInFrames={durationInFrames}
          >
            <SubtitlePage page={page} />
          </Sequence>
        );
      })}
      {getFileExists(captionsSrc) ? null : <NoCaptionFile />}
    </AbsoluteFill>
  );
};

const RemotionRoot: React.FC = () => (
  <Composition
    id="CaptionedVideo"
    component={CaptionedVideo}
    calculateMetadata={calculateCaptionedVideoMetadata}
    schema={captionedVideoSchema}
    width={1080}
    height={1920}
    defaultProps={{
      src: staticFile("video/scenario.mp4"),
      audioSrc: staticFile("video/audio.wav"),
      captionsSrc: staticFile("video/audio.json"),
    }}
  />
);

registerRoot(RemotionRoot);