export const logger = {
  formatMessage(level, context, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${context}] ${message}`;
  },
  info(context, message, data = null) {
    console.log(this.formatMessage('INFO', context, message));
    if (data !== null && data !== undefined) {
      console.log(typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
    }
  },
  warn(context, message, data = null) {
    console.warn(this.formatMessage('WARN', context, message));
    if (data !== null && data !== undefined) {
      console.warn(typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
    }
  },
  error(context, message, err = null) {
    console.error(this.formatMessage('ERROR', context, message));
    if (err) {
      if (err.response) {
        console.error(`API Response Status: ${err.response.status}`);
        console.error(`API Response Headers:`, JSON.stringify(err.response.headers || {}, null, 2));
        console.error(`API Response Data:`, JSON.stringify(err.response.data, null, 2));
      } else if (err.stack) {
        console.error(err.stack);
      } else {
        console.error(typeof err === 'object' ? JSON.stringify(err, null, 2) : err);
      }
    }
  }
};
