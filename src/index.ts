import { ui, rgb, draculaTheme } from '@rezi-ui/core';
import { createNodeApp } from '@rezi-ui/node';
import figlet from 'figlet';
import googleTrends from 'google-trends-api';

// ─── Types ───────────────────────────────────────────────────────────────────

type TimelinePoint = {
  formattedTime: string;
  value: number;
};

type RegionPoint = {
  geoName: string;
  value: number;
};

type RelatedQuery = {
  query: string;
  value: number;
};

type TrendsData = {
  timeline: TimelinePoint[];
  regions: RegionPoint[];
  queries: RelatedQuery[];
};

type Status = 'loading' | 'ready' | 'error';

type State = {
  status: Status;
  keyword: string;
  data: TrendsData | null;
  error: string | null;
};

// ─── Neon Color Palette ───────────────────────────────────────────────────────

const NEON_CYAN   = rgb(0, 255, 200);
const NEON_PINK   = rgb(255, 46, 151);
const NEON_GREEN  = rgb(80, 250, 123);
const DIM_TEXT    = rgb(98, 114, 164);
const CHART_COLOR = '#00ffc8';

// ─── Static Banner ────────────────────────────────────────────────────────────

const BANNER_TEXT = figlet.textSync('TUI  TRENDS', { font: 'Standard' });
const BANNER_LINES = BANNER_TEXT.split('\n').filter(l => l.length > 0);

// ─── Data Fetching ────────────────────────────────────────────────────────────

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
    .map((d: any) => ({
      geoName: String(d.geoName ?? ''),
      value: Number(d.value?.[0] ?? 0),
    }))
    .sort((a: RegionPoint, b: RegionPoint) => b.value - a.value)
    .slice(0, 8);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queriesJson = JSON.parse(queriesRaw) as { default?: { rankedList?: any[] } };
  const rankedList = queriesJson.default?.rankedList ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queries: RelatedQuery[] = ((rankedList[0]?.rankedKeyword ?? []) as any[])
    .slice(0, 10)
    .map((d) => ({
      query: String(d.query ?? ''),
      value: Number(d.value ?? 0),
    }));

  return { timeline, regions, queries };
}

// ─── App ──────────────────────────────────────────────────────────────────────

const keyword = process.argv[2] ?? 'bitcoin';

const app = createNodeApp<State>({
  initialState: { status: 'loading', keyword, data: null, error: null },
  theme: draculaTheme,
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function refetch(): Promise<void> {
  app.update(s => ({ ...s, status: 'loading', data: null, error: null }));
  try {
    const data = await fetchTrends(keyword);
    app.update(s => ({ ...s, status: 'ready', data }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    app.update(s => ({ ...s, status: 'error', error: msg }));
  }
}

// ─── Views ────────────────────────────────────────────────────────────────────

function loadingView(state: Readonly<State>) {
  return ui.page({
    body: ui.column({ gap: 1, items: 'center', justify: 'center' }, [
      ui.column(
        { gap: 0 },
        BANNER_LINES.map((line, i) =>
          ui.text(line, {
            style: {
              fg: i % 2 === 0 ? NEON_CYAN : NEON_PINK,
              bold: true,
            },
            key: String(i),
          }),
        ),
      ),
      ui.spacer({ size: 1 }),
      ui.row({ gap: 1, items: 'center' }, [
        ui.spinner({ variant: 'dots' }),
        ui.text(`Fetching trends for "${state.keyword}"…`, {
          style: { fg: NEON_GREEN },
        }),
      ]),
      ui.text('This may take a few seconds', { style: { fg: DIM_TEXT } }),
    ]),
  });
}

function errorView(state: Readonly<State>) {
  return ui.page({
    header: ui.header({ title: 'TUI TRENDS', subtitle: 'Failed to fetch data' }),
    body: ui.column({ gap: 2 }, [
      ui.callout(state.error ?? 'Unknown error', { variant: 'error' }),
      ui.text('Press [r] to retry or [q] to quit', { style: { fg: DIM_TEXT } }),
    ]),
  });
}

function dashboardView(state: Readonly<State>) {
  const data = state.data!;
  const timelineValues = data.timeline.map(t => t.value);

  const firstDate = data.timeline[0]?.formattedTime ?? '';
  const lastDate = data.timeline.at(-1)?.formattedTime ?? '';

  return ui.page({
    header: ui.header({
      title: 'TUI TRENDS',
      subtitle: `"${state.keyword}" — interest over the last 12 months`,
    }),
    body: ui.column({ gap: 1 }, [
      // ── ASCII banner strip ───────────────────────────────────────
      ui.row(
        { gap: 0 },
        BANNER_LINES.map((line, i) =>
          ui.text(line, {
            style: { fg: i % 2 === 0 ? NEON_CYAN : NEON_PINK, bold: true },
            key: String(i),
          }),
        ),
      ),

      ui.divider(),

      // ── Interest over time ───────────────────────────────────────
      ui.panel(
        { title: '▸  Interest Over Time', variant: 'rounded', p: 1, gap: 1 },
        [
          ui.lineChart({
            width: 90,
            height: 10,
            series: [{ label: state.keyword, color: CHART_COLOR, data: timelineValues }],
            axes: {
              y: { min: 0, max: 100 },
            },
            showLegend: false,
            blitter: 'braille',
          }),
          ui.row({ gap: 2 }, [
            ui.text(`Peak: ${Math.max(...timelineValues)}`, { style: { fg: NEON_GREEN, bold: true } }),
            ui.text(`Avg: ${Math.round(timelineValues.reduce((a, b) => a + b, 0) / timelineValues.length)}`, { style: { fg: NEON_CYAN } }),
            ui.text(`Current: ${timelineValues.at(-1) ?? 0}`, { style: { fg: NEON_PINK } }),
            ui.spacer({ flex: 1 }),
            ui.text(`${firstDate} → ${lastDate}`, { style: { fg: DIM_TEXT } }),
          ]),
        ],
      ),

      // ── Bottom row: regions + queries ────────────────────────────
      ui.row({ gap: 1 }, [
        ui.box({ flex: 1 }, [
          ui.panel(
            { title: '▸  Top Regions', variant: 'rounded', p: 1 },
            [
              ui.barChart(
                data.regions.map(r => ({
                  label: r.geoName.length > 16 ? r.geoName.slice(0, 15) + '…' : r.geoName,
                  value: r.value,
                  variant: 'info' as const,
                })),
                { orientation: 'horizontal', showValues: true },
              ),
            ],
          ),
        ]),

        ui.box({ flex: 1 }, [
          ui.panel(
            { title: '▸  Related Queries', variant: 'rounded', p: 1 },
            [
              ui.table({
                id: 'related-queries',
                columns: [
                  { key: 'query', header: 'Query', flex: 1, overflow: 'ellipsis' },
                  { key: 'value', header: 'Score', width: 7, align: 'right' },
                ],
                data: data.queries,
                getRowKey: r => r.query,
                showHeader: true,
                borderStyle: { variant: 'single', color: rgb(68, 71, 90) },
              }),
            ],
          ),
        ]),
      ]),
    ]),

    footer: ui.statusBar({
      left: [
        ui.text('[q]', { style: { fg: NEON_PINK, bold: true } }),
        ui.text('quit', { style: { fg: DIM_TEXT } }),
        ui.text('  [r]', { style: { fg: NEON_PINK, bold: true } }),
        ui.text('refresh', { style: { fg: DIM_TEXT } }),
        ui.text('  [↑↓] scroll queries', { style: { fg: DIM_TEXT } }),
      ],
      right: [
        ui.text('powered by Google Trends', { style: { fg: DIM_TEXT } }),
      ],
    }),
  });
}

// ─── Register view ────────────────────────────────────────────────────────────

app.view((state) => {
  if (state.status === 'loading') return loadingView(state);
  if (state.status === 'error')   return errorView(state);
  return dashboardView(state);
});

// ─── Key bindings ─────────────────────────────────────────────────────────────

app.keys({
  q: () => { void app.stop(); },
  r: () => { void refetch(); },
});

// ─── Start ────────────────────────────────────────────────────────────────────

void refetch();
await app.start();
