import { Link } from "react-router-dom";

import { useBasicGetFetch } from "../../../hooks/use-basic-get-fetch";
import { getThreeNewestAdded } from "../../../services/propertiesServices";

import { useAuthContext } from "../../../contexts/Auth-Context";

import SingeNewestAddedPropertyContainer from "./Single-Neweset-Added-Property-Container";
import WheelchairTireSpinner from "../../loaders/Wheelcheir-Tire-Spinner";

import styles from "../Home.module.css";

export default function NewestAddedPropertiesContainer() {
    const {
        data: theeNewestAddedPropertiesData,
        isDataLoaded: isThreeNewestAddedPropertiesDataLoaded } = useBasicGetFetch(() => getThreeNewestAdded());

    const { id } = useAuthContext();

    return (
        <>
            <div className="container-fluid py-3">
                <div className="container pt-5 pb-3">
                    <div className="text-center mb-3">
                        <span className={styles["section-title"]}>
                            Properties
                        </span>
                        <span className={styles["section-text"]}>
                            Explore the newest added
                        </span>
                    </div>
                    <div className="row justify-content-center">
                        {isThreeNewestAddedPropertiesDataLoaded
                            ? theeNewestAddedPropertiesData.map(tnapd =>
                                <SingeNewestAddedPropertyContainer
                                    key={tnapd._id}
                                    {...tnapd}
                                    isLoggedInUserPropertyDataCreator={id === tnapd._ownerId}
                                />
                            )
                            : <WheelchairTireSpinner style={{ minHeight: "calc(100vh - 450px)" }}/>
                        }
                    </div>
                    <div className={styles["explore-all"]}>
                        <Link to={`/properties`}>Explore all properties</Link>
                    </div>
                </div>
            </div>
        </>
    )
};
