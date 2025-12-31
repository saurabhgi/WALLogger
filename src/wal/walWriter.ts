import { promises as fs } from "fs";
import { config } from "../config";

export interface LogEvent {
  requestId: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  request?: any;
  response?: any;
  truncated?: boolean;
}

export class WALWriter {
  private readonly logPath: string;
  private fileHandle: fs.FileHandle | null = null;
  private isOpen = false;
  // constructor to set file path
  constructor(logPath: string = config.wal.logFile) {
    this.logPath = logPath;
  }
  //function to open file in append mode
  async open(): Promise<void> {
    if (this.isOpen) {
      return;
    }

    this.fileHandle = await fs.open(this.logPath, "a");
    this.isOpen = true;
  }
  //function to append file
  async appendData(event: LogEvent): Promise<void> {
    if(!this.isOpen || !this.fileHandle){
      return
    }
    const stringfiedJSONLine= JSON.stringify(event)+"\n";
    const buffer = Buffer.from(stringfiedJSONLine, 'utf-8'); // do the UTF-8 encoding for JSON string. 
    await this.fileHandle.write(buffer,0,buffer.length,null); // write buffer to file. 
    await this.fileHandle.sync(); // flush to storage data.
 
  }
  // function to close file
  async close(): Promise<void> {
    if (!this.isOpen || !this.fileHandle) {
      return;
    }

    await this.fileHandle.sync(); //before close to flush the data to storage define. an OS concept.
    await this.fileHandle.close();
    this.isOpen = false;
  }
}
