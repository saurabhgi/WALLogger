export const config = {
    wal: {
    logFile: process.env.WAL_LOG_FILE || 'wal.log',
    offsetFile: process.env.WAL_OFFSET_FILE || 'wal.offset',
  }
}