import http from "http";

const CONCURRENCY = parseInt(process.env.CONCURRENCY || "50", 10);
const DURATION_SECONDS = parseInt(process.env.DURATION || "10", 10);
const TARGET_URL = process.env.TARGET_URL || "http://localhost:5000/api/health";

console.log(`?? Starting Load Test on ${TARGET_URL}`);
console.log(`? Concurrency: ${CONCURRENCY} connections | Duration: ${DURATION_SECONDS}s\n`);

let totalRequests = 0;
let totalSuccess = 0;
let totalFailures = 0;
const latencies = [];

const startTime = Date.now();
const endTime = startTime + DURATION_SECONDS * 1000;

function sendRequest() {
  if (Date.now() >= endTime) return;

  const reqStart = Date.now();
  const req = http.get(TARGET_URL, (res) => {
    const latency = Date.now() - reqStart;
    latencies.push(latency);
    totalRequests++;

    if (res.statusCode >= 200 && res.statusCode < 400) {
      totalSuccess++;
    } else {
      totalFailures++;
    }

    res.resume();
    if (Date.now() < endTime) {
      setImmediate(sendRequest);
    }
  });

  req.on("error", () => {
    const latency = Date.now() - reqStart;
    latencies.push(latency);
    totalRequests++;
    totalFailures++;

    if (Date.now() < endTime) {
      setImmediate(sendRequest);
    }
  });
}

for (let i = 0; i < CONCURRENCY; i++) {
  sendRequest();
}

const interval = setInterval(() => {
  const elapsed = (Date.now() - startTime) / 1000;
  console.log(`?? Elapsed: ${elapsed.toFixed(1)}s | Requests: ${totalRequests} | Success: ${totalSuccess} | Failures: ${totalFailures}`);
  if (Date.now() >= endTime) {
    clearInterval(interval);
    setTimeout(printReport, 500);
  }
}, 2000);

function printReport() {
  const totalDurationSec = (Date.now() - startTime) / 1000;
  const rps = (totalRequests / totalDurationSec).toFixed(2);
  
  latencies.sort((a, b) => a - b);
  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1)).toFixed(2);
  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

  console.log("\n========================================");
  console.log("?? SCALABILITY & LOAD TEST REPORT");
  console.log("========================================");
  console.log(`Target URL:           ${TARGET_URL}`);
  console.log(`Total Requests:       ${totalRequests}`);
  console.log(`Successful Requests:  ${totalSuccess}`);
  console.log(`Failed Requests:      ${totalFailures}`);
  console.log(`Requests / Sec (RPS): ${rps} req/sec`);
  console.log(`Average Latency:      ${avgLatency} ms`);
  console.log(`50th Percentile (p50): ${p50} ms`);
  console.log(`95th Percentile (p95): ${p95} ms`);
  console.log(`99th Percentile (p99): ${p99} ms`);
  console.log("========================================\n");
}
