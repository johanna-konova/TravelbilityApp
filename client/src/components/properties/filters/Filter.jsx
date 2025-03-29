import { useFiltersContext } from '../../../contexts/Filters-Context';

import { AccessibilityFilterLoader, FacilitiesFilterLoader, PropertyTypeFilterLoader } from "../../loaders/Loaders";

import styles from './../all-properties/All-Properties.module.css';

const filterLoaders = {
    "Property types": <PropertyTypeFilterLoader />,
    "Facilities": <FacilitiesFilterLoader />,
    "Accessibility": <AccessibilityFilterLoader />,
};

export default function Filter({
    filterLabel,
    filterName,
    isFilterLoaded,
    filter,
    selectedFilterIds,
}) {
    const { isPropertiesDataLoaded, filterHandler } = useFiltersContext();

    return (
        <div className={styles["filter-boxes"]}>
            <label>{filterLabel}</label>
            {isFilterLoaded
                ? filter.map(f =>
                    <div key={f._id}>
                        <label className={styles["custom-checkbox"]}>
                            <input
                                type="checkbox"
                                value={f._id}
                                checked={selectedFilterIds.includes(f._id)}
                                disabled={!isPropertiesDataLoaded}
                                onChange={() => filterHandler(filterName, f._id)}
                            />
                            <span className={styles["checkmark"]}></span>
                            <span style={{ color: isPropertiesDataLoaded ? "#656565" : "lightgray" }}>{f.name}</span>
                        </label>
                    </div>
                  )
                : filterLoaders[filterLabel]
            }
        </div>
    )
};
