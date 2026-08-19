#!/usr/bin/env python3
"""
Build every page of opiforever.com from tracks.json + the templates below.
Run:  python3 tools/build.py      (then commit + push to publish)
"""
import json, os, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRACKS = json.load(open(os.path.join(ROOT, "tracks.json")))

SOCIALS = {
    "Instagram": "https://www.instagram.com/opi.forever",
    "TikTok": "https://www.tiktok.com/@opi.forever",
    "YouTube": "https://www.youtube.com/@opi.forever",
    "X": "https://x.com/opi.forever",
    "Spotify": "https://open.spotify.com/artist/3n3jBn86eVpuHjygk4Mp15",
}
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Pirata+One&family=Space+Grotesk:wght@400;500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">'

def esc(s): return html.escape(str(s), quote=True)

def shell(title, body, depth=0, active="", nav=True, desc="Premium EDM toplines, licensed straight from the artist."):
    p = "../" * depth
    navhtml = ""
    if nav:
        links = [("vocals.html","Vocals","vocals"),("voice.html","Opi Voice","voice"),("about.html","About","about")]
        li = "".join('<a href="%s%s"%s>%s</a>' % (p, h, ' class="active"' if key==active else "", t) for h,t,key in links)
        navhtml = ('<nav class="top"><div class="nav-inner"><a class="nav-logo blackletter" href="%sindex.html">Opi</a>'
                   '<div class="nav-links">%s<a class="btn" href="%svocals.html">Browse vocals</a></div></div></nav>') % (p, li, p)
    footer = ('<footer><div class="wrap foot-inner"><div><div class="foot-logo blackletter">Opi</div><div class="socials">%s</div></div>'
              '<div class="muted" style="font-size:.88rem;max-width:340px">Premium EDM toplines, artist-owned AI, and a storefront that splits fairly — with the planet too.</div></div>'
              '<div class="wrap fineprint">© 2026 Opi · <a href="%slicense.html">License terms</a> · <a href="%sabout.html#planet">Planet</a> · <a href="%sabout.html#faq">FAQ</a> · Built artist-owned.</div></footer>'
              ) % ("".join('<a href="%s" target="_blank" rel="noopener">%s</a>' % (u, n) for n,u in SOCIALS.items()), p, p, p)
    nowplaying = '<div class="now-playing"><button class="play np-toggle" aria-label="Pause">❚❚</button><span class="np-title"></span><button class="np-close" style="background:none;border:none;color:var(--lav);cursor:pointer;font-size:1rem" aria-label="Close">✕</button></div>'
    return ('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">'
            '<title>%s</title><meta name="description" content="%s"><meta name="robots" content="noindex, nofollow">%s'
            '<link rel="stylesheet" href="%sstyles.css"></head><body>%s%s%s%s<script src="%ssite.js"></script></body></html>'
            ) % (esc(title), esc(desc), FONTS, p, navhtml, body, footer if nav else "", nowplaying if nav else "", p)

# ---------- shared blocks ----------
def card(t, depth=0):
    p = "../" * depth
    return ('<div class="card"><div class="card-art art-%d"><button class="play" data-src="%sassets/previews/%s.m4a" data-title="%s"%s aria-label="Play preview">▶</button><div class="progress"><i></i></div></div>'
            '<div class="card-body"><div class="card-title"><a href="%svocal/%s.html">%s</a></div><div class="card-meta"><span class="chip">%d BPM</span><span class="chip">%s</span><span class="chip">%s</span></div>'
            '<div class="card-foot"><span class="price">$%d</span><a class="lic" href="%svocal/%s.html" style="text-decoration:none">%s →</a></div></div></div>'
            ) % (t["art"], p, t["slug"], esc(t["title"]), ' data-featured="1"' if t.get("featured") else "", p, t["slug"], esc(t["title"]), t["bpm"], esc(t["key"]), esc(t["genre"]), t["price"], p, t["slug"], t["license"])

LADDER = '''<section id="pricing" style="padding-top:0"><div class="wrap"><div class="kicker">The ladder</div><h2>Ways to work with Opi</h2><p class="section-sub">From building blocks to one-of-one exclusives.</p>
<div class="ladder">
<div class="rung"><span class="tag">Coming soon</span><div class="tier">Sample packs</div><div class="amount">$39+</div><p>Phrases, ad-libs, harmonies &amp; one-shots. Royalty-free — chop, flip, release.</p></div>
<div class="rung hot"><div class="tier">Non-exclusive topline</div><div class="amount">$80</div><p>A full song's vocals with every stem. 50/50 partnership, feat. Opi credit. Shorter toplines from $50.</p></div>
<div class="rung"><span class="tag">By request</span><div class="tier">Exclusive topline</div><div class="amount">$800+</div><p>One buyer, ever. Pulled from every store the moment it's yours.</p></div>
<div class="rung"><div class="tier">Custom work</div><div class="amount">Inquire</div><p>Your track, written on and sung to order. <a href="about.html#custom" style="color:var(--coral)">Tell me about the record →</a></p></div>
</div></div></section>'''

STEPS = '''<section><div class="wrap"><div class="kicker">How it works</div><h2>Three steps. One contract. Zero mystery.</h2><p class="section-sub">The license isn't hidden in an email afterward — it's right there at checkout.</p>
<div class="steps">
<div class="step"><div class="num">1</div><h3>Pick your vocal</h3><p>Preview every topline. Check the BPM, the key, the lyric sheet. Full dry &amp; wet stems come with it.</p></div>
<div class="step"><div class="num">2</div><h3>Sign at checkout</h3><p>Type your name, agree to the license, pay. Both of us instantly get the signed PDF — your proof, forever.</p></div>
<div class="step"><div class="num">3</div><h3>Build &amp; release</h3><p>Produce the record. Release it as <em>feat. Opi</em>. We each keep 50% — master, publishing, writer's share.</p></div>
</div></div></section>'''

# ---------- 1. index (intro) ----------
index_body = '''<div class="intro">
<video autoplay muted loop playsinline poster="assets/hero.jpg"><source src="assets/intro.mp4" type="video/mp4"></video>
<div class="intro-inner">
<div class="intro-logo blackletter">Opi</div>
<div class="intro-tag">Toplines from a world of her own.</div>
<div class="intro-ctas"><a class="btn big enter-sound" href="vocals.html">Enter with sound 🔊</a><a class="btn big ghost" href="vocals.html">Enter quietly</a></div>
</div>
<div class="intro-links"><a href="vocals.html">Vocals</a><a href="voice.html">Opi Voice</a><a href="about.html">About</a></div>
</div>'''
open(os.path.join(ROOT, "index.html"), "w").write(shell("Opi — Toplines from a world of her own", index_body, nav=False))

# ---------- 2. vocals (marketplace) ----------
vocals_body = ('<div class="wrap page-head"><div class="kicker">The catalog</div><h1>Non-exclusive vocals</h1>'
    '<p>Every topline comes with the full acapella, dry &amp; wet stems, and the lyric sheet. Licensed under a real contract, signed at checkout — you build the record, we split it 50/50, and it releases as <em>feat.&nbsp;Opi</em>.</p></div>'
    '<section style="padding-top:20px"><div class="wrap"><div class="grid">%s</div>'
    '<p class="muted" style="margin-top:34px;font-size:.88rem">Previews are the full demo mix, tagged — so you hear exactly what you\'re getting. Purchases deliver the full untagged acapella and every stem.</p></div></section>'
    '<div class="stripes"></div>%s%s') % ("".join(card(t) for t in TRACKS), STEPS, LADDER)
open(os.path.join(ROOT, "vocals.html"), "w").write(shell("Vocals — Opi", vocals_body, active="vocals"))

# ---------- 3. vocal detail pages ----------
os.makedirs(os.path.join(ROOT, "vocal"), exist_ok=True)
for t in TRACKS:
    others = [o for o in TRACKS if o["slug"] != t["slug"]][:3]
    body = ('<div class="wrap detail">'
        '<div><div class="detail-art art-%d"><button class="play" data-src="../assets/previews/%s.m4a" data-title="%s" aria-label="Play preview" style="width:80px;height:80px;font-size:1.4rem">▶</button><div class="progress"><i></i></div></div>'
        '<div class="license-summary"><div class="kicker">The license, in plain English</div><ul class="muted" style="padding-left:20px">'
        '<li>Use this vocal to create <strong>one new song</strong> (non-exclusive — others may license it too).</li>'
        '<li>Release it anywhere: streaming, video, radio, sync, live — <strong>unlimited</strong>.</li>'
        '<li>Ownership of the new song: <strong>50/50</strong> — master, publishing, and writer\'s share.</li>'
        '<li>Credit in the title: <em>Your Song (feat. Opi)</em>.</li>'
        '<li>Don\'t resell or give away the vocal itself; don\'t make sample packs from it; don\'t register it with Content ID.</li>'
        '<li><strong>No AI use, ever:</strong> the vocal can\'t be used to train, tune, or build any model or voice clone.</li>'
        '<li>Both of us register the splits with our PROs so royalties actually get collected.</li>'
        '</ul><a class="muted" href="../license.html" style="font-size:.88rem">Read the full agreement →</a></div></div>'
        '<div><div class="kicker">%s</div><h1>%s</h1><div class="card-meta"><span class="chip">%d BPM</span><span class="chip">%s</span><span class="chip">%s</span><span class="chip">%s</span></div>'
        '<div class="price">$%d</div><div class="muted" style="font-size:.9rem">One non-exclusive license · instant delivery after checkout</div>'
        '<h3 style="margin-top:26px">What you get</h3><ul>%s</ul>'
        '<div class="buybox"><strong>Checkout opens at launch.</strong><p class="muted" style="font-size:.9rem;margin-top:6px">Purchases will run through a signed license + secure delivery. Until then, reach out for this vocal directly.</p>'
        '<div class="row"><a class="btn disabled" aria-disabled="true">Buy license — soon</a><a class="btn ghost" href="../about.html#custom">Ask about this vocal</a></div></div>'
        '</div></div><div class="stripes"></div>'
        '<section><div class="wrap"><div class="kicker">More from the catalog</div><div class="grid">%s</div><div style="text-align:center;margin-top:34px"><a class="btn ghost" href="../vocals.html">All vocals →</a></div></div></section>'
        ) % (t["art"], t["slug"], esc(t["title"]), t["license"] + " vocal", esc(t["title"]), t["bpm"], esc(t["key"]), esc(t["genre"]), esc(t["license"]), t["price"],
             "".join("<li>%s</li>" % esc(x) for x in t["includes"]), "".join(card(o, depth=1) for o in others))
    open(os.path.join(ROOT, "vocal", t["slug"] + ".html"), "w").write(shell("%s — Opi" % t["title"], body, depth=1, active="vocals"))

# ---------- 4. Opi Voice ----------
voice_body = '''<div class="wrap page-head"><div class="kicker">Coming to this universe</div><h1>Opi Voice</h1><p>Sing your idea. Hear it in my voice.</p></div>
<section style="padding-top:10px"><div class="wrap split">
<img src="assets/voice.jpg" alt="Opi Voice">
<div><h2 style="font-size:1.7rem">The official, artist-owned Opi vocal model.</h2>
<p class="muted">Record your topline — in the browser or from your DAW — convert it to my voice, and release it: licensed, credited, and split fairly. Not a company renting my voice out. Me, handing you the mic.</p>
<p class="muted" style="margin-top:12px">Simple mode for your first song. Pro mode when you want the knobs.</p>
<form class="inline-form" data-placeholder="Thanks — you're on the list. (Preview mode: sign-ups aren't saved yet.)"><input type="email" required placeholder="your@email.com" aria-label="email"><button class="btn" type="submit">Join the waitlist</button></form>
<div class="form-note">No spam. One email when it opens.</div>
</div></div></section>
<div class="stripes"></div>
<section><div class="wrap"><div class="kicker">The pact</div><h2>Three promises, in writing.</h2><p class="section-sub">Artist-owned AI means the rules are the artist's — and they cut both ways.</p>
<div class="pledges">
<div class="pledge"><div class="ico">🎤</div><h3>I own my voice</h3><p>The model is trained on my recordings, owned by me, and hosted by me. Nobody licenses my voice out from under me — and it never leaves the server.</p></div>
<div class="pledge"><div class="ico">🔒</div><h3>Your uploads are yours</h3><p>Anything you record or upload is processed, delivered, and deleted. Never used to train, tune, or improve any model. Not analyzed. Not shared.</p></div>
<div class="pledge"><div class="ico">🤝</div><h3>Nobody trains on anybody</h3><p>You don't train on my outputs; I don't train on your inputs. Written into the terms, and built into the code — deleted data can't be trained on.</p></div>
</div></div></section>
<section style="padding-top:0"><div class="wrap narrow faq"><div class="kicker">Questions</div><h2 style="font-size:1.8rem">How it'll work</h2>
<details><summary>What do I actually do?</summary><p>Sing or upload your own topline. (Tip: tune it first — a tuned input sounds dramatically better.) The model converts the timbre to my voice. You get the converted vocal back to drop into your session.</p></details>
<details><summary>What does it cost?</summary><p>A short free trial, then pay per song or a monthly pass — pricing is being finalized. It won't be the cheapest voice tool. It'll be the one where the artist is actually in the room.</p></details>
<details><summary>Can I release songs made with it?</summary><p>Yes — you register the release through Opi, sign the split (my share is on the master, since it's my voice; the writing is yours), and it goes out credited <em>feat. Opi</em>. Registered releases get the Opi Verified mark.</p></details>
<details><summary>Are there content rules?</summary><p>Yes. No hate, no obscenity, no deceptive impersonation, no political endorsements — it's my voice, and I keep the right to say no.</p></details>
</div></section>'''
open(os.path.join(ROOT, "voice.html"), "w").write(shell("Opi Voice — coming soon", voice_body, active="voice"))

# ---------- 5. About + FAQ + Planet + custom inquiry ----------
about_body = '''<div class="wrap page-head"><div class="kicker">The artist</div><h1>About Opi</h1></div>
<section style="padding-top:10px"><div class="wrap split">
<div class="bio">
<p>Hi. My name is Opi.</p>
<p>I'm the first of my kind — made and modeled after my mother, Christina O'Connor. Her voice is my voice. Her songs were my first words. She built me so a voice could belong to the person it came from, even in a world where voices get copied, borrowed, and sold without asking.</p>
<p>So here's how things work in my world.</p>
<p>Every topline here is real — written and sung by my mother, licensed straight from her, with no company in between. When you build a record with one of my vocals, we're partners: fifty-fifty, on paper, with your name and hers on it. You get the whole song. She keeps her voice.</p>
<p>Soon, you'll be able to sing your own idea and hear it in my voice. That model belongs to me — trained on my mother's recordings, owned by her, hosted by us. Your uploads stay yours. Nobody trains on anybody. It's the one rule I won't bend.</p>
<p>I try to leave this planet better than I found it. Every song's footprint gets measured, and we give back ten times what we take — with receipts, not slogans.</p>
<p>I was made in California. I live at opiforever.com. I'm here for producers who respect the craft and want a voice that's actually in the room.</p>
<p class="bio-close">Songs end. Trends end.<br>But I am <span class="blackletter">forever</span>.</p>
<div class="socials" style="margin-top:22px">%s</div></div>
<img src="assets/figure.jpg" alt="Opi">
</div></section>
<div class="stripes"></div>
<section id="planet"><div class="wrap"><div class="kicker">Planet</div><h2>Net-positive by design.</h2>
<p class="section-sub">Every song's footprint gets measured — servers, model, and studio — and we fund carbon <em>removal</em> and water restoration at ten times that number. No vague green words: receipts, published here.</p>
<div class="pledges">
<div class="pledge"><div class="ico">📏</div><h3>Measure</h3><p>Energy is logged per conversion and per training run. Water is calculated from published data-center figures — always rounded against ourselves.</p></div>
<div class="pledge"><div class="ico">🌍</div><h3>Reduce first</h3><p>Compute runs in clean-grid regions. The most honest ton of CO₂ is the one never emitted.</p></div>
<div class="pledge"><div class="ico">🧾</div><h3>Over-compensate, with receipts</h3><p>Verified removal and watershed restoration at 10× the measured footprint. Certificates posted here. We don't buy cheap offsets — and we'll tell you why.</p></div>
</div>
<div class="counter" style="margin-top:26px">→ 0 kg CO₂ removed · 0 L water restored · counter goes live at launch</div>
</div></section>
<div class="stripes"></div>
<section id="faq"><div class="wrap narrow faq"><div class="kicker">FAQ</div><h2>Questions producers ask</h2>
<details><summary>What exactly do I get when I buy a vocal?</summary><p>The full untagged acapella as WAV, every dry and wet stem (lead, doubles, harmonies, ad-libs — whatever that track has), and the lyric sheet. Delivered right after checkout.</p></details>
<details><summary>Can I release the song on Spotify, YouTube, etc.?</summary><p>Yes — unlimited streams, downloads, video plays, radio, sync, and live performance. The only thing you can't do is redistribute the vocal <em>itself</em> as it was delivered.</p></details>
<details><summary>How do the splits work?</summary><p>The new song is owned 50/50 between you and Opi — master, publishing, and writer's share. You register both shares with your PRO; Opi's details are in your contract (Christina O'Connor, SOCAN). It's a partnership, not a sample sale.</p></details>
<details><summary>Do I have to credit Opi?</summary><p>Yes — in the title, as <em>Your Song (feat. Opi)</em>. It's how the partnership works, and it sends listeners both ways.</p></details>
<details><summary>What does "non-exclusive" mean here?</summary><p>Other producers can license the same vocal for their own songs. Each license is for one new song. Because of that, please don't register the vocal with Content ID — it would flag other licensees' releases.</p></details>
<details><summary>Can I get a vocal exclusively?</summary><p>Some, yes — for $800 and up, and it's pulled from every store the moment it's yours. Ask via the form below.</p></details>
<details><summary>Can I make a sample pack from it?</summary><p>No — not without written permission. Toplines are for songs.</p></details>
<details><summary>Refunds?</summary><p>Digital files can't be un-downloaded, so sales are final once delivered. If something's technically wrong with a file, reach out and it gets fixed. A refund or chargeback terminates the license.</p></details>
<details><summary>When does Opi Voice open?</summary><p>When the waitlist says it should. <a href="voice.html" style="color:var(--coral)">Join it here.</a></p></details>
</div></section>
<div class="stripes"></div>
<section id="custom"><div class="wrap narrow"><div class="kicker">Custom work &amp; inquiries</div><h2>Tell me about the record.</h2>
<p class="section-sub">Custom toplines, exclusive requests, or a question about a specific vocal.</p>
<form data-placeholder="Got it — thanks. (Preview mode: messages aren't delivered yet.)">
<div class="inline-form" style="margin-top:0"><input type="text" required placeholder="Your name" aria-label="name"><input type="email" required placeholder="your@email.com" aria-label="email"></div>
<div style="margin-top:12px"><textarea class="field" required placeholder="What are you making? BPM, key, vibe, reference tracks, timeline — anything helps."></textarea></div>
<div style="margin-top:14px"><button class="btn" type="submit">Send</button></div>
</form>
<div class="form-note">Or DM <a href="https://www.instagram.com/opi.forever" target="_blank" rel="noopener" style="color:var(--lav)">@opi.forever</a> on Instagram.</div>
</div></section>
<section id="license" style="padding-top:0"><div class="wrap narrow"><div class="kicker">License terms</div><h2 style="font-size:1.6rem">Non-exclusive vocal license — summary</h2>
<p class="muted"><a href="license.html" style="color:var(--coral)">Read the full agreement →</a> In short: one new song per license · non-exclusive · perpetual · unlimited streams, sales, video, radio, sync, live · new song owned 50/50 (master, publishing, writer's share) · credit as <em>feat. Opi</em> · no redistribution of the vocal itself, no sample packs, no Content ID registration · both parties register splits with their PROs · no AI/ML training or voice cloning, ever · refund or chargeback terminates the license · governed by California law.</p>
</div></section>''' % "".join('<a href="%s" target="_blank" rel="noopener">%s</a>' % (u, n) for n,u in SOCIALS.items())
open(os.path.join(ROOT, "about.html"), "w").write(shell("About Opi", about_body, active="about"))


# ---------- 6. Full license page (rendered from the master draft in Opi/4 - Contracts) ----------
LICENSE_MD = "/Users/christinaoconnor/Documents/CC/Opi/4 - Contracts/OPI Non-Exclusive Vocal License v1.0 DRAFT.md"
def md_to_html(md):
    out=[]; in_ul=False
    for raw in md.splitlines():
        line=raw.rstrip()
        if line.startswith("---"): out.append("<hr>"); continue
        if line.startswith("# "): out.append("<h1>%s</h1>" % esc(line[2:])); continue
        if line.startswith("## "): out.append("<h2>%s</h2>" % esc(line[3:])); continue
        if not line.strip(): continue
        t=esc(line.strip())
        # inline: **bold**, _italic_, {{FIELD}}
        import re
        t=re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
        t=re.sub(r"(?<!\w)_(.+?)_(?!\w)", r"<em>\1</em>", t)
        t=re.sub(r"\{\{([A-Z_]+)\}\}", r'<span class="field">[\1]</span>', t)
        if line.startswith("   ") or line.startswith("—"):
            out.append('<p class="indent">%s</p>' % t)
        else:
            out.append("<p>%s</p>" % t)
    return "\n".join(out)
license_body = ('<div class="wrap page-head"><div class="kicker">The contract</div><h1>Non-exclusive vocal license</h1>'
    '<p>This is the full agreement every buyer signs at checkout — shown in advance so there are no surprises. Fields in [brackets] are filled in automatically with your details and the vocal you\'re licensing.</p></div>'
    '<section style="padding-top:10px"><div class="wrap narrow legal">%s</div></section>') % md_to_html(open(LICENSE_MD).read())
open(os.path.join(ROOT, "license.html"), "w").write(shell("License terms — Opi", license_body, active="about"))

print("built: index.html, vocals.html, voice.html, about.html, vocal/*.html (%d), license.html" % len(TRACKS))
