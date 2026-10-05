import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

function slugify(text) {
  return text.toString().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const inputDir = 'C:\\Users\\User\\Desktop\\FotosMenuDePelicula';
const outputDir = 'C:\\Users\\User\\Desktop\\de pelicla\\public\\menu';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function processImages() {
  const files = fs.readdirSync(inputDir);
  for (const file of files) {
    if (!file.match(/\.(jpg|jpeg|png)$/i)) continue;
    
    const inputPath = path.join(inputDir, file);
    const nameWithoutExt = path.parse(file).name;
    const nameWithoutNumbers = nameWithoutExt.replace(/\d+/g, '').replace(/\./g, '');
    const slug = slugify(nameWithoutNumbers);
    const outFilename = `${slug}.webp`;
    const outputPath = path.join(outputDir, outFilename);
    
    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      // Use contain instead of extract to avoid cropping the top/bottom
      await image
        .resize(800, 800, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent padding
        })
        .webp({ quality: 85 })
        .toFile(outputPath);
        
      console.log(`${file} -> ${outFilename}`);
    } catch (e) {
      console.error(`Error processing ${file}:`, e);
    }
  }
}

processImages();
