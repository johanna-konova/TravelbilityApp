export const generateStarIcons = (starsCount) => new Array(starsCount)
    .fill(null)
    .map((_, index) => (<i key={index} className="fas fa-star"></i>));

export const getCountryName = (address) =>
    address.substring(address.lastIndexOf(",") + 1).trim();