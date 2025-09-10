import os, json

MEME_DIR = "memes"
EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
os.chdir(os.path.dirname(os.path.abspath(__file__)))
def collect_memes():
    data = {}
    for theme in os.listdir(MEME_DIR):
        theme_path = os.path.join(MEME_DIR, theme)
        if os.path.isdir(theme_path):
            images = []
            for f in os.listdir(theme_path):
                ext = os.path.splitext(f)[1].lower()
                if ext in EXTENSIONS:
                    images.append(f"{MEME_DIR}/{theme}/{f}")
            images.sort()
            data[theme] = images
    return data

if __name__ == "__main__":
    memes = collect_memes()
    with open("memes.json", "w") as f:
        json.dump(memes, f, indent=2)
    print("✅ memes.json updated!")
