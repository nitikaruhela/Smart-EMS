const toneStyles = {
  slate: "pill",
  brand: "pill pill--brand",
  emerald: "pill pill--success",
  amber: "pill pill--amber",
};

export default function DashboardCard({
  title,
  value,
  detail,
  icon,
  tone = "slate",
  loading = false,
}) {
  const badgeClass = toneStyles[tone] || toneStyles.slate;

  return (
    <div className="card metric-card">
      <div className="section-header">
        <div>
          <p className="card-kicker">{title}</p>
          {loading ? (
            <div className="skeleton skeleton--headline" />
          ) : (
            <p className="metric-card__value">{value}</p>
          )}
        </div>
        {icon ? <span className={`metric-card__badge ${badgeClass}`}>{icon}</span> : null}
      </div>
      {loading ? (
        <div className="skeleton skeleton--title" />
      ) : (
        <p className="metric-card__detail">{detail}</p>
      )}
    </div>
  );
}
