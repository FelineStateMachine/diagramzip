import React, {useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import {diagramTypes} from '@site/data/diagram-types.mjs';
import styles from './styles.module.css';

export default function TypeGrid() {
  const [query, setQuery] = useState('');

  const visibleTypes = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return diagramTypes;
    return diagramTypes.filter((type) =>
      [type.label, type.id, type.category, type.summary]
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }, [query]);

  return (
    <section className={styles.typeSection} aria-labelledby="type-grid-title">
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>30 supported types</p>
          <h2 id="type-grid-title">Choose a diagram type</h2>
        </div>
        <label className={styles.searchLabel}>
          <span>Filter types</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or use"
            aria-label="Filter diagram types"
          />
        </label>
      </div>
      {visibleTypes.length > 0 ? (
        <div className={styles.grid}>
          {visibleTypes.map((type) => (
            <article className={styles.card} key={type.id}>
              <div>
                <p className={styles.category}>{type.category}</p>
                <h3>{type.label}</h3>
                <p>{type.summary}</p>
              </div>
              <div className={styles.links}>
                <Link to={`/create/types/${type.id}/`}>Syntax</Link>
                <Link to={`/style/types/${type.id}/`}>Style</Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No diagram type matches “{query}”.</p>
      )}
      <p className={styles.resultCount} aria-live="polite">
        Showing {visibleTypes.length} of {diagramTypes.length} diagram types
      </p>
    </section>
  );
}
