#!/usr/bin/env python3
"""Generate all game design assets via OpenRouter Gemini image API"""
import json, base64, time, os, urllib.request

API_KEY = "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"
MODEL = "google/gemini-2.5-flash-image"
OUTPUT_DIR = "public/assets"

ASSETS = [
    # App icon + Splash
    ("icon_app", "Game app icon for 'Pfotenwelt' (Paw World) - a cute cartoon paw print with a heart inside, surrounded by tiny animal faces (dog, cat, rabbit), warm orange and purple gradient background, round icon shape, mobile game style, NO TEXT, clean vector design"),
    ("splash_screen", "Splash screen for pet shelter game 'Pfotenwelt' - cute cartoon shelter building with a big heart-shaped window, happy cartoon dogs and cats peeking out, warm sunset colors, pastel pink and purple sky, kawaii style, inviting and warm, NO TEXT, mobile game loading screen"),

    # Station backgrounds (top portion of each station scene)
    ("bg_shelter", "Interior of a cute cartoon animal shelter, cozy warm room with pet beds, toys, food bowls on floor, wooden walls, warm lighting, kawaii style, pastel colors, NO TEXT, game background, wide horizontal format"),
    ("bg_vet", "Interior of a cute cartoon veterinary clinic, examination table, medicine shelf, stethoscope on wall, clean white and blue, friendly atmosphere, kawaii style, NO TEXT, game background"),
    ("bg_salon", "Interior of a cute cartoon pet grooming salon, bathtub, brushes, scissors, mirrors, pink and purple decor, sparkles, kawaii style, NO TEXT, game background"),
    ("bg_school", "Cute cartoon dog training area outdoors, green grass, agility equipment (hurdles, tunnels), treats on ground, blue sky, kawaii style, NO TEXT, game background"),
    ("bg_hotel", "Interior of a cute cartoon luxury pet hotel, plush beds, chandeliers, velvet curtains, fancy but warm, gold and cream colors, kawaii style, NO TEXT, game background"),
    ("bg_cafe", "Interior of a cute cartoon cat cafe, cozy tables and chairs, cat trees, coffee cups, warm lighting, plants, kawaii style, NO TEXT, game background"),

    # Merge item icons (5 chains × 5 levels = 25 icons, but do key ones)
    ("item_kibble", "Tiny pile of pet food kibble, cartoon icon, simple cute, orange-brown, transparent background circle, game item icon, NO TEXT"),
    ("item_treat", "Dog bone treat, cartoon icon, simple cute, beige, game item icon, NO TEXT"),
    ("item_bowl", "Pet food bowl filled with food, cartoon icon, cute, orange, game item icon, NO TEXT"),
    ("item_premium_food", "Premium pet food can with meat, cartoon icon, cute, golden label, game item icon, NO TEXT"),
    ("item_feast", "Gourmet pet feast plate with meat and vegetables, cartoon icon, cute, game item icon, NO TEXT"),
    ("item_yarn", "Ball of yarn, cartoon icon, simple cute, colorful, game item icon, NO TEXT"),
    ("item_ball", "Tennis ball toy, cartoon icon, simple cute, yellow-green, game item icon, NO TEXT"),
    ("item_plush", "Cute teddy bear plush toy, cartoon icon, brown, game item icon, NO TEXT"),
    ("item_cattree", "Cat scratching tree tower, cartoon icon, cute, beige and green, game item icon, NO TEXT"),
    ("item_playground", "Pet playground with slides and tunnels, cartoon icon, colorful cute, game item icon, NO TEXT"),
    ("item_bandage", "Small bandage/plaster, cartoon icon, simple cute, white with red cross, game item icon, NO TEXT"),
    ("item_medicine", "Medicine bottle with pills, cartoon icon, cute, blue, game item icon, NO TEXT"),
    ("item_medkit", "Medical first aid kit, cartoon icon, cute, red cross, game item icon, NO TEXT"),
    ("item_soap", "Bar of soap with bubbles, cartoon icon, cute, blue-white, game item icon, NO TEXT"),
    ("item_brush", "Pet grooming brush, cartoon icon, cute, pink, game item icon, NO TEXT"),
    ("item_shampoo", "Pet shampoo bottle, cartoon icon, cute, purple, game item icon, NO TEXT"),
    ("item_blanket", "Soft pet blanket, cartoon icon, cute, light blue, game item icon, NO TEXT"),
    ("item_cushion", "Pet cushion/pillow, cartoon icon, cute, pink, game item icon, NO TEXT"),
    ("item_bed", "Cozy pet bed basket, cartoon icon, cute, brown with blanket, game item icon, NO TEXT"),

    # UI elements
    ("ui_heart", "Red heart icon, glossy cartoon style, 3D-ish, cute, game UI, NO TEXT, transparent background"),
    ("ui_energy", "Yellow lightning bolt icon, glossy cartoon style, game UI energy icon, NO TEXT, transparent background"),
    ("ui_star", "Golden star icon, glossy cartoon style, sparkling, game UI, NO TEXT, transparent background"),
    ("ui_coin", "Golden coin with paw print, cartoon style, glossy, game currency icon, NO TEXT"),
    ("ui_paw", "Cute paw print icon, warm orange-brown, cartoon style, game UI, NO TEXT"),
]

def generate_asset(asset_id, prompt):
    outfile = os.path.join(OUTPUT_DIR, f"{asset_id}.png")
    if os.path.exists(outfile) and os.path.getsize(outfile) > 10000:
        print(f"SKIP {asset_id}")
        return True

    payload = json.dumps({
        "model": MODEL,
        "messages": [{"role": "user", "content": f"Generate an image: {prompt}"}]
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
            print(f"OK {asset_id} ({size//1024}KB)")
            return True
        else:
            text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            print(f"NO_IMG {asset_id}: {text[:80]}")
            return False
    except Exception as e:
        print(f"ERROR {asset_id}: {e}")
        return False

if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    ok = 0
    for aid, prompt in ASSETS:
        if generate_asset(aid, prompt):
            ok += 1
        time.sleep(2)
    print(f"\nDone: {ok}/{len(ASSETS)}")
