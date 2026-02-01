import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import React from "react";
// Allocation Chart Component
interface AllocationChartProps {
  title: string;
  data: AllocationItem[];
  darkMode: boolean;
}
interface AllocationItem {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

const AllocationChart: React.FC<AllocationChartProps> = ({
  title,
  data,
  darkMode,
}) => {
  const cardBg = darkMode ? "#1a1f2e" : "#ffffff";
  const textColor = darkMode ? "#e2e8f0" : "#111827";
  const mutedColor = darkMode ? "#94a3b8" : "#6b7280";
  const borderColor = darkMode ? "#2d3548" : "#e5e7eb";

  return (
    <div
      style={{
        backgroundColor: cardBg,
        borderRadius: "8px",
        padding: "24px",
        border: `1px solid ${borderColor}`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <h3
        style={{
          fontSize: "18px",
          fontWeight: "600",
          color: textColor,
          marginBottom: "16px",
        }}
      >
        {title}
      </h3>
      <div style={{ height: "256px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: cardBg,
                border: `1px solid ${borderColor}`,
                borderRadius: "8px",
                color: textColor,
              }}
              formatter={(value?: number) => [`${value ?? 0}%`, "Allocation"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: "16px" }}>
        {data.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "14px",
              marginBottom: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: item.color,
                }}
              />
              <span style={{ color: textColor }}>{item.name}</span>
            </div>
            <span style={{ color: mutedColor, fontWeight: "500" }}>
              {item.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllocationChart;
