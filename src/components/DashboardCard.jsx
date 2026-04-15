export default function DashboardCard({ title, value, detail }) {
  return (
    <div className="glass-panel p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
        {title}
      </p>
      <p className="mt-4 font-display text-4xl font-bold text-slate-950">{value}</p>
      <p className="mt-3 text-sm text-slate-500">{detail}</p>
    </div>
  );
}
