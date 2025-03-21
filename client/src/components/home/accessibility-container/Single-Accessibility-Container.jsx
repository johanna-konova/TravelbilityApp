import { Link } from 'react-router-dom';

import styles from "../Home.module.css";

export default function SingleAccessibilityConteiner({
    _id,
    name
}) {
    return (
        <div className={styles["single-accessibility-container"]}>
            <Link to={`/properties/?accessibilityIds=${_id}`}>
                <img src={`img/accessibility/${name.replace(":", " -")}.png`} />
                <div>
                    <span className="mb-0">{name}</span>
                </div>
            </Link>
        </div>
    )
};
