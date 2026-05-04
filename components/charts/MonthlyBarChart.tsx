import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';

interface MonthData {
  label: string;
  expenses: number;
  income: number;
}

interface MonthlyBarChartProps {
  data: MonthData[];
}

const CHART_W = 340;
const CHART_H = 160;
const PADDING = { top: 10, bottom: 30, left: 8, right: 8 };
const BAR_GAP = 4;

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  if (!data.length) return null;

  const maxVal = Math.max(...data.flatMap(d => [d.expenses, d.income]), 1);

  const plotW = CHART_W - PADDING.left - PADDING.right;
  const plotH = CHART_H - PADDING.top - PADDING.bottom;

  const groupW = plotW / data.length;
  const barW = (groupW - BAR_GAP * 3) / 2;

  return (
    <View>
      <Svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = PADDING.top + plotH * (1 - frac);
          return (
            <Line
              key={frac}
              x1={PADDING.left}
              y1={y}
              x2={CHART_W - PADDING.right}
              y2={y}
              stroke="#1E293B"
              strokeWidth={1}
            />
          );
        })}

        {data.map((d, i) => {
          const gx = PADDING.left + i * groupW + BAR_GAP;
          const incomeH = maxVal > 0 ? (d.income / maxVal) * plotH : 0;
          const expH = maxVal > 0 ? (d.expenses / maxVal) * plotH : 0;

          const incomeY = PADDING.top + plotH - incomeH;
          const expY = PADDING.top + plotH - expH;
          const labelY = CHART_H - 6;
          const labelX = gx + groupW / 2 - BAR_GAP;

          return (
            <View key={i}>
              {/* Income bar (emerald) */}
              <Rect
                x={gx}
                y={incomeY}
                width={barW}
                height={Math.max(incomeH, 0)}
                fill="#10B981"
                rx={2}
              />
              {/* Expense bar (violet) */}
              <Rect
                x={gx + barW + BAR_GAP}
                y={expY}
                width={barW}
                height={Math.max(expH, 0)}
                fill="#7C3AED"
                rx={2}
              />
              {/* Label */}
              <SvgText
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fill="#64748B"
                fontSize={9}
              >
                {d.label}
              </SvgText>
            </View>
          );
        })}
      </Svg>
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#7C3AED' }]} />
          <Text style={styles.legendText}>Expenses</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#64748B',
    fontSize: 11,
  },
});
