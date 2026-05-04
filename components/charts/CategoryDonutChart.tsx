import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface SliceData {
  category: string;
  amount: number;
  color: string;
}

interface CategoryDonutChartProps {
  data: SliceData[];
  total: number;
  size?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function CategoryDonutChart({ data, total, size = 200 }: CategoryDonutChartProps) {
  if (!data.length || total === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Circle cx={100} cy={100} r={70} fill="none" stroke="#334155" strokeWidth={30} />
        </Svg>
        <View style={styles.center}>
          <Text style={styles.centerText}>No data</Text>
        </View>
      </View>
    );
  }

  const cx = 100, cy = 100, r = 70, strokeWidth = 30;
  let cumAngle = 0;
  const paths: { d: string; color: string; key: string }[] = [];

  data.forEach((slice) => {
    const angle = (slice.amount / total) * 360;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    if (angle > 0.5) {
      paths.push({
        d: arcPath(cx, cy, r, startAngle, endAngle),
        color: slice.color,
        key: slice.category,
      });
    }
    cumAngle += angle;
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {paths.map(p => (
          <Path
            key={p.key}
            d={p.d}
            fill="none"
            stroke={p.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />
        ))}
      </Svg>
      <View style={styles.center}>
        <Text style={styles.centerLabel}>Total</Text>
        <Text style={styles.centerAmount} numberOfLines={1}>
          {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    color: '#64748B',
    fontSize: 11,
  },
  centerAmount: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  centerText: {
    color: '#64748B',
    fontSize: 13,
  },
});
