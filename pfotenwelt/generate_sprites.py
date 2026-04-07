#!/usr/bin/env python3
"""Generate all 23 pet breed portraits via OpenRouter Gemini image API"""
import json, base64, time, os, sys

API_KEY = "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"
MODEL = "google/gemini-2.5-flash-image"
OUTPUT_DIR = "public/assets"

BREEDS = [
    # Dogs
    ("labrador", "golden Labrador Retriever"),
    ("dackel", "brown Dachshund (Dackel)"),
    ("schaeferhund", "German Shepherd (Schäferhund)"),
    ("golden", "Golden Retriever with light golden fur"),
    ("husky", "Siberian Husky with blue eyes, grey and white"),
    ("pudel", "white Poodle (Pudel) with curly fur"),
    ("corgi", "orange Welsh Corgi with short legs"),
    ("dalmatiner", "white Dalmatian with black spots"),
    ("samojede", "fluffy white Samoyed smiling"),
    # Cats
    ("hauskatze", "grey domestic shorthair cat (Hauskatze)"),
    ("tiger_katze", "orange tabby cat with stripes"),
    ("schwarze", "black cat with green eyes"),
    ("perser", "cream Persian cat with flat face"),
    ("maine_coon", "brown Maine Coon cat with tufted ears"),
    ("siam", "Siamese cat with blue eyes, cream body, dark face"),
    ("bengal", "golden Bengal cat with leopard spots"),
    # Small animals
    ("kaninchen", "grey lop-eared rabbit (Kaninchen)"),
    ("hamster", "golden Syrian hamster with round cheeks"),
    ("meerschwein", "brown and white Guinea pig (Meerschweinchen)"),
]

STYLE = "cute kawaii cartoon face portrait, round shape, big adorable eyes with heart shine, pink cheeks, happy smile, flat vector game icon style, solid light pastel circular background, NO TEXT, NO WORDS, NO LETTERS, clean simple design, mobile game character"

def generate_breed(breed_id, description):
    import urllib.request
    outfile = os.path.join(OUTPUT_DIR, f"breed_{breed_id}.png")
    if os.path.exists(outfile) and os.path.getsize(outfile) > 10000:
        print(f"SKIP {breed_id} (already exists)")
        return True

    prompt = f"Generate an image: {STYLE}. The animal is a {description}."

    payload = json.dumps({
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}]
    }).encode()

    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())

        images = data.get("choices", [{}])[0].get("message", {}).get("images", [])
        if images:
            url = images[0]["image_url"]["url"]
            b64 = url.split(",")[1]
            with open(outfile, "wb") as f:
                f.write(base64.b64decode(b64))
            size = os.path.getsize(outfile)
            print(f"OK {breed_id} ({size} bytes)")
            return True
        else:
            text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            print(f"NO IMAGE {breed_id}: {text[:100]}")
            return False
    except Exception as e:
        print(f"ERROR {breed_id}: {e}")
        return False

if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    success = 0
    for breed_id, desc in BREEDS:
        if generate_breed(breed_id, desc):
            success += 1
        time.sleep(2)  # Rate limiting
    print(f"\nDone: {success}/{len(BREEDS)} breeds generated")
