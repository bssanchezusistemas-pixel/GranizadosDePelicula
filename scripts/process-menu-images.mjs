import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
dotenv.config({ path: path.resolve(root, '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const inputDir = 'C:\\Users\\User\\Desktop\\FotosMenuDePelicula';
const outputDir = path.resolve(root, 'public', 'menu');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Explicit mappings for items
const explicitMapping = {
  "Boom de caramelo 17.000.jpeg": "boom-caramelo",
  "Cholado grande 11.000.jpeg": "chol-grande",
  "Cholado tradicional 8.000.jpeg": "chol-tradicional",
  "Desgranado mixto.jpeg": "des-mixto",
  "Fresas con mym 14000 _17000.jpeg": "hel-fresas-mm",
  "Granizado de Milo. 11.000.jpeg": "gran-milo",
  "Granizado de frutos amarillos 11.000.jpeg": "gran-frutos-amarillos",
  "Granizado de oreo 11.000.jpeg": "gran-oreo",
  "Granizado de sandía 11.000.jpeg": "gran-sandia",
  "Granizado frutos rojos 11.000.jpeg": "gran-frutos-rojos",
  "Hamburguesa criminal.jpeg": "ham-criminal",
  "Hamburguesa gratinada.jpeg": "ham-gratinada",
  "Maracubiche 11.000.jpeg": "gran-maracubiche",
  "Raspado con helado 7.000-9.000.jpeg": "rasp-con-helado",
  "Salchicostilla.jpeg": "sal-costilla",
  "Salchipapa montañera.jpeg": "sal-montanera",
  "Soda de cereza 13.000.jpeg": "soda-cereza",
  "Soda de maracuyá 13.000.jpeg": "soda-maracuya",
  "boomchocolate17000.jpeg": "boom-chocolate",
  "boomdeoreo.jpeg": "boom-oreo-milo",
  "choricostilla.jpeg": "sal-chori-costilla",
  "churrasco.jpeg": "asa-churrasco",
  "costillasbbq.jpeg": "asa-costilla",
  "granizadomangobiche11000.jpeg": "gran-mango-biche",
  "granizadomaracuya11000.jpeg": "gran-maracuya",
  "granizadomasmello11000.jpeg": "gran-masmelo",
  "hamburgesa la chingona.jpeg": "ham-chingona",
  "hamburguesa beicon.jpeg": "ham-beicon",
  "hamburguesa kentucky.jpeg": "ham-kentuck",
  "limonadadecoco10000.jpeg": "lim-coco",
  "megacholado17000.jpeg": "chol-mega",
  "mocacaramelo.jpeg": "gran-mocca-caramelo",
  "patacondepelicula.jpeg": "pat-pelicula",
  "salchicerdo.jpeg": "sal-cerdo",
  "salchicostilla1.jpeg": "sal-costilla",
  "salchigratinada.jpeg": "sal-gratinada",
  "salchilasaña.jpeg": "sal-lazana",
  "salchimixta.jpeg": "sal-mixta",
  "salchipapatradicional.jpeg": "sal-tradicional",
  "salchipelicula.jpeg": "sal-pelicula",
  "salchipelicula1.jpeg": "sal-pelicula",
  "salchipollo.jpeg": "sal-pollo",
  "sodadefresa13000.jpeg": "soda-fresa",
  "sodademanzanaverde13000.jpeg": "soda-manzana",
  "sodadesandia13000.jpeg": "soda-sandia",
  "sodamangobiche13000.jpeg": "soda-mango",
  "sodamoraazul130000.jpeg": "soda-mora"
};

async function run() {
  console.log('--- Loading Menu Data ---');
  const menuPath = pathToFileURL(path.resolve(root, 'src/data/menu.ts')).href;
  const { MENU_CATEGORIES } = await import(menuPath);
  
  // Flatten all menu items
  const allItems = MENU_CATEGORIES.flatMap(c => c.items.map(i => ({ ...i, categoryId: c.id })));
  console.log(`Loaded ${allItems.length} menu items.`);

  console.log('\n--- Scanning Photos Directory ---');
  const files = fs.readdirSync(inputDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
  console.log(`Found ${files.length} photos in source folder.`);

  const mappings = [];
  const unmatched = [];

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const matchedItemId = explicitMapping[file];

    if (matchedItemId) {
      const item = allItems.find(i => i.id === matchedItemId);
      if (item) {
        mappings.push({
          file,
          inputPath,
          itemId: matchedItemId,
          itemName: item.name,
        });
      } else {
        console.error(`Warning: Mapped item ID "${matchedItemId}" for file "${file}" not found in menu.ts!`);
        unmatched.push(file);
      }
    } else {
      unmatched.push(file);
    }
  }

  console.log(`\nMatched ${mappings.length} files successfully.`);
  if (unmatched.length > 0) {
    console.log('Unmatched/skipped files:', unmatched);
  }

  console.log('\n--- Processing Images (Cropping 1:1 Cover & WebP conversion) ---');
  const processedItems = new Map(); // Keep track of the last processed file for an item

  for (const map of mappings) {
    const outFilename = `${map.itemId}.webp`;
    const outputPath = path.join(outputDir, outFilename);

    try {
      await sharp(map.inputPath)
        .resize(800, 800, {
          fit: 'cover',
          position: 'centre'
        })
        .webp({ quality: 85 })
        .toFile(outputPath);

      console.log(`Processed: ${map.file} -> public/menu/${outFilename} (Item: ${map.itemName})`);
      processedItems.set(map.itemId, `/menu/${outFilename}`);
    } catch (err) {
      console.error(`Error processing ${map.file}:`, err);
    }
  }

  console.log('\n--- Updating src/data/menu.ts ---');
  let menuContent = fs.readFileSync(path.resolve(root, 'src/data/menu.ts'), 'utf8');

  // Let's modify the menuContent programmatically
  for (const [itemId, imagePath] of processedItems.entries()) {
    // Regex to match the block of the item with the given ID
    const itemRegex = new RegExp(`(\\{\\s*id:\\s*["']${itemId}["'][\\s\\S]*?\\})`, 'g');
    menuContent = menuContent.replace(itemRegex, (match) => {
      // Check if image property already exists
      if (match.includes('image:')) {
        // Replace existing image property
        return match.replace(/image:\s*["'].*?["']/, `image: "${imagePath}"`);
      } else {
        // Insert image property after id: "..."
        return match.replace(/(id:\s*["'].*?["'],?)/, `$1\n        image: "${imagePath}",`);
      }
    });
  }

  fs.writeFileSync(path.resolve(root, 'src/data/menu.ts'), menuContent, 'utf8');
  console.log('src/data/menu.ts updated successfully.');

  if (url && key) {
    console.log('\n--- Synchronizing with Supabase ---');
    const supabase = createClient(url, key);

    // Let's run a batch update for the processed items
    for (const [itemId, imagePath] of processedItems.entries()) {
      const { data, error } = await supabase
        .from('menu_items')
        .update({ image_url: imagePath })
        .eq('id', itemId);

      if (error) {
        console.error(`Error updating Supabase for item ${itemId}:`, error.message);
      } else {
        console.log(`Supabase database updated: ${itemId} -> ${imagePath}`);
      }
    }
    console.log('Supabase synchronization finished.');
  } else {
    console.log('\nSupabase credentials missing. Skipping DB sync.');
  }

  console.log('\n--- Complete! ---');
}

run().catch(console.error);
