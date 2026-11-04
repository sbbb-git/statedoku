#!/usr/bin/env python3
"""Voice and assembly for the videos of scripts/video/videos.json.

    node scripts/video/render-frames.cjs OUT      # one PNG per segment
    python3 scripts/video/render.py OUT VOICE.onnx  # voice, then MP4s in OUT/mp4/

Voice: Piper (offline neural text-to-speech, the en_US-ryan-high model from
rhasspy/piper-voices), so no text leaves the machine. Each spoken segment
lasts its audio plus a short pause; a countdown step lasts one second with a
tick. The caption burned into each frame is the line being spoken.
"""
import json
import math
import struct
import subprocess
import sys
import wave
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from piper import PiperVoice

HERE = Path(__file__).resolve().parent
OUT = Path(sys.argv[1])
VOICE = sys.argv[2]
A, B = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (0, None)
videos = json.load(open(HERE / 'videos.json', encoding='utf-8'))[A:B]
voice = PiperVoice.load(VOICE)
RATE = voice.config.sample_rate
PAD = 0.35


def tone(seconds, freq=None, beep=0.09):
    n = int(RATE * seconds)
    out = bytearray()
    for i in range(n):
        v = 0
        if freq and i < RATE * beep:
            v = int(9000 * math.sin(2 * math.pi * freq * i / RATE) * (1 - i / (RATE * beep)))
        out += struct.pack('<h', v)
    return bytes(out)


TICK, GO = tone(1.0, 880), tone(1.0, 660)
(OUT / 'mp4').mkdir(parents=True, exist_ok=True)
report = []


def speak(text, path):
    with wave.open(str(path), 'wb') as wf:
        voice.synthesize_wav(text, wf)
    with wave.open(str(path), 'rb') as rf:
        return rf.readframes(rf.getnframes())


for v in videos:
    d = OUT / v['slug']
    audio, durs = bytearray(), []
    for i, s in enumerate(v['segments']):
        if s['kind'] == 'count':
            pcm = TICK if s['caption'] != '1' else GO
        else:
            pcm = speak(s['voice'], d / f'a{i:03d}.wav') + tone(PAD)
        audio += pcm
        durs.append(len(pcm) / 2 / RATE)
    with wave.open(str(d / 'audio.wav'), 'wb') as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(RATE); wf.writeframes(bytes(audio))
    with open(d / 'frames.txt', 'w') as f:
        for i, t in enumerate(durs):
            f.write(f"file 'f{i:03d}.png'\nduration {t:.3f}\n")
        f.write(f"file 'f{len(durs) - 1:03d}.png'\n")
    v['_dur'] = sum(durs)
    report.append((v['slug'], round(v['_dur'], 1)))


def encode(v):
    d = OUT / v['slug']
    out = OUT / 'mp4' / f"{v['slug']}.mp4"
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', str(d / 'frames.txt'), '-i', str(d / 'audio.wav'),
           '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'stillimage', '-crf', '27',
           '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', str(out)]
    subprocess.run(cmd, check=True)
    return out


with ThreadPoolExecutor(2) as ex:
    outs = list(ex.map(encode, videos))
durs = [t for _, t in report]
print(f'{len(outs)} videos, {min(durs)} to {max(durs)} s, outside 30 to 60 s: {[s for s, t in report if not 30 <= t <= 60]}')
json.dump(report, open(OUT / f'durations-{A}.json', 'w'))
