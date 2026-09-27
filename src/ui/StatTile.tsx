interface StatTileProps {
  value: string | number;
  label: string;
}

export default function StatTile({ value, label }: StatTileProps) {
  return (
    <div className="rounded-ui bg-bg-raised p-3.5">
      <div className="font-mono text-2xl font-extrabold tabular-nums">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
