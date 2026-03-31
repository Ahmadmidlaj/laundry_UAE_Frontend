"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../api/admin.service';
import { TrendingUp, Users, ShoppingBag, DollarSign, Download, Loader2, PackageX } from 'lucide-react';
import { subDays, subYears, isAfter, format, parseISO } from 'date-fns';

// 1. Safely Import and Register Chart.js
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

// 2. Reusable Metric Card Component
const MetricCard = ({ title, value, isLoading, icon: Icon, prefix = "" }: any) => (
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
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value || 0}
          </p>
        )}
      </div>
    </div>
  </div>
);

// 3. Main Reports Page
export const ReportsPage = () => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '1Y' | 'ALL'>('30D');

  // Fetch KPI Summary Data (Overall System Stats)
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: adminService.getDashboardStats,
  });

  // Fetch ALL Orders to aggregate for charts
  const { data: allOrders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['adminAllOrders'],
    queryFn: adminService.getAllOrders,
  });

  // 4. Data Processing Engine
  const chartData = useMemo(() => {
    // Failsafe: If no data yet, return empty
    if (!allOrders || !Array.isArray(allOrders)) {
      return { lineData: null, doughnutData: null, barData: null, hasData: false, rawRevenue: [] };
    }

    const now = new Date();
    let cutoffDate = new Date(0); // Epoch (All time)
    
    if (timeRange === '7D') cutoffDate = subDays(now, 7);
    if (timeRange === '30D') cutoffDate = subDays(now, 30);
    if (timeRange === '1Y') cutoffDate = subYears(now, 1);

    // Filter orders by selected date range safely
    const filteredOrders = allOrders.filter((order: any) => {
      if (!order.created_at) return true; // Include if date is missing
      try {
        return isAfter(parseISO(order.created_at), cutoffDate);
      } catch (e) {
        return true;
      }
    });

    if (filteredOrders.length === 0) return { hasData: false };

    // --- A. Line Chart: Revenue Trend ---
    const dailyStats = new Map<string, { dateStr: string, timestamp: number, revenue: number }>();
    
    filteredOrders.forEach((order: any) => {
      let dateObj = new Date();
      if (order.created_at) {
        try { dateObj = parseISO(order.created_at); } catch (e) {}
      }
      const dateStr = format(dateObj, 'MMM dd');
      
      if (!dailyStats.has(dateStr)) {
        dailyStats.set(dateStr, { dateStr, timestamp: dateObj.getTime(), revenue: 0 });
      }
      
      const val = order.final_price > 0 ? order.final_price : (order.estimated_price || 0);
      dailyStats.get(dateStr)!.revenue += val;
    });
    
    // Sort chronologically (oldest to newest left-to-right)
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

    // --- B. Doughnut Chart: Pipeline Status ---
    const statusCounts = { NEW_ORDER: 0, PICKED_UP: 0, DELIVERED: 0, CANCELLED: 0 };
    filteredOrders.forEach((o: any) => {
      if (o.status in statusCounts) {
        statusCounts[o.status as keyof typeof statusCounts]++;
      }
    });
    
    const doughnutData = {
      labels: ['New', 'Picked Up', 'Delivered', 'Cancelled'],
      datasets: [{
        data: [statusCounts.NEW_ORDER, statusCounts.PICKED_UP, statusCounts.DELIVERED, statusCounts.CANCELLED],
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    };

    // --- C. Bar Chart: Top Performing Services ---
    const itemStats = new Map<string, { name: string, count: number }>();
    filteredOrders.forEach((order: any) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((i: any) => {
          const itemName = i.item?.name || 'Unknown';
          const qty = i.final_quantity > 0 ? i.final_quantity : (i.estimated_quantity || 0);
          
          if (!itemStats.has(itemName)) itemStats.set(itemName, { name: itemName, count: 0 });
          itemStats.get(itemName)!.count += qty;
        });
      }
    });

    // Sort by count descending, take top 6
    const topItems = Array.from(itemStats.values()).sort((a, b) => b.count - a.count).slice(0, 6);
    
    const barData = {
      labels: topItems.map(i => i.name),
      datasets: [{
        label: 'Total Pieces Processed',
        data: topItems.map(i => i.count),
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      }]
    };

    return { lineData, doughnutData, barData, hasData: true, rawRevenue: sortedRevenue };
  }, [allOrders, timeRange]);

  // 5. CSV Export Feature
  const handleExport = () => {
    if (!chartData.rawRevenue || chartData.rawRevenue.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8,Date,Revenue(AED)\n"
      + chartData.rawRevenue.map((e: any) => `${e.dateStr},${e.revenue}`).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `alnejoum_financials_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoading = isStatsLoading || isOrdersLoading;

  return (
    <div className="min-h-screen pb-20 font-sans space-y-8 relative">
      
      {/* HEADER & FILTERS */}
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
            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Export CSV</span>
          </button>
        </div>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Gross Net Revenue" value={stats?.total_revenue} prefix="AED " isLoading={isLoading} icon={DollarSign} />
        <MetricCard title="Total Order Volume" value={(stats?.new_orders || 0) + (stats?.picked_up_orders || 0) + (stats?.delivered_orders || 0)} isLoading={isLoading} icon={ShoppingBag} />
        <MetricCard title="Successfully Delivered" value={stats?.delivered_orders} isLoading={isLoading} icon={TrendingUp} />
        <MetricCard title="Total Customers" value={stats?.total_customers} isLoading={isLoading} icon={Users} />
      </div>

      {/* CHART AREA */}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Revenue Over Time (Line Chart) */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-900">Revenue Trend</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">AED Generated vs Time</p>
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

          {/* Pipeline Status (Doughnut Chart) */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
            <div className="mb-2">
              <h3 className="text-xl font-black text-slate-900">Pipeline Status</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Active Order Distribution</p>
            </div>
            <div className="flex-1 min-h-[250px] flex items-center justify-center">
              {chartData.doughnutData && (
                <Doughnut 
                  data={chartData.doughnutData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    cutout: '75%',
                    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { weight: 'bold', size: 11 } } } }
                  }} 
                />
              )}
            </div>
          </div>

          {/* Top Items (Bar Chart) */}
          <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-900">Top Performing Services</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Pieces Processed by Category</p>
            </div>
            <div className="h-72 w-full">
               {chartData.barData && (
                 <Bar 
                   data={chartData.barData} 
                   options={{ 
                     responsive: true, 
                     maintainAspectRatio: false, 
                     indexAxis: 'y', // Makes the bar chart horizontal
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