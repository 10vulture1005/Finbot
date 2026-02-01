import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from "recharts";

// ============================================================================
// Type Definitions
// ============================================================================

type Sentiment = "positive" | "negative" | "neutral";

interface PortfolioDataItem {
  name: string;
  value: number;
  sentiment?: Sentiment;
}

interface PortfolioBarChartProps {
  data?: PortfolioDataItem[];
  height?: number;
  colors?: {
    positive: string;
    negative: string;
    neutral: string;
  };
  isVisible?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: PortfolioDataItem;
  }>;
}

// ============================================================================
// PortfolioBarChart Component
// A responsive, accessible bar chart for displaying portfolio metrics
// ============================================================================

const PortfolioBarChart: React.FC<PortfolioBarChartProps> = ({
  data = [],
  height = 280,
  colors = {
    positive: "#3b82f6", // blue-500
    negative: "#ef4444", // red-500
    neutral: "#6b7280", // gray-500
  },
  isVisible = true,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Custom tooltip with enhanced styling
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-3"
          role="tooltip"
        >
          <p className="font-semibold text-gray-900 mb-1">{data.name}</p>
          <p className="text-sm text-gray-600">
            Value:{" "}
            <span className="font-medium text-gray-900">{data.value}%</span>
          </p>
          {data.sentiment && (
            <p className="text-xs text-gray-500 mt-1 capitalize">
              {data.sentiment}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Get color based on sentiment
  const getBarColor = (sentiment?: Sentiment): string => {
    if (!sentiment) return colors.neutral;
    return colors[sentiment] || colors.neutral;
  };

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: "#6b7280", fontSize: 12 }}
            axisLine={{ stroke: "#d1d5db" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 12 }}
            axisLine={{ stroke: "#d1d5db" }}
            tickLine={false}
            label={{
              value: "Value (%)",
              angle: -90,
              position: "insideLeft",
              fill: "#6b7280",
              fontSize: 12,
            }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
          />
          <Bar
            dataKey="value"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
            animationBegin={isVisible ? 0 : 99999}
            key={isVisible ? 'visible' : 'hidden'}
            onMouseEnter={(_: any, index: number) => setActiveIndex(index)}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.sentiment)}
                opacity={
                  activeIndex === null || activeIndex === index ? 1 : 0.6
                }
                style={{ transition: "opacity 0.2s ease" }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// Advantage Component
// Main feature grid showcasing banking platform benefits
// ============================================================================

const Advantage: React.FC = () => {
  // Sample data for the portfolio chart
  const portfolioData: PortfolioDataItem[] = [
    { name: "Security", value: 95, sentiment: "positive" },
    { name: "Speed", value: 88, sentiment: "positive" },
    { name: "Innovation", value: 92, sentiment: "positive" },
    { name: "Trust", value: 85, sentiment: "neutral" },
    { name: "Growth", value: 78, sentiment: "positive" },
  ];

    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const growthData = [
    { year: 'Y1', value: 0 },
    { year: 'Y2', value: 55 },
    { year: 'Y3', value: 48 },
    { year: 'Y4', value: 85 },
    { year: 'Y5', value: 150 },
  ];

  return (
    <div ref={sectionRef} className="bg-gradient-to-b from-[#D8DFFB] via-[#A2CBFD] to-[#BFE1FF] py-16 px-4 sm:py-20 sm:px-6 lg:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className={`text-center mb-12 sm:mb-16 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-3 sm:mb-4">
            Smarter <span className="italic font-serif">banking</span>
          </h1>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            <span className="italic font-serif">Moments</span> start here
          </h2>
          <p className="text-gray-700 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Our finance platform automates processes, enhances security, and
            empowers better decisions.
          </p>
        </header>

        {/* Feature Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          role="list"
        >
          {/* Card 1: User Focus Icon */}
          <article
            className={`bg-white/70 backdrop-blur-sm rounded-3xl p-6 sm:p-8 flex items-center justify-center h-56 sm:h-64 shadow-xs hover:shadow-sm transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            role="listitem"
          >
            <div className="text-center">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-xs"
                aria-hidden="true"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"></div>
              </div>
              <p className="text-gray-900 font-semibold text-lg">You</p>
              <p className="text-gray-600 text-sm mt-1">
                We consider you At the center
              </p>
            </div>
          </article>

          {/* Card 2: Moments - Digital Growth */}
          <article
            className={`bg-white/70 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-sm transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            role="listitem"
          >
            {/* Label */}
            <p className="text-gray-500 text-xs sm:text-sm mb-4 uppercase tracking-wide">
              Insight
            </p>

            {/* Header Section */}
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div
                className="bg-linear-to-br from-blue-400 to-blue-600 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 shadow-xs"
                aria-hidden="true"
              >
                <div className="w-16 sm:w-20 h-6 sm:h-8 rounded"></div>
              </div>
              <h3 className="text-gray-900 font-semibold text-base sm:text-lg">
                Portfolio Growth Snapshot
              </h3>
            </div>

            {/* Sub Label */}
            <p className="text-gray-500 text-xs sm:text-sm mb-2 uppercase tracking-wide">
              Growth Difference
            </p>

            {/* Main Content Row */}
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              {/* Metric Box */}
              <div
                className="bg-linear-to-br from-blue-100 to-blue-200 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 shadow-xs"
                aria-hidden="true"
              >
                {/* Replace with live data later */}
                <div className="w-10 sm:w-15 h-6 sm:h-8 rounded"></div>
              </div>
              <h3 className="text-gray-900 font-semibold text-base sm:text-lg">
                Without Proper Mangement
              </h3>

              {/* Description */}
            </div>
            <p className="text-gray-900 font-medium text-xs sm:text-sm leading-relaxed">
              Your portfolio outperformed its previous period.
              <span className="text-blue-600 font-semibold">
                {" "}
                AI highlights the key sectors driving this growth.
              </span>
            </p>
          </article>

          {/* Card 3: Portfolio Performance Chart */}
          <article
            className={`bg-white/70 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-sm transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            role="listitem"
          >
            <h3 className="text-gray-900 font-bold text-xl sm:text-2xl mb-2">
              Portfolio
            </h3>
            <p className="text-gray-900 italic font-serif text-lg sm:text-xl mb-4 sm:mb-6">
              performance metrics
            </p>
            {/* Bar Chart Integration */}
            <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-2xl p-3 sm:p-4">
              <PortfolioBarChart data={portfolioData} height={200} isVisible={isVisible} />
            </div>
          </article>

          {/* Card 4: Smarter Financial Technology */}
          <article
            className={`bg-white/70 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-sm transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            role="listitem"
          >
            <h3 className="text-gray-900 font-bold text-xl sm:text-2xl mb-2">
              Smarter <span className="italic font-serif">financial</span>
            </h3>
            <p className="text-gray-900 italic font-serif text-lg sm:text-xl mb-4 sm:mb-6">
              technology
            </p>
            <ul className="space-y-3 sm:space-y-4" role="list">
              <li className="flex items-center gap-3 sm:gap-4">
                <div
                  className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                  aria-hidden="true"
                >
                  <div className="w-6 h-6 border-2 border-blue-600 rounded"></div>
                </div>
                <p className="text-gray-900 font-medium text-sm sm:text-base">
                  Digital Data
                </p>
              </li>
              <li className="flex items-center gap-3 sm:gap-4">
                <div
                  className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                  aria-hidden="true"
                >
                  <span className="text-2xl" role="img" aria-label="Bank">
                    🏛️
                  </span>
                </div>
                <p className="text-gray-900 font-medium text-sm sm:text-base">
                  Modern <span className="text-blue-600">banking</span>
                </p>
              </li>
              <li className="flex items-center gap-3 sm:gap-4">
                <div
                  className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                  aria-hidden="true"
                >
                  <div className="w-6 h-6 border-2 border-blue-600 rounded-full"></div>
                </div>
                <p className="text-gray-900 font-medium text-sm sm:text-base">
                  Fast speed
                </p>
              </li>
            </ul>
          </article>

          {/* Card 5: Innovation Investment */}
    <article
      className={`bg-white/70 backdrop-blur-sm rounded-3xl p-6 sm:p-8 md:col-span-2 lg:col-span-2 shadow-xs hover:shadow-sm transition-all duration-700 delay-500 overflow-hidden relative ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      role="listitem"
    >
      <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-center">
        <div className="flex-1 z-10">
          <div className="inline-block  text-gray-500 font-serif text-xs font-semibold px-3 py-1 rounded-full mb-3">
            PROVEN RESULTS
          </div>
          <h3 className="text-gray-900 font-bold text-2xl sm:text-3xl mb-3 sm:mb-4">
            Join <span className="text-blue-600">100+</span> assets
          </h3>
          <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4">
            Growing Profits by an average of{" "}
            <span className="font-bold text-blue-600">55%</span> in their
            first year with our platform.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">24/7 Support</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Bank-grade Security</span>
            </div>
          </div>
        </div>

        {/* Animated Line Chart */}
        <div className="w-full md:w-64 h-48 flex-shrink-0 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  hide={true}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                  labelStyle={{ color: '#111827', fontWeight: 600 }}
                  itemStyle={{ color: '#3b82f6' }}
                  formatter={(value: any) => [`${value}%`, 'Growth']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#2563eb' }}
                  animationDuration={2000}
                  animationBegin={isVisible ? 500 : 99999}
                  key={isVisible ? 'visible' : 'hidden'}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Growth indicator */}
            
          </div>
        </div>
      </div>

      {/* Decorative background element */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl pointer-events-none"></div>
    </article>
        </div>
      </div>
    </div>
  );
};

export default Advantage;
