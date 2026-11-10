# Agrega lat/lng a data/locales.json usando OpenStreetMap (Nominatim), 1 pedido por segundo.
import json, time, urllib.parse, urllib.request
ruta = 'data/locales.json'
locales = json.load(open(ruta, encoding='utf-8'))
CENTRO = (-38.0055, -57.5426)
def buscar(q):
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode({'q': q, 'format': 'json', 'limit': 1, 'viewbox': '-57.70,-37.90,-57.50,-38.15', 'bounded': 1})
    req = urllib.request.Request(url, headers={'User-Agent': 'recomiendo-tp-universitario/1.0'})
    r = json.load(urllib.request.urlopen(req, timeout=20))
    time.sleep(1.1)
    return (float(r[0]['lat']), float(r[0]['lon'])) if r else None
for l in locales:
    if l.get('lat'): continue
    pos = None
    for q in [f"{l['direccion']}, Mar del Plata", f"{l['nombre']}, Mar del Plata", f"{l['barrio']}, Mar del Plata"]:
        try: pos = buscar(q)
        except Exception as e: print('error', e)
        if pos: break
    if not pos: pos = CENTRO
    l['lat'], l['lng'] = round(pos[0], 6), round(pos[1], 6)
    print(l['id'], pos)
json.dump(locales, open(ruta, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
