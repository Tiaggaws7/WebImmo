import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  Clock,
  Eye,
  Loader2,
  Mail,
  MessageCircle,
  MousePointerClick,
  Phone,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { auth } from '../firebase-config';
import type { House } from '../types';

const API_URL = (import.meta.env.VITE_ANALYTICS_API_URL as string | undefined)?.trim() || '/api/analytics';

type CountItem = { key: string; count: number };

type DailyRow = {
  date: string;
  visitors: number;
  sessions: number;
  pageviews: number;
  emailsSent: number;
  emailsFailed: number;
  formSubmits: number;
  whatsappClicks: number;
  phoneClicks: number;
};

type RecentEmail = {
  id: string;
  timestamp: string;
  name: string | null;
  path: string;
  meta: Record<string, string | number | boolean>;
};

type RecentEvent = {
  id: string;
  timestamp: string;
  type: string;
  name: string | null;
  path: string;
  title: string;
  device: string;
  browser: string;
  os: string;
  country: string;
  source: string;
  meta: Record<string, string | number | boolean>;
};

type RecentSession = {
  time: string;
  durationMs: number;
  pageviews: number;
  events: number;
  source: string;
  device: string;
  country: string;
  landingPath: string;
  lastPath: string;
  formSubmits: number;
  emailsSent: number;
};

type PageEngagement = {
  key: string;
  avgDwellMs: number;
  avgScroll: number;
  samples: number;
};

type AnalyticsData = {
  generatedAt: string;
  range: { days: number; from: string; to: string };
  totals: Record<string, number>;
  daily: DailyRow[];
  pages: CountItem[];
  houses: CountItem[];
  houseClicks: CountItem[];
  sources: CountItem[];
  referrers: CountItem[];
  devices: CountItem[];
  browsers: CountItem[];
  os: CountItem[];
  countries: CountItem[];
  languages: CountItem[];
  events: CountItem[];
  emailsByForm: CountItem[];
  searches: CountItem[];
  pageEngagement: PageEngagement[];
  recentEvents: RecentEvent[];
  recentSessions: RecentSession[];
  recentSubmissions: RecentEmail[];
};

const numberFormatter = new Intl.NumberFormat('fr-FR');
const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'America/Guadeloupe',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
const longDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'America/Guadeloupe',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'America/Guadeloupe',
  hour: '2-digit',
  minute: '2-digit',
});

const FILTER_LABELS: Record<string, string> = {
  ville: 'Ville',
  type: 'Type',
  budget: 'Budget max',
  surface: 'Surface min',
  pieces: 'Pièces min',
  chambres: 'Chambres min',
  sdb: 'Salles de bain min',
  annexes: 'Annexes',
  etat: 'État',
  tri: 'Tri',
};

const SORT_LABELS: Record<string, string> = {
  newest: 'Plus récents',
  'price-asc': 'Prix croissant',
  'price-desc': 'Prix décroissant',
  'size-asc': 'Surface croissante',
  'size-desc': 'Surface décroissante',
};

const EVENT_LABELS: Record<string, string> = {
  listing_view: 'Bien consulté',
  listing_click: 'Clic sur un bien',
  search: 'Recherche',
  form_start: 'Formulaire commencé',
  form_step: 'Étape de formulaire',
  form_submit: 'Formulaire rempli',
  email_sent: 'Email envoyé',
  email_error: 'Échec email',
  whatsapp_click: 'WhatsApp',
  phone_click: 'Appel téléphone',
  email_click: 'Clic email',
  outbound_click: 'Lien sortant',
  share: 'Partage',
  gallery_open: 'Galerie ouverte',
  qr_download: 'QR code téléchargé',
  virtual_tour_open: 'Visite virtuelle',
  page_leave: 'Fin de page',
  scroll_depth: 'Défilement',
  pageview: 'Page vue',
};

function formatNumber(value: number | undefined): string {
  return numberFormatter.format(Math.round(value || 0));
}

function formatDuration(milliseconds: number | undefined): string {
  const value = milliseconds || 0;
  if (!Number.isFinite(value) || value < 0 || value > 24 * 60 * 60 * 1000) {
    return '—';
  }
  const totalSeconds = Math.max(0, Math.round(value / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  }
  return minutes > 0 ? `${minutes} min ${String(seconds).padStart(2, '0')} s` : `${seconds} s`;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}

function formatLongDate(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00-04:00`);
  return Number.isNaN(date.getTime()) ? dateKey : longDateFormatter.format(date);
}

function formatDay(dateKey: string): string {
  const [, month, day] = dateKey.split('-');
  return month && day ? `${day}/${month}` : dateKey;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : timeFormatter.format(date);
}

function formatRelative(iso: string): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return '—';
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.round(hours / 24)} j`;
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '—';
}

function deviceLabel(value: string): string {
  if (value === 'mobile') return 'Mobile';
  if (value === 'tablet') return 'Tablette';
  if (value === 'desktop') return 'Ordinateur';
  return capitalize(value);
}

function osLabel(value: string): string {
  if (value === 'iOS' || value === 'macOS') return value;
  return capitalize(value);
}

function languageLabel(value: string): string {
  const base = value.split('-')[0].toLowerCase();
  const labels: Record<string, string> = {
    fr: 'Français',
    en: 'Anglais',
    es: 'Espagnol',
    pt: 'Portugais',
    de: 'Allemand',
    it: 'Italien',
    nl: 'Néerlandais',
  };
  return labels[base] || (value ? capitalize(value) : '—');
}

function eventLabelForName(name: string): string {
  return EVENT_LABELS[name] || name;
}

function eventLabel(event: RecentEvent): string {
  if (event.type === 'pageview' || !event.name) return 'Page vue';
  return eventLabelForName(event.name);
}

function metaSummary(event: RecentEvent): string {
  const parts: string[] = [];
  const meta = event.meta || {};
  if (meta.houseTitle) parts.push(String(meta.houseTitle));
  if (meta.form) parts.push(`formulaire ${formatForm(String(meta.form))}`);
  if (meta.method) parts.push(String(meta.method));
  if (meta.filters) parts.push(formatFilters(String(meta.filters)));
  if (meta.depth) parts.push(`défilement ${meta.depth}%`);
  if (meta.dwellMs) parts.push(`temps ${formatDuration(Number(meta.dwellMs))}`);
  return parts.join(' · ');
}

function pageLabel(path: string, housesById: Map<string, House>): string {
  if (!path) return '—';
  if (path === '/') return 'Accueil';
  if (path === '/Acheter') return 'Biens à vendre';
  if (path === '/Vendre') return 'Vendre son bien';
  if (path === '/EliseBUIL') return 'À propos d’Élise';
  if (path === '/Estimation') return 'Estimation';
  if (path === '/autre') return 'Autres pages';
  if (path.startsWith('/house/')) {
    const house = housesById.get(path.slice('/house/'.length));
    if (!house) return 'Fiche bien supprimée';
    return house.title ? `Fiche bien : ${house.title}` : 'Fiche bien sans titre';
  }
  return path;
}

function formatSource(source: string): string {
  if (!source) return 'Inconnu';
  if (source.toLowerCase() === 'direct') return 'Accès direct';
  return source;
}

function formatForm(form: string): string {
  if (form === 'vendre') return 'Vente';
  if (form === 'estimation') return 'Estimation';
  if (form === 'contact') return 'Contact';
  return form ? form.charAt(0).toUpperCase() + form.slice(1) : 'Demande';
}

function formatFilterValue(key: string, value: string): string {
  if (key === 'budget') {
    const amount = Number(value);
    return Number.isFinite(amount) ? `${amount.toLocaleString('fr-FR')} €` : value;
  }
  if (key === 'surface') return `${value} m²`;
  if (key === 'annexes') return value.split('|').join(', ');
  if (key === 'tri') return SORT_LABELS[value] || value;
  if (key === 'type' || key === 'etat') {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  }
  return value;
}

function formatFilters(filters: string): string {
  if (!filters || filters === 'aucun') return 'Sans filtre';
  return filters
    .split(', ')
    .map((part) => {
      const [key, ...rest] = part.split(':');
      const value = rest.join(':');
      if (!value) return FILTER_LABELS[key] || key;
      return `${FILTER_LABELS[key] || key} : ${formatFilterValue(key, value)}`;
    })
    .join(' · ');
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'blue',
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: string;
}) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
        <span className={`p-1.5 rounded-lg ${tones[tone] || tones.blue}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-white border border-gray-100 rounded-xl shadow-sm p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function BarList({
  items,
  empty = 'Aucune donnée sur la période.',
  formatKey,
}: {
  items: CountItem[];
  empty?: string;
  formatKey?: (key: string) => string;
}) {
  if (!items.length) return <p className="text-sm text-gray-500">{empty}</p>;

  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const label = formatKey ? formatKey(item.key) : item.key;
        return (
          <li key={item.key}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-700 truncate" title={label}>
                {label}
              </span>
              <span className="font-semibold text-gray-900 tabular-nums">{formatNumber(item.count)}</span>
            </div>
            <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.max(2, (item.count / max) * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DailyTrafficChart({ rows }: { rows: DailyRow[] }) {
  if (!rows.length) return <p className="text-sm text-gray-500">Aucune donnée.</p>;

  const width = 720;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 28, left: 38 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const max = Math.max(1, ...rows.map((row) => Math.max(row.visitors, row.pageviews)));
  const barWidth = Math.max(2, (innerWidth / Math.max(rows.length, 1)) * 0.45);
  const xFor = (index: number) =>
    padding.left + (rows.length > 1 ? (index / (rows.length - 1)) * innerWidth : innerWidth / 2);
  const yFor = (value: number) => padding.top + innerHeight - (value / max) * innerHeight;
  const linePoints = rows.map((row, index) => `${xFor(index)},${yFor(row.pageviews)}`).join(' ');
  const labelIndexes =
    rows.length <= 8
      ? rows.map((_, index) => index)
      : [0, Math.floor((rows.length - 1) / 2), rows.length - 1];

  return (
    <div>
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Visiteurs
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pages vues
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56" role="img" aria-label="Fréquentation quotidienne">
        {[0, 0.5, 1].map((ratio) => {
          const y = padding.top + innerHeight - ratio * innerHeight;
          return (
            <line
              key={ratio}
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="#e5e7eb"
              strokeDasharray="3 3"
            />
          );
        })}

        {rows.map((row, index) => {
          const heightValue = (row.visitors / max) * innerHeight;
          return (
            <rect
              key={row.date}
              x={xFor(index) - barWidth / 2}
              y={padding.top + innerHeight - heightValue}
              width={barWidth}
              height={heightValue}
              rx={2}
              fill="#3b82f6"
            >
              <title>{`${formatDay(row.date)} : ${formatNumber(row.visitors)} visiteurs`}</title>
            </rect>
          );
        })}

        {rows.length > 1 && (
          <polyline
            points={linePoints}
            fill="none"
            stroke="#10b981"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {rows.map((row, index) => (
          <circle key={`point-${row.date}`} cx={xFor(index)} cy={yFor(row.pageviews)} r={2.5} fill="#10b981">
            <title>{`${formatDay(row.date)} : ${formatNumber(row.pageviews)} pages vues`}</title>
          </circle>
        ))}

        {labelIndexes.map((index) => {
          const row = rows[index];
          return (
            <text
              key={`label-${row.date}`}
              x={xFor(index)}
              y={height - 8}
              textAnchor="middle"
              className="fill-gray-400"
              fontSize={10}
            >
              {formatDay(row.date)}
            </text>
          );
        })}

        <text x={4} y={padding.top + 4} className="fill-gray-400" fontSize={10}>
          {formatNumber(max)}
        </text>
        <text x={4} y={padding.top + innerHeight} className="fill-gray-400" fontSize={10}>
          0
        </text>
      </svg>
    </div>
  );
}

function DailyEmailChart({ rows }: { rows: DailyRow[] }) {
  if (!rows.length) return <p className="text-sm text-gray-500">Aucune donnée.</p>;

  const max = Math.max(1, ...rows.map((row) => Math.max(row.emailsSent, row.emailsFailed)));
  return (
    <div>
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Envoyés
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-400" /> Échecs
        </span>
      </div>
      <div className="flex items-end gap-1 h-28 border-b border-gray-100">
        {rows.map((row) => (
          <div
            key={row.date}
            className="flex-1 min-w-0 flex items-end justify-center gap-0.5"
            title={`${formatDay(row.date)} : ${row.emailsSent} envoyé(s), ${row.emailsFailed} échec(s)`}
          >
            <div
              className="w-1/2 bg-emerald-500 rounded-t"
              style={{ height: `${(row.emailsSent / max) * 100}%` }}
            />
            <div
              className="w-1/2 bg-red-400 rounded-t"
              style={{ height: `${(row.emailsFailed / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{formatDay(rows[0].date)}</span>
        <span>{formatDay(rows[rows.length - 1].date)}</span>
      </div>
    </div>
  );
}

function HouseList({
  views,
  clicks,
  housesById,
}: {
  views: CountItem[];
  clicks: CountItem[];
  housesById: Map<string, House>;
}) {
  const clicksById = new Map(clicks.map((item) => [item.key, item.count]));
  const viewsById = new Map(views.map((item) => [item.key, item.count]));
  const ids = Array.from(new Set([...viewsById.keys(), ...clicksById.keys()]));
  const items = ids
    .map((id) => ({
      id,
      views: viewsById.get(id) || 0,
      clicks: clicksById.get(id) || 0,
    }))
    .sort((a, b) => b.views + b.clicks - (a.views + a.clicks))
    .slice(0, 10);

  if (!items.length) return <p className="text-sm text-gray-500">Aucun bien consulté sur cette période.</p>;

  const max = Math.max(...items.map((item) => item.views + item.clicks), 1);
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const house = housesById.get(item.id);
        return (
          <Link key={item.id} to={`/house/${item.id}`} className="block group">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-700 truncate group-hover:text-blue-600 transition-colors">
                {house?.title || 'Bien supprimé'}
              </span>
              <span className="text-gray-500 whitespace-nowrap tabular-nums">
                {formatNumber(item.views)} vues · {formatNumber(item.clicks)} clics
              </span>
            </div>
            <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full"
                style={{ width: `${Math.max(2, ((item.views + item.clicks) / max) * 100)}%` }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function StatusBadge({ email }: { email: RecentEmail }) {
  if (email.name === 'email_sent') {
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">Email envoyé</span>;
  }
  if (email.name === 'email_error') {
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700">Échec</span>;
  }
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">Demande reçue</span>;
}

function SubmissionsTable({
  items,
  housesById,
}: {
  items: RecentEmail[];
  housesById: Map<string, House>;
}) {
  const emails = items
    .filter((item) => item.name === 'email_sent' || item.name === 'email_error')
    .slice(0, 10);

  if (!emails.length) {
    return <p className="text-sm text-gray-500 mt-4">Aucun email envoyé sur cette période.</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wide text-gray-400">
            <th className="py-2 pr-3 font-semibold">Date</th>
            <th className="py-2 pr-3 font-semibold">Type de demande</th>
            <th className="py-2 pr-3 font-semibold">Résultat</th>
            <th className="py-2 font-semibold">Page</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {emails.map((email) => (
            <tr key={email.id}>
              <td className="py-2 pr-3 whitespace-nowrap text-gray-500">{formatDateTime(email.timestamp)}</td>
              <td className="py-2 pr-3 text-gray-700">{formatForm(String(email.meta.form || ''))}</td>
              <td className="py-2 pr-3">
                <StatusBadge email={email} />
              </td>
              <td className="py-2 text-gray-500 truncate max-w-[220px]" title={pageLabel(email.path, housesById)}>
                {pageLabel(email.path, housesById)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PageEngagementTable({
  items,
  housesById,
}: {
  items: PageEngagement[];
  housesById: Map<string, House>;
}) {
  if (!items.length) {
    return (
      <p className="text-sm text-gray-500">
        Pas encore assez de données. Les temps apparaîtront après quelques visites.
      </p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-gray-400">
              <th className="py-2 pr-3 font-semibold">Page</th>
              <th className="py-2 pr-3 font-semibold">Temps moyen</th>
              <th className="py-2 pr-3 font-semibold">Page lue</th>
              <th className="py-2 font-semibold">Visites</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.slice(0, 10).map((item) => (
              <tr key={item.key}>
                <td className="py-2 pr-3 text-gray-700 truncate max-w-[320px]" title={pageLabel(item.key, housesById)}>
                  {pageLabel(item.key, housesById)}
                </td>
                <td className="py-2 pr-3 whitespace-nowrap text-gray-700">{formatDuration(item.avgDwellMs)}</td>
                <td className="py-2 pr-3 whitespace-nowrap text-gray-700">{Math.round(item.avgScroll)} %</td>
                <td className="py-2 text-gray-500 tabular-nums">{formatNumber(item.samples)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-400">
        « Page lue » indique jusqu’où le visiteur a fait défiler la page.
      </p>
    </div>
  );
}

function SessionsTable({
  items,
  housesById,
}: {
  items: RecentSession[];
  housesById: Map<string, House>;
}) {
  if (!items.length) return <p className="text-sm text-gray-500">Aucune visite récente.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wide text-gray-400">
            <th className="py-2 pr-3 font-semibold">Dernière activité</th>
            <th className="py-2 pr-3 font-semibold">Durée</th>
            <th className="py-2 pr-3 font-semibold">Pages</th>
            <th className="py-2 pr-3 font-semibold">Source</th>
            <th className="py-2 pr-3 font-semibold">Appareil</th>
            <th className="py-2 pr-3 font-semibold">Pays</th>
            <th className="py-2 font-semibold">Arrivée</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item, index) => (
            <tr key={`${item.time}-${index}`}>
              <td className="py-2 pr-3 whitespace-nowrap text-gray-500">{formatRelative(item.time)}</td>
              <td className="py-2 pr-3 whitespace-nowrap text-gray-700">{formatDuration(item.durationMs)}</td>
              <td className="py-2 pr-3 text-gray-700 tabular-nums">{formatNumber(item.pageviews)}</td>
              <td className="py-2 pr-3 text-gray-500">{item.source ? formatSource(item.source) : '—'}</td>
              <td className="py-2 pr-3 text-gray-500">{deviceLabel(item.device)}</td>
              <td className="py-2 pr-3 text-gray-500">{item.country || '—'}</td>
              <td className="py-2 text-gray-500 truncate max-w-[220px]" title={pageLabel(item.landingPath, housesById)}>
                {pageLabel(item.landingPath, housesById)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventsTable({
  items,
  housesById,
}: {
  items: RecentEvent[];
  housesById: Map<string, House>;
}) {
  if (!items.length) return <p className="text-sm text-gray-500">Aucune action récente.</p>;

  return (
    <div className="max-h-[430px] overflow-y-auto divide-y divide-gray-100 pr-1">
      {items.map((event) => (
        <div key={event.id} className="py-2 flex items-center gap-3 text-sm" title={metaSummary(event)}>
          <span className="w-12 shrink-0 text-[11px] text-gray-400 tabular-nums">{formatTime(event.timestamp)}</span>
          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
            {eventLabel(event)}
          </span>
          <span className="flex-1 min-w-0 text-gray-600 truncate">{pageLabel(event.path, housesById)}</span>
          <span className="shrink-0 text-[11px] text-gray-400">
            {deviceLabel(event.device)} · {event.country || '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-28 bg-white border border-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-white border border-gray-100 rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 bg-white border border-gray-100 rounded-xl" />
        <div className="h-72 bg-white border border-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

export default function AdminAnalytics({ houses }: { houses: House[] }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Session administrateur expirée. Reconnectez-vous.');

      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || `Erreur ${response.status}`);
      }
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(
          "L'API de statistiques n'est pas disponible. Déployez les Cloud Functions ou configurez VITE_ANALYTICS_API_URL.",
        );
      }
      const nextData = (await response.json()) as AnalyticsData;
      if (requestId !== requestRef.current) return;
      setData(nextData);
    } catch (loadError) {
      if (requestId !== requestRef.current) return;
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les statistiques.');
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const housesById = useMemo(() => new Map(houses.map((house) => [house.id, house])), [houses]);
  const totals = data?.totals || {};

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Ce que font les visiteurs
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Un aperçu simple et anonyme de la fréquentation, des biens consultés et des demandes reçues.
          </p>
          {data && (
            <p className="text-xs text-gray-400 mt-1">
              Du {formatLongDate(data.range.from)} au {formatLongDate(data.range.to)}.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[7, 30, 90].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDays(value)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  days === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
                title={`Voir les ${value} derniers jours`}
              >
                {value} j
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {loading && !data ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900">Statistiques indisponibles</h3>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
          {import.meta.env.DEV && (
            <p className="text-xs text-gray-500 mt-2">
              En local, lancez les émulateurs Firebase ou définissez <code>VITE_ANALYTICS_API_URL</code>.
            </p>
          )}
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      ) : data ? (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900">
            <p className="font-semibold">Comment lire ce tableau ?</p>
            <p className="mt-1 text-blue-800">
              Un visiteur est une personne différente (comptée une fois par jour). Une visite correspond à une
              ouverture du site. Les emails et formulaires comptent les demandes reçues.
            </p>
          </div>

          {totals.pageviews === 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-900">
              Aucune visite enregistrée sur cette période. Les statistiques apparaîtront après le déploiement et
              les premières visites.
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="Visiteurs"
              value={formatNumber(totals.visitors)}
              hint="Comptés une fois par jour"
              icon={Users}
              tone="blue"
            />
            <KpiCard
              label="Visites"
              value={formatNumber(totals.sessions)}
              hint="Ouvertures du site"
              icon={TrendingUp}
              tone="violet"
            />
            <KpiCard
              label="Pages vues"
              value={formatNumber(totals.pageviews)}
              hint="Total des pages affichées"
              icon={Eye}
              tone="green"
            />
            <KpiCard
              label="Temps moyen"
              value={formatDuration(totals.avgSessionMs)}
              hint="Par visite"
              icon={Clock}
              tone="amber"
            />
            <KpiCard
              label="Emails envoyés"
              value={formatNumber(totals.emailsSent)}
              hint="Demandes reçues par email"
              icon={Mail}
              tone="green"
            />
            <KpiCard
              label="Formulaires remplis"
              value={formatNumber(totals.formSubmits)}
              hint="Vente et estimation"
              icon={MousePointerClick}
              tone="blue"
            />
            <KpiCard
              label="WhatsApp"
              value={formatNumber(totals.whatsappClicks)}
              hint="Clics vers WhatsApp"
              icon={MessageCircle}
              tone="green"
            />
            <KpiCard
              label="Appels"
              value={formatNumber(totals.phoneClicks)}
              hint="Clics sur le téléphone"
              icon={Phone}
              tone="violet"
            />
          </div>

          <Section title="Fréquentation jour par jour" subtitle="Barres : nombre de visiteurs · Courbe : pages vues">
            <DailyTrafficChart rows={data.daily || []} />
          </Section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Pages les plus consultées" subtitle="Classement par nombre de visites">
              <BarList
                items={(data.pages || []).slice(0, 10)}
                formatKey={(key) => pageLabel(key, housesById)}
                empty="Aucune page consultée sur cette période."
              />
            </Section>
            <Section title="Biens les plus consultés" subtitle="Vues et clics sur les fiches">
              <HouseList
                views={data.houses || []}
                clicks={data.houseClicks || []}
                housesById={housesById}
              />
            </Section>
          </div>

          <Section
            title="Temps passé sur chaque page"
            subtitle="Temps moyen avant de quitter la page, et part de page lue"
          >
            <PageEngagementTable items={data.pageEngagement || []} housesById={housesById} />
          </Section>

          <Section title="Demandes reçues" subtitle="Emails et formulaires envoyés depuis le site">
            <DailyEmailChart rows={data.daily || []} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
              <div>
                <span className="text-gray-500">Emails envoyés</span>
                <p className="font-bold text-gray-900">{formatNumber(totals.emailsSent)}</p>
              </div>
              <div>
                <span className="text-gray-500">Échecs</span>
                <p className="font-bold text-red-600">{formatNumber(totals.emailsFailed)}</p>
              </div>
              <div>
                <span className="text-gray-500">Formulaires commencés</span>
                <p className="font-bold text-gray-900">{formatNumber(totals.formStarts)}</p>
              </div>
              <div>
                <span className="text-gray-500">Formulaires remplis</span>
                <p className="font-bold text-gray-900">{formatNumber(totals.formSubmits)}</p>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Emails envoyés par type de demande
              </h4>
              <BarList
                items={data.emailsByForm || []}
                empty="Aucun email envoyé sur cette période."
                formatKey={formatForm}
              />
            </div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mt-6 mb-1">
              Derniers emails envoyés
            </h4>
            <SubmissionsTable items={data.recentSubmissions || []} housesById={housesById} />
          </Section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="D’où viennent les visiteurs" subtitle="Recherche, réseaux sociaux, accès direct…">
              <BarList
                items={(data.sources || []).slice(0, 8)}
                formatKey={formatSource}
                empty="Aucune source détectée sur cette période."
              />
            </Section>
            <Section title="Où se trouvent les visiteurs" subtitle="Estimation selon le fuseau horaire, sans adresse IP">
              <BarList
                items={(data.countries || []).slice(0, 8)}
                empty="Aucune provenance détectée sur cette période."
              />
            </Section>
          </div>

          <Section title="Ce que cherchent les visiteurs" subtitle="Filtres utilisés sur la page Biens à vendre">
            <BarList
              items={(data.searches || []).filter((item) => item.key !== 'aucun').slice(0, 10)}
              formatKey={formatFilters}
              empty="Aucune recherche enregistrée sur cette période."
            />
          </Section>

          <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
            <button
              type="button"
              onClick={() => setShowAdvanced((value) => !value)}
              aria-expanded={showAdvanced}
              className="w-full p-5 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div>
                <h3 className="text-sm font-bold text-gray-900">Statistiques avancées</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Appareils, navigateurs, actions enregistrées et visites récentes. Ces données sont plus
                  techniques.
                </p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${
                  showAdvanced ? 'rotate-180' : ''
                }`}
              />
            </button>
            {showAdvanced && (
              <div className="px-5 pb-5 pt-5 border-t border-gray-100 space-y-6">
                <p className="text-xs text-gray-500">
                  Vocabulaire : un « événement » est une action enregistrée (clic, recherche, envoi de
                  formulaire…). Les ouvertures de page sont comptées séparément dans « Pages vues ».
                </p>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  <Section title="Appareils" subtitle="Répartition des pages vues par appareil">
                    <BarList items={(data.devices || []).slice(0, 8)} formatKey={deviceLabel} />
                  </Section>
                  <Section title="Systèmes d'exploitation" subtitle="Répartition des pages vues par système">
                    <BarList items={(data.os || []).slice(0, 8)} formatKey={osLabel} />
                  </Section>
                  <Section title="Navigateurs" subtitle="Répartition des pages vues par navigateur">
                    <BarList items={(data.browsers || []).slice(0, 8)} formatKey={capitalize} />
                  </Section>
                  <Section title="Langues" subtitle="Langue configurée dans le navigateur">
                    <BarList items={(data.languages || []).slice(0, 8)} formatKey={languageLabel} />
                  </Section>
                  <Section title="Sites référents" subtitle="Sites depuis lesquels les visiteurs sont arrivés">
                    <BarList
                      items={(data.referrers || []).slice(0, 8)}
                      empty="Aucun site référent sur cette période."
                    />
                  </Section>
                  <Section title="Actions enregistrées" subtitle="Nombre de fois où chaque action a eu lieu">
                    <BarList items={(data.events || []).slice(0, 10)} formatKey={eventLabelForName} />
                  </Section>
                </div>
                <Section title="Visites récentes" subtitle="Les 20 dernières visites">
                  <SessionsTable items={data.recentSessions || []} housesById={housesById} />
                </Section>
                <Section title="Dernières actions" subtitle="Les dernières actions enregistrées">
                  <EventsTable items={data.recentEvents || []} housesById={housesById} />
                </Section>
              </div>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <p>
              Mesure anonyme : aucune adresse IP, aucun nom, email ou téléphone n’est enregistré. Les visiteurs
              peuvent refuser la mesure depuis le pied de page.
            </p>
          </div>
        </>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
          <Loader2 className="w-6 h-6 text-gray-400 mx-auto animate-spin" />
        </div>
      )}
    </div>
  );
}
