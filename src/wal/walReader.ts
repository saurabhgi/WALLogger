import { promises as fs } from "node:fs";
import { config } from "../config";

export class WALReader {
  private readonly logPath: string;
  private fileHandle: fs.FileHandle | null = null;
  private isOpen = false;
  constructor(logPath: string = config.wal.logFile) {
    this.logPath = logPath;
  }

  //if file is open do nothing, if not open it.
  async open(): Promise<void> {
    if (this.isOpen) {
      return;
    }

    this.fileHandle = await fs.open(this.logPath, "r");
    this.isOpen = true;
  }

  async readFile(offset: number, maxBytes = 64 * 1024): Promise<void> {
    /*check if file is open and filheandle varible has value assigned.
     *check filesize so that we can apply check on offset >= filesize. this means nothing to read.
     *Read file with constraints. do not read more than EOF, do not read more than maxSize
     *Create buffer and allocate size to the buffer(mininum of (maxsize, remaining data to be read))
     *DO the reading
     *Validate how many bytes got read. If no byte got read handle and return
     *Convert buffer to string
     *Split each line and push to an array
     *Loop over the array check for Valid JSON. If not valid log an error return accordinly. If valid then push to new Array. Update how many byte got read.
     *Return new array and newOffset(oldOffset + totalByteReadOffset)

     */
  }

  //get file size
  async getFileSize(): Promise<number> {
    if (!this.isOpen || !this.fileHandle) {
      const stats = await fs.stat(this.logPath);
      return stats.size;
    }

    const stats = await this.fileHandle.stat();
    return stats.size;
  }

  //close file
  async close(): Promise<void> {
    if (this.isOpen == false || this.fileHandle == null) {
      return;
    }

    await this.fileHandle.close();
    this.fileHandle = null;
    this.isOpen = false;
  }
}
