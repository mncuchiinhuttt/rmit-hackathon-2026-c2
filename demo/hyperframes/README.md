# Hostless Hui — two-minute demo

Output: [`../video.mp4`](../video.mp4). Captions: [`../video-en.srt`](../video-en.srt).

Four chapters follow the competition brief exactly: possibility (0–25s), constraint (25–50s), prototype (50–100s), changes (100–120s). Captures are actual local application states, not recreated interfaces. The video is an edited, narrated walkthrough, not an uninterrupted screen recording.

The four voice tracks were supplied by the author, generated with ElevenLabs. The fourth is played at 1.071× to fit its 20-second chapter; the other tracks use their original speed. Captions are phrase-timed against the script, not a word-level forced alignment. No music or paid cloud render is used.

## Rebuild

Requirements: Bun for the source generator, Node.js 22+ for the HyperFrames CLI, and FFmpeg. From this folder:

```sh
bun run build-film
bun run check
bun run dev
bun run render
```

HyperFrames is pinned to 0.8.185. Do not force the CLI to run under Bun on Windows: its worker resolution failed there during this build. `bunx` without `--bun` lets the CLI use Node. The application itself continues to use Bun.

Assets and fonts are local for deterministic renders. `.hyperframes`, thumbnail and waveform caches are ignored. Each chapter is a separate composition; narration and captions are separate tracks. `build-film.ts` regenerates HTML and the SRT from `voiceover-en.txt`.

## Claim boundary

Selectable fictional identities, votes, reader grants and redemption in these captures are SQLite application simulation. They are not ORK enforcement, real payment custody or proof of a live 2-of-3 Tide quorum. Live signed-policy encryption/decryption, quorum, alternative-policy resistance and administrator threat-model experiments remain acceptance work. Already viewed or copied codes cannot be recalled.
