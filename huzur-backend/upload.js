const fs = require("fs");
const { parser } = require("stream-json");
const { pick } = require("stream-json/filters/pick.js");
const { streamArray } = require("stream-json/streamers/stream-array.js");
const cliProgress = require("cli-progress");

const { createEmbedding } = require("./services/embedding");
const { upsertPoints } = require("./services/qdrant");
const { log } = require("./utils/logger");
const { loadProgress, saveProgress } = require("./utils/progress");

// Constants
const KNOWLEDGE_BASE_PATH = "./knowledge/knowledge_base_final.json";
const TOTAL_POINTS = 27723;
const BATCH_SIZE = 100;
const CONCURRENT_EMBEDDINGS = 5;

/**
 * Dynamically loads p-limit since v7.3.0 is ESM-only and our project is CommonJS.
 */
async function getLimit() {
  try {
    const module = await import("p-limit");
    return module.default;
  } catch (err) {
    // Fallback if imported synchronously
    return require("p-limit");
  }
}

/**
 * Generic retry wrapper for async functions.
 * @param {Function} fn - The async function to execute.
 * @param {number} maxRetries - Maximum number of retries.
 * @param {string} actionName - Name of the action for logging.
 * @returns {Promise<any>}
 */
async function withRetry(fn, maxRetries = 5, actionName = "Action") {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        log(`\n❌ [ERROR] ${actionName} failed after ${maxRetries} attempts: ${error.message}`);
        throw error; // Throw error after all retries fail
      }
      
      const delayMs = 2000 * Math.pow(2, attempt - 1); // 2s, 4s, 8s, 16s...
      log(`\n⚠️ [WARN] ${actionName} failed (Attempt ${attempt}/${maxRetries}): ${error.message}. Retrying in ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Process a single batch of points.
 * Generates embeddings with concurrency limit, updates metadata, and upserts to Qdrant.
 *
 * @param {Array} batchItems - Array of objects { index, point }
 * @param {Function} limitFn - p-limit function for concurrency
 */
async function processBatch(batchItems, limitFn) {
  // 1. Generate embeddings for all points in the batch concurrently
  const processedPoints = await Promise.all(
    batchItems.map((item) =>
      limitFn(async () => {
        const { point } = item;
        
        // Extract required text from payload
        const text = point.payload?.embedding?.embedding_text;
        if (!text) {
          throw new Error(`Point ${point.id} is missing payload.embedding.embedding_text`);
        }

        // Generate embedding with retry logic
        const vector = await withRetry(
          () => createEmbedding(text, "document"),
          3,
          `Embedding generation for point ${point.id}`
        );

        // Assign generated vector
        point.vector = vector;

        // Ensure nested payload objects exist
        if (!point.payload) point.payload = {};
        if (!point.payload.embedding) point.payload.embedding = {};

        // Update point metadata
        point.payload.embedding.model = "jeffh/intfloat-multilingual-e5-large:q8_0";
        point.payload.embedding.vector_size = 1024;
        point.payload.embedding.status = "completed";
        point.payload.embedding_model = "jeffh/intfloat-multilingual-e5-large:q8_0";
        point.payload.embedding_ready = true;
        point.payload.embedding_version = 2;

        return point;
      })
    )
  );

  // 2. Upsert the processed batch to Qdrant with retry logic
  await withRetry(() => upsertPoints(processedPoints), 5, `Qdrant batch upload (${processedPoints.length} points)`);

  // 3. Update progress configuration
  const maxIndexInBatch = Math.max(...batchItems.map((item) => item.index));
  // Save the next index to be processed
  saveProgress(maxIndexInBatch + 1);
}

/**
 * Main execution function.
 */
async function run() {
  log("Initializing upload process...");
  
  // Load concurrency limiter
  const limit = await getLimit();
  const limitFn = limit(CONCURRENT_EMBEDDINGS);

  // Resume from previous progress
  const progress = loadProgress();
  let lastIndex = progress.lastIndex || 0;

  // Initialize Progress Bar
  const progressBar = new cliProgress.SingleBar({
    format: "Uploaded: {value} / {total} | {bar} | {percentage}% | ETA: {eta}s | Elapsed: {duration}s | Current Batch: {batchSize}",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
  });

  const startTime = Date.now();
  
  if (lastIndex >= TOTAL_POINTS) {
    log("All points have already been processed.");
    return;
  }

  progressBar.start(TOTAL_POINTS, lastIndex, { batchSize: 0 });

  // Create stream pipeline for parsing JSON incrementally
  const pipeline = fs
    .createReadStream(KNOWLEDGE_BASE_PATH)
    .pipe(parser.asStream())
    .pipe(pick.asStream({ filter: "points" }))
    .pipe(streamArray.asStream());

  let batch = [];

  try {
    for await (const data of pipeline) {
      const { key: index, value: point } = data;

      // Skip already processed points
      if (index < lastIndex) {
        continue;
      }

      batch.push({ index, point });

      // When batch size is reached, process and upload
      if (batch.length >= BATCH_SIZE) {
        progressBar.update(lastIndex, { batchSize: batch.length });
        
        await processBatch(batch, limitFn);
        
        // Update variables for next iteration
        lastIndex = batch[batch.length - 1].index + 1;
        progressBar.update(lastIndex, { batchSize: 0 });
        batch = [];
      }
    }

    // Process any remaining points in the final batch
    if (batch.length > 0) {
      progressBar.update(lastIndex, { batchSize: batch.length });
      
      await processBatch(batch, limitFn);
      
      lastIndex = batch[batch.length - 1].index + 1;
      progressBar.update(lastIndex, { batchSize: 0 });
    }

    progressBar.stop();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n==================================`);
    console.log(`Upload completed successfully`);
    console.log(`${TOTAL_POINTS} points uploaded`);
    console.log(`Total elapsed time: ${elapsed}s`);
    console.log(`==================================\n`);

  } catch (error) {
    progressBar.stop();
    log(`\n❌ Fatal error during upload execution: ${error.message}`);
    process.exit(1);
  }
}

// Start the script
run();
