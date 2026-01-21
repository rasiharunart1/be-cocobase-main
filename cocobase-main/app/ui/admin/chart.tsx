'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BarController
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getDataNoQuery } from '@/app/utils/fetchData';
import { ChartSchema } from '@/app/utils/interface';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
);

const LineChart = () => {
  const [rawData, setRawData] = useState<ChartSchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getDataNoQuery({ path: '/scrap' });
        if (isMounted) {
          setRawData(data.scrap);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Gagal mengambil data');
          console.error('Error fetching data:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');

  // Function to convert month number to month name
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const uniqueYears = useMemo(() => {
    return [...new Set(rawData.map(item => item.tahun.toString()))];
  }, [rawData]);

  const uniqueMonths = useMemo(() => {
    const months = rawData
      .filter(item => item.tahun.toString() === selectedYear)
      .map(item => item.bulan.toString());
    return [...new Set(months)];
  }, [rawData, selectedYear]);

  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      const yearMatch = item.tahun.toString() === selectedYear;
      if (selectedMonth === 'all') {
        return yearMatch;
      } else {
        const monthMatch = item.bulan.toString() === selectedMonth;
        return yearMatch && monthMatch;
      }
    });
  }, [selectedYear, selectedMonth]);

  const data = selectedMonth === 'all' ? {
    labels: uniqueMonths.map(month => monthNames[parseInt(month) - 1]),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Total Penjualan per Bulan',
        data: uniqueMonths.map(month => 
          filteredData
            .filter(item => item.bulan.toString() === month)
            .reduce((acc, item) => acc + item.jumlah_total, 0)
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        type: 'bar' as const,
        label: 'Rata-rata Harga per Bulan',
        data: uniqueMonths.map(month => {
          const monthData = filteredData.filter(item => item.bulan.toString() === month);
          return monthData.reduce((acc, item) => acc + item.harga_rata, 0) / monthData.length;
        }),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        yAxisID: 'y1'
      }
    ]
  } : {
    labels: filteredData
      .sort((a, b) => a.minggu_ke - b.minggu_ke)
      .map(item => `Minggu ${item.minggu_ke}`),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Total Penjualan per Minggu',
        data: filteredData
          .sort((a, b) => a.minggu_ke - b.minggu_ke)
          .map(item => item.jumlah_total),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        type: 'bar' as const,
        label: 'Harga Rata-rata per Minggu',
        data: filteredData
          .sort((a, b) => a.minggu_ke - b.minggu_ke)
          .map(item => item.harga_rata),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        yAxisID: 'y1'
      }
    ]
  };

  // Options for the chart
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: selectedMonth === 'all' ? 'Monthly Sales Data || 1 KG Gula Aren' : 'Weekly Sales Data || 1 KG Gula Aren',
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Total Penjualan'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Harga Rata-rata'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        stacked: false
      }
    },
  };

  useEffect(() => {
    if (uniqueYears.length > 0 && selectedYear === '') {
      setSelectedYear(uniqueYears[0]);
    }
  }, [uniqueYears, selectedYear]);

  // Jika data belum siap, tampilkan loading
  if (isLoading) {
    return <div>Memuat data...</div>;
  }

  // Jika terjadi error, tampilkan pesan error
  if (error) {
    return <div style={{color: 'red'}}>{error}</div>;
  }

  // Jika tidak ada data, tampilkan pesan
  if (rawData.length === 0) {
    return <div>Tidak ada data tersedia</div>;
  }

  return (
    <div>
      <select 
        value={selectedYear} 
        onChange={(e) => setSelectedYear(e.target.value)}
      >
        {uniqueYears.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
      <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
        <option value="all">All Months</option>
        {uniqueMonths.map(month => (
          <option key={month} value={month}>{monthNames[parseInt(month) - 1]}</option>
        ))}
      </select>
      <Bar data={data} options={options} />
    </div>
  );
};

export default LineChart;
