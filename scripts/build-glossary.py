"""Build public/data/glossary.json from CC-CEDICT, restricted to the words that
actually occur in the app's Chinese text (lessons, exercises, exam bank).

Usage: python3 scripts/build-glossary.py path/to/cedict_ts.u8
CC-CEDICT is licensed CC BY-SA 4.0 (https://www.mdbg.net/chinese/dictionary?page=cedict).
"""
import json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
MAX_LEN = 6
HAN = re.compile(r'[一-鿿]+')

TONES = {'a': 'āáǎàa', 'e': 'ēéěèe', 'i': 'īíǐìi', 'o': 'ōóǒòo', 'u': 'ūúǔùu', 'ü': 'ǖǘǚǜü'}

def mark(syl):
    m = re.match(r'^([a-zü:]+)([1-5])$', syl, re.I)
    if not m:
        return syl
    s, tone = m.group(1).replace('u:', 'ü').replace('U:', 'Ü'), int(m.group(2))
    low = s.lower()
    for v in ('a', 'e'):
        if v in low:
            i = low.index(v); break
    else:
        i = low.index('ou') if 'ou' in low else max((k for k, ch in enumerate(low) if ch in 'aeiouü'), default=-1)
    if i < 0:
        return s
    ch = low[i]
    rep = TONES[ch][tone - 1]
    if s[i].isupper():
        rep = rep.upper()
    return s[:i] + rep + s[i + 1:]

def to_marks(p):
    return ' '.join(mark(x) for x in p.split())

def collect_text():
    chunks = []
    for f in (ROOT / 'public/data').glob('*.json'):
        if f.name != 'glossary.json':
            chunks.append(f.read_text())
    for f in (ROOT / 'src').rglob('*.js*'):
        chunks.append(f.read_text())
    return '\n'.join(chunks)

def main(cedict_path):
    entries = {}
    for line in open(cedict_path, encoding='utf-8'):
        if line.startswith('#'):
            continue
        m = re.match(r'^(\S+) (\S+) \[([^\]]+)\] /(.*)/$', line.strip())
        if not m:
            continue
        _, simp, py, defs = m.groups()
        senses = [d for d in defs.split('/') if d and not re.match(r'^(old |archaic |)variant of|^see |^CL:|^Taiwan pr\.', d)]
        if not senses:
            continue
        entries.setdefault(simp, []).append((py, senses))

    text = collect_text()
    wanted = set()
    for run in HAN.findall(text):
        for i in range(len(run)):
            for n in range(1, MAX_LEN + 1):
                if i + n <= len(run):
                    wanted.add(run[i:i + n])

    out = {}
    for w in sorted(wanted):
        if w not in entries:
            continue
        # Keep every common (lowercase) reading with its own senses; the app picks the
        # reading that matches the contextual pinyin. Proper-noun readings only as fallback.
        common = [r for r in entries[w] if not r[0][:1].isupper()] or entries[w]
        readings = []
        for py, senses in common:
            py = to_marks(py)
            senses = [d for d in senses if not d.startswith(('surname ', 'used in ', 'abbr. for '))] or senses
            prev = next((r for r in readings if r['p'] == py), None)
            if prev:
                prev['en'] = '; '.join(dict.fromkeys(prev['en'].split('; ') + senses[:3]))
            else:
                readings.append({'p': py, 'en': '; '.join(senses[:4])})
        out[w] = readings[:4]

    dest = ROOT / 'public/data/glossary.json'
    dest.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
    single = sum(1 for k in out if len(k) == 1)
    print(f'{len(out)} entries ({single} characters) -> {dest} ({dest.stat().st_size // 1024} KB)')

if __name__ == '__main__':
    main(sys.argv[1])
