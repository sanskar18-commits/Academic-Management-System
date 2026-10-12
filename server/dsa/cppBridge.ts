import { execFileSync } from "child_process";
import path from "path";
import fs from "fs";

export interface CppEngineStatus {
  available: boolean;
  binaryPath: string;
  version: string;
  testOutput?: string;
}

/**
 * C++ DSA Engine Bridge
 * Integrates native C++ DSA implementation compiled with g++ into Node.js runtime.
 */
class CppBridge {
  private binaryPath: string;
  private isAvailable: boolean = false;

  constructor() {
    this.binaryPath = path.join(process.cwd(), "server", "dsa", "cpp", "dsa_engine.exe");
    this.checkAvailability();
  }

  private checkAvailability(): void {
    try {
      if (fs.existsSync(this.binaryPath)) {
        this.isAvailable = true;
      } else {
        this.isAvailable = false;
      }
    } catch {
      this.isAvailable = false;
    }
  }

  public getStatus(): CppEngineStatus {
    this.checkAvailability();
    let testOutput: string | undefined;

    if (this.isAvailable) {
      try {
        testOutput = execFileSync(this.binaryPath, ["--test"], {
          encoding: "utf-8",
          timeout: 3000,
        });
      } catch (err: any) {
        testOutput = `Error running C++ binary: ${err.message}`;
      }
    }

    return {
      available: this.isAvailable,
      binaryPath: this.binaryPath,
      version: "1.0 (MinGW C++11 Native Binary)",
      testOutput,
    };
  }

  public isNativeEnabled(): boolean {
    return this.isAvailable;
  }
}

export const cppBridge = new CppBridge();
