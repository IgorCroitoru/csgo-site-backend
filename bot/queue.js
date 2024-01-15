const EventEmitter = require('events').EventEmitter,
      util = require('util'),
      setTimeoutPromise = util.promisify(setTimeout);
class Queue extends EventEmitter {
  constructor(timeout = 0) {
    super();
    this.timeout = timeout;
    this.queue = [];
    this.processing = false; // Flag to track if the queue is currently being processed
  }

  enqueue(processor) {
    this.queue.push(processor);

    // Start processing the queue if it's not already being processed
    if (!this.processing) {
      this.processQueue();
    }
  }

  dequeue() {
    return this.queue.shift();
  }

  async processQueue() {
    // Set the processing flag to true
    this.processing = true;

    // Process the queue
    while (!this.isEmpty()) {
      const processor = this.dequeue();
      await processor();
      await setTimeoutPromise(this.timeout);
    }

    // Set the processing flag to false after processing is complete
    this.processing = false;
  }

  isEmpty() {
    return this.queue.length === 0;
  }
}

module.exports = Queue;
