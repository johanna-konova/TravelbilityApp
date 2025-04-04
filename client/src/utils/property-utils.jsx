export const generateStarIcons = (starsCount) => new Array(starsCount)
    .fill(null)
    .map((_, index) => (<i key={index} className="fas fa-star"></i>));

export const getCountryName = (address) =>
    address.substring(address.lastIndexOf(",") + 1).trim();

export const constructPropertyDataForEditing = (propertyData, propertyFacilities) => {
    return {
        "id": propertyData._id,
        "step-1": {
            name: propertyData.name,
            typeId: propertyData.typeId,
            starsCount: propertyData.starsCount,
            checkIn: propertyData.checkIn,
            checkOut: propertyData.checkOut,
            address: propertyData.address,
            description: propertyData.description,
        },
        "step-2": {
            commonFacilityIds: propertyFacilities
                .filter(pf => pf.isForAccessibility === false)
                .map(pf => pf.facilityId),
            accessibilityIds: propertyFacilities
                .filter(pf => pf.isForAccessibility)
                .map(pf => pf.facilityId),
        },
        "step-3": {
            imageUrls: propertyData.imageUrls?.map((iu, i) => ({ id: i + 1, url: iu })),
        }
    };
}