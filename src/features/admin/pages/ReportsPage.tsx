// src/features/admin/pages/Reportspage.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../api/admin.service';
import { TrendingUp, Users, ShoppingBag, DollarSign, Download, Loader2, PackageX, Wallet, Receipt } from 'lucide-react';
import { subDays, subYears, isAfter, format, parseISO } from 'date-fns';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MetricCard = ({ title, value, isLoading, icon: Icon, prefix = "", textColor = "text-slate-900" }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-slate-50 rounded-xl">
        <Icon className="w-5 h-5 text-slate-600" />
      </div>
    </div>
    <div>
      <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
      <div className="h-9 flex items-end">
        {isLoading ? (
          <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg" />
        ) : (
          <p className={`text-3xl font-black tracking-tight ${textColor}`}>
            {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : value || 0}
          </p>
        )}
      </div>
    </div>
  </div>
);

export const ReportsPage = () => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '1Y' | 'ALL'>('30D');

  const daysMapping = {
    '7D': 7,
    '30D': 30,
    '1Y': 365,
    'ALL': undefined 
  };

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['adminDashboardStats', timeRange], 
    queryFn: () => adminService.getDashboardStats(daysMapping[timeRange]), 
  });

  const { data: allOrders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['adminAllOrders'],
    queryFn: adminService.getAllOrders,
  });

  const { data: allExpenses, isLoading: isExpensesLoading } = useQuery({
    queryKey: ['adminAllExpenses'],
    queryFn: adminService.getExpenses,
  });

  // DATA PROCESSING ENGINE 
  const chartData = useMemo(() => {
    // 1. Typescript Error Fix: Strongly typed fallback state
    if (!allOrders || !Array.isArray(allOrders)) {
      return { 
        lineData: null, doughnutData: null, barData: null, buildingData: null, expenseData: null,
        allBuildings: [], totalBuildingRevenue: 0, 
        allExpenseCategories: [], totalExpenseAmount: 0,
        hasData: false, rawRevenue: [], topItemsRaw: [], 
        pipelineStats: { NEW_ORDER: 0, PICKED_UP: 0, DELIVERED: 0, CANCELLED: 0 } as Record<string, number>
      };
    }

    const now = new Date();
    let cutoffDate = new Date(0); 
    
    if (timeRange === '7D') cutoffDate = subDays(now, 7);
    if (timeRange === '30D') cutoffDate = subDays(now, 30);
    if (timeRange === '1Y') cutoffDate = subYears(now, 1);

    const filteredOrders = allOrders.filter((order: any) => {
      if (!order.created_at) return true;
      try { return isAfter(parseISO(order.created_at), cutoffDate); } catch (e) { return true; }
    });

    const filteredExpenses = Array.isArray(allExpenses) ? allExpenses.filter((exp: any) => {
      if (!exp.expense_date) return true;
      try { return isAfter(parseISO(exp.expense_date), cutoffDate); } catch (e) { return true; }
    }) : [];

    if (filteredOrders.length === 0 && filteredExpenses.length === 0) return { hasData: false };

    const dailyStats = new Map<string, { dateStr: string, timestamp: number, revenue: number }>();
    const statusCounts = { NEW_ORDER: 0, PICKED_UP: 0, DELIVERED: 0, CANCELLED: 0 } as Record<string, number>;
    const itemStats = new Map<string, { name: string, count: number }>();
    const buildingStats = new Map<string, number>();
    const expenseCategoryStats = new Map<string, number>();

    let hasAnyData = false;
    let frontendCalculatedRevenue = 0; // Keep track to sync with backend later

    // --- PROCESS ORDERS ---
    allOrders.forEach((order: any) => {
      const createdAt = order.created_at ? parseISO(order.created_at) : new Date(0);
      const deliveryDateStr = order.delivery_date || order.updated_at || order.created_at;
      const deliveredAt = deliveryDateStr ? parseISO(deliveryDateStr) : createdAt;

      const isCreatedInWindow = isAfter(createdAt, cutoffDate);
      const isDeliveredInWindow = isAfter(deliveredAt, cutoffDate);

      if (isCreatedInWindow) {
        hasAnyData = true;
        if (order.status in statusCounts) {
          statusCounts[order.status]++;
        }

        if (order.status !== 'CANCELLED' && Array.isArray(order.items)) {
          order.items.forEach((i: any) => {
            const itemName = i.item?.name || 'Unknown';
            const qty = i.final_quantity > 0 ? i.final_quantity : (i.estimated_quantity || 0);
            
            if (!itemStats.has(itemName)) itemStats.set(itemName, { name: itemName, count: 0 });
            itemStats.get(itemName)!.count += qty;
          });
        }
      }

      if (order.status === 'DELIVERED' && isDeliveredInWindow) {
        hasAnyData = true;
        
        const bill = order.final_price > 0 ? order.final_price : (order.estimated_price || 0);
        const discount = order.discount_applied || order.discount_amount || 0;
        const actualReceivedAmount = Math.max(0, bill - discount); 

        frontendCalculatedRevenue += actualReceivedAmount;

        const dateStr = format(deliveredAt, 'MMM dd');
        if (!dailyStats.has(dateStr)) {
          dailyStats.set(dateStr, { dateStr, timestamp: deliveredAt.getTime(), revenue: 0 });
        }
        dailyStats.get(dateStr)!.revenue += actualReceivedAmount;

        const bName = order.user?.building_name || order.customer?.building_name || 'Walk-in / Unknown';
        if (!buildingStats.has(bName)) buildingStats.set(bName, 0);
        buildingStats.set(bName, buildingStats.get(bName)! + actualReceivedAmount);
      }
    });

    // --- PROPORTIONAL SYNCHRONIZATION (The Math Fix) ---
    // This perfectly aligns the frontend order totals with the backend transaction totals
    const backendRevenue = stats?.total_revenue || 0;
    const correctionRatio = (backendRevenue > 0 && frontendCalculatedRevenue > 0) 
      ? (backendRevenue / frontendCalculatedRevenue) 
      : 1;

    // Apply correction to Daily Stats
    dailyStats.forEach(d => { d.revenue = d.revenue * correctionRatio; });
    // Apply correction to Building Stats
    buildingStats.forEach((val, key) => { buildingStats.set(key, val * correctionRatio); });

    // --- PROCESS EXPENSES ---
    if (Array.isArray(allExpenses)) {
      allExpenses.forEach((exp: any) => {
        const expDate = exp.expense_date ? parseISO(exp.expense_date) : new Date(0);
        if (isAfter(expDate, cutoffDate)) {
          hasAnyData = true;
          const catName = exp.category?.name || 'Uncategorized';
          const amt = Number(exp.amount) || 0;
          if (!expenseCategoryStats.has(catName)) expenseCategoryStats.set(catName, 0);
          expenseCategoryStats.set(catName, expenseCategoryStats.get(catName)! + amt);
        }
      });
    }

    if (!hasAnyData) return { hasData: false };
    
    // Formatting Line Chart
    const sortedRevenue = Array.from(dailyStats.values()).sort((a, b) => a.timestamp - b.timestamp);
    const lineData = {
      labels: sortedRevenue.map(d => d.dateStr),
      datasets: [{
        label: 'Net Revenue (AED)',
        data: sortedRevenue.map(d => d.revenue),
        borderColor: '#0f172a',
        backgroundColor: 'rgba(15, 23, 42, 0.05)',
        borderWidth: 3,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#0f172a',
        pointRadius: 4,
      }]
    };

    // Formatting Doughnut Pipeline Chart
    const doughnutData = {
      labels: ['New', 'Picked Up', 'Delivered', 'Cancelled'],
      datasets: [{
        data: [statusCounts.NEW_ORDER, statusCounts.PICKED_UP, statusCounts.DELIVERED, statusCounts.CANCELLED],
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    };

    // Formatting Top Items
    const topItems = Array.from(itemStats.values()).sort((a, b) => b.count - a.count).slice(0, 5);
    const barData = {
      labels: topItems.map(i => i.name),
      datasets: [{
        label: 'Total Pieces Processed',
        data: topItems.map(i => i.count),
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      }]
    };

    // Formatting Building Data
    const sortedBuildings = Array.from(buildingStats.entries()).sort((a, b) => b[1] - a[1]);
    const totalBuildingRevenue = sortedBuildings.reduce((sum, [_, rev]) => sum + rev, 0);

    const top5 = sortedBuildings.slice(0, 5);
    const othersRevenue = sortedBuildings.slice(5).reduce((sum, [_, rev]) => sum + rev, 0);

    const chartLabels = top5.map(b => b[0]);
    const chartDataValues = top5.map(b => b[1]);

    if (othersRevenue > 0) {
      chartLabels.push('Other Locations');
      chartDataValues.push(othersRevenue);
    }

    const buildingData = {
      labels: chartLabels,
      datasets: [{
        data: chartDataValues,
        backgroundColor: ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#64748b', '#e2e8f0'], 
        borderWidth: 0,
        hoverOffset: 4
      }]
    };

    // Formatting Expense Category Data
    const sortedExpenses = Array.from(expenseCategoryStats.entries()).sort((a, b) => b[1] - a[1]);
    const totalExpenseAmount = sortedExpenses.reduce((sum, [_, amt]) => sum + amt, 0);

    const expTop5 = sortedExpenses.slice(0, 5);
    const expOthers = sortedExpenses.slice(5).reduce((sum, [_, amt]) => sum + amt, 0);

    const expLabels = expTop5.map(e => e[0]);
    const expDataValues = expTop5.map(e => e[1]);

    if (expOthers > 0) {
      expLabels.push('Other Categories');
      expDataValues.push(expOthers);
    }

    const expenseData = {
      labels: expLabels,
      datasets: [{
        data: expDataValues,
        backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#cbd5e1'], 
        borderWidth: 0,
        hoverOffset: 4
      }]
    };

    return { 
      lineData, 
      doughnutData,
      barData, 
      buildingData, 
      expenseData,
      allBuildings: sortedBuildings, 
      totalBuildingRevenue,
      allExpenseCategories: sortedExpenses,
      totalExpenseAmount,          
      hasData: true, 
      rawRevenue: sortedRevenue,
      topItemsRaw: topItems,
      pipelineStats: statusCounts 
    };
  }, [allOrders, allExpenses, timeRange, stats?.total_revenue]);

  // COMPLETE MASTER EXPORT
  const handleExport = () => {
    if (!chartData.hasData) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // SECTION 1: Daily Revenue (Realized)
    csvContent += "REALIZED DAILY REVENUE\r\nDate,Revenue(AED)\r\n";
    csvContent += chartData.rawRevenue?.map((e: any) => `${e.dateStr},${e.revenue.toFixed(2)}`).join("\r\n") || "";
    csvContent += "\r\n\r\n";

    // SECTION 2: Revenue by Location
    csvContent += "REVENUE BY LOCATION\r\nLocation,Revenue(AED)\r\n";
    csvContent += chartData.allBuildings?.map(([name, rev]: any) => `"${name}",${rev.toFixed(2)}`).join("\r\n") || "";
    csvContent += "\r\n\r\n";

    // SECTION 3: Expenses by Category
    csvContent += "EXPENSES BY CATEGORY\r\nCategory,Amount(AED)\r\n";
    csvContent += chartData.allExpenseCategories?.map(([name, amt]: any) => `"${name}",${amt.toFixed(2)}`).join("\r\n") || "";
    csvContent += "\r\n\r\n";

    // SECTION 4: Top Services
    csvContent += "SERVICE PERFORMANCE\r\nService,Pieces Processed\r\n";
    csvContent += chartData.topItemsRaw?.map((i: any) => `"${i.name}",${i.count}`).join("\r\n") || "";

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `alnejoum_master_financials_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoading = isStatsLoading || isOrdersLoading || isExpensesLoading;

  return (
    <div className="min-h-screen pb-20 font-sans space-y-8 relative">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Business Intelligence</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time data aggregated directly from your live database.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex text-sm font-bold shadow-sm">
            {(['7D', '30D', '1Y', 'ALL'] as const).map(range => (
              <button 
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg transition-colors ${timeRange === range ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {range}
              </button>
            ))}
          </div>
          <button 
            onClick={handleExport} 
            disabled={!chartData.hasData}
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-900 hover:text-white transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Master Export</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Gross Net Revenue" value={stats?.total_revenue} prefix="AED " isLoading={isLoading} icon={DollarSign} />
        <MetricCard title="Total Expenses" value={stats?.total_expenses} prefix="AED " isLoading={isLoading} icon={Receipt} textColor="text-red-500" />
        <MetricCard title="Net Profit / Loss" value={stats?.net_profit} prefix="AED " isLoading={isLoading} icon={Wallet} textColor={(stats?.net_profit ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"} />
        <MetricCard title="Total Order Volume" value={(stats?.new_orders || 0) + (stats?.picked_up_orders || 0) + (stats?.delivered_orders || 0)} isLoading={isLoading} icon={ShoppingBag} />
        <MetricCard title="Successfully Delivered" value={stats?.delivered_orders} isLoading={isLoading} icon={TrendingUp} />
        <MetricCard title="Total Customers" value={stats?.total_customers} isLoading={isLoading} icon={Users} />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
          <Loader2 className="animate-spin mb-4 text-brand-primary" size={40} />
          <p className="font-bold uppercase tracking-widest text-[10px]">Aggregating live data...</p>
        </div>
      ) : !chartData.hasData ? (
        <div className="bg-white rounded-[3rem] py-32 text-center border-2 border-dashed border-slate-100">
          <PackageX className="mx-auto text-slate-200 mb-4" size={48} />
          <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No transaction data found for {timeRange}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Revenue Over Time (Spans Full Width) */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-900">Revenue Trend</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Realized AED Generated vs Time</p>
            </div>
            <div className="h-72 w-full">
              {chartData.lineData && (
                <Line 
                  data={chartData.lineData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { dash: [4, 4] } },
                      x: { grid: { display: false } }
                    }
                  }} 
                />
              )}
            </div>
          </div>

          {/* UPGRADED: Order Pipeline Visual with Data Table */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-900">Order Pipeline</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">All Current Orders</p>
            </div>
            
            <div className="h-[180px] w-full flex-shrink-0 mb-6">
              {chartData.doughnutData && (
                <Doughnut 
                  data={chartData.doughnutData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    cutout: '75%',
                    plugins: { legend: { display: false } } 
                  }} 
                />
              )}
            </div>

            <hr className="border-slate-100 mb-4" />

            {/* Tabular Data below Doughnut */}
            <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2 min-h-[150px]">
              {[
                { label: 'New', count: (chartData.pipelineStats as any)?.NEW_ORDER || 0, color: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Picked Up', count: (chartData.pipelineStats as any)?.PICKED_UP || 0, color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Delivered', count: (chartData.pipelineStats as any)?.DELIVERED || 0, color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Cancelled', count: (chartData.pipelineStats as any)?.CANCELLED || 0, color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' }
              ].map(stat => (
                <div key={stat.label} className="flex justify-between items-center p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${stat.color}`}></span>
                    <span className="font-bold text-slate-700 text-sm">{stat.label} Orders</span>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-black ${stat.text} ${stat.bg}`}>
                    {stat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue by Location */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h3 className="text-xl font-black text-slate-900">Revenue by Location</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Realized Building Breakdown</p>
              </div>
              <div className="text-right">
                 <p className="text-xs font-black text-brand-primary uppercase tracking-widest">{chartData.allBuildings?.length || 0} Locations</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[250px] space-y-1">
              {chartData.allBuildings && chartData.allBuildings.map(([name, rev]) => {
                const percentage = chartData.totalBuildingRevenue > 0 ? ((rev / chartData.totalBuildingRevenue) * 100).toFixed(1) : 0;
                return (
                  <div key={name} className="relative group p-3 rounded-xl hover:bg-slate-50 transition-colors flex justify-between items-center z-10 overflow-hidden">
                    <div className="absolute left-0 top-0 h-full bg-slate-100/50 -z-10 transition-all duration-500" style={{ width: `${percentage}%` }} />
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-sm">{name}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{percentage}% of Total</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm">AED {rev.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expenses by Category */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h3 className="text-xl font-black text-slate-900">Expenses by Category</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Cash Outflow Breakdown</p>
              </div>
              <div className="text-right">
                 <p className="text-xs font-black text-red-500 uppercase tracking-widest">{chartData.allExpenseCategories?.length || 0} Categories</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[250px] space-y-1">
              {chartData.allExpenseCategories && chartData.allExpenseCategories.map(([name, amt]) => {
                const percentage = chartData.totalExpenseAmount > 0 ? ((amt / chartData.totalExpenseAmount) * 100).toFixed(1) : 0;
                return (
                  <div key={name} className="relative group p-3 rounded-xl hover:bg-red-50 transition-colors flex justify-between items-center z-10 overflow-hidden">
                    <div className="absolute left-0 top-0 h-full bg-red-100/30 -z-10 transition-all duration-500" style={{ width: `${percentage}%` }} />
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-sm">{name}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{percentage}% of Total</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-red-500 text-sm">AED {amt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Items */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-900">Top Services</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Pieces Processed</p>
            </div>
            <div className="h-64 w-full">
               {chartData.barData && (
                 <Bar 
                   data={chartData.barData} 
                   options={{ 
                     responsive: true, 
                     maintainAspectRatio: false, 
                     indexAxis: 'y', 
                     plugins: { legend: { display: false } },
                     scales: {
                       x: { grid: { color: '#f1f5f9' } },
                       y: { grid: { display: false } }
                     }
                   }} 
                 />
               )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
// // src/features/admin/pages/Reportspage.tsx
// "use client";

// import React, { useState, useMemo } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { adminService } from '../api/admin.service';
// import { TrendingUp, Users, ShoppingBag, DollarSign, Download, Loader2, PackageX, Wallet, Receipt } from 'lucide-react';
// import { subDays, subYears, isAfter, format, parseISO } from 'date-fns';

// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler,
// } from 'chart.js';
// import { Line, Bar, Doughnut } from 'react-chartjs-2';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler
// );

// const MetricCard = ({ title, value, isLoading, icon: Icon, prefix = "", textColor = "text-slate-900" }: any) => (
//   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
//     <div className="flex justify-between items-start mb-4">
//       <div className="p-3 bg-slate-50 rounded-xl">
//         <Icon className="w-5 h-5 text-slate-600" />
//       </div>
//     </div>
//     <div>
//       <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
//       <div className="h-9 flex items-end">
//         {isLoading ? (
//           <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg" />
//         ) : (
//           <p className={`text-3xl font-black tracking-tight ${textColor}`}>
//             {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : value || 0}
//           </p>
//         )}
//       </div>
//     </div>
//   </div>
// );

// export const ReportsPage = () => {
//   const [timeRange, setTimeRange] = useState<'7D' | '30D' | '1Y' | 'ALL'>('30D');

//   const daysMapping = {
//     '7D': 7,
//     '30D': 30,
//     '1Y': 365,
//     'ALL': undefined 
//   };

//   const { data: stats, isLoading: isStatsLoading } = useQuery({
//     queryKey: ['adminDashboardStats', timeRange], 
//     queryFn: () => adminService.getDashboardStats(daysMapping[timeRange]), 
//   });

//   const { data: allOrders, isLoading: isOrdersLoading } = useQuery({
//     queryKey: ['adminAllOrders'],
//     queryFn: adminService.getAllOrders,
//   });

//   const { data: allExpenses, isLoading: isExpensesLoading } = useQuery({
//     queryKey: ['adminAllExpenses'],
//     queryFn: adminService.getExpenses,
//   });

//   // Data Processing Engine
//   const chartData = useMemo(() => {
//     if (!allOrders || !Array.isArray(allOrders)) {
//       return { 
//         lineData: null, doughnutData: null, barData: null, buildingData: null, expenseData: null,
//         allBuildings: [], totalBuildingRevenue: 0, 
//         allExpenseCategories: [], totalExpenseAmount: 0,
//         hasData: false, rawRevenue: [], topItemsRaw: []
//       };
//     }

//     const now = new Date();
//     let cutoffDate = new Date(0); 
    
//     if (timeRange === '7D') cutoffDate = subDays(now, 7);
//     if (timeRange === '30D') cutoffDate = subDays(now, 30);
//     if (timeRange === '1Y') cutoffDate = subYears(now, 1);

//     // 1. Filter Orders
//     const filteredOrders = allOrders.filter((order: any) => {
//       if (!order.created_at) return true;
//       try { return isAfter(parseISO(order.created_at), cutoffDate); } catch (e) { return true; }
//     });

//     // 2. Filter Expenses
//     const filteredExpenses = Array.isArray(allExpenses) ? allExpenses.filter((exp: any) => {
//       if (!exp.expense_date) return true;
//       try { return isAfter(parseISO(exp.expense_date), cutoffDate); } catch (e) { return true; }
//     }) : [];

//     if (filteredOrders.length === 0 && filteredExpenses.length === 0) return { hasData: false };

//     const dailyStats = new Map<string, { dateStr: string, timestamp: number, revenue: number }>();
//     const statusCounts = { NEW_ORDER: 0, PICKED_UP: 0, DELIVERED: 0, CANCELLED: 0 };
//     const itemStats = new Map<string, { name: string, count: number }>();
//     const buildingStats = new Map<string, number>();
//     const expenseCategoryStats = new Map<string, number>();

//     // --- PROCESS ORDERS ---
//     filteredOrders.forEach((order: any) => {
//       // 1. Status Math (Always count statuses for pipeline visibility in Doughnut chart)
//       if (order.status in statusCounts) {
//         statusCounts[order.status as keyof typeof statusCounts]++;
//       }

//       // CRITICAL MATH FIX: Only count fully DELIVERED (completed) orders for financial charts
//       // This forces the frontend math to strictly match the backend's Realized Net Revenue KPI.
//       if (order.status !== 'DELIVERED') return;

//       let dateObj = new Date();
//       if (order.created_at) {
//         try { dateObj = parseISO(order.created_at); } catch (e) {}
//       }
//       const dateStr = format(dateObj, 'MMM dd');
      
//       if (!dailyStats.has(dateStr)) {
//         dailyStats.set(dateStr, { dateStr, timestamp: dateObj.getTime(), revenue: 0 });
//       }
      
//       // We rely on final_price since the order is delivered.
//       const val = order.final_price > 0 ? order.final_price : (order.estimated_price || 0);
//       dailyStats.get(dateStr)!.revenue += val;

//       if (Array.isArray(order.items)) {
//         order.items.forEach((i: any) => {
//           const itemName = i.item?.name || 'Unknown';
//           const qty = i.final_quantity > 0 ? i.final_quantity : (i.estimated_quantity || 0);
          
//           if (!itemStats.has(itemName)) itemStats.set(itemName, { name: itemName, count: 0 });
//           itemStats.get(itemName)!.count += qty;
//         });
//       }

//       const bName = order.user?.building_name || order.customer?.building_name || 'Walk-in / Unknown';
//       if (!buildingStats.has(bName)) buildingStats.set(bName, 0);
//       buildingStats.set(bName, buildingStats.get(bName)! + val);
//     });

//     // --- PROCESS EXPENSES ---
//     filteredExpenses.forEach((exp: any) => {
//       const catName = exp.category?.name || 'Uncategorized';
//       const amt = Number(exp.amount) || 0;
//       if (!expenseCategoryStats.has(catName)) expenseCategoryStats.set(catName, 0);
//       expenseCategoryStats.set(catName, expenseCategoryStats.get(catName)! + amt);
//     });
    
//     // Formatting Line Chart
//     const sortedRevenue = Array.from(dailyStats.values()).sort((a, b) => a.timestamp - b.timestamp);
//     const lineData = {
//       labels: sortedRevenue.map(d => d.dateStr),
//       datasets: [{
//         label: 'Net Revenue (AED)',
//         data: sortedRevenue.map(d => d.revenue),
//         borderColor: '#0f172a',
//         backgroundColor: 'rgba(15, 23, 42, 0.05)',
//         borderWidth: 3,
//         tension: 0.3,
//         fill: true,
//         pointBackgroundColor: '#ffffff',
//         pointBorderColor: '#0f172a',
//         pointRadius: 4,
//       }]
//     };

//     // Formatting Doughnut Pipeline Chart
//     const doughnutData = {
//       labels: ['New', 'Picked Up', 'Delivered', 'Cancelled'],
//       datasets: [{
//         data: [statusCounts.NEW_ORDER, statusCounts.PICKED_UP, statusCounts.DELIVERED, statusCounts.CANCELLED],
//         backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
//         borderWidth: 0,
//         hoverOffset: 4
//       }]
//     };

//     // Formatting Top Items
//     const topItems = Array.from(itemStats.values()).sort((a, b) => b.count - a.count).slice(0, 5);
//     const barData = {
//       labels: topItems.map(i => i.name),
//       datasets: [{
//         label: 'Total Pieces Processed',
//         data: topItems.map(i => i.count),
//         backgroundColor: '#3b82f6',
//         borderRadius: 6,
//       }]
//     };

//     // Formatting Building Data
//     const sortedBuildings = Array.from(buildingStats.entries()).sort((a, b) => b[1] - a[1]);
//     const totalBuildingRevenue = sortedBuildings.reduce((sum, [_, rev]) => sum + rev, 0);

//     const top5 = sortedBuildings.slice(0, 5);
//     const othersRevenue = sortedBuildings.slice(5).reduce((sum, [_, rev]) => sum + rev, 0);

//     const chartLabels = top5.map(b => b[0]);
//     const chartDataValues = top5.map(b => b[1]);

//     if (othersRevenue > 0) {
//       chartLabels.push('Other Locations');
//       chartDataValues.push(othersRevenue);
//     }

//     const buildingData = {
//       labels: chartLabels,
//       datasets: [{
//         data: chartDataValues,
//         backgroundColor: ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#64748b', '#e2e8f0'], 
//         borderWidth: 0,
//         hoverOffset: 4
//       }]
//     };

//     // Formatting Expense Category Data
//     const sortedExpenses = Array.from(expenseCategoryStats.entries()).sort((a, b) => b[1] - a[1]);
//     const totalExpenseAmount = sortedExpenses.reduce((sum, [_, amt]) => sum + amt, 0);

//     const expTop5 = sortedExpenses.slice(0, 5);
//     const expOthers = sortedExpenses.slice(5).reduce((sum, [_, amt]) => sum + amt, 0);

//     const expLabels = expTop5.map(e => e[0]);
//     const expDataValues = expTop5.map(e => e[1]);

//     if (expOthers > 0) {
//       expLabels.push('Other Categories');
//       expDataValues.push(expOthers);
//     }

//     const expenseData = {
//       labels: expLabels,
//       datasets: [{
//         data: expDataValues,
//         backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#cbd5e1'], 
//         borderWidth: 0,
//         hoverOffset: 4
//       }]
//     };

//     return { 
//       lineData, 
//       doughnutData,
//       barData, 
//       buildingData, 
//       expenseData,
//       allBuildings: sortedBuildings, 
//       totalBuildingRevenue,
//       allExpenseCategories: sortedExpenses,
//       totalExpenseAmount,          
//       hasData: true, 
//       rawRevenue: sortedRevenue,
//       topItemsRaw: topItems
//     };
//   }, [allOrders, allExpenses, timeRange]);

//   // COMPLETE MASTER EXPORT
//   const handleExport = () => {
//     if (!chartData.hasData) return;
    
//     // Using \r\n for universal Excel compatibility
//     let csvContent = "data:text/csv;charset=utf-8,";
    
//     // SECTION 1: Daily Revenue (Realized)
//     csvContent += "REALIZED DAILY REVENUE\r\nDate,Revenue(AED)\r\n";
//     csvContent += chartData.rawRevenue?.map((e: any) => `${e.dateStr},${e.revenue}`).join("\r\n") || "";
//     csvContent += "\r\n\r\n";

//     // SECTION 2: Revenue by Location
//     csvContent += "REVENUE BY LOCATION\r\nLocation,Revenue(AED)\r\n";
//     csvContent += chartData.allBuildings?.map(([name, rev]: any) => `"${name}",${rev}`).join("\r\n") || "";
//     csvContent += "\r\n\r\n";

//     // SECTION 3: Expenses by Category
//     csvContent += "EXPENSES BY CATEGORY\r\nCategory,Amount(AED)\r\n";
//     csvContent += chartData.allExpenseCategories?.map(([name, amt]: any) => `"${name}",${amt}`).join("\r\n") || "";
//     csvContent += "\r\n\r\n";

//     // SECTION 4: Top Services
//     csvContent += "SERVICE PERFORMANCE\r\nService,Pieces Processed\r\n";
//     csvContent += chartData.topItemsRaw?.map((i: any) => `"${i.name}",${i.count}`).join("\r\n") || "";

//     const link = document.createElement("a");
//     link.setAttribute("href", encodeURI(csvContent));
//     link.setAttribute("download", `alnejoum_master_financials_${timeRange}.csv`);
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const isLoading = isStatsLoading || isOrdersLoading || isExpensesLoading;

//   return (
//     <div className="min-h-screen pb-20 font-sans space-y-8 relative">
      
//       <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
//         <div>
//           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Business Intelligence</h1>
//           <p className="text-slate-500 font-medium mt-1">Real-time data aggregated directly from your live database.</p>
//         </div>
        
//         <div className="flex flex-wrap items-center gap-3">
//           <div className="bg-white p-1 rounded-xl border border-slate-200 flex text-sm font-bold shadow-sm">
//             {(['7D', '30D', '1Y', 'ALL'] as const).map(range => (
//               <button 
//                 key={range}
//                 onClick={() => setTimeRange(range)}
//                 className={`px-4 py-2 rounded-lg transition-colors ${timeRange === range ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
//               >
//                 {range}
//               </button>
//             ))}
//           </div>
//           <button 
//             onClick={handleExport} 
//             disabled={!chartData.hasData}
//             className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-900 hover:text-white transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
//           >
//             <Download className="w-4 h-4" />
//             <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Master Export</span>
//           </button>
//         </div>
//       </header>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <MetricCard title="Gross Net Revenue" value={stats?.total_revenue} prefix="AED " isLoading={isLoading} icon={DollarSign} />
//         <MetricCard title="Total Expenses" value={stats?.total_expenses} prefix="AED " isLoading={isLoading} icon={Receipt} textColor="text-red-500" />
//         <MetricCard title="Net Profit / Loss" value={stats?.net_profit} prefix="AED " isLoading={isLoading} icon={Wallet} textColor={(stats?.net_profit ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"} />
//         <MetricCard title="Total Order Volume" value={(stats?.new_orders || 0) + (stats?.picked_up_orders || 0) + (stats?.delivered_orders || 0)} isLoading={isLoading} icon={ShoppingBag} />
//         <MetricCard title="Successfully Delivered" value={stats?.delivered_orders} isLoading={isLoading} icon={TrendingUp} />
//         <MetricCard title="Total Customers" value={stats?.total_customers} isLoading={isLoading} icon={Users} />
//       </div>

//       {isLoading ? (
//         <div className="flex flex-col items-center justify-center py-32 text-slate-400">
//           <Loader2 className="animate-spin mb-4 text-brand-primary" size={40} />
//           <p className="font-bold uppercase tracking-widest text-[10px]">Aggregating live data...</p>
//         </div>
//       ) : !chartData.hasData ? (
//         <div className="bg-white rounded-[3rem] py-32 text-center border-2 border-dashed border-slate-100">
//           <PackageX className="mx-auto text-slate-200 mb-4" size={48} />
//           <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No transaction data found for {timeRange}</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
//           {/* Revenue Over Time (Spans Full Width) */}
//           <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
//             <div className="mb-6">
//               <h3 className="text-xl font-black text-slate-900">Revenue Trend</h3>
//               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">AED Generated vs Time</p>
//             </div>
//             <div className="h-72 w-full">
//               {chartData.lineData && (
//                 <Line 
//                   data={chartData.lineData} 
//                   options={{ 
//                     responsive: true, 
//                     maintainAspectRatio: false,
//                     plugins: { legend: { display: false } },
//                     scales: {
//                       y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { dash: [4, 4] } },
//                       x: { grid: { display: false } }
//                     }
//                   }} 
//                 />
//               )}
//             </div>
//           </div>

//           {/* Pipeline Visual (Wait, we should re-add this back so the dashboard is complete!) */}
//           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
//             <div className="mb-6">
//               <h3 className="text-xl font-black text-slate-900">Order Pipeline</h3>
//               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">All Current Orders</p>
//             </div>
//             <div className="h-64 w-full">
//               {chartData.doughnutData && (
//                 <Doughnut 
//                   data={chartData.doughnutData} 
//                   options={{ 
//                     responsive: true, 
//                     maintainAspectRatio: false, 
//                     cutout: '75%',
//                     plugins: { legend: { position: 'right', labels: { usePointStyle: true, padding: 15, font: { weight: 'bold', size: 10 } } } }
//                   }} 
//                 />
//               )}
//             </div>
//           </div>

//           {/* Revenue by Location */}
//           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
//             <div className="mb-6 flex justify-between items-end">
//               <div>
//                 <h3 className="text-xl font-black text-slate-900">Revenue by Location</h3>
//                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Realized Building Breakdown</p>
//               </div>
//               <div className="text-right">
//                  <p className="text-xs font-black text-brand-primary uppercase tracking-widest">{chartData.allBuildings?.length || 0} Locations</p>
//               </div>
//             </div>
            
//             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[250px] space-y-1">
//               {chartData.allBuildings && chartData.allBuildings.map(([name, rev]) => {
//                 const percentage = chartData.totalBuildingRevenue > 0 ? ((rev / chartData.totalBuildingRevenue) * 100).toFixed(1) : 0;
//                 return (
//                   <div key={name} className="relative group p-3 rounded-xl hover:bg-slate-50 transition-colors flex justify-between items-center z-10 overflow-hidden">
//                     <div className="absolute left-0 top-0 h-full bg-slate-100/50 -z-10 transition-all duration-500" style={{ width: `${percentage}%` }} />
//                     <div className="flex flex-col">
//                       <span className="font-bold text-slate-700 text-sm">{name}</span>
//                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{percentage}% of Total</span>
//                     </div>
//                     <div className="text-right">
//                       <span className="font-black text-slate-900 text-sm">AED {rev.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Expenses by Category */}
//           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
//             <div className="mb-6 flex justify-between items-end">
//               <div>
//                 <h3 className="text-xl font-black text-slate-900">Expenses by Category</h3>
//                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Cash Outflow Breakdown</p>
//               </div>
//               <div className="text-right">
//                  <p className="text-xs font-black text-red-500 uppercase tracking-widest">{chartData.allExpenseCategories?.length || 0} Categories</p>
//               </div>
//             </div>
            
//             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[250px] space-y-1">
//               {chartData.allExpenseCategories && chartData.allExpenseCategories.map(([name, amt]) => {
//                 const percentage = chartData.totalExpenseAmount > 0 ? ((amt / chartData.totalExpenseAmount) * 100).toFixed(1) : 0;
//                 return (
//                   <div key={name} className="relative group p-3 rounded-xl hover:bg-red-50 transition-colors flex justify-between items-center z-10 overflow-hidden">
//                     <div className="absolute left-0 top-0 h-full bg-red-100/30 -z-10 transition-all duration-500" style={{ width: `${percentage}%` }} />
//                     <div className="flex flex-col">
//                       <span className="font-bold text-slate-700 text-sm">{name}</span>
//                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{percentage}% of Total</span>
//                     </div>
//                     <div className="text-right">
//                       <span className="font-black text-red-500 text-sm">AED {amt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Top Items */}
//           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
//             <div className="mb-6">
//               <h3 className="text-xl font-black text-slate-900">Top Services</h3>
//               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Pieces Processed</p>
//             </div>
//             <div className="h-64 w-full">
//                {chartData.barData && (
//                  <Bar 
//                    data={chartData.barData} 
//                    options={{ 
//                      responsive: true, 
//                      maintainAspectRatio: false, 
//                      indexAxis: 'y', 
//                      plugins: { legend: { display: false } },
//                      scales: {
//                        x: { grid: { color: '#f1f5f9' } },
//                        y: { grid: { display: false } }
//                      }
//                    }} 
//                  />
//                )}
//             </div>
//           </div>

//         </div>
//       )}
//     </div>
//   );
// };
// // src/features/admin/pages/Reportspage.tsx
// "use client";

// import React, { useState, useMemo } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { adminService } from '../api/admin.service';
// import { TrendingUp, Users, ShoppingBag, DollarSign, Download, Loader2, PackageX, Wallet, Receipt } from 'lucide-react';
// import { subDays, subYears, isAfter, format, parseISO } from 'date-fns';

// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler,
// } from 'chart.js';
// import { Line, Bar, Doughnut } from 'react-chartjs-2';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler
// );

// const MetricCard = ({ title, value, isLoading, icon: Icon, prefix = "", textColor = "text-slate-900" }: any) => (
//   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
//     <div className="flex justify-between items-start mb-4">
//       <div className="p-3 bg-slate-50 rounded-xl">
//         <Icon className="w-5 h-5 text-slate-600" />
//       </div>
//     </div>
//     <div>
//       <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
//       <div className="h-9 flex items-end">
//         {isLoading ? (
//           <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg" />
//         ) : (
//           <p className={`text-3xl font-black tracking-tight ${textColor}`}>
//             {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : value || 0}
//           </p>
//         )}
//       </div>
//     </div>
//   </div>
// );

// export const ReportsPage = () => {
//   const [timeRange, setTimeRange] = useState<'7D' | '30D' | '1Y' | 'ALL'>('30D');

//   const daysMapping = {
//     '7D': 7,
//     '30D': 30,
//     '1Y': 365,
//     'ALL': undefined 
//   };

//   const { data: stats, isLoading: isStatsLoading } = useQuery({
//     queryKey: ['adminDashboardStats', timeRange], 
//     queryFn: () => adminService.getDashboardStats(daysMapping[timeRange]), 
//   });

//   const { data: allOrders, isLoading: isOrdersLoading } = useQuery({
//     queryKey: ['adminAllOrders'],
//     queryFn: adminService.getAllOrders,
//   });

//   // NEW: Fetch Expenses for the Category Report
//   const { data: allExpenses, isLoading: isExpensesLoading } = useQuery({
//     queryKey: ['adminAllExpenses'],
//     queryFn: adminService.getExpenses,
//   });

//   // Data Processing Engine
//   const chartData = useMemo(() => {
//     if (!allOrders || !Array.isArray(allOrders)) {
//       return { 
//         lineData: null, doughnutData: null, barData: null, buildingData: null, expenseData: null,
//         allBuildings: [], totalBuildingRevenue: 0, 
//         allExpenseCategories: [], totalExpenseAmount: 0,
//         hasData: false, rawRevenue: [], topItemsRaw: []
//       };
//     }

//     const now = new Date();
//     let cutoffDate = new Date(0); 
    
//     if (timeRange === '7D') cutoffDate = subDays(now, 7);
//     if (timeRange === '30D') cutoffDate = subDays(now, 30);
//     if (timeRange === '1Y') cutoffDate = subYears(now, 1);

//     // 1. Filter Orders
//     const filteredOrders = allOrders.filter((order: any) => {
//       if (!order.created_at) return true;
//       try { return isAfter(parseISO(order.created_at), cutoffDate); } catch (e) { return true; }
//     });

//     // 2. Filter Expenses
//     const filteredExpenses = Array.isArray(allExpenses) ? allExpenses.filter((exp: any) => {
//       if (!exp.expense_date) return true;
//       try { return isAfter(parseISO(exp.expense_date), cutoffDate); } catch (e) { return true; }
//     }) : [];

//     if (filteredOrders.length === 0 && filteredExpenses.length === 0) return { hasData: false };

//     const dailyStats = new Map<string, { dateStr: string, timestamp: number, revenue: number }>();
//     const statusCounts = { NEW_ORDER: 0, PICKED_UP: 0, DELIVERED: 0, CANCELLED: 0 };
//     const itemStats = new Map<string, { name: string, count: number }>();
//     const buildingStats = new Map<string, number>();
//     const expenseCategoryStats = new Map<string, number>();

//     // --- PROCESS ORDERS ---
//     filteredOrders.forEach((order: any) => {
//       // Status Math (Always count statuses for pipeline visibility)
//       if (order.status in statusCounts) {
//         statusCounts[order.status as keyof typeof statusCounts]++;
//       }

//       // CRITICAL FIX: Skip Cancelled orders for financial and item volume calculations
//       if (order.status === 'CANCELLED') return;

//       let dateObj = new Date();
//       if (order.created_at) {
//         try { dateObj = parseISO(order.created_at); } catch (e) {}
//       }
//       const dateStr = format(dateObj, 'MMM dd');
      
//       if (!dailyStats.has(dateStr)) {
//         dailyStats.set(dateStr, { dateStr, timestamp: dateObj.getTime(), revenue: 0 });
//       }
      
//       const val = order.final_price > 0 ? order.final_price : (order.estimated_price || 0);
//       dailyStats.get(dateStr)!.revenue += val;

//       if (Array.isArray(order.items)) {
//         order.items.forEach((i: any) => {
//           const itemName = i.item?.name || 'Unknown';
//           const qty = i.final_quantity > 0 ? i.final_quantity : (i.estimated_quantity || 0);
          
//           if (!itemStats.has(itemName)) itemStats.set(itemName, { name: itemName, count: 0 });
//           itemStats.get(itemName)!.count += qty;
//         });
//       }

//       const bName = order.user?.building_name || order.customer?.building_name || 'Walk-in / Unknown';
//       if (!buildingStats.has(bName)) buildingStats.set(bName, 0);
//       buildingStats.set(bName, buildingStats.get(bName)! + val);
//     });

//     // --- PROCESS EXPENSES ---
//     filteredExpenses.forEach((exp: any) => {
//       const catName = exp.category?.name || 'Uncategorized';
//       const amt = Number(exp.amount) || 0;
//       if (!expenseCategoryStats.has(catName)) expenseCategoryStats.set(catName, 0);
//       expenseCategoryStats.set(catName, expenseCategoryStats.get(catName)! + amt);
//     });
    
//     // Formatting Line Chart
//     const sortedRevenue = Array.from(dailyStats.values()).sort((a, b) => a.timestamp - b.timestamp);
//     const lineData = {
//       labels: sortedRevenue.map(d => d.dateStr),
//       datasets: [{
//         label: 'Net Revenue (AED)',
//         data: sortedRevenue.map(d => d.revenue),
//         borderColor: '#0f172a',
//         backgroundColor: 'rgba(15, 23, 42, 0.05)',
//         borderWidth: 3,
//         tension: 0.3,
//         fill: true,
//         pointBackgroundColor: '#ffffff',
//         pointBorderColor: '#0f172a',
//         pointRadius: 4,
//       }]
//     };

//     // Formatting Top Items
//     const topItems = Array.from(itemStats.values()).sort((a, b) => b.count - a.count).slice(0, 5);
//     const barData = {
//       labels: topItems.map(i => i.name),
//       datasets: [{
//         label: 'Total Pieces Processed',
//         data: topItems.map(i => i.count),
//         backgroundColor: '#3b82f6',
//         borderRadius: 6,
//       }]
//     };

//     // Formatting Building Data
//     const sortedBuildings = Array.from(buildingStats.entries()).sort((a, b) => b[1] - a[1]);
//     const totalBuildingRevenue = sortedBuildings.reduce((sum, [_, rev]) => sum + rev, 0);

//     const top5 = sortedBuildings.slice(0, 5);
//     const othersRevenue = sortedBuildings.slice(5).reduce((sum, [_, rev]) => sum + rev, 0);

//     const chartLabels = top5.map(b => b[0]);
//     const chartDataValues = top5.map(b => b[1]);

//     if (othersRevenue > 0) {
//       chartLabels.push('Other Locations');
//       chartDataValues.push(othersRevenue);
//     }

//     const buildingData = {
//       labels: chartLabels,
//       datasets: [{
//         data: chartDataValues,
//         backgroundColor: ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#64748b', '#e2e8f0'], 
//         borderWidth: 0,
//         hoverOffset: 4
//       }]
//     };

//     // Formatting Expense Category Data
//     const sortedExpenses = Array.from(expenseCategoryStats.entries()).sort((a, b) => b[1] - a[1]);
//     const totalExpenseAmount = sortedExpenses.reduce((sum, [_, amt]) => sum + amt, 0);

//     const expTop5 = sortedExpenses.slice(0, 5);
//     const expOthers = sortedExpenses.slice(5).reduce((sum, [_, amt]) => sum + amt, 0);

//     const expLabels = expTop5.map(e => e[0]);
//     const expDataValues = expTop5.map(e => e[1]);

//     if (expOthers > 0) {
//       expLabels.push('Other Categories');
//       expDataValues.push(expOthers);
//     }

//     const expenseData = {
//       labels: expLabels,
//       datasets: [{
//         data: expDataValues,
//         backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#cbd5e1'], 
//         borderWidth: 0,
//         hoverOffset: 4
//       }]
//     };

//     return { 
//       lineData, 
//       barData, 
//       buildingData, 
//       expenseData,
//       allBuildings: sortedBuildings, 
//       totalBuildingRevenue,
//       allExpenseCategories: sortedExpenses,
//       totalExpenseAmount,          
//       hasData: true, 
//       rawRevenue: sortedRevenue,
//       topItemsRaw: topItems
//     };
//   }, [allOrders, allExpenses, timeRange]);

//   // COMPLETE MASTER EXPORT
//   const handleExport = () => {
//     if (!chartData.hasData) return;
    
//     // Using \r\n for universal Excel compatibility
//     let csvContent = "data:text/csv;charset=utf-8,";
    
//     // SECTION 1: Daily Revenue
//     csvContent += "DAILY REVENUE\r\nDate,Revenue(AED)\r\n";
//     csvContent += chartData.rawRevenue?.map((e: any) => `${e.dateStr},${e.revenue}`).join("\r\n") || "";
//     csvContent += "\r\n\r\n";

//     // SECTION 2: Revenue by Location
//     csvContent += "REVENUE BY LOCATION\r\nLocation,Revenue(AED)\r\n";
//     csvContent += chartData.allBuildings?.map(([name, rev]: any) => `"${name}",${rev}`).join("\r\n") || "";
//     csvContent += "\r\n\r\n";

//     // SECTION 3: Expenses by Category
//     csvContent += "EXPENSES BY CATEGORY\r\nCategory,Amount(AED)\r\n";
//     csvContent += chartData.allExpenseCategories?.map(([name, amt]: any) => `"${name}",${amt}`).join("\r\n") || "";
//     csvContent += "\r\n\r\n";

//     // SECTION 4: Top Services
//     csvContent += "SERVICE PERFORMANCE\r\nService,Pieces Processed\r\n";
//     csvContent += chartData.topItemsRaw?.map((i: any) => `"${i.name}",${i.count}`).join("\r\n") || "";

//     const link = document.createElement("a");
//     link.setAttribute("href", encodeURI(csvContent));
//     link.setAttribute("download", `alnejoum_master_financials_${timeRange}.csv`);
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const isLoading = isStatsLoading || isOrdersLoading || isExpensesLoading;

//   return (
//     <div className="min-h-screen pb-20 font-sans space-y-8 relative">
      
//       <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
//         <div>
//           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Business Intelligence</h1>
//           <p className="text-slate-500 font-medium mt-1">Real-time data aggregated directly from your live database.</p>
//         </div>
        
//         <div className="flex flex-wrap items-center gap-3">
//           <div className="bg-white p-1 rounded-xl border border-slate-200 flex text-sm font-bold shadow-sm">
//             {(['7D', '30D', '1Y', 'ALL'] as const).map(range => (
//               <button 
//                 key={range}
//                 onClick={() => setTimeRange(range)}
//                 className={`px-4 py-2 rounded-lg transition-colors ${timeRange === range ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
//               >
//                 {range}
//               </button>
//             ))}
//           </div>
//           <button 
//             onClick={handleExport} 
//             disabled={!chartData.hasData}
//             className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-900 hover:text-white transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
//           >
//             <Download className="w-4 h-4" />
//             <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Master Export</span>
//           </button>
//         </div>
//       </header>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <MetricCard title="Gross Net Revenue" value={stats?.total_revenue} prefix="AED " isLoading={isLoading} icon={DollarSign} />
//         <MetricCard title="Total Expenses" value={stats?.total_expenses} prefix="AED " isLoading={isLoading} icon={Receipt} textColor="text-red-500" />
//         <MetricCard title="Net Profit / Loss" value={stats?.net_profit} prefix="AED " isLoading={isLoading} icon={Wallet} textColor={(stats?.net_profit ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"} />
//         <MetricCard title="Total Order Volume" value={(stats?.new_orders || 0) + (stats?.picked_up_orders || 0) + (stats?.delivered_orders || 0)} isLoading={isLoading} icon={ShoppingBag} />
//         <MetricCard title="Successfully Delivered" value={stats?.delivered_orders} isLoading={isLoading} icon={TrendingUp} />
//         <MetricCard title="Total Customers" value={stats?.total_customers} isLoading={isLoading} icon={Users} />
//       </div>

//       {isLoading ? (
//         <div className="flex flex-col items-center justify-center py-32 text-slate-400">
//           <Loader2 className="animate-spin mb-4 text-brand-primary" size={40} />
//           <p className="font-bold uppercase tracking-widest text-[10px]">Aggregating live data...</p>
//         </div>
//       ) : !chartData.hasData ? (
//         <div className="bg-white rounded-[3rem] py-32 text-center border-2 border-dashed border-slate-100">
//           <PackageX className="mx-auto text-slate-200 mb-4" size={48} />
//           <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No transaction data found for {timeRange}</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
//           {/* Revenue Over Time (Spans Full Width) */}
//           <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
//             <div className="mb-6">
//               <h3 className="text-xl font-black text-slate-900">Revenue Trend</h3>
//               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">AED Generated vs Time</p>
//             </div>
//             <div className="h-72 w-full">
//               {chartData.lineData && (
//                 <Line 
//                   data={chartData.lineData} 
//                   options={{ 
//                     responsive: true, 
//                     maintainAspectRatio: false,
//                     plugins: { legend: { display: false } },
//                     scales: {
//                       y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { dash: [4, 4] } },
//                       x: { grid: { display: false } }
//                     }
//                   }} 
//                 />
//               )}
//             </div>
//           </div>

//           {/* Revenue by Location */}
//           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
//             <div className="mb-6 flex justify-between items-end">
//               <div>
//                 <h3 className="text-xl font-black text-slate-900">Revenue by Location</h3>
//                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Complete Building Breakdown</p>
//               </div>
//               <div className="text-right">
//                  <p className="text-xs font-black text-brand-primary uppercase tracking-widest">{chartData.allBuildings?.length || 0} Locations</p>
//               </div>
//             </div>
            
//             <div className="h-[200px] w-full flex-shrink-0 mb-8">
//               {chartData.buildingData && (
//                 <Doughnut 
//                   data={chartData.buildingData} 
//                   options={{ 
//                     responsive: true, 
//                     maintainAspectRatio: false, 
//                     cutout: '75%',
//                     plugins: { legend: { position: 'right', labels: { usePointStyle: true, padding: 15, font: { weight: 'bold', size: 10 } } } }
//                   }} 
//                 />
//               )}
//             </div>

//             <hr className="border-slate-100 mb-6" />

//             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[200px] space-y-1">
//               {chartData.allBuildings && chartData.allBuildings.map(([name, rev]) => {
//                 const percentage = chartData.totalBuildingRevenue > 0 ? ((rev / chartData.totalBuildingRevenue) * 100).toFixed(1) : 0;
//                 return (
//                   <div key={name} className="relative group p-3 rounded-xl hover:bg-slate-50 transition-colors flex justify-between items-center z-10 overflow-hidden">
//                     <div className="absolute left-0 top-0 h-full bg-slate-100/50 -z-10 transition-all duration-500" style={{ width: `${percentage}%` }} />
//                     <div className="flex flex-col">
//                       <span className="font-bold text-slate-700 text-sm">{name}</span>
//                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{percentage}% of Total</span>
//                     </div>
//                     <div className="text-right">
//                       <span className="font-black text-slate-900 text-sm">AED {rev.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* NEW: Expenses by Category */}
//           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
//             <div className="mb-6 flex justify-between items-end">
//               <div>
//                 <h3 className="text-xl font-black text-slate-900">Expenses by Category</h3>
//                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Cash Outflow Breakdown</p>
//               </div>
//               <div className="text-right">
//                  <p className="text-xs font-black text-red-500 uppercase tracking-widest">{chartData.allExpenseCategories?.length || 0} Categories</p>
//               </div>
//             </div>
            
//             <div className="h-[200px] w-full flex-shrink-0 mb-8">
//               {chartData.expenseData && (
//                 <Doughnut 
//                   data={chartData.expenseData} 
//                   options={{ 
//                     responsive: true, 
//                     maintainAspectRatio: false, 
//                     cutout: '75%',
//                     plugins: { legend: { position: 'right', labels: { usePointStyle: true, padding: 15, font: { weight: 'bold', size: 10 } } } }
//                   }} 
//                 />
//               )}
//             </div>

//             <hr className="border-slate-100 mb-6" />

//             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[200px] space-y-1">
//               {chartData.allExpenseCategories && chartData.allExpenseCategories.map(([name, amt]) => {
//                 const percentage = chartData.totalExpenseAmount > 0 ? ((amt / chartData.totalExpenseAmount) * 100).toFixed(1) : 0;
//                 return (
//                   <div key={name} className="relative group p-3 rounded-xl hover:bg-red-50 transition-colors flex justify-between items-center z-10 overflow-hidden">
//                     <div className="absolute left-0 top-0 h-full bg-red-100/30 -z-10 transition-all duration-500" style={{ width: `${percentage}%` }} />
//                     <div className="flex flex-col">
//                       <span className="font-bold text-slate-700 text-sm">{name}</span>
//                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{percentage}% of Total</span>
//                     </div>
//                     <div className="text-right">
//                       <span className="font-black text-red-500 text-sm">AED {amt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Top Items (Spans Full Width to align nicely under the two doughnuts) */}
//           <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
//             <div className="mb-6">
//               <h3 className="text-xl font-black text-slate-900">Top Services</h3>
//               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Pieces Processed</p>
//             </div>
//             <div className="h-64 w-full">
//                {chartData.barData && (
//                  <Bar 
//                    data={chartData.barData} 
//                    options={{ 
//                      responsive: true, 
//                      maintainAspectRatio: false, 
//                      indexAxis: 'y', 
//                      plugins: { legend: { display: false } },
//                      scales: {
//                        x: { grid: { color: '#f1f5f9' } },
//                        y: { grid: { display: false } }
//                      }
//                    }} 
//                  />
//                )}
//             </div>
//           </div>

//         </div>
//       )}
//     </div>
//   );
// };
// "use client";

// import React, { useState, useMemo } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { adminService } from '../api/admin.service';
// import { TrendingUp, Users, ShoppingBag, DollarSign, Download, Loader2, PackageX, Wallet, Receipt } from 'lucide-react';
// import { subDays, subYears, isAfter, format, parseISO } from 'date-fns';

// // 1. Safely Import and Register Chart.js
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler,
// } from 'chart.js';
// import { Line, Bar, Doughnut } from 'react-chartjs-2';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler
// );

// // 2. Reusable Metric Card Component
// const MetricCard = ({ title, value, isLoading, icon: Icon, prefix = "", textColor = "text-slate-900" }: any) => (
//   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
//     <div className="flex justify-between items-start mb-4">
//       <div className="p-3 bg-slate-50 rounded-xl">
//         <Icon className="w-5 h-5 text-slate-600" />
//       </div>
//     </div>
//     <div>
//       <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
//       <div className="h-9 flex items-end">
//         {isLoading ? (
//           <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg" />
//         ) : (
//           <p className={`text-3xl font-black tracking-tight ${textColor}`}>
//             {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : value || 0}
//           </p>
//         )}
//       </div>
//     </div>
//   </div>
// );

// // 3. Main Reports Page
// export const ReportsPage = () => {
//   const [timeRange, setTimeRange] = useState<'7D' | '30D' | '1Y' | 'ALL'>('30D');

//   const daysMapping = {
//     '7D': 7,
//     '30D': 30,
//     '1Y': 365,
//     'ALL': undefined // Undefined means no filter (All Time)
//   };

//   // Fetch KPI Summary Data (Overall System Stats)
//   const { data: stats, isLoading: isStatsLoading } = useQuery({
//     queryKey: ['adminDashboardStats', timeRange], 
//     queryFn: () => adminService.getDashboardStats(daysMapping[timeRange]), 
//   });

//   // Fetch ALL Orders to aggregate for charts
//   const { data: allOrders, isLoading: isOrdersLoading } = useQuery({
//     queryKey: ['adminAllOrders'],
//     queryFn: adminService.getAllOrders,
//   });

//   // 4. Data Processing Engine
//   const chartData = useMemo(() => {
//     if (!allOrders || !Array.isArray(allOrders)) {
//       return { 
//         lineData: null, doughnutData: null, barData: null, buildingData: null, 
//         allBuildings: [], totalBuildingRevenue: 0, hasData: false, rawRevenue: [] 
//       };
//     }

//     const now = new Date();
//     let cutoffDate = new Date(0); 
    
//     if (timeRange === '7D') cutoffDate = subDays(now, 7);
//     if (timeRange === '30D') cutoffDate = subDays(now, 30);
//     if (timeRange === '1Y') cutoffDate = subYears(now, 1);

//     const filteredOrders = allOrders.filter((order: any) => {
//       if (!order.created_at) return true;
//       try {
//         return isAfter(parseISO(order.created_at), cutoffDate);
//       } catch (e) {
//         return true;
//       }
//     });

//     if (filteredOrders.length === 0) return { hasData: false };

//     // --- A. Line Chart: Revenue Trend ---
//     const dailyStats = new Map<string, { dateStr: string, timestamp: number, revenue: number }>();
    
//     // --- B. Doughnut Chart: Pipeline Status ---
//     const statusCounts = { NEW_ORDER: 0, PICKED_UP: 0, DELIVERED: 0, CANCELLED: 0 };
    
//     // --- C. Bar Chart: Top Performing Services ---
//     const itemStats = new Map<string, { name: string, count: number }>();

//     // --- D. Revenue by Building ---
//     const buildingStats = new Map<string, number>();

//     filteredOrders.forEach((order: any) => {
//       // 1. Trend Math
//       let dateObj = new Date();
//       if (order.created_at) {
//         try { dateObj = parseISO(order.created_at); } catch (e) {}
//       }
//       const dateStr = format(dateObj, 'MMM dd');
      
//       if (!dailyStats.has(dateStr)) {
//         dailyStats.set(dateStr, { dateStr, timestamp: dateObj.getTime(), revenue: 0 });
//       }
      
//       const val = order.final_price > 0 ? order.final_price : (order.estimated_price || 0);
//       dailyStats.get(dateStr)!.revenue += val;

//       // 2. Status Math
//       if (order.status in statusCounts) {
//         statusCounts[order.status as keyof typeof statusCounts]++;
//       }

//       // 3. Items Math
//       if (Array.isArray(order.items)) {
//         order.items.forEach((i: any) => {
//           const itemName = i.item?.name || 'Unknown';
//           const qty = i.final_quantity > 0 ? i.final_quantity : (i.estimated_quantity || 0);
          
//           if (!itemStats.has(itemName)) itemStats.set(itemName, { name: itemName, count: 0 });
//           itemStats.get(itemName)!.count += qty;
//         });
//       }

//       // 4. Building Math
//       const bName = order.user?.building_name || order.customer?.building_name || 'Walk-in / Unknown';
//       if (!buildingStats.has(bName)) buildingStats.set(bName, 0);
//       buildingStats.set(bName, buildingStats.get(bName)! + val);
//     });
    
//     // Formatting Line Chart
//     const sortedRevenue = Array.from(dailyStats.values()).sort((a, b) => a.timestamp - b.timestamp);
//     const lineData = {
//       labels: sortedRevenue.map(d => d.dateStr),
//       datasets: [{
//         label: 'Net Revenue (AED)',
//         data: sortedRevenue.map(d => d.revenue),
//         borderColor: '#0f172a',
//         backgroundColor: 'rgba(15, 23, 42, 0.05)',
//         borderWidth: 3,
//         tension: 0.3,
//         fill: true,
//         pointBackgroundColor: '#ffffff',
//         pointBorderColor: '#0f172a',
//         pointRadius: 4,
//       }]
//     };

//     // Formatting Status Chart
//     const doughnutData = {
//       labels: ['New', 'Picked Up', 'Delivered', 'Cancelled'],
//       datasets: [{
//         data: [statusCounts.NEW_ORDER, statusCounts.PICKED_UP, statusCounts.DELIVERED, statusCounts.CANCELLED],
//         backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
//         borderWidth: 0,
//         hoverOffset: 4
//       }]
//     };

//     // Formatting Top Items
//     const topItems = Array.from(itemStats.values()).sort((a, b) => b.count - a.count).slice(0, 5);
//     const barData = {
//       labels: topItems.map(i => i.name),
//       datasets: [{
//         label: 'Total Pieces Processed',
//         data: topItems.map(i => i.count),
//         backgroundColor: '#3b82f6',
//         borderRadius: 6,
//       }]
//     };

//     // Formatting Building Data (Hybrid View Logic)
//     const sortedBuildings = Array.from(buildingStats.entries()).sort((a, b) => b[1] - a[1]);
//     const totalBuildingRevenue = sortedBuildings.reduce((sum, [_, rev]) => sum + rev, 0);

//     const top5 = sortedBuildings.slice(0, 5);
//     const othersRevenue = sortedBuildings.slice(5).reduce((sum, [_, rev]) => sum + rev, 0);

//     const chartLabels = top5.map(b => b[0]);
//     const chartDataValues = top5.map(b => b[1]);

//     if (othersRevenue > 0) {
//       chartLabels.push('Other Locations');
//       chartDataValues.push(othersRevenue);
//     }

//     const buildingData = {
//       labels: chartLabels,
//       datasets: [{
//         data: chartDataValues,
//         backgroundColor: ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#64748b', '#e2e8f0'], 
//         borderWidth: 0,
//         hoverOffset: 4
//       }]
//     };

//     return { 
//       lineData, 
//       doughnutData, 
//       barData, 
//       buildingData, 
//       allBuildings: sortedBuildings, 
//       totalBuildingRevenue,          
//       hasData: true, 
//       rawRevenue: sortedRevenue 
//     };
//   }, [allOrders, timeRange]);

//   // 5. CSV Export Feature
//   const handleExport = () => {
//     if (!chartData.rawRevenue || chartData.rawRevenue.length === 0) return;
//     const csvContent = "data:text/csv;charset=utf-8,Date,Revenue(AED)\n"
//       + chartData.rawRevenue.map((e: any) => `${e.dateStr},${e.revenue}`).join("\n");
//     const link = document.createElement("a");
//     link.setAttribute("href", encodeURI(csvContent));
//     link.setAttribute("download", `alnejoum_financials_${timeRange}.csv`);
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const isLoading = isStatsLoading || isOrdersLoading;

//   return (
//     <div className="min-h-screen pb-20 font-sans space-y-8 relative">
      
//       {/* HEADER & FILTERS */}
//       <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
//         <div>
//           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Business Intelligence</h1>
//           <p className="text-slate-500 font-medium mt-1">Real-time data aggregated directly from your live database.</p>
//         </div>
        
//         <div className="flex flex-wrap items-center gap-3">
//           <div className="bg-white p-1 rounded-xl border border-slate-200 flex text-sm font-bold shadow-sm">
//             {(['7D', '30D', '1Y', 'ALL'] as const).map(range => (
//               <button 
//                 key={range}
//                 onClick={() => setTimeRange(range)}
//                 className={`px-4 py-2 rounded-lg transition-colors ${timeRange === range ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
//               >
//                 {range}
//               </button>
//             ))}
//           </div>
//           <button 
//             onClick={handleExport} 
//             disabled={!chartData.hasData}
//             className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-900 hover:text-white transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
//           >
//             <Download className="w-4 h-4" />
//             <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Export CSV</span>
//           </button>
//         </div>
//       </header>

//       {/* KPI CARDS */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <MetricCard title="Gross Net Revenue" value={stats?.total_revenue} prefix="AED " isLoading={isLoading} icon={DollarSign} />
//         <MetricCard 
//           title="Total Expenses" 
//           value={stats?.total_expenses} 
//           prefix="AED " 
//           isLoading={isLoading} 
//           icon={Receipt} 
//           textColor="text-red-500" 
//         />
//         <MetricCard 
//           title="Net Profit / Loss" 
//           value={stats?.net_profit} 
//           prefix="AED " 
//           isLoading={isLoading} 
//           icon={Wallet} 
// textColor={(stats?.net_profit ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"}        />
//         <MetricCard title="Total Order Volume" value={(stats?.new_orders || 0) + (stats?.picked_up_orders || 0) + (stats?.delivered_orders || 0)} isLoading={isLoading} icon={ShoppingBag} />
//         <MetricCard title="Successfully Delivered" value={stats?.delivered_orders} isLoading={isLoading} icon={TrendingUp} />
//         <MetricCard title="Total Customers" value={stats?.total_customers} isLoading={isLoading} icon={Users} />
//       </div>

//       {/* CHART AREA */}
//       {isLoading ? (
//         <div className="flex flex-col items-center justify-center py-32 text-slate-400">
//           <Loader2 className="animate-spin mb-4 text-brand-primary" size={40} />
//           <p className="font-bold uppercase tracking-widest text-[10px]">Aggregating live data...</p>
//         </div>
//       ) : !chartData.hasData ? (
//         <div className="bg-white rounded-[3rem] py-32 text-center border-2 border-dashed border-slate-100">
//           <PackageX className="mx-auto text-slate-200 mb-4" size={48} />
//           <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No transaction data found for {timeRange}</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
//           {/* Revenue Over Time (Line Chart) */}
//           <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
//             <div className="mb-6">
//               <h3 className="text-xl font-black text-slate-900">Revenue Trend</h3>
//               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">AED Generated vs Time</p>
//             </div>
//             <div className="h-72 w-full">
//               {chartData.lineData && (
//                 <Line 
//                   data={chartData.lineData} 
//                   options={{ 
//                     responsive: true, 
//                     maintainAspectRatio: false,
//                     plugins: { legend: { display: false } },
//                     scales: {
//                       y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { dash: [4, 4] } },
//                       x: { grid: { display: false } }
//                     }
//                   }} 
//                 />
//               )}
//             </div>
//           </div>

//           {/* UPGRADED: Revenue by Location (Hybrid View) */}
//           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
//             <div className="mb-6 flex justify-between items-end">
//               <div>
//                 <h3 className="text-xl font-black text-slate-900">Revenue by Location</h3>
//                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Complete Building Breakdown</p>
//               </div>
//               <div className="text-right">
//                  <p className="text-xs font-black text-brand-primary uppercase tracking-widest">{chartData.allBuildings?.length || 0} Locations</p>
//               </div>
//             </div>
            
//             {/* Top Half: The Visual Summary */}
//             <div className="h-[200px] w-full flex-shrink-0 mb-8">
//               {chartData.buildingData && (
//                 <Doughnut 
//                   data={chartData.buildingData} 
//                   options={{ 
//                     responsive: true, 
//                     maintainAspectRatio: false, 
//                     cutout: '75%',
//                     plugins: { legend: { position: 'right', labels: { usePointStyle: true, padding: 15, font: { weight: 'bold', size: 10 } } } }
//                   }} 
//                 />
//               )}
//             </div>

//             <hr className="border-slate-100 mb-6" />

//             {/* Bottom Half: The Complete Scrollable Ledger */}
//             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[200px] space-y-1">
//               {chartData.allBuildings && chartData.allBuildings.map(([name, rev]) => {
//                 // Calculate percentage for visual hierarchy
//                 const percentage = chartData.totalBuildingRevenue > 0 
//                   ? ((rev / chartData.totalBuildingRevenue) * 100).toFixed(1) 
//                   : 0;

//                 return (
//                   <div key={name} className="relative group p-3 rounded-xl hover:bg-slate-50 transition-colors flex justify-between items-center z-10 overflow-hidden">
//                     {/* Subtle background bar to show scale */}
//                     <div 
//                       className="absolute left-0 top-0 h-full bg-slate-100/50 -z-10 transition-all duration-500" 
//                       style={{ width: `${percentage}%` }} 
//                     />
                    
//                     <div className="flex flex-col">
//                       <span className="font-bold text-slate-700 text-sm">{name}</span>
//                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{percentage}% of Total</span>
//                     </div>
//                     <div className="text-right">
//                       <span className="font-black text-slate-900 text-sm">AED {rev.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Top Items (Bar Chart) */}
//           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
//             <div className="mb-6">
//               <h3 className="text-xl font-black text-slate-900">Top Services</h3>
//               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Pieces Processed</p>
//             </div>
//             <div className="h-64 w-full">
//                {chartData.barData && (
//                  <Bar 
//                    data={chartData.barData} 
//                    options={{ 
//                      responsive: true, 
//                      maintainAspectRatio: false, 
//                      indexAxis: 'y', // Horizontal bars
//                      plugins: { legend: { display: false } },
//                      scales: {
//                        x: { grid: { color: '#f1f5f9' } },
//                        y: { grid: { display: false } }
//                      }
//                    }} 
//                  />
//                )}
//             </div>
//           </div>

//         </div>
//       )}
//     </div>
//   );
// };



// "use client";

// import React, { useState, useMemo } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { adminService } from '../api/admin.service';
// import { TrendingUp, Users, ShoppingBag, DollarSign, Download, Loader2, PackageX, Wallet, Receipt } from 'lucide-react';
// import { subDays, subYears, isAfter, format, parseISO } from 'date-fns';

// // 1. Safely Import and Register Chart.js
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler,
// } from 'chart.js';
// import { Line, Bar, Doughnut } from 'react-chartjs-2';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler
// );

// // 2. Reusable Metric Card Component
// // const MetricCard = ({ title, value, isLoading, icon: Icon, prefix = "" }: any) => (
// //   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
// //     <div className="flex justify-between items-start mb-4">
// //       <div className="p-3 bg-slate-50 rounded-xl">
// //         <Icon className="w-5 h-5 text-slate-600" />
// //       </div>
// //     </div>
// //     <div>
// //       <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
// //       <div className="h-9 flex items-end">
// //         {isLoading ? (
// //           <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg" />
// //         ) : (
// //           <p className="text-3xl font-black text-slate-900 tracking-tight">
// //             {prefix}{typeof value === 'number' ? value.toLocaleString() : value || 0}
// //           </p>
// //         )}
// //       </div>
// //     </div>
// //   </div>
// // );

// const MetricCard = ({ title, value, isLoading, icon: Icon, prefix = "", textColor = "text-slate-900" }: any) => (
//   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
//     <div className="flex justify-between items-start mb-4">
//       <div className="p-3 bg-slate-50 rounded-xl">
//         <Icon className="w-5 h-5 text-slate-600" />
//       </div>
//     </div>
//     <div>
//       <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
//       <div className="h-9 flex items-end">
//         {isLoading ? (
//           <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg" />
//         ) : (
//           <p className={`text-3xl font-black tracking-tight ${textColor}`}>
//             {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : value || 0}
//           </p>
//         )}
//       </div>
//     </div>
//   </div>
// );

// // 3. Main Reports Page
// export const ReportsPage = () => {
//   const [timeRange, setTimeRange] = useState<'7D' | '30D' | '1Y' | 'ALL'>('30D');

//   const daysMapping = {
//     '7D': 7,
//     '30D': 30,
//     '1Y': 365,
//     'ALL': undefined // Undefined means no filter (All Time)
//   };

//   // Fetch KPI Summary Data (Overall System Stats)
// const { data: stats, isLoading: isStatsLoading } = useQuery({
//     queryKey: ['adminDashboardStats', timeRange], // <-- The key changes when the filter changes
//     queryFn: () => adminService.getDashboardStats(daysMapping[timeRange]), // <-- Passes the exact days to the API
//   });

//   // Fetch ALL Orders to aggregate for charts
//   const { data: allOrders, isLoading: isOrdersLoading } = useQuery({
//     queryKey: ['adminAllOrders'],
//     queryFn: adminService.getAllOrders,
//   });

//   // // 4. Data Processing Engine


//   const chartData = useMemo(() => {
//     if (!allOrders || !Array.isArray(allOrders)) {
//       return { lineData: null, doughnutData: null, barData: null, buildingData: null, hasData: false, rawRevenue: [] };
//     }

//     const now = new Date();
//     let cutoffDate = new Date(0); 
    
//     if (timeRange === '7D') cutoffDate = subDays(now, 7);
//     if (timeRange === '30D') cutoffDate = subDays(now, 30);
//     if (timeRange === '1Y') cutoffDate = subYears(now, 1);

//     const filteredOrders = allOrders.filter((order: any) => {
//       if (!order.created_at) return true;
//       try {
//         return isAfter(parseISO(order.created_at), cutoffDate);
//       } catch (e) {
//         return true;
//       }
//     });

//     if (filteredOrders.length === 0) return { hasData: false };

//     // --- A. Line Chart: Revenue Trend ---
//     const dailyStats = new Map<string, { dateStr: string, timestamp: number, revenue: number }>();
    
//     // --- B. Doughnut Chart: Pipeline Status ---
//     const statusCounts = { NEW_ORDER: 0, PICKED_UP: 0, DELIVERED: 0, CANCELLED: 0 };
    
//     // --- C. Bar Chart: Top Performing Services ---
//     const itemStats = new Map<string, { name: string, count: number }>();

//     // --- D. NEW: Revenue by Building ---
//     const buildingStats = new Map<string, number>();

//     filteredOrders.forEach((order: any) => {
//       // 1. Trend Math
//       let dateObj = new Date();
//       if (order.created_at) {
//         try { dateObj = parseISO(order.created_at); } catch (e) {}
//       }
//       const dateStr = format(dateObj, 'MMM dd');
      
//       if (!dailyStats.has(dateStr)) {
//         dailyStats.set(dateStr, { dateStr, timestamp: dateObj.getTime(), revenue: 0 });
//       }
      
//       const val = order.final_price > 0 ? order.final_price : (order.estimated_price || 0);
//       dailyStats.get(dateStr)!.revenue += val;

//       // 2. Status Math
//       if (order.status in statusCounts) {
//         statusCounts[order.status as keyof typeof statusCounts]++;
//       }

//       // 3. Items Math
//       if (Array.isArray(order.items)) {
//         order.items.forEach((i: any) => {
//           const itemName = i.item?.name || 'Unknown';
//           const qty = i.final_quantity > 0 ? i.final_quantity : (i.estimated_quantity || 0);
          
//           if (!itemStats.has(itemName)) itemStats.set(itemName, { name: itemName, count: 0 });
//           itemStats.get(itemName)!.count += qty;
//         });
//       }

//       // 4. NEW: Building Math
//       // We safely check order.user or order.customer depending on how your backend serializes it
//       const bName = order.user?.building_name || order.customer?.building_name || 'Walk-in / Unknown';
//       if (!buildingStats.has(bName)) buildingStats.set(bName, 0);
//       buildingStats.set(bName, buildingStats.get(bName)! + val);
//     });
    
//     // Formatting Line Chart
//     const sortedRevenue = Array.from(dailyStats.values()).sort((a, b) => a.timestamp - b.timestamp);
//     const lineData = {
//       labels: sortedRevenue.map(d => d.dateStr),
//       datasets: [{
//         label: 'Net Revenue (AED)',
//         data: sortedRevenue.map(d => d.revenue),
//         borderColor: '#0f172a',
//         backgroundColor: 'rgba(15, 23, 42, 0.05)',
//         borderWidth: 3,
//         tension: 0.3,
//         fill: true,
//         pointBackgroundColor: '#ffffff',
//         pointBorderColor: '#0f172a',
//         pointRadius: 4,
//       }]
//     };

//     // Formatting Status Chart
//     const doughnutData = {
//       labels: ['New', 'Picked Up', 'Delivered', 'Cancelled'],
//       datasets: [{
//         data: [statusCounts.NEW_ORDER, statusCounts.PICKED_UP, statusCounts.DELIVERED, statusCounts.CANCELLED],
//         backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
//         borderWidth: 0,
//         hoverOffset: 4
//       }]
//     };

//     // Formatting Top Items
//     const topItems = Array.from(itemStats.values()).sort((a, b) => b.count - a.count).slice(0, 5);
//     const barData = {
//       labels: topItems.map(i => i.name),
//       datasets: [{
//         label: 'Total Pieces Processed',
//         data: topItems.map(i => i.count),
//         backgroundColor: '#3b82f6',
//         borderRadius: 6,
//       }]
//     };

//     // NEW: Formatting Building Data (Top 5 revenue-generating buildings)
//     const topBuildings = Array.from(buildingStats.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
//     const buildingData = {
//       labels: topBuildings.map(b => b[0]),
//       datasets: [{
//         data: topBuildings.map(b => b[1]),
//         // A premium color palette for locations
//         backgroundColor: ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#64748b'], 
//         borderWidth: 0,
//         hoverOffset: 4
//       }]
//     };

//     return { lineData, doughnutData, barData, buildingData, hasData: true, rawRevenue: sortedRevenue };
//   }, [allOrders, timeRange]);

//   // 5. CSV Export Feature
//   const handleExport = () => {
//     if (!chartData.rawRevenue || chartData.rawRevenue.length === 0) return;
//     const csvContent = "data:text/csv;charset=utf-8,Date,Revenue(AED)\n"
//       + chartData.rawRevenue.map((e: any) => `${e.dateStr},${e.revenue}`).join("\n");
//     const link = document.createElement("a");
//     link.setAttribute("href", encodeURI(csvContent));
//     link.setAttribute("download", `alnejoum_financials_${timeRange}.csv`);
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const isLoading = isStatsLoading || isOrdersLoading;

//   return (
//     <div className="min-h-screen pb-20 font-sans space-y-8 relative">
      
//       {/* HEADER & FILTERS */}
//       <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
//         <div>
//           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Business Intelligence</h1>
//           <p className="text-slate-500 font-medium mt-1">Real-time data aggregated directly from your live database.</p>
//         </div>
        
//         <div className="flex flex-wrap items-center gap-3">
//           <div className="bg-white p-1 rounded-xl border border-slate-200 flex text-sm font-bold shadow-sm">
//             {(['7D', '30D', '1Y', 'ALL'] as const).map(range => (
//               <button 
//                 key={range}
//                 onClick={() => setTimeRange(range)}
//                 className={`px-4 py-2 rounded-lg transition-colors ${timeRange === range ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
//               >
//                 {range}
//               </button>
//             ))}
//           </div>
//           <button 
//             onClick={handleExport} 
//             disabled={!chartData.hasData}
//             className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-900 hover:text-white transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
//           >
//             <Download className="w-4 h-4" />
//             <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Export CSV</span>
//           </button>
//         </div>
//       </header>

//       {/* KPI CARDS */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <MetricCard title="Gross Net Revenue" value={stats?.total_revenue} prefix="AED " isLoading={isLoading} icon={DollarSign} />
//         <MetricCard 
//           title="Total Expenses" 
//           value={stats?.total_expenses} 
//           prefix="AED " 
//           isLoading={isLoading} 
//           icon={Receipt} 
//           textColor="text-red-500" 
//         />
        
//         <MetricCard 
//           title="Net Profit / Loss" 
//           value={stats?.net_profit} 
//           prefix="AED " 
//           isLoading={isLoading} 
//           icon={Wallet} 
//           textColor={stats?.net_profit >= 0 ? "text-emerald-500" : "text-red-500"} 
//         />
//         <MetricCard title="Total Order Volume" value={(stats?.new_orders || 0) + (stats?.picked_up_orders || 0) + (stats?.delivered_orders || 0)} isLoading={isLoading} icon={ShoppingBag} />
//         <MetricCard title="Successfully Delivered" value={stats?.delivered_orders} isLoading={isLoading} icon={TrendingUp} />
//         <MetricCard title="Total Customers" value={stats?.total_customers} isLoading={isLoading} icon={Users} />
//       </div>

//     {/* CHART AREA */}
//       {isLoading ? (
//         <div className="flex flex-col items-center justify-center py-32 text-slate-400">
//           <Loader2 className="animate-spin mb-4 text-brand-primary" size={40} />
//           <p className="font-bold uppercase tracking-widest text-[10px]">Aggregating live data...</p>
//         </div>
//       ) : !chartData.hasData ? (
//         <div className="bg-white rounded-[3rem] py-32 text-center border-2 border-dashed border-slate-100">
//           <PackageX className="mx-auto text-slate-200 mb-4" size={48} />
//           <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No transaction data found for {timeRange}</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
//           {/* Revenue Over Time (Line Chart) */}
//           <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
//             <div className="mb-6">
//               <h3 className="text-xl font-black text-slate-900">Revenue Trend</h3>
//               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">AED Generated vs Time</p>
//             </div>
//             <div className="h-72 w-full">
//               {chartData.lineData && (
//                 <Line 
//                   data={chartData.lineData} 
//                   options={{ 
//                     responsive: true, 
//                     maintainAspectRatio: false,
//                     plugins: { legend: { display: false } },
//                     scales: {
//                       y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { dash: [4, 4] } },
//                       x: { grid: { display: false } }
//                     }
//                   }} 
//                 />
//               )}
//             </div>
//           </div>

//           {/* NEW: Revenue by Location (Doughnut) */}
//           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
//             <div className="mb-2">
//               <h3 className="text-xl font-black text-slate-900">Revenue by Location</h3>
//               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Top 5 Generating Buildings</p>
//             </div>
//             <div className="flex-1 min-h-[250px] flex items-center justify-center">
//               {chartData.buildingData && (
//                 <Doughnut 
//                   data={chartData.buildingData} 
//                   options={{ 
//                     responsive: true, 
//                     maintainAspectRatio: false, 
//                     cutout: '70%',
//                     plugins: { legend: { position: 'right', labels: { usePointStyle: true, padding: 20, font: { weight: 'bold', size: 11 } } } }
//                   }} 
//                 />
//               )}
//             </div>
//           </div>

//           {/* Top Items (Bar Chart) */}
//           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
//             <div className="mb-6">
//               <h3 className="text-xl font-black text-slate-900">Top Services</h3>
//               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Pieces Processed</p>
//             </div>
//             <div className="h-64 w-full">
//                {chartData.barData && (
//                  <Bar 
//                    data={chartData.barData} 
//                    options={{ 
//                      responsive: true, 
//                      maintainAspectRatio: false, 
//                      indexAxis: 'y', // Horizontal bars
//                      plugins: { legend: { display: false } },
//                      scales: {
//                        x: { grid: { color: '#f1f5f9' } },
//                        y: { grid: { display: false } }
//                      }
//                    }} 
//                  />
//                )}
//             </div>
//           </div>

//         </div>
//       )}
//     </div>
//   );
// };