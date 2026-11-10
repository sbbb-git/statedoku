#!/usr/bin/env python3
"""Sound and MP4 for the animated videos of make-anim.cjs.

    python3 scripts/video/render-anim.py OUT VOICE.onnx

For each OUT/<slug>/ with a timeline.json: the voice lines (Piper, offline)
are laid at their times, the sounds are synthesised here (a pop, a tick, a
note: nothing is taken from a sound library), and ffmpeg joins the frames at
30 a second with the mix. Prints every voice line that runs into the next.
"""
import io, json, subprocess, sys, wave
from pathlib import Path
import numpy as np
from piper import PiperVoice

OUT, voice = Path(sys.argv[1]), PiperVoice.load(sys.argv[2])
R = voice.config.sample_rate


def sound(kind, f):
    if kind == 'pop':
        t = np.arange(int(R * 0.16)) / R
        return 0.26 * np.sin(2 * np.pi * np.cumsum(f * (1 + 0.8 * np.exp(-t * 40))) / R) * np.exp(-t * 22)
    if kind == 'tick':
        t = np.arange(int(R * 0.07)) / R
        return 0.16 * np.sin(2 * np.pi * f * t) * np.exp(-t * 50)
    t = np.arange(int(R * 0.55)) / R
    return 0.2 * (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 7)


def speak(text):
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        voice.synthesize_wav(text, wf)
    buf.seek(0)
    with wave.open(buf, 'rb') as rf:
        return np.frombuffer(rf.readframes(rf.getnframes()), dtype=np.int16).astype(np.float64) / 32768


(OUT / 'mp4').mkdir(exist_ok=True)
for tl_path in sorted(OUT.glob('*/timeline.json')):
    d, tl = tl_path.parent, json.load(open(tl_path))
    mix = np.zeros(int(R * tl['frames'] / tl['fps']) + R)

    def put(pcm, t):
        i = int(t * R)
        pcm = pcm[:max(0, len(mix) - i)]
        mix[i:i + len(pcm)] += pcm

    lines = sorted(tl['voice'], key=lambda v: v['t'])
    for k, v in enumerate(lines):
        pcm = speak(v['text'])
        put(0.95 * pcm, v['t'])
        end = v['t'] + len(pcm) / R
        if k + 1 < len(lines) and end > lines[k + 1]['t']:
            print(f"  {d.name}: \"{v['text']}\" runs {end - lines[k + 1]['t']:.2f} s into the next line")
    for e in tl['events']:
        put(sound(e['kind'], e['f']), e['t'])
    pcm = (np.clip(mix, -1, 1) * 32000).astype(np.int16)
    with wave.open(str(d / 'audio.wav'), 'wb') as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(R); wf.writeframes(pcm.tobytes())
    out = OUT / 'mp4' / f'{d.name}.mp4'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(tl['fps']), '-i', str(d / 'f%05d.jpg'), '-i', str(d / 'audio.wav'),
                    '-vf', 'scale=720:1280,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-b:a', '128k',
                    '-t', f"{tl['frames'] / tl['fps']:.3f}", '-movflags', '+faststart', str(out)], check=True)
    print(f"{d.name}: {tl['frames'] / tl['fps']:.1f} s, {len(lines)} voice lines, {len(tl['events'])} sounds, {out.stat().st_size // 1024} KB")
