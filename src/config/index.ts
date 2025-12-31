export const config = {
  //WAL configs
  wal: {
    logFile: process.env.WAL_LOG_FILE || "wal.log", //file name on the server where logs will be appended.
    offsetFile: process.env.WAL_OFFSET_FILE || "wal.offset", // file name to write offset after processing by shipper.
  },

  //API server configuration
  api:{
    port: parseInt(process.env.PORT || '3000', 10) 
    // convert string to number as env data will always be an string.
    // @param 2 = 10 denotes we want decimal value after conversion. basically base 10 values only.
  }
};
