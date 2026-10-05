import os
from PIL import Image
import re
import unicodedata

def slugify(value):
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    value = re.sub(r'[^\w\s-]', '', value).strip().lower()
    return re.sub(r'[-\s]+', '-', value)

input_dir = r"C:\Users\User\Desktop\FotosMenuDePelicula"
output_dir = r"C:\Users\User\Desktop\de pelicla\public\menu"

os.makedirs(output_dir, exist_ok=True)

for filename in os.listdir(input_dir):
    if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        continue
    
    path = os.path.join(input_dir, filename)
    with Image.open(path) as img:
        # Convert to RGB if needed
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # Crop to 1:1
        width, height = img.size
        new_size = min(width, height)
        left = (width - new_size)/2
        top = (height - new_size)/2
        right = (width + new_size)/2
        bottom = (height + new_size)/2
        img_cropped = img.crop((left, top, right, bottom))
        
        # Resize to 800x800
        img_resized = img_cropped.resize((800, 800), Image.Resampling.LANCZOS)
        
        # Slugify filename without extension and remove numbers
        name_without_ext = os.path.splitext(filename)[0]
        name_without_numbers = re.sub(r'\d+', '', name_without_ext)
        slug = slugify(name_without_numbers)
        
        # Save as webp
        out_filename = f"{slug}.webp"
        out_path = os.path.join(output_dir, out_filename)
        img_resized.save(out_path, 'WEBP', quality=85)
        print(f"{filename} -> {out_filename}")
