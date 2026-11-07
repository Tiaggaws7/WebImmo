import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Copy,
  Inbox,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { auth } from '../firebase-config';

const API_URL = (
  (import.meta.env.VITE_LEADS_URL as string | undefined)?.trim() || '/api/leads'
).replace(/\/+$/, '');

type LeadType = 'estimation' | 'vendre' | 'contact';
type LeadStatus = 'new' | 'email_sent' | 'email_error';

type Lead = {
  id: string;
  type: LeadType;
  status: LeadStatus;
  createdAt: string | null;
  updatedAt: string | null;
  emailSentAt: string | null;
  emailError: string | null;
  pagePath: string;
  source: string;
  contact: {
    name?: string;
    email?: string;
    phone?: string;
  };
  data: Record<string, string | number | boolean | string[]>;
};

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'America/Guadeloupe',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const TYPE_LABELS: Record<LeadType, string> = {
  estimation: 'Estimation',
  vendre: 'Vente',
  contact: 'Contact',
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Nouvelle',
  email_sent: 'Email envoyé',
  email_error: 'Échec email',
};

const FIELD_LABELS: Record<string, string> = {
  address: 'Adresse du bien',
  propertyType: 'Type de bien',
  livingArea: 'Surface habitable (m²)',
  landArea: 'Surface du terrain (m²)',
  floors: 'Nombre de niveaux',
  rooms: 'Nombre de pièces',
  bedrooms: 'Nombre de chambres',
  constructionPeriod: 'Période de construction',
  condition: 'État du bien',
  features: 'Caractéristiques',
  saleTimeline: 'Délai de vente',
  gender: 'Civilité',
  firstName: 'Prénom',
  lastName: 'Nom',
  name: 'Nom',
  surname: 'Nom de famille',
  project: 'Projet',
  availability: 'Disponibilités',
  message: 'Message',
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

function typeLabel(type: LeadType): string {
  return TYPE_LABELS[type] || type;
}

function statusLabel(status: LeadStatus): string {
  return STATUS_LABELS[status] || status;
}

function statusClass(status: LeadStatus): string {
  if (status === 'email_sent') return 'bg-emerald-50 text-emerald-700';
  if (status === 'email_error') return 'bg-red-50 text-red-700';
  return 'bg-amber-50 text-amber-700';
}

function pageLabel(path: string): string {
  if (path === '/Estimation') return 'Estimation';
  if (path === '/Vendre') return 'Vendre son bien';
  if (path === '/EliseBUIL') return 'Contact';
  return path || '—';
}

function displayValue(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function leadSearchText(lead: Lead): string {
  return [
    lead.contact.name,
    lead.contact.email,
    lead.contact.phone,
    lead.type,
    lead.status,
    lead.pagePath,
    lead.source,
    ...Object.values(lead.data || {}),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function copyText(value: string): void {
  if (!value || !navigator.clipboard) return;
  void navigator.clipboard.writeText(value).catch(() => {
    /* presse-papiers indisponible */
  });
}

function LeadDetail({
  lead,
  onClose,
}: {
  lead: Lead;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const dataEntries = Object.entries(lead.data || {}).filter(
    ([key]) => !['name', 'surname', 'email', 'phone'].includes(key),
  );

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                {typeLabel(lead.type)}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusClass(lead.status)}`}>
                {statusLabel(lead.status)}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mt-2">
              {lead.contact.name || 'Demande sans nom'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(lead.createdAt)} · Page {pageLabel(lead.pagePath)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Contact</h4>
            <div className="space-y-2 text-sm">
              {lead.contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href={`mailto:${lead.contact.email}`} className="text-blue-600 hover:underline break-all">
                    {lead.contact.email}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyText(lead.contact.email || '')}
                    className="p-1 text-gray-400 hover:text-gray-700"
                    title="Copier l'email"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {lead.contact.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href={`tel:${lead.contact.phone}`} className="text-blue-600 hover:underline">
                    {lead.contact.phone}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyText(lead.contact.phone || '')}
                    className="p-1 text-gray-400 hover:text-gray-700"
                    title="Copier le téléphone"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {!lead.contact.email && !lead.contact.phone && (
                <p className="text-gray-500">Aucun contact renseigné.</p>
              )}
            </div>
          </section>

          <section>
            <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
              Contenu de la demande
            </h4>
            {dataEntries.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dataEntries.map(([key, value]) => (
                  <div key={key} className={key === 'message' || key === 'project' || key === 'availability' ? 'sm:col-span-2' : ''}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      {FIELD_LABELS[key] || key}
                    </p>
                    <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap break-words">
                      {displayValue(value)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucun détail supplémentaire.</p>
            )}
          </section>

          {lead.emailError && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              <p className="font-semibold">Erreur EmailJS</p>
              <p className="mt-1 break-words">{lead.emailError}</p>
            </div>
          )}

          {lead.source && (
            <p className="text-xs text-gray-400">Source : {lead.source}</p>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-black transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [days, setDays] = useState('90');
  const [type, setType] = useState<'all' | LeadType>('all');
  const [status, setStatus] = useState<'all' | LeadStatus>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
          "L'API des demandes n'est pas disponible. Déployez les Cloud Functions ou configurez VITE_LEADS_URL.",
        );
      }
      const result = (await response.json()) as { leads?: Lead[] };
      if (requestId !== requestRef.current) return;
      setLeads(Array.isArray(result.leads) ? result.leads : []);
    } catch (loadError) {
      if (requestId !== requestRef.current) return;
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les demandes.');
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(
    () => ({
      total: leads.length,
      new: leads.filter((lead) => lead.status === 'new').length,
      sent: leads.filter((lead) => lead.status === 'email_sent').length,
      failed: leads.filter((lead) => lead.status === 'email_error').length,
    }),
    [leads],
  );

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (type !== 'all' && lead.type !== type) return false;
      if (status !== 'all' && lead.status !== status) return false;
      if (query && !leadSearchText(lead).includes(query)) return false;
      return true;
    });
  }, [leads, type, status, search]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-600" />
            Demandes reçues
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Toutes les demandes sont enregistrées avant l'envoi de l'email. Vous les retrouvez ici même si
            EmailJS échoue.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={days}
            onChange={(event) => setDays(event.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white"
            title="Période"
          >
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
            <option value="365">12 derniers mois</option>
            <option value="all">Tout l'historique</option>
          </select>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, className: 'text-gray-900' },
          { label: 'Nouvelles', value: stats.new, className: 'text-amber-600' },
          { label: 'Emails envoyés', value: stats.sent, className: 'text-emerald-600' },
          { label: 'Échecs email', value: stats.failed, className: 'text-red-600' },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className={`mt-2 text-2xl font-bold ${item.className}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un nom, un email, un téléphone, un message…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <select
          value={type}
          onChange={(event) => setType(event.target.value as 'all' | LeadType)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white"
          title="Type de demande"
        >
          <option value="all">Tous les types</option>
          <option value="estimation">Estimations</option>
          <option value="vendre">Ventes</option>
          <option value="contact">Contacts</option>
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as 'all' | LeadStatus)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white"
          title="Statut email"
        >
          <option value="all">Tous les statuts</option>
          <option value="new">Nouvelles</option>
          <option value="email_sent">Email envoyé</option>
          <option value="email_error">Échec email</option>
        </select>
      </div>

      {loading && !leads.length ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <Loader2 className="w-6 h-6 text-gray-400 mx-auto animate-spin" />
          <p className="text-sm text-gray-500 mt-3">Chargement des demandes…</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900">Demandes indisponibles</h3>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900">Aucune demande</h3>
          <p className="text-sm text-gray-500 mt-1">
            {leads.length
              ? 'Aucune demande ne correspond aux filtres.'
              : 'Les demandes apparaîtront ici dès qu’un visiteur remplira un formulaire.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-[10px] uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Nom</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Téléphone</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold text-right">Détail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatDate(lead.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                      {typeLabel(lead.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium max-w-[180px] truncate">
                    {lead.contact.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[220px] truncate">
                    {lead.contact.email ? (
                      <a href={`mailto:${lead.contact.email}`} className="hover:text-blue-600 hover:underline">
                        {lead.contact.email}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {lead.contact.phone ? (
                      <a href={`tel:${lead.contact.phone}`} className="hover:text-blue-600 hover:underline">
                        {lead.contact.phone}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusClass(lead.status)}`}>
                      {statusLabel(lead.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(lead)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      Voir <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <LeadDetail lead={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
