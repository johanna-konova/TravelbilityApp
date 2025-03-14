import styles from './../all-properties/All-Properties.module.css';

export default function Filter({
    filterLabel,
    filterName,
    filter,
    selectedFilterIds,
    filtersHandler
}) {
    return (
        <div className={styles["filter-boxes"]}>
            <label>{filterLabel}</label>
            {filter.map(f =>
                <div key={f._id}>
                    <label className={styles["custom-checkbox"]}>
                        <input
                            type="checkbox"
                            value={f._id}
                            checked={selectedFilterIds.includes(f._id)}
                            onChange={() => filtersHandler(filterName, f._id)}
                        />
                        <span className={styles["checkmark"]}></span>
                        <span>{f.name}</span>
                    </label>
                </div>
            )}
        </div>
    )
};
