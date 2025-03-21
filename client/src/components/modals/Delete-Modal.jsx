import { Button, Modal } from 'react-bootstrap';

import styles from './Modals.module.css';
import { Link } from 'react-router-dom';

export default function DeleteModal({
    propertyId,
    propertyName,
    isModalShowed,
    closeModalHandler
}) {
    return (
        <Modal show={isModalShowed} onHide={closeModalHandler} centered>
            <Modal.Header>
                <div className={styles["x-icon"]} onClick={closeModalHandler}>
                    <i className="fas fa-times text-primary"></i>
                </div>
            </Modal.Header>
            <Modal.Body className={styles["modal-body"]}>
                Are you sure you want to delete
                <div>
                    <Link to={`/properties/${propertyId}`} className="text-dark">{propertyName}</Link>
                    ?
                </div>

                <div className={styles["warning-message"]}>
                    *This action is irreversible and will permanently remove the item.
                    <div>
                        Please confirm if you're sure.
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={closeModalHandler}>
                    Cancel
                </Button>
                <Button className={styles["agree-btn"]} variant="danger">
                    Delete
                </Button>
            </Modal.Footer>
        </Modal>
    )
};
