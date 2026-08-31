#!/usr/bin/env python3
"""
Generate tagged, low-bitrate 45-second preview clips for the Opi store.

- Source: each track's demo mix WAV (vocal + beat) — NOT the clean acapella.
- FULL-LENGTH demo mix (complete transparency of what you get), fades in/out.
- Overlays an "Opi" tag every ~12s. If Christina's own recording exists at
  assets/tag/opi-tag.wav (or .aiff/.m4a/.mp3) it is used; otherwise a
  placeholder macOS voice is generated.
- Exports AAC .m4a at 96 kbps → assets/previews/<slug>.m4a

Uses only macOS built-ins: python3 (audioop/wave), `say`, `afconvert`.
Run:  python3 tools/make_previews.py
"""
import audioop, os, subprocess, sys, wave, tempfile

VOCALS = "/Users/christinaoconnor/Documents/Documents - Christina’s MacBook Air/CC/Opi/2 - Vocals"
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "previews")
CLIP_SEC = None      # None = whole song
TAG_EVERY = 12       # seconds between tags
TAG_FIRST = 5        # first tag offset
TAG_GAIN = 0.55      # tag loudness (0–1)
RATE = 48000

TRACKS = {
    "garbage":        "*garbage/*garbage 70bpm DbMajor.wav",
    "life-raft":      "Life Raft/life raft 115bpm Gminor.wav",
    "something-good": "Something Good/something good 136bpm Gmin.wav",
    "i-need-you":     "i need you/i need you 135 bpm C#min.wav",
    "oceans-deep":    "oceans deep/oceans deep 80bpm C#min.wav",
    "sad":            "sad/sad 115 bpm Cmaj.wav",
}

def load_16bit_stereo_48k(path):
    w = wave.open(path, "rb")
    ch, sw, fr, n = w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getnframes()
    data = w.readframes(n); w.close()
    if sw != 2:
        data = audioop.lin2lin(data, sw, 2)
    if ch == 1:
        data = audioop.tostereo(data, 2, 1, 1)
    if fr != RATE:
        data, _ = audioop.ratecv(data, 2, 2, fr, RATE, None)
    return data  # 16-bit stereo @48k

def make_tag_wav():
    tmp = tempfile.mkdtemp()
    wavp = os.path.join(tmp, "tag.wav")
    tag_dir = os.path.join(os.path.dirname(OUT_DIR), "tag")
    for ext in ("wav", "aiff", "aif", "m4a", "mp3"):
        own = os.path.join(tag_dir, "opi-tag." + ext)
        if os.path.exists(own):
            print("using Christina's tag:", own)
            subprocess.run(["afconvert", own, "-f", "WAVE", "-d", "LEI16@48000", "-c", "2", wavp], check=True)
            return load_16bit_stereo_48k(wavp)
    print("using placeholder macOS tag (drop your recording at assets/tag/opi-tag.wav)")
    aiff = os.path.join(tmp, "tag.aiff")
    subprocess.run(["say", "-v", "Samantha", "-r", "165", "-o", aiff, "Opi"], check=True)
    subprocess.run(["afconvert", aiff, "-f", "WAVE", "-d", "LEI16@48000", "-c", "2", wavp], check=True)
    return load_16bit_stereo_48k(wavp)

def loudest_window(data, sec):
    frame_bytes = 4  # 16-bit stereo
    per_sec = RATE * frame_bytes
    total_sec = len(data) // per_sec
    if total_sec <= sec:
        return 0
    rms = [audioop.rms(data[i*per_sec:(i+1)*per_sec], 2) for i in range(total_sec)]
    best, best_i = -1, 0
    for i in range(0, total_sec - sec + 1):
        s = sum(rms[i:i+sec])
        if s > best: best, best_i = s, i
    return best_i

def fade(data, fade_in_sec, fade_out_sec):
    fb = 4; per_sec = RATE * fb
    n_in = int(fade_in_sec * RATE); n_out = int(fade_out_sec * RATE)
    out = bytearray(data)
    total = len(data) // fb
    # cheap fades: process in 10ms chunks
    chunk = RATE // 100
    for start in range(0, n_in, chunk):
        g = start / n_in
        seg = audioop.mul(data[start*fb:(start+chunk)*fb], 2, g)
        out[start*fb:start*fb+len(seg)] = seg
    for k, start in enumerate(range(total - n_out, total, chunk)):
        g = max(0.0, 1 - (start - (total - n_out)) / n_out)
        seg = audioop.mul(data[start*fb:(start+chunk)*fb], 2, g)
        out[start*fb:start*fb+len(seg)] = seg
    return bytes(out)

def overlay(base, tag, at_sec, gain):
    fb = 4
    pos = int(at_sec * RATE) * fb
    tag_g = audioop.mul(tag, 2, gain)
    end = min(len(base), pos + len(tag_g))
    if pos >= len(base): return base
    mixed = audioop.add(base[pos:end], tag_g[:end-pos], 2)
    return base[:pos] + mixed + base[end:]

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    tag = make_tag_wav()
    for slug, rel in TRACKS.items():
        src = os.path.join(VOCALS, rel)
        if not os.path.exists(src):
            print("MISSING", src); continue
        data = load_16bit_stereo_48k(src)
        per_sec = RATE * 4
        total_sec = len(data) // per_sec
        if CLIP_SEC:
            start = loudest_window(data, CLIP_SEC); clip = data[start*per_sec:(start+CLIP_SEC)*per_sec]; clip_sec = CLIP_SEC
        else:
            start = 0; clip = data; clip_sec = total_sec
        clip = fade(clip, 0.5, 2.5)
        t = TAG_FIRST
        while t < clip_sec - 1:
            clip = overlay(clip, tag, t, TAG_GAIN); t += TAG_EVERY
        # normalize peak to -1 dBFS
        peak = audioop.max(clip, 2) or 1
        clip = audioop.mul(clip, 2, min(4.0, 0.89 * 32767 / peak))
        tmpwav = os.path.join(tempfile.mkdtemp(), slug + ".wav")
        w = wave.open(tmpwav, "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(clip); w.close()
        out = os.path.join(OUT_DIR, slug + ".m4a")
        subprocess.run(["afconvert", tmpwav, "-f", "m4af", "-d", "aac", "-b", "96000", "-q", "127", "-s", "3", out], check=True)
        print(f"{slug:16s} {clip_sec:3d}s  {os.path.getsize(out)//1024} KB")

if __name__ == "__main__":
    main()
