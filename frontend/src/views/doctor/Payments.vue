<template>
  <div class="page-container">
    <div class="page-header flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="page-title">My Earnings</h1>
        <p class="text-gray-600">Completed services and expected compensation per month</p>
      </div>
      <button @click="printAll" class="btn btn-secondary flex items-center gap-2">
        <PrinterIcon class="h-4 w-4" /> Print / PDF
      </button>
    </div>

    <!-- Summary totals -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div class="card p-4 text-center">
        <p class="text-2xl font-bold text-green-700">₦{{ fmt(grandTotal) }}</p>
        <p class="text-xs text-gray-500">Total Earned</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-2xl font-bold text-gray-900">{{ grandCount }}</p>
        <p class="text-xs text-gray-500">Services Completed</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-2xl font-bold text-primary-600">₦{{ fmt(currentMonthTotal) }}</p>
        <p class="text-xs text-gray-500">This Month</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-2xl font-bold text-gray-900">{{ months.length }}</p>
        <p class="text-xs text-gray-500">Active Months</p>
      </div>
    </div>

    <div v-if="loading" class="flex flex-col items-center py-16">
      <div class="spinner spinner-lg mb-4"></div>
      <p class="text-gray-500">Loading earnings...</p>
    </div>

    <div v-else-if="months.length === 0" class="card p-12 text-center text-gray-500">
      No completed services yet. Accepted service requests will appear here once completed.
    </div>

    <div v-else id="print-area">
      <div v-for="bucket in months" :key="bucket.monthKey" class="card mb-4 overflow-hidden">
        <!-- Month toggle header -->
        <button type="button"
          class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
          @click="toggle(bucket.monthKey)">
          <div class="flex items-center gap-4">
            <ChevronDownIcon :class="['h-5 w-5 text-gray-400 transition-transform', open.has(bucket.monthKey) ? 'rotate-180' : '']" />
            <span class="font-semibold text-gray-900 text-lg">{{ bucket.label }}</span>
            <span class="badge badge-primary">{{ bucket.totals.count }} service{{ bucket.totals.count !== 1 ? 's' : '' }}</span>
          </div>
          <span class="font-bold text-green-700 text-lg">₦{{ fmt(bucket.totals.total) }}</span>
        </button>

        <div v-show="open.has(bucket.monthKey)">
          <div class="px-6 pb-3 flex items-center justify-between border-b border-gray-100">
            <p class="text-xs text-gray-500">{{ bucket.services.length }} services in {{ bucket.label }}</p>
            <button @click="printMonth(bucket)" class="btn btn-sm btn-secondary flex items-center gap-1">
              <PrinterIcon class="h-3.5 w-3.5" /> Print month
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th class="px-4 py-3 text-left">Date</th>
                  <th class="px-4 py-3 text-left">Service</th>
                  <th class="px-4 py-3 text-left">Patient</th>
                  <th class="px-4 py-3 text-left">Reference</th>
                  <th class="px-4 py-3 text-right">Amount (₦)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="s in bucket.services" :key="s.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3 whitespace-nowrap text-gray-700">{{ fmtDate(s.created_at) }}</td>
                  <td class="px-4 py-3 capitalize text-gray-800">{{ (s.payment_type || '').replace(/_/g, ' ') }}</td>
                  <td class="px-4 py-3">
                    <p class="font-medium text-gray-900">{{ s.patient_first_name }} {{ s.patient_last_name }}</p>
                    <p class="text-xs text-gray-400">{{ s.patient_lifeline_id }}</p>
                  </td>
                  <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ s.payment_reference || '—' }}</td>
                  <td class="px-4 py-3 text-right font-semibold text-gray-900">{{ fmt(s.amount) }}</td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50 font-semibold">
                <tr>
                  <td colspan="4" class="px-4 py-3 text-right text-gray-700">Month Total</td>
                  <td class="px-4 py-3 text-right text-green-700">₦{{ fmt(bucket.totals.total) }}</td>
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
import { ref, computed, onMounted } from 'vue';
import { format } from 'date-fns';
import apiClient from '@/services/api';
import { useToast } from '@/composables/useToast';
import { PrinterIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';

const { error: showError } = useToast();
const loading = ref(true);
const months  = ref([]);
const open    = ref(new Set());

const grandTotal        = computed(() => months.value.reduce((s, b) => s + b.totals.total, 0));
const grandCount        = computed(() => months.value.reduce((s, b) => s + b.totals.count, 0));
const currentMonthTotal = computed(() => months.value[0]?.totals.total ?? 0);

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const res  = await apiClient.get('/payments/provider/monthly');
    const data = res.data || res;
    months.value = data.months || [];
    if (months.value.length) open.value = new Set([months.value[0].monthKey]);
  } catch { showError('Failed to load earnings'); }
  finally { loading.value = false; }
}

function toggle(key) {
  const s = new Set(open.value);
  s.has(key) ? s.delete(key) : s.add(key);
  open.value = s;
}

const fmt     = n => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(Number(n) || 0);
const fmtDate = d => { try { return format(new Date(d), 'dd MMM yyyy'); } catch { return d || '—'; } };

function printHtml(title, buckets) {
  const rows = buckets.flatMap(b => b.services.map(s => `
    <tr>
      <td>${fmtDate(s.created_at)}</td>
      <td style="text-transform:capitalize">${(s.payment_type||'').replace(/_/g,' ')}</td>
      <td>${s.patient_first_name||''} ${s.patient_last_name||''}<br>
          <small style="color:#888">${s.patient_lifeline_id||''}</small></td>
      <td style="font-family:monospace;font-size:11px">${s.payment_reference||'—'}</td>
      <td style="text-align:right">₦${fmt(s.amount)}</td>
    </tr>`));
  const total = buckets.reduce((s,b) => s + b.totals.total, 0);
  return `<html><head><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px}h1{font-size:18px}
    table{width:100%;border-collapse:collapse}th{background:#f3f4f6;text-align:left;padding:6px 8px;font-size:11px;text-transform:uppercase}
    td{padding:5px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top}tfoot td{font-weight:bold;background:#f9fafb}
    @media print{button{display:none}}</style></head><body>
    <h1>LifeLine Pro — ${title}</h1>
    <p>Generated: ${format(new Date(),'dd MMM yyyy HH:mm')}</p>
    <table><thead><tr><th>Date</th><th>Service</th><th>Patient</th><th>Reference</th><th>Amount (₦)</th></tr></thead>
    <tbody>${rows.join('')}</tbody>
    <tfoot><tr><td colspan="4" style="text-align:right">Grand Total</td><td>₦${fmt(total)}</td></tr></tfoot>
    </table></body></html>`;
}

const printMonth = b  => { const w = window.open('','_blank'); w.document.write(printHtml(`Earnings — ${b.label}`,[b])); w.document.close(); w.focus(); setTimeout(()=>w.print(),400); };
const printAll   = () => { if(!months.value.length) return; const w=window.open('','_blank'); w.document.write(printHtml('All Earnings',months.value)); w.document.close(); w.focus(); setTimeout(()=>w.print(),400); };
</script>
