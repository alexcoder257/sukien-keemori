import { readFile, statfs } from 'node:fs/promises';
import * as os from 'node:os';

export interface MemoryUsage {
  total: number;
  used: number;
}

export interface SystemHealth {
  memory: MemoryUsage;
  /** `null` khi máy không có swap hoặc không đọc được `/proc/meminfo`. */
  swap: MemoryUsage | null;
  /** `null` khi `statfs` không chạy được trên hệ điều hành này. */
  disk: MemoryUsage | null;
  loadAverage: [number, number, number];
  cpuCount: number;
  hostUptimeSeconds: number;
  processUptimeSeconds: number;
  processRss: number;
  processHeapUsed: number;
}

/**
 * Chỉ số của **máy chủ**, đọc từ bên trong container backend.
 *
 * Đọc được số của máy chứ không chỉ của container vì `/proc/meminfo`, load
 * average và `statfs` không bị Docker cô lập: RAM là RAM của VPS, còn `statfs('/')`
 * trên overlay trả về ổ đĩa chứa `/var/lib/docker` — tức ổ gốc của VPS, cũng là
 * ổ chứa volume Postgres và ảnh tải lên.
 */
export async function collectSystemHealth(): Promise<SystemHealth> {
  const [meminfo, disk] = await Promise.all([readMeminfo(), readDisk('/')]);
  const memoryUsage = process.memoryUsage();

  const total = os.totalmem();
  return {
    memory: {
      total,
      // `MemAvailable` chứ không phải `MemFree`: Linux dùng RAM rảnh làm page
      // cache, nên `MemFree` luôn thấp và máy khoẻ vẫn trông như sắp hết RAM.
      used: total - (meminfo.get('MemAvailable') ?? os.freemem() / 1024) * 1024,
    },
    swap: readSwap(meminfo),
    disk,
    loadAverage: os.loadavg() as [number, number, number],
    cpuCount: os.availableParallelism(),
    hostUptimeSeconds: os.uptime(),
    processUptimeSeconds: process.uptime(),
    processRss: memoryUsage.rss,
    processHeapUsed: memoryUsage.heapUsed,
  };
}

/** Các dòng `/proc/meminfo`, đơn vị kB. Rỗng trên máy không phải Linux. */
async function readMeminfo(): Promise<Map<string, number>> {
  const values = new Map<string, number>();
  try {
    const content = await readFile('/proc/meminfo', 'utf8');
    for (const line of content.split('\n')) {
      const match = /^(\w+):\s+(\d+)/.exec(line);
      if (match) values.set(match[1], Number(match[2]));
    }
  } catch {
    // macOS khi chạy dev: không có swap để báo, RAM rơi về `os.freemem()`.
  }
  return values;
}

function readSwap(meminfo: Map<string, number>): MemoryUsage | null {
  const total = meminfo.get('SwapTotal');
  const free = meminfo.get('SwapFree');
  if (!total || free === undefined) return null;
  return { total: total * 1024, used: (total - free) * 1024 };
}

async function readDisk(path: string): Promise<MemoryUsage | null> {
  try {
    const stats = await statfs(path);
    const total = stats.blocks * stats.bsize;
    // `bavail` chứ không phải `bfree`: phần dự trữ cho root (thường 5%) không
    // dùng được cho Postgres, tính vào là báo còn chỗ trong khi ổ đã đầy.
    return { total, used: total - stats.bavail * stats.bsize };
  } catch {
    return null;
  }
}
