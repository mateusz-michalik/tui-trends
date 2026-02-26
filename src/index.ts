import {
  ui, rgb, draculaTheme, darkTheme, nordTheme, dimmedTheme,
  type ThemeDefinition, type Rgb,
} from '@rezi-ui/core';
import { createNodeApp } from '@rezi-ui/node';
import googleTrends from 'google-trends-api';

// ─── Types ───────────────────────────────────────────────────────────────────

type TimelinePoint = { formattedTime: string; value: number };
type RegionPoint   = { geoName: string; value: number };
type RelatedQuery  = { query: string; value: number };

type TrendsData = {
  timeline: TimelinePoint[];
  regions:  RegionPoint[];
  queries:  RelatedQuery[];
};

type Mode   = 'google' | 'npm';
type Status = 'loading' | 'ready' | 'error';

type State = {
  status:     Status;
  keyword:    string;
  mode:       Mode;
  data:       TrendsData | null;
  error:      string | null;
  themeIndex: number;
};

// ─── Themes ──────────────────────────────────────────────────────────────────

type AppTheme = {
  name:       string;
  rezi:       ThemeDefinition;
  chart:      string;
  accent1:    Rgb;
  accent2:    Rgb;
  accent3:    Rgb;
  banner1:    Rgb;
  banner2:    Rgb;
  barVariant: 'default' | 'success' | 'warning' | 'error' | 'info';
  dim:        Rgb;
};

const THEMES: AppTheme[] = [
  {
    name: 'Synthwave',
    rezi: draculaTheme,
    chart:      '#00ffc8',
    accent1:    rgb(80, 250, 123),
    accent2:    rgb(0, 255, 200),
    accent3:    rgb(255, 46, 151),
    banner1:    rgb(0, 255, 200),
    banner2:    rgb(255, 46, 151),
    barVariant: 'info',
    dim:        rgb(98, 114, 164),
  },
  {
    name: 'Matrix',
    rezi: darkTheme,
    chart:      '#00ff41',
    accent1:    rgb(0, 255, 65),
    accent2:    rgb(57, 255, 20),
    accent3:    rgb(0, 200, 40),
    banner1:    rgb(0, 255, 65),
    banner2:    rgb(0, 160, 30),
    barVariant: 'success',
    dim:        rgb(0, 100, 25),
  },
  {
    name: 'C64',
    rezi: darkTheme,
    chart:      '#acacff',
    accent1:    rgb(172, 172, 255),
    accent2:    rgb(255, 255, 255),
    accent3:    rgb(255, 255, 100),
    banner1:    rgb(172, 172, 255),
    banner2:    rgb(100, 100, 220),
    barVariant: 'info',
    dim:        rgb(80, 80, 160),
  },
  {
    name: 'Amber',
    rezi: dimmedTheme,
    chart:      '#ffaa00',
    accent1:    rgb(255, 200, 50),
    accent2:    rgb(255, 140, 0),
    accent3:    rgb(255, 100, 0),
    banner1:    rgb(255, 160, 0),
    banner2:    rgb(200, 80, 0),
    barVariant: 'warning',
    dim:        rgb(120, 70, 0),
  },
  {
    name: 'Nord',
    rezi: nordTheme,
    chart:      '#88c0d0',
    accent1:    rgb(163, 190, 140),
    accent2:    rgb(136, 192, 208),
    accent3:    rgb(180, 142, 173),
    banner1:    rgb(136, 192, 208),
    banner2:    rgb(94, 129, 172),
    barVariant: 'info',
    dim:        rgb(76, 86, 106),
  },
  {
    name: 'Blood Moon',
    rezi: darkTheme,
    chart:      '#ff3030',
    accent1:    rgb(255, 80, 80),
    accent2:    rgb(255, 140, 0),
    accent3:    rgb(255, 220, 50),
    banner1:    rgb(255, 48, 48),
    banner2:    rgb(180, 0, 0),
    barVariant: 'error',
    dim:        rgb(100, 30, 30),
  },
];

// ─── Static Banner (pre-generated from figlet Standard font) ─────────────────

const BANNER_TEXT = "  _____ _   _ ___    _____ ____  _____ _   _ ____  ____  \n |_   _| | | |_ _|  |_   _|  _ \\| ____| \\ | |  _ \\/ ___| \n   | | | | | || |     | | | |_) |  _| |  \\| | | | \\___ \\ \n   | | | |_| || |     | | |  _ <| |___| |\\  | |_| |___) |\n   |_|  \\___/|___|    |_| |_| \\_\\_____|_| \\_|____/|____/ ";
const BANNER_LINES = BANNER_TEXT.split('\n').filter(l => l.length > 0);

// ─── Google Trends Fetching ───────────────────────────────────────────────────

async function fetchTrends(keyword: string): Promise<TrendsData> {
  const startTime = new Date();
  startTime.setFullYear(startTime.getFullYear() - 1);

  const [timelineRaw, regionsRaw, queriesRaw] = await Promise.all([
    googleTrends.interestOverTime({ keyword, startTime }),
    googleTrends.interestByRegion({ keyword, startTime, resolution: 'COUNTRY' }),
    googleTrends.relatedQueries({ keyword, startTime }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timelineJson = JSON.parse(timelineRaw) as { default?: { timelineData?: any[] } };
  const timeline: TimelinePoint[] = (timelineJson.default?.timelineData ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any) => ({
      formattedTime: String(d.formattedAxisTime ?? d.formattedTime ?? ''),
      value: Number(d.value?.[0] ?? 0),
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const regionsJson = JSON.parse(regionsRaw) as { default?: { geoMapData?: any[] } };
  const regions: RegionPoint[] = (regionsJson.default?.geoMapData ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((d: any) => ({ geoName: String(d.geoName ?? ''), value: Number(d.value?.[0] ?? 0) }))
    .sort((a: RegionPoint, b: RegionPoint) => b.value - a.value)
    .slice(0, 8);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queriesJson = JSON.parse(queriesRaw) as { default?: { rankedList?: any[] } };
  const rankedList = queriesJson.default?.rankedList ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queries: RelatedQuery[] = ((rankedList[0]?.rankedKeyword ?? []) as any[])
    .slice(0, 12)
    .map((d) => ({ query: String(d.query ?? ''), value: Number(d.value ?? 0) }));

  return { timeline, regions, queries };
}

// ─── npm Downloads Fetching ───────────────────────────────────────────────────

function monthLabel(yyyyMM: string): string {
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [y, m] = yyyyMM.split('-');
  return `${names[parseInt(m ?? '1') - 1] ?? '?'} '${(y ?? '').slice(2)}`;
}

async function fetchNpm(pkg: string): Promise<TrendsData> {
  const res = await fetch(
    `https://api.npmjs.org/downloads/range/last-year/${encodeURIComponent(pkg)}`,
  );
  if (!res.ok) throw new Error(`npm registry error: ${res.status} ${res.statusText}`);

  const json = await res.json() as {
    downloads?: { downloads: number; day: string }[];
    error?: string;
  };
  if (json.error) throw new Error(`Package not found: "${pkg}"`);

  const daily = json.downloads ?? [];

  // ── Weekly buckets (normalized 0–100 for the line chart) ─────────────────
  const weeks: { label: string; total: number }[] = [];
  for (let i = 0; i < daily.length; i += 7) {
    const chunk = daily.slice(i, Math.min(i + 7, daily.length));
    const total = chunk.reduce((s, d) => s + d.downloads, 0);
    weeks.push({ label: chunk[0]!.day, total });
  }
  const maxWeek = Math.max(...weeks.map(w => w.total), 1);
  const timeline: TimelinePoint[] = weeks.map(w => ({
    formattedTime: w.label,
    value: Math.round((w.total / maxWeek) * 100),
  }));

  // ── Top 8 weeks for the bar chart ("Peak Weeks") ─────────────────────────
  const topWeeks = [...weeks].sort((a, b) => b.total - a.total).slice(0, 8);
  const regions: RegionPoint[] = topWeeks.map(w => ({
    // Show as "MMM 'YY" — e.g. "Mar '25"
    geoName: monthLabel(w.label.slice(0, 7)) + ' ' + w.label.slice(8, 10),
    value: Math.round((w.total / maxWeek) * 100),
  }));

  // ── Monthly totals for the table ("Monthly Breakdown") ───────────────────
  const monthMap = new Map<string, number>();
  for (const { day, downloads } of daily) {
    const mo = day.slice(0, 7);
    monthMap.set(mo, (monthMap.get(mo) ?? 0) + downloads);
  }
  const sortedMonths = [...monthMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const maxMonth = Math.max(...sortedMonths.map(([, v]) => v), 1);
  const queries: RelatedQuery[] = sortedMonths.map(([mo, total]) => ({
    query: monthLabel(mo),
    value: Math.round((total / maxMonth) * 100),
  }));

  return { timeline, regions, queries };
}

// ─── App ──────────────────────────────────────────────────────────────────────

// argv:  tui-trends [keyword]          → Google Trends
//        tui-trends --npm [package]    → npm downloads
const rawArgs = process.argv.slice(2);
let mode: Mode = 'google';
let keyword: string;

if (rawArgs[0] === '--npm') {
  mode    = 'npm';
  keyword = rawArgs[1] ?? 'react';
} else {
  keyword = rawArgs[0] ?? 'bitcoin';
}

const app = createNodeApp<State>({
  initialState: { status: 'loading', keyword, mode, data: null, error: null, themeIndex: 0 },
  theme: THEMES[0]!.rezi,
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchOnce(kw: string): Promise<void> {
  try {
    const data = mode === 'npm' ? await fetchNpm(kw) : await fetchTrends(kw);
    app.update(s => ({ ...s, status: 'ready', data }));
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    const isRateLimit = raw.includes('<HEAD>') || raw.includes('DOCTYPE') || raw.includes('not valid JSON');
    const msg = isRateLimit
      ? 'Google Trends is rate-limiting requests from this IP.\n\nWait 1–2 minutes and try again.'
      : raw;
    app.update(s => ({ ...s, status: 'error', error: msg }));
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function theme(state: Readonly<State>): AppTheme {
  return THEMES[state.themeIndex] ?? THEMES[0]!;
}

function xAxisLabels(timeline: TimelinePoint[], count = 7): string[] {
  if (timeline.length === 0) return [];
  const step = (timeline.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, i) => {
    const raw = timeline[Math.round(i * step)]?.formattedTime ?? '';
    if (raw.includes('-')) {
      // npm format: YYYY-MM-DD
      return monthLabel(raw.slice(0, 7));
    }
    // Google format: "Mar 3, 2025"
    const month = raw.slice(0, 3);
    const year  = raw.match(/\d{4}/)?.[0]?.slice(2) ?? '';
    return year ? `${month} '${year}` : month;
  });
}

function footer(state: Readonly<State>) {
  const t = theme(state);
  return ui.statusBar({
    left: [
      ui.text('[q]',  { style: { fg: t.accent3, bold: true } }),
      ui.text('quit', { style: { fg: t.dim } }),
      ui.text('  [← →]',       { style: { fg: t.accent3, bold: true } }),
      ui.text('cycle theme', { style: { fg: t.dim } }),
    ],
    right: [
      ui.text(`${t.name}  (${state.themeIndex + 1}/${THEMES.length})`, { style: { fg: t.accent2 } }),
    ],
  });
}

// ─── Views ────────────────────────────────────────────────────────────────────

function loadingView(state: Readonly<State>) {
  const t = theme(state);
  return ui.page({
    body: ui.column({ gap: 1, items: 'center', justify: 'center' }, [
      ui.column({ gap: 0 }, BANNER_LINES.map((line, i) =>
        ui.text(line, { style: { fg: i % 2 === 0 ? t.banner1 : t.banner2, bold: true }, key: String(i) }),
      )),
      ui.spacer({ size: 1 }),
      ui.row({ gap: 1, items: 'center' }, [
        ui.spinner({ variant: 'dots' }),
        ui.text(`Fetching ${state.mode === 'npm' ? 'npm downloads' : 'trends'} for "${state.keyword}"…`, { style: { fg: t.accent1 } }),
      ]),
      ui.text('This may take a few seconds', { style: { fg: t.dim } }),
    ]),
    footer: footer(state),
  });
}

function errorView(state: Readonly<State>) {
  const t = theme(state);
  return ui.page({
    header: ui.header({ title: 'TUI TRENDS', subtitle: `"${state.keyword}"` }),
    body: ui.column({ gap: 2 }, [
      ui.callout(state.error ?? 'Unknown error', { variant: 'error' }),
      ui.text('Press [q] to quit', { style: { fg: t.dim } }),
    ]),
    footer: footer(state),
  });
}

function dashboardView(state: Readonly<State>) {
  const t      = theme(state);
  const data   = state.data!;
  const isNpm  = state.mode === 'npm';
  const vals   = data.timeline.map(p => p.value);
  const xlabels = xAxisLabels(data.timeline);

  return ui.page({
    header: ui.header({
      title:    'TUI TRENDS',
      subtitle: isNpm
        ? `"${state.keyword}" — npm downloads (weekly index, 0–100)`
        : `"${state.keyword}" — interest over the last 12 months`,
    }),
    body: ui.column({ gap: 1 }, [

      // ── Line chart ───────────────────────────────────────────────
      ui.panel({ title: isNpm ? '▸  Weekly Downloads' : '▸  Interest Over Time', variant: 'rounded', p: 1, gap: 1 }, [
        ui.lineChart({
          width: 90,
          height: 12,
          series: [{ label: state.keyword, color: t.chart, data: vals }],
          axes: { y: { min: 0, max: 100 } },
          showLegend: false,
          blitter: 'braille',
        }),
        ui.row({ gap: 0 }, xlabels.flatMap((label, i) => [
          ui.text(label, { style: { fg: t.dim }, key: `xl${i}` }),
          ...(i < xlabels.length - 1 ? [ui.spacer({ flex: 1, key: `xs${i}` })] : []),
        ])),
        ui.row({ gap: 2 }, [
          ui.text(`Peak: ${Math.max(...vals)}`,    { style: { fg: t.accent1, bold: true } }),
          ui.text(`Avg: ${Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)}`, { style: { fg: t.accent2 } }),
          ui.text(`Current: ${vals.at(-1) ?? 0}`, { style: { fg: t.accent3 } }),
        ]),
      ]),

      // ── Bottom row ───────────────────────────────────────────────
      ui.row({ gap: 1 }, [

        ui.box({ flex: 1 }, [
          ui.panel({ title: isNpm ? '▸  Peak Weeks' : '▸  Top Regions', variant: 'rounded', p: 1 }, [
            ui.barChart(
              data.regions.map(r => ({
                label: r.geoName.length > 16 ? r.geoName.slice(0, 15) + '…' : r.geoName,
                value: r.value,
                variant: t.barVariant,
              })),
              { orientation: 'horizontal', showValues: true },
            ),
          ]),
        ]),

        ui.box({ flex: 1 }, [
          ui.panel({ title: isNpm ? '▸  Monthly Breakdown' : '▸  Related Queries', variant: 'rounded', p: 1 }, [
            ui.table({
              id: 'queries-table',
              columns: [
                { key: 'query', header: isNpm ? 'Month' : 'Query', flex: 1, overflow: 'ellipsis' },
                { key: 'value', header: isNpm ? 'Index' : 'Score', width: 7, align: 'right' },
              ],
              data: data.queries,
              getRowKey: r => r.query,
              showHeader: true,
              borderStyle: { variant: 'single', color: t.dim },
            }),
          ]),
        ]),

      ]),
    ]),
    footer: footer(state),
  });
}

// ─── Register view ────────────────────────────────────────────────────────────

app.view((state) => {
  if (state.status === 'loading') return loadingView(state);
  if (state.status === 'error')   return errorView(state);
  return dashboardView(state);
});

// ─── Key bindings ─────────────────────────────────────────────────────────────

function cycleTheme(currentIndex: number, dir: 1 | -1): void {
  const next = ((currentIndex + dir) + THEMES.length) % THEMES.length;
  app.update(s => ({ ...s, themeIndex: next }));
}

app.keys({
  q:     (ctx) => { void app.stop(); },
  left:  (ctx) => { cycleTheme(ctx.state.themeIndex, -1); },
  right: (ctx) => { cycleTheme(ctx.state.themeIndex, +1); },
  t:     (ctx) => { cycleTheme(ctx.state.themeIndex, +1); },
});

// ─── Start ────────────────────────────────────────────────────────────────────

void fetchOnce(keyword);
await app.start();
