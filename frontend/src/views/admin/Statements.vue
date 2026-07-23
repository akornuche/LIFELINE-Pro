<template>
  <div class="page-container">
    <div class="page-header flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="page-title">Financial Statements</h1>
        <p class="text-gray-600">Monthly breakdown of all completed transactions between patients and providers</p>
      </div>
      <button @click="printAll" class="btn btn-secondary flex items-center gap-2">
        <PrinterIcon class="h-4 w-4" />
        Print / PDF
      </button>
    </div>

    <!-- Global filters -->
    <div class="card mb-6">
      <div class="card-body">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="form-group sm:col-span-2">
            <label class="form-label text-xs">Search (patient name, email, LifeLine ID, reference)</label>
            <input
              v-model="filters.search"
              type="text"
              class="input"
              placeholder="Search..."
              @input="debouncedLoad"
            />
          </div>
          <div class="form-group">
            <label class="form-label text-xs">Provider type</label>
            <select v-model="filters.providerType" class="input" @change="loadTransactions">
              <option value="">All providers</option>
              <option value="doctor">Doctor</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="hospital">Hospital</option>
            </select>
          </div>
          <div class="form-group flex items-end">
            <button @click="resetFilters" class="btn btn-secondary w-full">Reset</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center py-16">
      <div class="spinner spinner-lg mb-4"></div>
      <p class="text-gray-500">Loading transactions...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="months.length === 0" class="card p-12 text-center text-gray-500">
      No completed transactions found.
    </div>

    <!-- Monthly accordion tabs (printable area) -->
    <div v-else id="print-area">
      <div
        v-for="(bucket, idx) in months"
        :key="bucket.monthKey"
        class="card mb-4 overflow-hidden"
      >
        <!-- Month header / toggle button -->
        <button
          type="button"
          class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
          @click="toggleMonth(bucket.monthKey)"
        >
          <div class="flex items-center gap-4">
            <ChevronDownIcon
              :class="['h-5 w-5 text-gray-400 transition-transform', openMonths.has(bucket.monthKey) ? 'rotate-180' : '']"
            />
            <span class="font-semibold text-gray-900 text-lg">{{ bucket.label }}</span>
            <span class="badge badge-primary">{{ bucket.totals.count }} transaction{{ bucket.totals.count !== 1 ? 's' : '' }}</span>
          </div>
          <span class="font-bold text-green-700 text-lg">₦{{ fmt(bucket.totals.total) }}</span>
        </button>

        <!-- Month body -->
        <div v-show="openMonths.has(bucket.monthKey)">
          <!-- Per-month print/export button -->
          <div class="px-6 pb-3 flex items-center justify-between border-b border-gray-100">
            <p class="text-xs text-gray-500">Showing all {{ bucket.transactions.length }} records for {{ bucket.label }}</p>
            <button @click="printMonth(bucket)" class="btn btn-sm btn-secondary flex items-center gap-1">
              <PrinterIcon class="h-3.5 w-3.5" />
              Print month
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th class="px-4 py-3 text-left">Date</th>
                  <th class="px-4 py-3 text-left">Reference</th>
                  <th class="px-4 py-3 text-left">Patient</th>
                  <th class="px-4 py-3 text-left">Provider</th>
                  <th class="px-4 py-3 text-left">Type</th>
                  <th class="px-4 py-3 text-right">Amount (₦)</th>
                  <th class="px-4 py-3 text-left">Method</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="tx in bucket.transactions" :key="tx.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3 whitespace-nowrap text-gray-700">{{ fmtDate(tx.created_at) }}</td>
                  <td class="px-4 py-3 font-mono text-xs text-gray-600">{{ tx.payment_reference || '—' }}</td>
                  <td class="px-4 py-3">
                    <p class="font-medium text-gray-900">{{ tx.patient_first_name }} {{ tx.patient_last_name }}</p>
                    <p class="text-xs text-gray-400">{{ tx.patient_lifeline_id }}</p>
                  </td>
                  <td class="px-4 py-3">
                    <p class="text-gray-800">{{ tx.provider_name || '—' }}</p>
                    <p class="text-xs text-gray-400 capitalize">{{ tx.provider_type || '' }}</p>
                  </td>
                  <td class="px-4 py-3 capitalize text-gray-700">{{ (tx.payment_type || '').replace(/_/g, ' ') }}</td>
                  <td class="px-4 py-3 text-right font-semibold text-gray-900">{{ fmt(tx.amount) }}</td>
                  <td class="px-4 py-3 text-gray-600 capitalize">{{ tx.payment_method || '—' }}</td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50 font-semibold text-gray-900">
                <tr>
                  <td colspan="5" class="px-4 py-3 text-right">Month Total</td>
                  <td class="px-4 py-3 text-right text-green-700">₦{{ fmt(bucket.totals.total) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { format } from 'date-fns';
import apiClient from '@/services/api';
import { useToast } from '@/composables/useToast';
import { PrinterIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';

const { error: showError } = useToast();

const loading = ref(true);
const months = ref([]);            // [ { year, month, label, monthKey, transactions, totals } ]
const openMonths = ref(new Set()); // which month accordions are expanded
const filters = ref({ search: '', providerType: '' });
let debounceTimer = null;

const debouncedLoad = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadTransactions, 400);
};

const loadTransactions = async () => {
  loading.value = true;
  try {
    const params = {};
    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.providerType) params.providerType = filters.value.providerType;
    const response = await apiClient.get('/admin/transactions', { params });
    const data = response.data || response;
    months.value = data.months || [];

    // Auto-open the current month (first bucket, since ordered newest first)
    openMonths.value = new Set();
    if (months.value.length > 0) {
      openMonths.value.add(months.value[0].monthKey);
    }
  } catch (err) {
    showError('Failed to load transactions');
  } finally {
    loading.value = false;
  }
};

const toggleMonth = (key) => {
  if (openMonths.value.has(key)) {
    openMonths.value.delete(key);
  } else {
    openMonths.value.add(key);
  }
  // Trigger Vue reactivity on the Set
  openMonths.value = new Set(openMonths.value);
};

const resetFilters = () => {
  filters.value = { search: '', providerType: '' };
  loadTransactions();
};

// ── Formatting ──────────────────────────────────────────────────────────────

const fmt = (n) => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(Number(n) || 0);

const fmtDate = (d) => {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return d; }
};

// ── Print helpers ────────────────────────────────────────────────────────────

function buildPrintHtml(title, buckets) {
  const rows = buckets.flatMap(b =>
    b.transactions.map(tx => `
      <tr>
        <td>${fmtDate(tx.created_at)}</td>
        <td style="font-family:monospace;font-size:11px">${tx.payment_reference || '—'}</td>
        <td>${tx.patient_first_name || ''} ${tx.patient_last_name || ''}<br>
            <span style="color:#888;font-size:11px">${tx.patient_lifeline_id || ''}</span></td>
        <td>${tx.provider_name || '—'}<br>
            <span style="color:#888;font-size:11px;text-transform:capitalize">${tx.provider_type || ''}</span></td>
        <td style="text-transform:capitalize">${(tx.payment_type || '').replace(/_/g, ' ')}</td>
        <td style="text-align:right">₦${fmt(tx.amount)}</td>
        <td style="text-transform:capitalize">${tx.payment_method || '—'}</td>
      </tr>
    `)
  );
  const grandTotal = buckets.reduce((s, b) => s + b.totals.total, 0);
  return `
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; }
      h1   { font-size: 18px; margin-bottom: 4px; }
      p    { color: #555; margin: 0 0 12px; }
      table{ width: 100%; border-collapse: collapse; }
      th   { background: #f3f4f6; text-align: left; padding: 6px 8px; font-size: 11px; text-transform: uppercase; }
      td   { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
      tfoot td { font-weight: bold; background: #f9fafb; }
      @media print { button { display: none; } }
    </style></head>
    <body>
      <h1>LifeLine Pro — ${title}</h1>
      <p>Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}</p>
      <table>
        <thead><tr>
          <th>Date</th><th>Reference</th><th>Patient</th>
          <th>Provider</th><th>Type</th><th>Amount (₦)</th><th>Method</th>
        </tr></thead>
        <tbody>${rows.join('')}</tbody>
        <tfoot><tr>
          <td colspan="5" style="text-align:right">Grand Total</td>
          <td>₦${fmt(grandTotal)}</td><td></td>
        </tr></tfoot>
      </table>
    </body></html>
  `;
}

const printMonth = (bucket) => {
  const w = window.open('', '_blank');
  w.document.write(buildPrintHtml(`Financial Statement — ${bucket.label}`, [bucket]));
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
};

const printAll = () => {
  if (months.value.length === 0) return;
  const w = window.open('', '_blank');
  w.document.write(buildPrintHtml('All Financial Statements', months.value));
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
};

onMounted(loadTransactions);
</script>
