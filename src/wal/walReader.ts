import { promises as fs } from "node:fs";
import { config } from "../config";
import { LogEvent } from "./walWriter";

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

  async readFile(
    offset: number,
    maxBytes = 64 * 1024,
  ): Promise<{ events: LogEvent[]; newOffset: number }> {
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

    //check if file is open and filheandle varible has value assigned
    if (!this.isOpen || !this.fileHandle) {
      throw new Error("File not open");
    }

    //check filesize so that we can apply check on offset >= filesize. this means nothing to read.
    const fileSize = await this.getFileSize();
    if (offset >= fileSize) {
      return { events: [], newOffset: offset };
    }

    //Read file with constraints. do not read more than EOF, do not read more than maxSize
    const bytesToRead = Math.min(maxBytes, fileSize - offset);

    //Create buffer and allocate size to the buffer(mininum of (maxsize, remaining data to be read))
    const buffer = Buffer.alloc(bytesToRead);
    const { bytesRead } = await this.fileHandle.read(
      buffer,
      0,
      bytesToRead,
      offset,
    );

    //Validate how many bytes got read. If no byte got read handle and return
    if (bytesRead == 0) {
      return { events: [], newOffset: offset };
    }

    //Convert buffer to string
    const text = buffer.toString("utf-8", 0, bytesRead);
    const events: LogEvent[] = [];

    //Split each line and push to an array
    //Loop over the array check for Valid JSON. If not valid log an error return accordinly. If valid then push to new Array. Update how many byte got read.
    const stringEvents = text.split("\n");

    let totalReadBytes = 0;
    let lastCompletedBytes = 0;

    //Loop over the array check for Valid JSON. If not valid log an error return accordinly. If valid then push to new Array. 
    // Update how many byte got read. Always skip the last line, it might be incomplete.
    for (let i = 0; i < stringEvents.length - 1; i++) {
      const log = stringEvents[i];
      const logWithNextLine = log + "\n";
      const lineBytes = Buffer.byteLength(logWithNextLine, "utf-8");

      if (log.trim()) {
        try {
          const parsedJSON = JSON.parse(log) as LogEvent;
          events.push(parsedJSON);
        } catch (error) {
          console.log(
            `Not able to parse the JSON ${offset + totalReadBytes} `,
            error,
          );
        }
      }

      totalReadBytes += lineBytes;
      lastCompletedBytes = totalReadBytes;
    }

    // Return new array and newOffset(oldOffset + totalByteReadOffset)
    const newOffset = offset + lastCompletedBytes;
    return { events, newOffset };
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
