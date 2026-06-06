function RelatedWorkBucketCard({ bucket }) {
  return (
    <article className="related-bucket-card">
      <div className="related-bucket-header">
        <h3>{bucket.title}</h3>
      </div>

      <p>{bucket.description}</p>

      <div className="related-bucket-why">
        <h4>Why it matters</h4>
        <p>{bucket.whyItMatters}</p>
      </div>

      <div className="related-bucket-terms">
        <h4>Example search terms</h4>
        <div className="chip-list compact">
          {bucket.exampleSearchTerms.map((term) => (
            <span className="query-chip is-soft" key={`${bucket.title}-${term}`}>
              {term}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default RelatedWorkBucketCard;
