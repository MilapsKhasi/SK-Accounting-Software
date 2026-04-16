import { state } from './state';

export function renderGSTSummary(container) {
  const { company } = state;
  const sales = company.modules.sales.filter(s => s.status !== 'Canceled');
  const purchases = company.modules.purchase.filter(p => p.status !== 'Canceled');

  const salesGST = sales.reduce((sum, s) => sum + (s.gstAmount || 0), 0);
  const purchaseGST = purchases.reduce((sum, p) => sum + (p.gstAmount || 0), 0);
  const netPayable = salesGST - purchaseGST;

  container.innerHTML = `
    <div class="p-8 space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-gray-900 tracking-tight">GST Summary</h1>
        <p class="text-gray-500 mt-1">Overview of your GST liability and Input Tax Credit</p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p class="text-sm font-medium text-gray-500">Output GST (Sales)</p>
          <p class="text-2xl font-bold mt-1 text-red-600">₹${salesGST.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p class="text-sm font-medium text-gray-500">Input GST (Purchase)</p>
          <p class="text-2xl font-bold mt-1 text-green-600">₹${purchaseGST.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p class="text-sm font-medium text-gray-500">Net GST Payable</p>
          <p class="text-2xl font-bold mt-1 ${netPayable >= 0 ? 'text-indigo-600' : 'text-green-600'}">
            ₹${Math.abs(netPayable).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            <span class="text-xs font-normal text-gray-400 ml-1">${netPayable >= 0 ? '(Payable)' : '(Credit)'}</span>
          </p>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-gray-100">
          <h3 class="font-bold text-gray-900">GST Breakdown by Rate</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50 border-b border-gray-100">
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">GST Rate</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Taxable Value</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">CGST</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">SGST</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Total GST</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              ${[5, 12, 18, 28].map(rate => {
                const rateSales = sales.filter(s => s.gstPercent === rate);
                const taxableValue = rateSales.reduce((sum, s) => sum + (s.discountedAmount || 0), 0);
                const totalGST = rateSales.reduce((sum, s) => sum + (s.gstAmount || 0), 0);
                
                if (taxableValue === 0) return '';

                return `
                  <tr>
                    <td class="px-6 py-4 text-sm font-bold text-gray-900">${rate}%</td>
                    <td class="px-6 py-4 text-sm text-gray-500 text-right">₹${taxableValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td class="px-6 py-4 text-sm text-gray-500 text-right">₹${(totalGST / 2).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td class="px-6 py-4 text-sm text-gray-500 text-right">₹${(totalGST / 2).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td class="px-6 py-4 text-sm font-bold text-gray-900 text-right">₹${totalGST.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  window.renderIcons();
}
