function BlueprintSectionCard({ items, title }) {
  return (
    <article className="blueprint-section-card">
      <h3>{title}</h3>
      <div className="blueprint-section-content">
        {items.map((item) => (
          <section className="blueprint-field" key={item.label}>
            <h4>{item.label}</h4>
            {Array.isArray(item.value) ? (
              <ul className="blueprint-list">
                {item.value.map((entry) => (
                  <li key={`${item.label}-${entry}`}>{entry}</li>
                ))}
              </ul>
            ) : (
              <p>{item.value}</p>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}

export default BlueprintSectionCard;
