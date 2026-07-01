import { execFile } from "node:child_process";
import { writeFile, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function scriptPath(name: string): string {
  const appRoot = process.env.GRANIZADOS_APP_ROOT?.trim();
  if (appRoot) {
    return path.join(appRoot, "scripts", name);
  }
  return path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "scripts",
    name,
  );
}

export async function isWindowsPrinterAvailable(
  printerName: string,
): Promise<boolean> {
  const safe = printerName.replace(/'/g, "''");
  const cmd = `$p = Get-Printer -Name '${safe}' -ErrorAction SilentlyContinue; if ($null -eq $p) { exit 1 }; if ($p.PrinterStatus -eq 'PendingDeletion') { exit 2 }; exit 0`;
  try {
    await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", cmd],
      { timeout: 8000, windowsHide: true },
    );
    return true;
  } catch {
    return false;
  }
}

export async function printRawWinSpool(
  printerName: string,
  data: Buffer,
): Promise<void> {
  const tmp = path.join(
    os.tmpdir(),
    `granizados-ticket-${Date.now()}-${Math.random().toString(16).slice(2)}.bin`,
  );

  await writeFile(tmp, data);

  try {
    const ps1 = scriptPath("raw-print.ps1");
    await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        ps1,
        "-PrinterName",
        printerName,
        "-FilePath",
        tmp,
      ],
      { timeout: 30000, windowsHide: true },
    );
  } catch (err) {
    const detail =
      err instanceof Error && "stderr" in err
        ? String((err as NodeJS.ErrnoException & { stderr?: string }).stderr ?? err.message)
        : err instanceof Error
          ? err.message
          : String(err);
    throw new Error(
      `Spooler Windows no pudo imprimir en "${printerName}". ${detail.trim()}`,
    );
  } finally {
    await unlink(tmp).catch(() => undefined);
  }
}
