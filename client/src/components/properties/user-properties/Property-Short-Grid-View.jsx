import { Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { generateStarIcons } from '../../../utils/property-utils';

import styles from './User-Properties.module.css';

export default function PropertyShortGridView({ propertyData }) {
    return (
        <>
            <Card className={styles["property-card"]}>
                <Link to={`/properties/${propertyData._id}`}>
                    <Card.Img variant="top" src={propertyData.imageUrls[0]} />
                </Link>
                <Card.Body>
                    <Link to={`/properties/${propertyData._id}`}>
                        <Card.Title className="mb-0">{propertyData.name}</Card.Title>
                    </Link>
                    <div className={styles["stars"]}>{generateStarIcons(Number(propertyData.starsCount))}</div>
                    <Card.Text className="mt-2">
                        <i className="fas fa-map-marker-alt"></i> <span>{propertyData.address}</span>
                    </Card.Text>
                    <Card.Text>{propertyData.description.slice(0, 150) + '...'}</Card.Text>
                </Card.Body>

                <Card.Footer className={styles["card-footer"]}>
                    <Link to={`/properties/${propertyData._id}`} type="button" className="btn btn-outline-success">View</Link>
                    <Link to={`/edit/${propertyData._id}`} type="button" className="btn btn-outline-warning">Edit</Link>
                    <Button variant="outline-danger">Delete</Button>
                </Card.Footer>
            </Card>
        </>
    )
};
