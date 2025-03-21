import styles from './Loaders.module.css';

export default function WheelchairTireSpinner({ style }) {
    return (
        <>
            <div className={styles["wheelchair-tire-spinner"]} style={style}>
                <img src="/img/Wheelchair tire spinner.png" alt="Wheelchair tire spinner" />
            </div>
        </>
    )
};
