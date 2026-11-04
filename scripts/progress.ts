/**
 * Live progress block for the sync: one header line with a spinner, the overall elapsed
 * time and how many repos are done, then one line per repo that is still running with
 * its own elapsed time.
 *
 *   ⠹ 1m12s [14/40] running 2
 *       team-3-app  9s
 *       team-7-api  41s
 *
 * In a terminal the block redraws in place. Where there is no TTY (Vercel logs, CI,
 * piped output) it prints nothing extra, so only the normal log lines appear.
 */

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const isTTY = Boolean(process.stdout.isTTY);

const active = new Map<string, number>(); // repo name → start time (ms)
let total = 0;
let done = 0;
let startedAt = Date.now();
let frame = 0;
let timer: ReturnType<typeof setInterval> | undefined;
let rows = 0; // rows the live block currently occupies on screen

export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`;
}

/** Erase the live block and leave the cursor at the start of its first row. */
function clearBlock() {
  if (!isTTY || rows === 0) return;
  const up = rows > 1 ? `\x1b[${rows - 1}A` : '';
  process.stdout.write(`\r${up}\x1b[J`);
  rows = 0;
}

function draw() {
  if (!isTTY || !timer) return;
  clearBlock();
  if (!active.size) return;
  frame++;

  const now = Date.now();
  const width = (process.stdout.columns || 120) - 2;
  // Each line must fit the terminal width, or it wraps and the row count breaks.
  const fit = (s: string) => (s.length > width ? `${s.slice(0, width - 1)}…` : s);

  const lines = [
    fit(
      `${FRAMES[frame % FRAMES.length]} ${formatDuration(now - startedAt)} ` +
        `[${done}/${total}] running ${active.size}`
    ),
    ...[...active].map(([name, t]) => fit(`    ${name}  ${formatDuration(now - t)}`)),
  ];
  process.stdout.write(lines.join('\r\n'));
  rows = lines.length;
}

export const progress = {
  /** Start a batch of `count` repos; the block redraws every 250 ms. */
  start(count: number) {
    total = count;
    done = 0;
    startedAt = Date.now();
    active.clear();
    if (isTTY && !timer) timer = setInterval(draw, 250);
  },

  /** A repo started fetching. */
  begin(name: string) {
    active.set(name, Date.now());
    draw();
  },

  /** A repo finished (successfully or not). */
  end(name: string) {
    active.delete(name);
    done++;
    draw();
  },

  /** A repo was skipped because its cached file is still valid. */
  skip() {
    done++;
    draw();
  },

  /** Print a normal line above the live block. */
  log(message: string, stream: 'out' | 'err' = 'out') {
    clearBlock();
    (stream === 'err' ? console.error : console.log)(message);
    draw();
  },

  /** Stop the spinner and remove the live block. */
  stop() {
    if (timer) clearInterval(timer);
    timer = undefined;
    clearBlock();
  },
};
