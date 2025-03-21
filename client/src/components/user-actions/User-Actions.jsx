import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';

import DeleteModal from '../modals/Delete-Modal';

import styles from './User-Actions.module.css';

export default function UserActions({
    _id,
    name,
    hasPaddingBottom
}) {
    const [isDeleteModalShowed, setIsDeleteModalShowed] = useState(false);

    const hideDeleteModalHandler = () => setIsDeleteModalShowed(false);

    return (
        <>
            <div className={`${styles["user-actions-container"]} ${hasPaddingBottom ? "pb-3" : ""}`}>
                <Link to={`/edit/${_id}`} className={styles["edit"]} title="Edit">
                    <i className="fas fa-edit m-1"></i>
                </Link>
                <Button className={styles["delete"]} title="Delete" onClick={() => setIsDeleteModalShowed(true)}>
                    <i className="fas fa-trash m-1"></i>
                </Button>
            </div>

            <DeleteModal
                propertyId={_id}
                propertyName={name}
                isModalShowed={isDeleteModalShowed}
                closeModalHandler={hideDeleteModalHandler}
            />
        </>
    )
};
