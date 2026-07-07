import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const assets =
  "C:/Users/User/.cursor/projects/c-Users-User-Desktop-de-pelicla/assets";
const outDir = "C:/Users/User/Desktop/de pelicla/public/menu";
fs.mkdirSync(outDir, { recursive: true });

/** @type {{ src: string; dest: string }[]} */
const jobs = [
  {
    src: `${assets}/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-13217dee-a48b-444c-b430-c7db4428d93a.png`,
    dest: `${outDir}/mega-cholao.webp`,
  },
  {
    src: `${assets}/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-6983032e-fc0f-4dd9-adf1-92f60f436df8.png`,
    dest: `${outDir}/cholado-grande-con-helado.webp`,
  },
  {
    src: `${assets}/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-ca3207da-36fb-4aee-b554-9cff4ddfc0ca.png`,
    dest: `${outDir}/cholado-pequeno-con-helado.webp`,
  },
  {
    src: `${assets}/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-25d68b80-0a8f-4ab9-a888-2e4001cd8fe5.png`,
    dest: `${outDir}/lulada.webp`,
  },
  {
    src: `${assets}/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-ec5a185a-cbd5-493a-a246-027315b411ca.png`,
    dest: `${outDir}/granizado-maracubiche.webp`,
  },
  {
    src: `${assets}/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-328ad489-e201-4ed0-9b60-f1cf3aa18844.png`,
    dest: `${outDir}/fresas-mm.webp`,
  },
  {
    src: `${assets}/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-b86167f2-94d2-4265-ba63-b30b38e5f7bb.png`,
    dest: `${outDir}/fresas-frambuesa.webp`,
  },
  {
    src: `${assets}/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-062e3025-4361-4796-872f-98a60c0b6ae9.png`,
    dest: `${outDir}/granizado-cafe.webp`,
  },
  {
    src: `${assets}/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-1cf71a40-d7a8-48c1-8a2a-a34b1617f9eb.png`,
    dest: `${outDir}/granizado-oreo.webp`,
  },
  {
    src: `${assets}/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-83aea76f-51f0-4644-b1b9-c8b919027724.png`,
    dest: `${outDir}/raspado-sencillo.webp`,
  },
];

const [cliSrc, cliName] = process.argv.slice(2);
const runJobs =
  cliSrc && cliName
    ? [{ src: cliSrc, dest: `${outDir}/${cliName}.webp` }]
    : jobs;

for (const job of runJobs) {
  const info = await sharp(job.src)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(job.dest);
  console.log(
    `${path.basename(job.dest)}: ${info.width}x${info.height} ${info.size} bytes`,
  );
}
