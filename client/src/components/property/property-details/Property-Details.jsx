import { Card, Container } from 'react-bootstrap';

import { generateStarIcons } from '../../../utils/property-utils';

import styles from './Property-Details.module.css';

export default function PropertyDetails({
    name,
    starsCount,
    address,
    description,
    facilities,
}) {
    return (
        <Container className="mt-3">
            <div className="d-flex">
                <h1 className="mb-0 pr-0">{name} 
                </h1>
                    <span className={styles["stars"]}>{generateStarIcons(Number(starsCount ?? 0))}</span>
            </div>

            <Card.Text className={styles["address"]}>
                <i className="fas fa-map-marker-alt"></i> <span>{address}</span>
            </Card.Text>

            <Container className="mt-3 pl-0">
                <h4 className="text-primary">Description</h4>
                <p>{description}</p>
            </Container>

            <Container className="mt-5 p-0 d-flex justify-content-center text-center">
                <div className={styles["facilities"]}>
                    <label className="text-primary">Facilities</label>

                    <div>
                        {facilities.filter(f => f.isForAccessibility === false).map(f =>
                            <div key={f.facilityId}>
                                <i className="fas fa-check text-primary"></i> <span>{f.facilityName}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles["facilities"]}>
                    <label className="text-primary">Accessibility</label>

                    <div>
                        {facilities.filter(f => f.isForAccessibility).map(f =>
                            <div key={f.facilityId}>
                                <i className="fas fa-check text-primary"></i> <span>{f.facilityName}</span>
                            </div>
                        )}
                    </div>
                </div>
            </Container>

        </Container>
    )
};
