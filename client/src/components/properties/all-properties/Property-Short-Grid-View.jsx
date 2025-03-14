import { Card, Row } from "react-bootstrap";

import { useBasicGetFetch } from "../../../hooks/use-basic-get-fetch";
import { getPropertyAccessibilityById } from "../../../services/propertiesServices";
import { generateStarIcons } from "../../../utils/property-utils";

import styles from './All-Properties.module.css';
import { Link } from "react-router-dom";

export default function PropertyShortGridView({
    _id,
    imageUrls,
    name,
    starsCount,
    address,
}) {
    const {
        data: propertyAccessibility,
        isDataLoaded: isPropertyAccessibilityLoaded } = useBasicGetFetch(() => getPropertyAccessibilityById(_id));

    return (
        <div className={styles["property-container"]}>
            <div className={styles["property-img-container"]}>
                <Link to={`/properties/${_id}`}>
                    <img src={imageUrls && imageUrls[0]} alt={`${name}'s main photo`} />
                </Link>
            </div>
            <div className={styles["property-info-container"]}>
                <Card.Title className="m-0">
                    <Link to={`/properties/${_id}`}>{name}</Link>
                </Card.Title>
                <div className={styles["stars"]}>{generateStarIcons(Number(starsCount || 0))}</div>
                <div className="mt-2">
                    <i className="fas fa-map-marker-alt"></i> <span className={styles["address"]}>{address}</span>
                </div>
                <div className="mt-3">
                    <i className="fab fa-accessible-icon text-primary"></i> <span className="text-primary">Accessibility:</span>
                    <div className="ml-3">
                        {propertyAccessibility.map((pa, i) =>
                            <div key={i}>
                                <i className="fas fa-check text-primary"></i> <span>{pa}, </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
};
