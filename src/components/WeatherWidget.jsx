import React, { useState, useEffect } from 'react';
import { Sun, CloudSun, CloudRain, Snowflake, Thermometer, Loader2 } from 'lucide-react';

export default function WeatherWidget({ lat, lon, targetDate }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getWeatherIcon = (condition) => {
    const cond = (condition || '').toLowerCase();
    if (cond.includes('snow') || cond.includes('cold') || cond.includes('ice') || cond.includes('freez')) return <Snowflake className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-300" />;
    if (cond.includes('rain') || cond.includes('shower') || cond.includes('storm')) return <CloudRain className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-400" />;
    if (cond.includes('cloud') || cond.includes('overcast')) return <CloudSun className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-slate-300" />;
    if (cond.includes('sun') || cond.includes('clear') || cond.includes('hot')) return <Sun className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-amber-400" />;
    return <Thermometer className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white/50" />;
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(false);
        const API_URL = window.location.hostname === 'localhost'
            ? `http://localhost:5000/api/weather?lat=${lat}&lon=${lon}`
            : `https://sanchaara-ai.onrender.com/api/weather?lat=${lat}&lon=${lon}`;

        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Failed to fetch weather');
        const data = await res.json();

        // Target Date parsing block
        let targetForecast = data.list[0]; // Fallback to current weather

        if (targetDate) {
          const tDate = new Date(targetDate);

          // Find forecast closest to 12:00 PM on the target date
          const forecastsOnDate = data.list.filter(item => {
            const itemDate = new Date(item.dt * 1000);
            return itemDate.getDate() === tDate.getDate() && itemDate.getMonth() === tDate.getMonth();
          });

          if (forecastsOnDate.length > 0) {
            // Pick noon or closest available
            targetForecast = forecastsOnDate.find(item => new Date(item.dt * 1000).getHours() === 12) || forecastsOnDate[Math.floor(forecastsOnDate.length / 2)];
          }
        }

        setWeather({
          temp: Math.round(targetForecast.main.temp),
          condition: targetForecast.weather[0].description,
        });

      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (lat && lon) {
      fetchWeather();
    }
  }, [lat, lon, targetDate]);

  if (loading) {
    return (
      <div className="bg-white/5 px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 rounded-xl sm:rounded-2xl md:rounded-3xl border border-white/10 flex items-center justify-center min-w-[120px]">
        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-white/30 animate-spin" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white/5 px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 rounded-xl sm:rounded-2xl md:rounded-3xl border border-white/10 flex items-center gap-3 sm:gap-4 opacity-50">
        <Thermometer className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white/30" />
        <div className="text-right">
          <p className="text-lg sm:text-xl md:text-2xl font-black tracking-tighter">--°C</p>
          <p className="text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase text-white/40 tracking-widest">No Signal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 rounded-xl sm:rounded-2xl md:rounded-3xl border border-white/10 flex items-center gap-3 sm:gap-4 group hover:bg-white/10 transition-all cursor-default">
      {getWeatherIcon(weather.condition)}
      <div className="text-right">
        <p className="text-lg sm:text-xl md:text-2xl font-black tracking-tighter">{weather.temp}°C</p>
        <p className="text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase text-white/40 tracking-widest">{weather.condition}</p>
      </div>
    </div>
  );
}
