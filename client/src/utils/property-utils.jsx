export const generateStarIcons = (starsCount) => new Array(starsCount)
    .fill(null)
    .map((_, index) => (<i key={index} className="fas fa-star"></i>));