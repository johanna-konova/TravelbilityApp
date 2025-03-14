import Filter from "./Filter";

import styles from './../all-properties/All-Properties.module.css';

export default function FiltersContainer({
    propertyTypes,
    facilities,
    filters,
    filtersHandler
}) {
    return (
        <>
            <div className={styles["filters-container"]}>

                <div className={styles["filter-by"]}>Filter by:</div>

                <Filter
                    filterLabel="Property types"
                    filterName="propertyTypeIds"
                    filter={propertyTypes}
                    selectedFilterIds={filters["propertyTypeIds"]}
                    filtersHandler={filtersHandler}
                />

                <Filter
                    filterLabel="Facilities"
                    filterName="facilityIds"
                    filter={facilities.filter(f => f.IsForAccessibility === false)}
                    selectedFilterIds={filters["facilityIds"]}
                    filtersHandler={filtersHandler}
                />

                <Filter
                    filterLabel="Accessibility"
                    filterName="accessibilityIds"
                    filter={facilities.filter(f => f.IsForAccessibility)}
                    selectedFilterIds={filters["accessibilityIds"]}
                    filtersHandler={filtersHandler}
                />
            </div>
        </>
    )
};
