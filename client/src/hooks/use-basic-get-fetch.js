import { useEffect, useState } from "react";

export function useBasicGetFetch(getDataCallbackFunction, initialData = [], dependencies = []) {
    const [data, setData] = useState(initialData);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    useEffect(() => {
        (async () => {
            const data = await getDataCallbackFunction();

            setData(data);
            setIsDataLoaded(true);
        }
        )()
    }, dependencies);

    return {
        data,
        setData,
        isDataLoaded
    }
}