# Imprime bytes RAW en impresora Windows por nombre (sin compartir / sin driver npm).
param(
  [Parameter(Mandatory = $true)][string]$PrinterName,
  [Parameter(Mandatory = $true)][string]$FilePath
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $FilePath)) {
  Write-Error "No existe el archivo: $FilePath"
}

$bytes = [System.IO.File]::ReadAllBytes($FilePath)
if ($bytes.Length -eq 0) {
  Write-Error "Archivo vacio"
}

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
  public class DOCINFOA {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
  }

  [DllImport("winspool.drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
  public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);

  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
  public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In] DOCINFOA di);

  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

  public static bool SendBytes(string printerName, byte[] bytes) {
    IntPtr hPrinter;
    if (!OpenPrinter(printerName, out hPrinter, IntPtr.Zero)) return false;

    var di = new DOCINFOA();
    di.pDocName = "Granizados Comanda";
    di.pDataType = "RAW";

    if (!StartDocPrinter(hPrinter, 1, di)) { ClosePrinter(hPrinter); return false; }
    if (!StartPagePrinter(hPrinter)) { EndDocPrinter(hPrinter); ClosePrinter(hPrinter); return false; }

    IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
    Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
    int written = 0;
    bool ok = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out written);
    Marshal.FreeCoTaskMem(pUnmanagedBytes);

    EndPagePrinter(hPrinter);
    EndDocPrinter(hPrinter);
    ClosePrinter(hPrinter);
    return ok && written == bytes.Length;
  }
}
"@

$ok = [RawPrinterHelper]::SendBytes($PrinterName, $bytes)
if (-not $ok) {
  Write-Error "No se pudo imprimir en '$PrinterName'. Verifica nombre y que este encendida."
}

Write-Host "OK: impreso en $PrinterName ($($bytes.Length) bytes)"
