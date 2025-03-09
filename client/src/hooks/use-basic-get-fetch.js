import { useEffect, useState } from "react";

export function useBasicGetFetch(getDataCallbackFunction, initialData = []) {
    const [data, setData] = useState(initialData);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    useEffect(() => {
        (async () => {
            const data = await getDataCallbackFunction();

            setData(data);
            setIsDataLoaded(true);
        }
        )()
    }, []);

    return {
        data,
        setData,
        isDataLoaded
    }
}